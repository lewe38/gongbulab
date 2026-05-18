"""Mince wrapper Gemini — un point d'entrée unique pour tout appel LLM.

Le modèle est choisi via l'argument `usage` ('extraction' | 'validation' | 'chatbot'),
ce qui permet de swap le modèle dans .env sans toucher au code applicatif.
"""
import re
import threading
import time
from collections import deque
from functools import lru_cache
from pathlib import Path
from typing import Any, Callable, Literal, TypeVar

from google import genai
from google.genai import errors as genai_errors
from google.genai import types

from app.config import get_settings

Usage = Literal["extraction", "validation", "chatbot"]

# ─── Rate limiting (tier gratuit Gemini : 5 RPM par modèle) ─────────
# Token bucket : max 4 appels par 60s pour rester safe sous la limite.
_RATE_WINDOW_S = 60.0
_RATE_MAX_CALLS = 10  # safe sous 15 RPM (gemini-2.5-flash-lite free tier)
_call_times: deque[float] = deque(maxlen=_RATE_MAX_CALLS)
_rate_lock = threading.Lock()


def _wait_for_slot() -> None:
    """Bloque jusqu'à ce qu'on ait un slot libre dans la fenêtre RPM."""
    with _rate_lock:
        now = time.time()
        if len(_call_times) >= _RATE_MAX_CALLS:
            oldest = _call_times[0]
            wait = (oldest + _RATE_WINDOW_S) - now
            if wait > 0:
                time.sleep(wait + 0.1)
                now = time.time()
        _call_times.append(now)


T = TypeVar("T")


def with_retry(fn: Callable[..., T], *args, max_retries: int = 5, **kwargs) -> T:
    """Exécute fn(*args, **kwargs) avec throttling + retry sur 429.
    Le délai recommandé par l'API (RetryInfo) est respecté."""
    for attempt in range(max_retries):
        _wait_for_slot()
        try:
            return fn(*args, **kwargs)
        except genai_errors.ClientError as e:
            msg = str(e)
            if "429" not in msg and "RESOURCE_EXHAUSTED" not in msg:
                raise
            # Parse "retryDelay": "59s" si présent, sinon backoff exponentiel
            m = re.search(r"retryDelay['\"]?\s*:\s*['\"]?(\d+)s?", msg)
            sleep_for = int(m.group(1)) + 2 if m else min(60, 2 ** attempt * 5)
            print(f"    [rate-limit] 429 — sleep {sleep_for}s puis retry ({attempt+1}/{max_retries})")
            time.sleep(sleep_for)
    raise RuntimeError(f"Échec après {max_retries} retries sur 429")


def _resolve_model(usage: Usage) -> str:
    s = get_settings()
    return {
        "extraction": s.gemini_model_extraction,
        "validation": s.gemini_model_validation,
        "chatbot": s.gemini_model_chatbot,
    }[usage]


@lru_cache(maxsize=1)
def _client() -> genai.Client:
    """Cached : un seul client réutilisé. Sinon httpx ferme la session entre instances."""
    return genai.Client(api_key=get_settings().gemini_api_key)


def generate_text(
    prompt: str,
    *,
    usage: Usage,
    system: str | None = None,
    temperature: float = 0.4,
) -> str:
    """Génération texte simple. Utilisé pour le chatbot et les tâches sans structure.
    Throttle + retry sur 429 (tier gratuit Gemini : 5 RPM)."""
    def _call() -> Any:
        return _client().models.generate_content(
            model=_resolve_model(usage),
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system,
                temperature=temperature,
            ),
        )
    response = with_retry(_call)
    return response.text or ""


def extract_structured(
    *,
    pdf_path: Path,
    prompt: str,
    response_schema: type | dict[str, Any],
    usage: Usage = "extraction",
    temperature: float = 0.1,
    max_output_tokens: int = 65536,
) -> Any:
    """Upload un PDF et demande à Gemini de retourner un JSON conforme au schéma.

    `response_schema` accepte soit une classe Pydantic, soit un dict JSON Schema.
    `max_output_tokens` est fixé au max courant de Gemini 3.x Pro pour éviter les
    troncatures sur les leçons longues (148 KB+ de JSON avec vocab complet).
    """
    client = _client()
    uploaded = client.files.upload(file=pdf_path)

    response = client.models.generate_content(
        model=_resolve_model(usage),
        contents=[uploaded, prompt],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=response_schema,
            temperature=temperature,
            max_output_tokens=max_output_tokens,
        ),
    )
    return response.parsed if response.parsed is not None else response.text

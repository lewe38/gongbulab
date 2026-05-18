"""Mince wrapper Gemini — un point d'entrée unique pour tout appel LLM.

Le modèle est choisi via l'argument `usage` ('extraction' | 'validation' | 'chatbot'),
ce qui permet de swap le modèle dans .env sans toucher au code applicatif.
"""
from pathlib import Path
from typing import Any, Literal

from google import genai
from google.genai import types

from app.config import get_settings

Usage = Literal["extraction", "validation", "chatbot"]


def _resolve_model(usage: Usage) -> str:
    s = get_settings()
    return {
        "extraction": s.gemini_model_extraction,
        "validation": s.gemini_model_validation,
        "chatbot": s.gemini_model_chatbot,
    }[usage]


def _client() -> genai.Client:
    return genai.Client(api_key=get_settings().gemini_api_key)


def generate_text(
    prompt: str,
    *,
    usage: Usage,
    system: str | None = None,
    temperature: float = 0.4,
) -> str:
    """Génération texte simple. Utilisé pour le chatbot et les tâches sans structure."""
    response = _client().models.generate_content(
        model=_resolve_model(usage),
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system,
            temperature=temperature,
        ),
    )
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

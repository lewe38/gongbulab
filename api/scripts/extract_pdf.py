"""Extraction structurée d'un PDF de leçon coréenne via Gemini Vision.

Stratégie : extraction en 2 étapes pour éviter les troncatures sur les PDFs riches.
  1. extract_outline()    → un appel Gemini renvoie juste la liste des chapitres présents
  2. extract_one_chapter() → un appel par chapitre, qui renvoie le contenu détaillé

Chaque appel reste sous la limite output tokens du modèle.

Hiérarchie réelle des manuels coréens :
    PDF (un fichier)  =  un Book (niveau partiel)
        └── chapters   →  과 (gwa) — '1과 건강한 생활' ou 'Unit 1: Greetings'
            └── sections   →  <1>, <2>, ... sous-sections numérotées
                ├── dialogue + vocabulary
                └── grammar_points    →  1., 2., ... points de grammaire
                    └── examples      →  phrases + dialogues 가:/나:

Usage :
    cd api
    uv run python -m scripts.extract_pdf "C:/Users/leopi/Desktop/pdf/lesson 1-1.pdf" --level 1
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

# Windows : stdout en cp1252 par défaut → casse sur Hangul et symboles Unicode.
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

from pydantic import BaseModel, Field

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import REPO_ROOT, get_settings  # noqa: E402
from google import genai  # noqa: E402
from google.genai import types  # noqa: E402


# ─── Schéma de sortie ───────────────────────────────────────────────
class Example(BaseModel):
    korean: str
    romanization: str | None = None
    french: str
    english: str | None = None


class GrammarPoint(BaseModel):
    order: int
    title_ko: str
    title_translit: str | None = None
    summary_fr: str
    explanation_fr: str
    explanation_en: str | None = None
    form_notes: str | None = None
    examples: list[Example]
    notes: str | None = None


class Word(BaseModel):
    hangeul: str
    romanization: str | None = None
    translation_fr: str
    translation_en: str | None = None
    part_of_speech: str | None = None


class Section(BaseModel):
    order: int
    title_ko: str
    title_fr: str
    dialogue_ko: str | None = None
    dialogue_fr: str | None = None
    dialogue_vocabulary: list[Word] = []
    vocabulary_expansion: list[Word] = []
    grammar_points: list[GrammarPoint] = []


class Chapter(BaseModel):
    """Un chapitre = 1과 / Unit 1. Un PDF en contient plusieurs (4 à 10 typiquement)."""
    chapter_number: int
    title_ko: str
    title_fr: str
    sections: list[Section]


class ChapterOutlineEntry(BaseModel):
    """Juste les métadonnées de chapitre pour la passe outline."""
    chapter_number: int = Field(description="Numéro du chapitre tel qu'écrit dans le PDF (1, 2, …)")
    title_ko: str = Field(description="Titre coréen exact du chapitre, ex: '건강한 생활'")


class Outline(BaseModel):
    chapters: list[ChapterOutlineEntry]


class Book(BaseModel):
    level: int
    chapters: list[Chapter]


# ─── Prompts ────────────────────────────────────────────────────────
_OUTLINE_PROMPT = """\
Liste UNIQUEMENT les chapitres présents dans ce PDF. \
Un chapitre est marqué '1과', '2과', '3과', … en coréen, ou 'Unit 1', 'Unit 2', … en anglais. \
Tu DOIS lister TOUS les chapitres du PDF — typiquement entre 4 et 10. \
Si tu n'en vois qu'un seul, refais une passe sur toutes les pages : le PDF en contient \
forcément plusieurs (il fait 12 à 24 pages).

Pour chaque chapitre, renvoie son numéro et son titre coréen exact. Rien d'autre.
"""

_EXHAUSTIVENESS_RULE = """\
EXHAUSTIVITÉ — règle critique :
- Capture TOUTES les sections (<1>, <2>, …) de ce chapitre.
- Pour chaque section, capture TOUS les grammar points.
- Pour chaque grammar point, capture TOUS les exemples présents (typiquement 4 à 10 phrases \
+ 1 à 3 dialogues 가:/나:). Ne résume pas, ne sélectionne pas.
- Capture TOUS les mots des listes Vocabulary.
- Pour les dialogues 가:/나:, garde les deux tours dans le même champ korean avec \\n entre.
"""


def _chapter_prompt_with_english(chapter_number: int, chapter_title_ko: str) -> str:
    return f"""\
Extrais le contenu détaillé UNIQUEMENT du chapitre **{chapter_number}과 — {chapter_title_ko}** \
(= 'Unit {chapter_number}') de ce PDF. Ignore les autres chapitres.

{_EXHAUSTIVENESS_RULE}

Pour chaque section :
- Titre coréen et anglais (génère le français à partir de l'anglais)
- Dialogue si présent : texte coréen brut + traduction française
- Dialogue Vocabulary et Vocabulary Expansion : mot KO + traduction anglaise (originale) + française (générée)
- Grammar points : title_ko, summary_fr, explanation_fr (traduit de l'EN), explanation_en (original), \
form_notes (markdown pour les tableaux consonne/voyelle), examples (KO/EN/FR), notes
- Pour chaque exemple : coréen + français (depuis l'anglais source) + anglais (original)

N'invente rien qui ne soit pas dans le PDF. Respecte strictement le schéma.
"""


def _chapter_prompt_korean_only(chapter_number: int, chapter_title_ko: str) -> str:
    return f"""\
Extrais le contenu détaillé UNIQUEMENT du chapitre **{chapter_number}과 — {chapter_title_ko}** \
de ce PDF. Ignore les autres chapitres.

{_EXHAUSTIVENESS_RULE}

Pour chaque grammar point :
- title_ko (ex: '-다가 보니까')
- 의미와 용법 → traduis pour explanation_fr ; résume en 1-2 phrases pour summary_fr
- 활용 (conjugaison) si présent → form_notes (markdown pour tableaux)
- 예문 → examples (KO + traduction française pédagogique). TOUS les exemples présents.
- 참고 si présent → notes

Met explanation_en et english (par exemple) à null : le PDF source n'a pas d'anglais.

Génère des traductions françaises naturelles. Ne traduis pas mot-à-mot. N'invente rien.
"""


# ─── Gemini calls ───────────────────────────────────────────────────
from functools import lru_cache  # noqa: E402


@lru_cache(maxsize=1)
def _client() -> genai.Client:
    """Cached : un seul client réutilisé pour upload + tous les appels generate.
    Sinon httpx ferme la session entre deux instances et on a 'client has been closed'."""
    return genai.Client(api_key=get_settings().gemini_api_key)


_MODEL_OVERRIDE: str | None = None


def _model_for_extraction() -> str:
    return _MODEL_OVERRIDE or get_settings().gemini_model_extraction


def _gemini_call(*, uploaded_file, prompt: str, schema: type, max_output_tokens: int) -> object:
    """Appel Gemini avec response_schema et max tokens explicites.

    Sur Flash (2.5/3.1), on désactive `thinking_budget` : il bouffe jusqu'à 4000+ tokens
    de notre budget output pour rien (la structure est déjà imposée par le schéma).
    Sur Pro, le thinking est obligatoire (l'API refuse budget=0)."""
    model = _model_for_extraction()
    config_kwargs = dict(
        response_mime_type="application/json",
        response_schema=schema,
        temperature=0.1,
        max_output_tokens=max_output_tokens,
    )
    if "flash" in model.lower():
        config_kwargs["thinking_config"] = types.ThinkingConfig(thinking_budget=0)

    resp = _client().models.generate_content(
        model=model,
        contents=[uploaded_file, prompt],
        config=types.GenerateContentConfig(**config_kwargs),
    )
    # MAX_TOKENS = la réponse est tronquée — on échoue tôt avec un message clair
    if resp.candidates and resp.candidates[0].finish_reason and \
       str(resp.candidates[0].finish_reason).endswith("MAX_TOKENS"):
        raise RuntimeError(
            f"Gemini a tronqué la réponse (MAX_TOKENS atteint avec budget={max_output_tokens}). "
            f"Augmente max_output_tokens ou réduis la portée de l'extraction."
        )
    return resp.parsed if resp.parsed is not None else resp.text


def _coerce(result: object, schema: type) -> BaseModel:
    """Normalise la sortie Gemini (Pydantic | dict | str | str-encoded-string) → schema."""
    if isinstance(result, schema):
        return result
    if isinstance(result, dict):
        return schema.model_validate(result)
    if isinstance(result, str):
        text = result.strip()
        if text.startswith("```"):
            text = text.lstrip("`")
            if text.startswith("json"):
                text = text[4:]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()
        data = json.loads(text)
        if isinstance(data, str):  # double-encoded
            data = json.loads(data)
        return schema.model_validate(data)
    raise TypeError(f"Type inattendu : {type(result).__name__}")


def extract_outline(uploaded_file) -> Outline:
    # 16384 : safe margin pour Pro qui consomme du budget en thinking interne
    raw = _gemini_call(
        uploaded_file=uploaded_file,
        prompt=_OUTLINE_PROMPT,
        schema=Outline,
        max_output_tokens=16384,
    )
    return _coerce(raw, Outline)


def extract_one_chapter(uploaded_file, *, level: int, number: int, title_ko: str) -> Chapter:
    prompt_fn = _chapter_prompt_with_english if level <= 3 else _chapter_prompt_korean_only
    # 49152 : un chapitre + thinking budget de Pro tient largement
    raw = _gemini_call(
        uploaded_file=uploaded_file,
        prompt=prompt_fn(number, title_ko),
        schema=Chapter,
        max_output_tokens=49152,
    )
    return _coerce(raw, Chapter)


# ─── Main ───────────────────────────────────────────────────────────
def main() -> None:
    global _MODEL_OVERRIDE
    parser = argparse.ArgumentParser(description="Extract a Korean lesson PDF.")
    parser.add_argument("pdf", type=Path)
    parser.add_argument("--level", type=int, required=True, help="1-6 (≤3 = anglais source, ≥4 = coréen pur)")
    parser.add_argument("--out", type=Path, default=None)
    parser.add_argument(
        "--chapters",
        type=str,
        default=None,
        help="Ne ré-extraire QUE ces numéros de chapitres (ex: '5,9,10'). "
             "Merge dans le JSON existant s'il existe (utile pour patcher en Pro après un batch Flash).",
    )
    parser.add_argument(
        "--model",
        type=str,
        default=None,
        help="Override le modèle Gemini (ex: 'gemini-2.5-pro'). Sinon utilise GEMINI_MODEL_EXTRACTION du .env.",
    )
    args = parser.parse_args()

    if not args.pdf.exists():
        sys.exit(f"PDF introuvable : {args.pdf}")

    if args.model:
        _MODEL_OVERRIDE = args.model
        print(f"  [model override : {args.model}]")

    selected_chapters: set[int] | None = None
    if args.chapters:
        selected_chapters = {int(n) for n in args.chapters.split(",")}
        print(f"  [mode patch : ré-extraction des chapitres {sorted(selected_chapters)} uniquement]")

    out_path = args.out or REPO_ROOT / "data" / "extracted" / f"{args.pdf.stem}.json"

    client = _client()
    print(f"→ Upload {args.pdf.name} → Gemini Files API…")
    uploaded = client.files.upload(file=args.pdf)

    print(f"→ Outline (liste des chapitres)…")
    outline = extract_outline(uploaded)
    print(f"  {len(outline.chapters)} chapitre(s) détecté(s) :")
    for o in outline.chapters:
        marker = "  [→ ré-extract]" if selected_chapters and o.chapter_number in selected_chapters else ""
        print(f"    {o.chapter_number}과 {o.title_ko}{marker}")

    # Charge l'ancien Book si on est en mode patch
    existing_by_number: dict[int, Chapter] = {}
    if selected_chapters and out_path.exists():
        try:
            prev = Book.model_validate_json(out_path.read_text(encoding="utf-8"))
            existing_by_number = {c.chapter_number: c for c in prev.chapters}
        except Exception as e:
            print(f"  ⚠ Impossible de relire {out_path} ({e}) — full re-extraction.")

    chapters: list[Chapter] = []
    for i, o in enumerate(outline.chapters, 1):
        if selected_chapters and o.chapter_number not in selected_chapters and o.chapter_number in existing_by_number:
            chapters.append(existing_by_number[o.chapter_number])
            print(f"→ [{i}/{len(outline.chapters)}] {o.chapter_number}과 {o.title_ko} — conservé (mode patch)")
            continue
        print(f"→ [{i}/{len(outline.chapters)}] Extraction chapitre {o.chapter_number}과 {o.title_ko}…")
        t0 = time.time()
        ch = extract_one_chapter(uploaded, level=args.level, number=o.chapter_number, title_ko=o.title_ko)
        print(f"    ✓ {len(ch.sections)} sections, "
              f"{sum(len(s.grammar_points) for s in ch.sections)} grammar points, "
              f"{sum(len(gp.examples) for s in ch.sections for gp in s.grammar_points)} exemples "
              f"({time.time() - t0:.1f}s)")
        chapters.append(ch)

    book = Book(level=args.level, chapters=chapters)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(book.model_dump(), ensure_ascii=False, indent=2), encoding="utf-8")

    n_se = sum(len(c.sections) for c in book.chapters)
    n_gp = sum(len(s.grammar_points) for c in book.chapters for s in c.sections)
    n_ex = sum(len(gp.examples) for c in book.chapters for s in c.sections for gp in s.grammar_points)
    n_wd = sum(len(s.dialogue_vocabulary) + len(s.vocabulary_expansion)
               for c in book.chapters for s in c.sections)
    print(f"\n✓ Total : {len(book.chapters)} chap / {n_se} sec / {n_gp} gp / {n_ex} ex / {n_wd} mots")
    print(f"✓ écrit : {out_path}")


if __name__ == "__main__":
    main()

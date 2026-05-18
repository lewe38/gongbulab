"""Génère un `intent` (description courte du but pédagogique) pour chaque section.

Pour chaque lesson (= section) :
  1. Lit le titre + dialogue + tous les grammar points et exemples
  2. Demande à Gemini Flash une phrase courte en français qui dit ce qu'on apprend
     à parler/faire dans cette leçon (≠ traduction littérale du titre)
  3. Persiste dans lesson_translations.intent (locale = 'fr' par défaut)

Usage:
    cd api
    uv run python -m scripts.generate_intents              # tout
    uv run python -m scripts.generate_intents --limit 1    # 1 leçon pour tester
    uv run python -m scripts.generate_intents --level 1    # 1 niveau seulement
    uv run python -m scripts.generate_intents --locale en  # en anglais

Coût estimé : ~$0.01 pour les 164 sections avec Gemini Flash.
"""
from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db import db_cursor  # noqa: E402
from app.llm.gemini import generate_text  # noqa: E402


PROMPT_TEMPLATES = {
    "fr": """\
Tu rédiges l'INTENT pédagogique d'une section de leçon de coréen — \
UNE SEULE PHRASE COURTE en français qui décrit ce qu'on apprend à FAIRE ou à DIRE \
dans cette section. Pas une traduction du titre, pas une explication grammaticale.

Exemples du ton attendu :
- "Parler de ses projets du week-end."
- "Se présenter et donner sa nationalité."
- "Demander son chemin dans la rue."
- "Raconter une expérience passée."
- "Exprimer ce qu'on aime et ce qu'on n'aime pas."

Réponds avec UNIQUEMENT la phrase d'intent (8-12 mots max, terminée par un point), \
rien d'autre. Pas de guillemets, pas de markdown.

---
Section : {title_ko}
Traduction du titre : {title_fr}

Grammar points couverts :
{grammar_summary}

Quelques exemples de la section :
{examples}
""",
    "en": """\
You write a pedagogical INTENT for a Korean lesson section — \
ONE SHORT ENGLISH SENTENCE that describes what the learner will be able to DO or SAY \
after this section. Not a title translation, not a grammar explanation.

Tone examples:
- "Talk about your weekend plans."
- "Introduce yourself and state your nationality."
- "Ask for directions in the street."
- "Tell a past experience."
- "Express what you like and dislike."

Reply with ONLY the intent sentence (8-12 words max, ending with a period), nothing else.

---
Section: {title_ko}
Title translation: {title_en}

Grammar points covered:
{grammar_summary}

Some examples from the section:
{examples}
""",
}


def build_prompt(locale: str, row: dict) -> str:
    return PROMPT_TEMPLATES[locale].format(**row)


def fetch_sections(level: int | None, limit: int | None, locale: str, only_missing: bool) -> list[dict]:
    with db_cursor() as cur:
        where = []
        params: list = [locale]
        if level is not None:
            where.append("l.level = %s")
            params.append(level)
        if only_missing:
            where.append("(lt.intent is null or lt.intent = '')")
        where_sql = ("where " + " and ".join(where)) if where else ""
        cur.execute(
            f"""
            select l.id, l.level, l.unit_number, l.section_number, l.title_ko,
                   lt.title, lt.dialogue
            from public.lessons l
            left join public.lesson_translations lt
              on lt.lesson_id = l.id and lt.locale = %s
            {where_sql}
            order by l.level, l.unit_number, l.section_number
            {('limit ' + str(int(limit)) if limit else '')}
            """,
            params,
        )
        rows = cur.fetchall()
    sections = []
    for r in rows:
        sections.append({
            "lesson_id": r[0],
            "level": r[1],
            "unit_number": r[2],
            "section_number": r[3],
            "title_ko": r[4],
            f"title_{locale}": r[5] or r[4],
        })
    return sections


def enrich_with_content(sections: list[dict]) -> None:
    """Ajoute grammar_summary + examples à chaque section, in-place."""
    with db_cursor() as cur:
        for s in sections:
            cur.execute(
                """
                select gp.title_ko, coalesce(gt.summary, '')
                from public.grammar_points gp
                left join public.grammar_translations gt on gt.grammar_point_id = gp.id and gt.locale = 'fr'
                where gp.lesson_id = %s
                order by gp.order_in_lesson
                """,
                (s["lesson_id"],),
            )
            gps = cur.fetchall()
            s["grammar_summary"] = (
                "\n".join(f"- {g[0]}: {g[1]}" for g in gps) or "(aucun)"
            )

            cur.execute(
                """
                select e.korean
                from public.examples e
                join public.grammar_points gp on gp.id = e.grammar_point_id
                where gp.lesson_id = %s
                limit 5
                """,
                (s["lesson_id"],),
            )
            exs = cur.fetchall()
            s["examples"] = "\n".join(f"- {e[0]}" for e in exs) or "(aucun)"


def upsert_intent(lesson_id: int, locale: str, intent: str) -> None:
    with db_cursor() as cur:
        cur.execute(
            """
            insert into public.lesson_translations (lesson_id, locale, title, intent)
            values (%s, %s, '', %s)
            on conflict (lesson_id, locale) do update
              set intent = excluded.intent
            """,
            (lesson_id, locale, intent),
        )


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--level", type=int, default=None)
    p.add_argument("--limit", type=int, default=None)
    p.add_argument("--locale", default="fr", choices=["fr", "en"])
    p.add_argument("--only-missing", action="store_true",
                   help="Ne générer que pour les sections dont l'intent est null/vide")
    args = p.parse_args()

    sections = fetch_sections(args.level, args.limit, args.locale, args.only_missing)
    print(f"→ {len(sections)} section(s) à traiter (locale={args.locale})")
    enrich_with_content(sections)

    for i, s in enumerate(sections, 1):
        prompt = build_prompt(args.locale, s)
        t0 = time.time()
        try:
            intent = generate_text(prompt, usage="validation", temperature=0.5).strip()
            # Garde-fous : strip guillemets/markdown
            intent = intent.strip('"').strip("«»").strip().rstrip(".") + "."
        except Exception as e:
            print(f"  [{i}/{len(sections)}] L{s['level']}/{s['unit_number']}.{s['section_number']} ✗ {e}")
            continue
        upsert_intent(s["lesson_id"], args.locale, intent)
        print(f"  [{i}/{len(sections)}] L{s['level']}/{s['unit_number']}.{s['section_number']} ✓ {intent} ({time.time()-t0:.1f}s)")


if __name__ == "__main__":
    main()

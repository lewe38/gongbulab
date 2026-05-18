"""Charge les JSON de data/extracted/ dans la DB Supabase locale.

Usage:
    cd api
    uv run python -m scripts.seed_from_extracted          # tous les fichiers
    uv run python -m scripts.seed_from_extracted --wipe   # vide d'abord les tables de contenu

Idempotence : le mode par défaut détruit et réinsère le contenu pédagogique
(lessons, grammar, examples, words) — mais préserve auth/srs/chat/subscriptions.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

import psycopg

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import REPO_ROOT, get_settings  # noqa: E402


CONTENT_TABLES_TO_WIPE = [
    # ordre = enfants d'abord (CASCADE prend soin du reste, mais on est explicite)
    "example_translations",
    "examples",
    "grammar_translations",
    "grammar_points",
    "word_translations",
    "words",
    "lesson_translations",
    "lessons",
]


def wipe_content(cur: psycopg.Cursor) -> None:
    print("→ wipe content tables…")
    for t in CONTENT_TABLES_TO_WIPE:
        cur.execute(f"truncate table public.{t} restart identity cascade;")
    print(f"  ✓ {len(CONTENT_TABLES_TO_WIPE)} tables vidées")


def seed_book(cur: psycopg.Cursor, source_pdf: str, book: dict) -> dict[str, int]:
    """Insère un Book (= contenu d'un PDF) et renvoie les compteurs."""
    counts = {"lessons": 0, "grammar_points": 0, "examples": 0, "words": 0}
    level = book["level"]

    for chapter in book["chapters"]:
        chap_num = chapter["chapter_number"]
        for section in chapter["sections"]:
            # 1. lesson (= section en DB)
            cur.execute(
                """
                insert into public.lessons (level, unit_number, section_number, title_ko, source_pdf)
                values (%s, %s, %s, %s, %s)
                returning id
                """,
                (level, chap_num, section["order"], section["title_ko"], source_pdf),
            )
            lesson_id = cur.fetchone()[0]
            counts["lessons"] += 1

            # 2. lesson title in French
            if section.get("title_fr"):
                cur.execute(
                    "insert into public.lesson_translations (lesson_id, locale, title, dialogue) values (%s, %s, %s, %s)",
                    (lesson_id, "fr", section["title_fr"], section.get("dialogue_fr")),
                )
            if section.get("dialogue_ko"):
                # On stocke le dialogue KO dans la traduction "ko" (pas idéal mais simple)
                cur.execute(
                    "insert into public.lesson_translations (lesson_id, locale, title, dialogue) values (%s, %s, %s, %s)",
                    (lesson_id, "ko", section["title_ko"], section.get("dialogue_ko")),
                )

            # 3. grammar points + traductions + examples + traductions
            for gp in section.get("grammar_points", []):
                cur.execute(
                    """
                    insert into public.grammar_points (lesson_id, order_in_lesson, title_ko, title_translit, form_notes)
                    values (%s, %s, %s, %s, %s)
                    returning id
                    """,
                    (lesson_id, gp["order"], gp["title_ko"], gp.get("title_translit"), gp.get("form_notes")),
                )
                gp_id = cur.fetchone()[0]
                counts["grammar_points"] += 1

                if gp.get("summary_fr") and gp.get("explanation_fr"):
                    cur.execute(
                        "insert into public.grammar_translations (grammar_point_id, locale, summary, explanation, notes) values (%s, %s, %s, %s, %s)",
                        (gp_id, "fr", gp["summary_fr"], gp["explanation_fr"], gp.get("notes")),
                    )
                if gp.get("explanation_en"):
                    cur.execute(
                        "insert into public.grammar_translations (grammar_point_id, locale, summary, explanation, notes) values (%s, %s, %s, %s, %s)",
                        (gp_id, "en", gp["explanation_en"][:200], gp["explanation_en"], gp.get("notes")),
                    )

                for ex_order, ex in enumerate(gp.get("examples", []), 1):
                    cur.execute(
                        """
                        insert into public.examples (grammar_point_id, order_in_point, korean, romanization)
                        values (%s, %s, %s, %s)
                        returning id
                        """,
                        (gp_id, ex_order, ex["korean"], ex.get("romanization")),
                    )
                    ex_id = cur.fetchone()[0]
                    counts["examples"] += 1
                    if ex.get("french"):
                        cur.execute(
                            "insert into public.example_translations (example_id, locale, translation) values (%s, %s, %s)",
                            (ex_id, "fr", ex["french"]),
                        )
                    if ex.get("english"):
                        cur.execute(
                            "insert into public.example_translations (example_id, locale, translation) values (%s, %s, %s)",
                            (ex_id, "en", ex["english"]),
                        )

            # 4. mots (vocabulary) — un mot peut apparaître plusieurs fois → ON CONFLICT DO NOTHING
            for word in section.get("dialogue_vocabulary", []) + section.get("vocabulary_expansion", []):
                cur.execute(
                    """
                    insert into public.words (hangeul, romanization, part_of_speech, level, source_lesson_id)
                    values (%s, %s, %s, %s, %s)
                    on conflict (hangeul, level) do nothing
                    returning id
                    """,
                    (word["hangeul"], word.get("romanization"), word.get("part_of_speech"), level, lesson_id),
                )
                row = cur.fetchone()
                if row is None:
                    # conflit : on récupère l'id existant pour quand même ajouter les traductions
                    cur.execute(
                        "select id from public.words where hangeul=%s and level=%s",
                        (word["hangeul"], level),
                    )
                    word_id = cur.fetchone()[0]
                else:
                    word_id = row[0]
                    counts["words"] += 1

                if word.get("translation_fr"):
                    cur.execute(
                        """
                        insert into public.word_translations (word_id, locale, translation, example_korean, example_translation)
                        values (%s, %s, %s, %s, %s)
                        on conflict (word_id, locale) do nothing
                        """,
                        (word_id, "fr", word["translation_fr"], None, None),
                    )
                if word.get("translation_en"):
                    cur.execute(
                        """
                        insert into public.word_translations (word_id, locale, translation, example_korean, example_translation)
                        values (%s, %s, %s, %s, %s)
                        on conflict (word_id, locale) do nothing
                        """,
                        (word_id, "en", word["translation_en"], None, None),
                    )

    return counts


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--wipe", action="store_true", help="Truncate content tables before seeding")
    parser.add_argument(
        "--extracted-dir",
        type=Path,
        default=REPO_ROOT / "data" / "extracted",
        help="Folder containing the *.json files",
    )
    args = parser.parse_args()

    dsn = get_settings().supabase_db_url
    if not dsn:
        sys.exit("SUPABASE_DB_URL absent du .env")

    files = sorted(args.extracted_dir.glob("*.json"))
    if not files:
        sys.exit(f"Aucun .json trouvé dans {args.extracted_dir}")

    totals = {"lessons": 0, "grammar_points": 0, "examples": 0, "words": 0}
    with psycopg.connect(dsn) as conn:
        with conn.cursor() as cur:
            if args.wipe:
                wipe_content(cur)
            for f in files:
                book = json.loads(f.read_text(encoding="utf-8"))
                print(f"→ {f.name} (level {book['level']}, {len(book['chapters'])} chapitres)…")
                counts = seed_book(cur, f.name, book)
                print(f"    ✓ +{counts['lessons']} lessons, +{counts['grammar_points']} gp, +{counts['examples']} ex, +{counts['words']} mots")
                for k, v in counts.items():
                    totals[k] += v
        conn.commit()

    print()
    print(f"✓ SEED TOTAL : {totals['lessons']} lessons, {totals['grammar_points']} grammar points, "
          f"{totals['examples']} exemples, {totals['words']} mots uniques")


if __name__ == "__main__":
    main()

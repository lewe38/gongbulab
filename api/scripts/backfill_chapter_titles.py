"""Backfill `lessons.chapter_title_ko` + `lesson_translations.chapter_title`
depuis les JSONs source dans data/extracted/.

Le JSON a la hiérarchie : Book → chapters[].title_ko + title_fr → sections[].
On copie chapter.title_ko sur TOUTES les sections du même chapitre, et
chapter.title_fr en tant que chapter_title dans lesson_translations (locale='fr').
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import REPO_ROOT  # noqa: E402
from app.db import db_cursor  # noqa: E402


def main() -> None:
    extracted = REPO_ROOT / "data" / "extracted"
    n_lessons = n_trans = 0

    with db_cursor() as cur:
        for jf in sorted(extracted.glob("*.json")):
            book = json.loads(jf.read_text(encoding="utf-8"))
            level = book["level"]
            for ch in book["chapters"]:
                key = (level, ch["chapter_number"])
                ko = ch["title_ko"]
                fr = ch.get("title_fr") or None

                cur.execute(
                    """
                    update public.lessons
                       set chapter_title_ko = %s
                     where level = %s and unit_number = %s
                    """,
                    (ko, *key),
                )
                n_lessons += cur.rowcount

                if fr:
                    cur.execute(
                        """
                        update public.lesson_translations lt
                           set chapter_title = %s
                          from public.lessons l
                         where lt.lesson_id = l.id
                           and l.level = %s and l.unit_number = %s
                           and lt.locale = 'fr'
                        """,
                        (fr, *key),
                    )
                    n_trans += cur.rowcount

    print(f"✓ chapter_title_ko set on {n_lessons} lesson rows")
    print(f"✓ chapter_title (fr) set on {n_trans} lesson_translations rows")


if __name__ == "__main__":
    main()

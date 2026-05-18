"""Marque comme `rewritten_at = now()` les exemples DB dont le texte coréen diffère
des JSONs sources dans data/extracted/.

Sert à backfiller le marqueur pour les rewrites antérieurs à la migration
20260519000002 (qui ont modifié la DB sans pouvoir set le timestamp).
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


def collect_originals() -> dict[tuple[int, int, int, int, int], str]:
    """(level, unit_number, section_number, gp_order, ex_order) → korean original."""
    originals: dict[tuple, str] = {}
    for jf in sorted((REPO_ROOT / "data" / "extracted").glob("*.json")):
        book = json.loads(jf.read_text(encoding="utf-8"))
        level = book["level"]
        for ch in book["chapters"]:
            for sec in ch["sections"]:
                for gp in sec.get("grammar_points", []):
                    for ex_order, ex in enumerate(gp.get("examples", []), 1):
                        key = (level, ch["chapter_number"], sec["order"], gp["order"], ex_order)
                        originals[key] = ex["korean"]
    return originals


def main() -> None:
    originals = collect_originals()
    print(f"→ {len(originals)} exemples source chargés depuis data/extracted/")

    with db_cursor() as cur:
        cur.execute(
            """
            select e.id, e.korean, e.order_in_point,
                   gp.order_in_lesson,
                   l.level, l.unit_number, l.section_number
            from public.examples e
            join public.grammar_points gp on gp.id = e.grammar_point_id
            join public.lessons l on l.id = gp.lesson_id
            where e.rewritten_at is null
            """,
        )
        rows = cur.fetchall()

    print(f"→ {len(rows)} exemples DB sans marqueur rewritten_at")

    to_mark: list[int] = []
    missing_src = 0
    for ex_id, ko_db, ex_order, gp_order, level, unit, section in rows:
        key = (level, unit, section, gp_order, ex_order)
        ko_src = originals.get(key)
        if ko_src is None:
            missing_src += 1
            continue
        if ko_src != ko_db:
            to_mark.append(ex_id)

    print(f"→ {len(to_mark)} exemples ont déjà été réécrits (KO diffère du source)")
    if missing_src:
        print(f"  (warning : {missing_src} exemples sans correspondance dans les JSONs)")

    if to_mark:
        with db_cursor() as cur:
            cur.execute(
                "update public.examples set rewritten_at = now() where id = any(%s)",
                (to_mark,),
            )
        print(f"✓ {len(to_mark)} marqueurs backfillés")
    else:
        print("Rien à backfiller.")


if __name__ == "__main__":
    main()

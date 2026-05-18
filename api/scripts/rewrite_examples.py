"""Réécriture des exemples — change les noms propres / lieux / sujets pour éviter \
de reproduire les phrases du PDF source (droits d'auteur). \
Le point de grammaire illustré reste IDENTIQUE.

Stratégie :
  - Itère grammar_point par grammar_point (≈ 6 exemples chacun)
  - Envoie à Gemini Flash le titre du gp + la liste des exemples (KO/FR/EN)
  - Demande une réécriture où on ne change QUE les noms propres, lieux, brands, \
    sujets concrets — pas la structure grammaticale, pas le vocabulaire du gp
  - Update les 3 colonnes (examples.korean + example_translations.translation pour fr+en)

Usage:
    cd api
    uv run python -m scripts.rewrite_examples --limit 1          # 1 grammar point pour tester
    uv run python -m scripts.rewrite_examples --level 1          # niveau 1
    uv run python -m scripts.rewrite_examples                    # tout (~300 gp)

Coût estimé : ~$0.30 pour les 306 grammar points avec Gemini Flash.

⚠ Destructif : modifie les rows examples et example_translations sur place.
Backup recommandé avant : pg_dump des tables.
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

from pydantic import BaseModel

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db import db_cursor  # noqa: E402
from app.llm.gemini import _client, _resolve_model, with_retry  # noqa: E402
from google.genai import types  # noqa: E402


PROMPT = """\
Tu réécris des exemples de phrases coréennes pour éviter les droits d'auteur du PDF source. \
Le point de grammaire illustré est : **{title_ko}**.

RÈGLES STRICTES :
1. Le point de grammaire (ex: '은/는', '-다가 보니까') doit rester EXACTEMENT pareil dans chaque phrase.
2. Tu CHANGES uniquement : noms de personnes (유키 → autre nom coréen ; Eric Parker → autre nom étranger), \
   noms de lieux (한국, 미국, 서울 → autres), noms de marques, sujets concrets (école → bibliothèque, etc.).
3. Tu GARDES : la structure de la phrase, le niveau de difficulté, le vocabulaire qui illustre le point grammatical, \
   le nombre de mots (à 1-2 près).
4. Pour les dialogues 가:/나: : garde le format, change juste les noms.
5. Les traductions française et anglaise doivent refléter EXACTEMENT la phrase coréenne réécrite (pas la phrase originale).

Réponds avec UN JSON conforme au schéma — autant d'items que d'exemples en entrée, dans le même ordre.

Exemples originaux :
{originals}
"""


class RewrittenExample(BaseModel):
    korean: str
    french: str
    english: str | None = None


class RewrittenBatch(BaseModel):
    examples: list[RewrittenExample]


def fetch_grammar_points(level: int | None, limit: int | None, only_missing: bool) -> list[dict]:
    with db_cursor() as cur:
        where = []
        params: list = []
        if level is not None:
            where.append("l.level = %s")
            params.append(level)
        if only_missing:
            # Au moins un exemple du gp n'a jamais été réécrit
            where.append(
                "exists (select 1 from public.examples e where e.grammar_point_id = gp.id and e.rewritten_at is null)"
            )
        where_sql = ("where " + " and ".join(where)) if where else ""
        limit_sql = f"limit {int(limit)}" if limit else ""
        cur.execute(
            f"""
            select gp.id, gp.title_ko, l.level, l.unit_number
            from public.grammar_points gp
            join public.lessons l on l.id = gp.lesson_id
            {where_sql}
            order by l.level, l.unit_number, l.section_number, gp.order_in_lesson
            {limit_sql}
            """,
            params,
        )
        return [
            {"gp_id": r[0], "title_ko": r[1], "level": r[2], "chapter": r[3]}
            for r in cur.fetchall()
        ]


def fetch_examples_for_gp(gp_id: int) -> list[dict]:
    """Charge tous les exemples d'un gp avec leurs traductions fr et en."""
    with db_cursor() as cur:
        cur.execute(
            """
            select e.id, e.korean, e.order_in_point,
                   max(case when et.locale='fr' then et.translation end) as fr,
                   max(case when et.locale='en' then et.translation end) as en
            from public.examples e
            left join public.example_translations et on et.example_id = e.id
            where e.grammar_point_id = %s
            group by e.id, e.korean, e.order_in_point
            order by e.order_in_point
            """,
            (gp_id,),
        )
        return [
            {"id": r[0], "korean": r[1], "order": r[2], "fr": r[3], "en": r[4]}
            for r in cur.fetchall()
        ]


def call_gemini_rewrite(title_ko: str, examples: list[dict]) -> list[RewrittenExample]:
    originals_text = "\n\n".join(
        f"[{i+1}]\nKO: {e['korean']}\nFR: {e['fr']}" + (f"\nEN: {e['en']}" if e['en'] else "")
        for i, e in enumerate(examples)
    )
    prompt = PROMPT.format(title_ko=title_ko, originals=originals_text)

    def _call():
        return _client().models.generate_content(
            model=_resolve_model("validation"),
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=RewrittenBatch,
                temperature=0.7,  # un peu de variété
                max_output_tokens=32768,
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            ),
        )
    resp = with_retry(_call)
    parsed = resp.parsed
    if parsed is None:
        # fallback parse manuel
        data = json.loads(resp.text)
        if isinstance(data, str):
            data = json.loads(data)
        parsed = RewrittenBatch.model_validate(data)
    if not isinstance(parsed, RewrittenBatch):
        parsed = RewrittenBatch.model_validate(parsed)
    return parsed.examples


def update_example(ex_id: int, ko: str, fr: str | None, en: str | None) -> None:
    with db_cursor() as cur:
        cur.execute(
            "update public.examples set korean = %s, rewritten_at = now() where id = %s",
            (ko, ex_id),
        )
        if fr is not None:
            cur.execute(
                """
                insert into public.example_translations (example_id, locale, translation)
                values (%s, 'fr', %s)
                on conflict (example_id, locale) do update set translation = excluded.translation
                """,
                (ex_id, fr),
            )
        if en is not None:
            cur.execute(
                """
                insert into public.example_translations (example_id, locale, translation)
                values (%s, 'en', %s)
                on conflict (example_id, locale) do update set translation = excluded.translation
                """,
                (ex_id, en),
            )


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--level", type=int, default=None)
    p.add_argument("--limit", type=int, default=None, help="Nb max de grammar points à traiter (test)")
    p.add_argument("--dry-run", action="store_true", help="Affiche le diff sans écrire en DB")
    p.add_argument("--only-missing", action="store_true",
                   help="Ne traiter que les gp dont au moins un exemple n'est pas encore réécrit")
    args = p.parse_args()

    gps = fetch_grammar_points(args.level, args.limit, args.only_missing)
    print(f"→ {len(gps)} grammar point(s) à réécrire")

    total_examples = 0
    failures = 0
    for i, gp in enumerate(gps, 1):
        examples = fetch_examples_for_gp(gp["gp_id"])
        if not examples:
            continue
        t0 = time.time()
        try:
            rewritten = call_gemini_rewrite(gp["title_ko"], examples)
        except Exception as e:
            print(f"  [{i}/{len(gps)}] L{gp['level']}/{gp['chapter']} {gp['title_ko']} ✗ {e}")
            failures += 1
            continue

        if len(rewritten) != len(examples):
            print(f"  [{i}/{len(gps)}] {gp['title_ko']} ⚠ mismatch ({len(rewritten)} vs {len(examples)}), skip")
            failures += 1
            continue

        if args.dry_run:
            print(f"  [{i}/{len(gps)}] {gp['title_ko']} (dry-run) — {len(examples)} examples")
            for orig, new in zip(examples, rewritten):
                print(f"    KO  ─→  {orig['korean']}\n         {new.korean}")
                print(f"    FR  ─→  {orig['fr']}\n         {new.french}")
                if orig['en'] or new.english:
                    print(f"    EN  ─→  {orig['en']}\n         {new.english}")
                print()
        else:
            for orig, new in zip(examples, rewritten):
                update_example(orig["id"], new.korean, new.french, new.english)
            print(f"  [{i}/{len(gps)}] L{gp['level']}/{gp['chapter']} {gp['title_ko']} ✓ {len(examples)} ex ({time.time()-t0:.1f}s)")

        total_examples += len(examples)

    print(f"\n✓ Terminé : {total_examples} exemples réécrits, {failures} échec(s).")


if __name__ == "__main__":
    main()

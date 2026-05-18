"""Pool de connexions Postgres pour l'API (psycopg + psycopg_pool).

Utilisé partout où on a besoin d'une transaction ou de perf — plus rapide que de
passer par PostgREST côté Supabase. RLS reste appliquée si on signe les requêtes
avec un JWT user (à faire dans une future amélioration ; pour l'instant on bypass
côté API et on applique la logique d'isolation par user_id explicitement dans les queries).
"""
from contextlib import contextmanager
from functools import lru_cache
from typing import Iterator

import psycopg
from psycopg_pool import ConnectionPool

from .config import get_settings


@lru_cache(maxsize=1)
def get_pool() -> ConnectionPool:
    pool = ConnectionPool(
        conninfo=get_settings().supabase_db_url,
        min_size=1,
        max_size=10,
        open=True,
    )
    return pool


@contextmanager
def db_cursor() -> Iterator[psycopg.Cursor]:
    """Usage : `with db_cursor() as cur: cur.execute(...)`. Commit auto à la sortie."""
    with get_pool().connection() as conn:
        with conn.cursor() as cur:
            yield cur

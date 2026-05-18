"""Endpoints SRS — récupère les cartes dues + applique un review FSRS.

Algo : `fsrs` (https://pypi.org/project/fsrs/, FSRS v6).
"""
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, HTTPException, status
from fsrs import Card, Rating, Scheduler, State
from pydantic import BaseModel, Field

from ..auth import CurrentUserDep
from ..db import db_cursor


router = APIRouter(prefix="/srs", tags=["srs"])
scheduler = Scheduler()  # paramètres par défaut FSRS v6 — suffit pour démarrer


# ─── Mappage DB ↔ fsrs ──────────────────────────────────────────────
_STATE_DB_TO_FSRS = {
    "new": State.Learning,        # fsrs n'a pas de 'new' explicite — on traite comme Learning step 0
    "learning": State.Learning,
    "review": State.Review,
    "relearning": State.Relearning,
}
_STATE_FSRS_TO_DB = {v: k for k, v in _STATE_DB_TO_FSRS.items() if k != "new"}

_RATING_MAP = {
    "again": Rating.Again,
    "hard": Rating.Hard,
    "good": Rating.Good,
    "easy": Rating.Easy,
}


# ─── Schémas API ────────────────────────────────────────────────────
class DueCard(BaseModel):
    card_id: int
    word_id: int
    hangeul: str
    romanization: str | None
    translation: str | None
    part_of_speech: str | None
    state: str
    due_at: datetime


class ReviewIn(BaseModel):
    card_id: int
    rating: Literal["again", "hard", "good", "easy"]
    time_taken_ms: int | None = Field(default=None, ge=0)


class ReviewResult(BaseModel):
    card_id: int
    new_state: str
    new_due_at: datetime
    new_stability: float
    new_difficulty: float


# ─── Endpoints ──────────────────────────────────────────────────────
@router.get("/due", response_model=list[DueCard])
def list_due_cards(user: CurrentUserDep, locale: str = "fr", limit: int = 50) -> list[DueCard]:
    """Renvoie les cartes du user à réviser maintenant (due_at ≤ now), triées par due_at."""
    with db_cursor() as cur:
        cur.execute(
            """
            select c.id, w.id, w.hangeul, w.romanization,
                   wt.translation, w.part_of_speech, c.state, c.due_at
            from public.srs_cards c
            join public.words w on w.id = c.word_id
            left join public.word_translations wt on wt.word_id = w.id and wt.locale = %s
            where c.user_id = %s::uuid and c.due_at <= now()
            order by c.due_at asc
            limit %s
            """,
            (locale, user.id, limit),
        )
        rows = cur.fetchall()
    return [
        DueCard(
            card_id=r[0],
            word_id=r[1],
            hangeul=r[2],
            romanization=r[3],
            translation=r[4],
            part_of_speech=r[5],
            state=r[6],
            due_at=r[7],
        )
        for r in rows
    ]


@router.post("/review", response_model=ReviewResult)
def review_card(user: CurrentUserDep, body: ReviewIn) -> ReviewResult:
    """Applique un grade à une carte, met à jour ses paramètres FSRS et logge la review."""
    rating = _RATING_MAP[body.rating]
    now = datetime.now(timezone.utc)

    with db_cursor() as cur:
        # 1. Vérifie l'ownership et charge l'état courant
        cur.execute(
            """
            select id, state, stability, difficulty, reps, lapses, last_review_at, due_at
            from public.srs_cards
            where id = %s and user_id = %s::uuid
            for update
            """,
            (body.card_id, user.id),
        )
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Carte introuvable")
        _id, state_str, stability, difficulty, reps, lapses, last_review_at, due_at = row

        # 2. Reconstruit l'objet fsrs Card
        card = Card(
            card_id=_id,
            state=_STATE_DB_TO_FSRS[state_str],
            step=0 if state_str == "new" else None,
            stability=stability if stability > 0 else None,
            difficulty=difficulty if difficulty > 0 else None,
            due=due_at,
            last_review=last_review_at,
        )

        # 3. Applique le review
        updated, review_log = scheduler.review_card(card, rating, review_datetime=now)

        new_state_db = _STATE_FSRS_TO_DB.get(updated.state, "review")
        new_stability = updated.stability or 0.0
        new_difficulty = updated.difficulty or 0.0
        new_due = updated.due

        # 4. Persiste la carte + log la review
        cur.execute(
            """
            update public.srs_cards set
              state = %s::srs_state,
              due_at = %s,
              stability = %s,
              difficulty = %s,
              reps = reps + 1,
              lapses = lapses + %s,
              last_review_at = %s
            where id = %s
            """,
            (
                new_state_db,
                new_due,
                new_stability,
                new_difficulty,
                1 if rating == Rating.Again else 0,
                now,
                body.card_id,
            ),
        )
        cur.execute(
            """
            insert into public.srs_reviews
              (card_id, user_id, rating, reviewed_at, time_taken_ms,
               stability_before, stability_after, difficulty_before, difficulty_after)
            values (%s, %s::uuid, %s::srs_rating, %s, %s, %s, %s, %s, %s)
            """,
            (
                body.card_id, user.id, body.rating, now, body.time_taken_ms,
                stability, new_stability, difficulty, new_difficulty,
            ),
        )

    return ReviewResult(
        card_id=body.card_id,
        new_state=new_state_db,
        new_due_at=new_due,
        new_stability=new_stability,
        new_difficulty=new_difficulty,
    )


@router.post("/enroll/{word_id}", status_code=status.HTTP_201_CREATED)
def enroll_word(user: CurrentUserDep, word_id: int) -> dict:
    """Crée une carte SRS pour ce mot, due immédiatement (état 'new')."""
    with db_cursor() as cur:
        cur.execute(
            """
            insert into public.srs_cards (user_id, word_id, state, due_at)
            values (%s::uuid, %s, 'new', now())
            on conflict (user_id, word_id) do nothing
            returning id
            """,
            (user.id, word_id),
        )
        row = cur.fetchone()
    return {"card_id": row[0] if row else None, "created": row is not None}

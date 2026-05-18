"""Endpoints chat — proxy Gemini avec gating par plan + threading + persistance.

Tier gratuit : 0 messages (le chatbot est le différenciateur premium).
"""
from datetime import date, datetime, timezone

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from ..auth import CurrentUserDep
from ..db import db_cursor
from ..llm.gemini import generate_text


router = APIRouter(prefix="/chat", tags=["chat"])

SYSTEM_PROMPT_BASE = (
    "Tu es l'assistant pédagogique de gongbulab, une plateforme de révision du coréen. "
    "Tu réponds en français par défaut (sauf si l'utilisateur écrit en anglais). "
    "Tu es concis, pédagogique et tu utilises des exemples coréens quand c'est utile. "
    "Tu n'inventes pas de règles : si tu n'es pas sûr, dis-le."
)


# ─── Schémas API ────────────────────────────────────────────────────
class PageContext(BaseModel):
    """Contexte de la page envoyée par le client pour le mode 'bulle flottante'."""
    type: str
    lesson_id: int | None = None
    grammar_point_id: int | None = None
    word_id: int | None = None
    extra: dict | None = None


class SendMessageIn(BaseModel):
    thread_id: int | None = Field(
        default=None,
        description="Si null, crée un nouveau thread. Sinon append à un thread existant.",
    )
    message: str = Field(min_length=1, max_length=4000)
    page_context: PageContext | None = None
    title: str | None = Field(
        default=None,
        description="Titre du thread (utilisé seulement à la création).",
    )


class ChatMessage(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime


class SendMessageOut(BaseModel):
    thread_id: int
    user_message: ChatMessage
    assistant_message: ChatMessage


class ChatThreadSummary(BaseModel):
    id: int
    title: str | None
    created_at: datetime
    last_message_at: datetime | None
    message_count: int


# ─── Helpers ────────────────────────────────────────────────────────
def _plan_for(user_id: str) -> str:
    """Renvoie 'free' | 'premium' selon le profil + abonnement Stripe."""
    with db_cursor() as cur:
        cur.execute(
            """
            select coalesce(s.plan, p.plan)::text
            from public.profiles p
            left join public.subscriptions s on s.user_id = p.user_id
            where p.user_id = %s::uuid
            """,
            (user_id,),
        )
        row = cur.fetchone()
    return (row[0] if row else "free") or "free"


def _require_premium(user_id: str) -> None:
    if _plan_for(user_id) != "premium":
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Le chatbot est réservé au plan premium.",
        )


def _build_context_prefix(ctx: PageContext | None) -> str:
    if not ctx:
        return ""
    parts = ["Contexte de la page sur laquelle l'utilisateur se trouve :"]
    if ctx.type == "lesson" and ctx.lesson_id:
        parts.append(f"- Leçon ID {ctx.lesson_id}")
        if ctx.grammar_point_id:
            parts.append(f"- Point de grammaire ID {ctx.grammar_point_id}")
    elif ctx.type == "srs" and ctx.word_id:
        parts.append(f"- Mot SRS ID {ctx.word_id}")
    if ctx.extra:
        parts.append(f"- Extra : {ctx.extra}")
    parts.append("Adapte ta réponse à ce contexte si pertinent.")
    return "\n".join(parts) + "\n\n"


# ─── Endpoints ──────────────────────────────────────────────────────
@router.get("/threads", response_model=list[ChatThreadSummary])
def list_threads(user: CurrentUserDep) -> list[ChatThreadSummary]:
    with db_cursor() as cur:
        cur.execute(
            """
            select t.id, t.title, t.created_at,
                   max(m.created_at), count(m.id)
            from public.chat_threads t
            left join public.chat_messages m on m.thread_id = t.id
            where t.user_id = %s::uuid
            group by t.id
            order by max(m.created_at) desc nulls last, t.created_at desc
            limit 100
            """,
            (user.id,),
        )
        rows = cur.fetchall()
    return [
        ChatThreadSummary(
            id=r[0], title=r[1], created_at=r[2], last_message_at=r[3], message_count=r[4]
        )
        for r in rows
    ]


@router.get("/threads/{thread_id}/messages", response_model=list[ChatMessage])
def get_messages(user: CurrentUserDep, thread_id: int) -> list[ChatMessage]:
    with db_cursor() as cur:
        cur.execute(
            "select user_id from public.chat_threads where id = %s",
            (thread_id,),
        )
        owner = cur.fetchone()
        if not owner or str(owner[0]) != user.id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Thread introuvable")

        cur.execute(
            "select id, role, content, created_at from public.chat_messages "
            "where thread_id = %s order by created_at asc",
            (thread_id,),
        )
        return [
            ChatMessage(id=r[0], role=r[1], content=r[2], created_at=r[3])
            for r in cur.fetchall()
        ]


@router.post("/send", response_model=SendMessageOut)
def send_message(user: CurrentUserDep, body: SendMessageIn) -> SendMessageOut:
    _require_premium(user.id)

    system_prompt = SYSTEM_PROMPT_BASE
    user_prompt = _build_context_prefix(body.page_context) + body.message

    # Appel Gemini
    assistant_content = generate_text(
        user_prompt,
        usage="chatbot",
        system=system_prompt,
        temperature=0.4,
    )

    now = datetime.now(timezone.utc)
    with db_cursor() as cur:
        # 1. Crée ou retrouve le thread
        if body.thread_id is None:
            cur.execute(
                "insert into public.chat_threads (user_id, title) values (%s::uuid, %s) returning id",
                (user.id, body.title),
            )
            thread_id = cur.fetchone()[0]
        else:
            cur.execute(
                "select 1 from public.chat_threads where id = %s and user_id = %s::uuid",
                (body.thread_id, user.id),
            )
            if not cur.fetchone():
                raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Thread introuvable")
            thread_id = body.thread_id

        # 2. Insère le message user
        ctx_json = body.page_context.model_dump_json() if body.page_context else None
        cur.execute(
            """
            insert into public.chat_messages (thread_id, role, content, page_context, created_at)
            values (%s, 'user', %s, %s::jsonb, %s)
            returning id, created_at
            """,
            (thread_id, body.message, ctx_json, now),
        )
        user_msg_id, user_msg_at = cur.fetchone()

        # 3. Insère la réponse assistant
        cur.execute(
            """
            insert into public.chat_messages (thread_id, role, content, created_at)
            values (%s, 'assistant', %s, %s)
            returning id, created_at
            """,
            (thread_id, assistant_content, datetime.now(timezone.utc)),
        )
        asst_msg_id, asst_msg_at = cur.fetchone()

        # 4. Compte ce message dans le quota mensuel
        first_of_month = date(now.year, now.month, 1)
        cur.execute(
            """
            insert into public.chat_usage (user_id, month, message_count)
            values (%s::uuid, %s, 1)
            on conflict (user_id, month) do update set message_count = chat_usage.message_count + 1
            """,
            (user.id, first_of_month),
        )

    return SendMessageOut(
        thread_id=thread_id,
        user_message=ChatMessage(id=user_msg_id, role="user", content=body.message, created_at=user_msg_at),
        assistant_message=ChatMessage(id=asst_msg_id, role="assistant", content=assistant_content, created_at=asst_msg_at),
    )

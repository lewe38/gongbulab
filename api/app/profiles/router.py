"""Endpoints profil utilisateur — préférences (langue, niveau cible, etc.)."""
from datetime import datetime

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from ..auth import CurrentUserDep
from ..db import db_cursor


router = APIRouter(prefix="/profile", tags=["profile"])


class Profile(BaseModel):
    user_id: str
    display_name: str | None
    interface_lang: str
    plan: str
    current_level: int
    created_at: datetime
    updated_at: datetime


class ProfilePatch(BaseModel):
    display_name: str | None = Field(default=None, max_length=60)
    interface_lang: str | None = Field(default=None, pattern=r"^[a-z]{2}$")
    current_level: int | None = Field(default=None, ge=1, le=4)


@router.get("", response_model=Profile)
def get_profile(user: CurrentUserDep) -> Profile:
    with db_cursor() as cur:
        cur.execute(
            """
            select user_id, display_name, interface_lang, plan::text, current_level,
                   created_at, updated_at
            from public.profiles
            where user_id = %s::uuid
            """,
            (user.id,),
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Profil introuvable")
    return Profile(
        user_id=str(row[0]),
        display_name=row[1],
        interface_lang=row[2],
        plan=row[3],
        current_level=row[4],
        created_at=row[5],
        updated_at=row[6],
    )


@router.patch("", response_model=Profile)
def patch_profile(user: CurrentUserDep, body: ProfilePatch) -> Profile:
    fields = body.model_dump(exclude_none=True)
    if not fields:
        # Pas de changement → retourne le profil tel quel
        return get_profile(user)

    set_clause = ", ".join(f"{k} = %s" for k in fields.keys())
    values = list(fields.values())

    with db_cursor() as cur:
        cur.execute(
            f"""
            update public.profiles
               set {set_clause}, updated_at = now()
             where user_id = %s::uuid
             returning user_id, display_name, interface_lang, plan::text, current_level,
                       created_at, updated_at
            """,
            [*values, user.id],
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Profil introuvable")
    return Profile(
        user_id=str(row[0]),
        display_name=row[1],
        interface_lang=row[2],
        plan=row[3],
        current_level=row[4],
        created_at=row[5],
        updated_at=row[6],
    )

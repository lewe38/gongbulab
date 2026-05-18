"""Endpoints Stripe — checkout session + portal session + webhooks.

Tier payant unique : 'premium'. La table `subscriptions` reflète l'état Stripe.
On lit l'événement webhook et on met à jour notre DB en conséquence.

À configurer dans .env :
  STRIPE_SECRET_KEY=sk_live_… (ou sk_test_…)
  STRIPE_WEBHOOK_SECRET=whsec_…
  STRIPE_PRICE_ID_PREMIUM=price_…   (créer dans Stripe dashboard)
"""
from __future__ import annotations

from typing import Any

import stripe
from fastapi import APIRouter, Header, HTTPException, Request, status
from pydantic import BaseModel

from ..auth import CurrentUserDep
from ..config import get_settings
from ..db import db_cursor


router = APIRouter(prefix="/billing", tags=["billing"])


def _stripe() -> Any:
    s = get_settings()
    if not s.stripe_secret_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe non configuré (STRIPE_SECRET_KEY manquant).",
        )
    stripe.api_key = s.stripe_secret_key
    return stripe


class CheckoutSessionIn(BaseModel):
    success_url: str
    cancel_url: str


class CheckoutSessionOut(BaseModel):
    url: str


class PortalSessionIn(BaseModel):
    return_url: str


class PortalSessionOut(BaseModel):
    url: str


def _get_or_create_stripe_customer(user: CurrentUserDep) -> str:
    """Renvoie le stripe_customer_id du user — le crée si pas encore existant."""
    s = _stripe()
    with db_cursor() as cur:
        cur.execute(
            "select stripe_customer_id from public.subscriptions where user_id = %s::uuid",
            (user.id,),
        )
        row = cur.fetchone()
        if row and row[0]:
            return row[0]

        customer = s.Customer.create(
            email=user.email,
            metadata={"supabase_user_id": user.id},
        )
        cur.execute(
            """
            insert into public.subscriptions (user_id, stripe_customer_id, plan)
            values (%s::uuid, %s, 'free')
            on conflict (user_id) do update set stripe_customer_id = excluded.stripe_customer_id
            """,
            (user.id, customer.id),
        )
        return customer.id


@router.post("/checkout", response_model=CheckoutSessionOut)
def create_checkout(user: CurrentUserDep, body: CheckoutSessionIn) -> CheckoutSessionOut:
    """Crée une session Stripe Checkout pour souscrire au plan premium."""
    s = _stripe()
    settings = get_settings()
    if not settings.stripe_price_id_premium:
        raise HTTPException(503, detail="STRIPE_PRICE_ID_PREMIUM non configuré.")

    customer_id = _get_or_create_stripe_customer(user)

    session = s.checkout.Session.create(
        customer=customer_id,
        mode="subscription",
        line_items=[{"price": settings.stripe_price_id_premium, "quantity": 1}],
        success_url=body.success_url,
        cancel_url=body.cancel_url,
        client_reference_id=user.id,
        subscription_data={"metadata": {"supabase_user_id": user.id}},
    )
    return CheckoutSessionOut(url=session.url or "")


@router.post("/portal", response_model=PortalSessionOut)
def create_portal(user: CurrentUserDep, body: PortalSessionIn) -> PortalSessionOut:
    """Génère un lien vers le Customer Portal Stripe (gérer/résilier l'abonnement)."""
    s = _stripe()
    customer_id = _get_or_create_stripe_customer(user)
    session = s.billing_portal.Session.create(
        customer=customer_id,
        return_url=body.return_url,
    )
    return PortalSessionOut(url=session.url)


@router.post("/webhook", status_code=status.HTTP_200_OK)
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(..., alias="stripe-signature"),
) -> dict[str, str]:
    """Webhook Stripe — met à jour notre table `subscriptions` à chaque événement."""
    s = _stripe()
    settings = get_settings()
    if not settings.stripe_webhook_secret:
        raise HTTPException(503, detail="STRIPE_WEBHOOK_SECRET non configuré.")

    payload = await request.body()
    try:
        event = s.Webhook.construct_event(
            payload=payload,
            sig_header=stripe_signature,
            secret=settings.stripe_webhook_secret,
        )
    except (ValueError, s.error.SignatureVerificationError) as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))

    etype = event["type"]
    obj = event["data"]["object"]

    # On gère les événements qui changent l'état d'un abonnement
    if etype in (
        "checkout.session.completed",
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
    ):
        await _sync_subscription_from_stripe_object(etype, obj)

    return {"received": "ok"}


async def _sync_subscription_from_stripe_object(etype: str, obj: dict[str, Any]) -> None:
    """Recalcule l'état local d'un abonnement à partir d'un objet Stripe."""
    customer_id = obj.get("customer") or obj.get("customer_id")
    if not customer_id:
        return

    # Sur checkout.session.completed, le sub_id est dans obj["subscription"]
    sub_id = obj.get("subscription") if etype == "checkout.session.completed" else obj.get("id")
    status_str = obj.get("status", "active") if etype != "checkout.session.completed" else "active"
    period_end = obj.get("current_period_end")
    cancel_at_period_end = obj.get("cancel_at_period_end", False)
    is_active = status_str in ("active", "trialing")
    plan = "premium" if is_active else "free"

    with db_cursor() as cur:
        cur.execute(
            """
            update public.subscriptions set
              stripe_subscription_id = %s,
              plan = %s::user_plan,
              status = %s,
              current_period_end = to_timestamp(%s),
              cancel_at_period_end = %s,
              updated_at = now()
            where stripe_customer_id = %s
            """,
            (sub_id, plan, status_str, period_end, cancel_at_period_end, customer_id),
        )
        # Reflète aussi le plan dans profiles (pour les queries rapides côté UI)
        cur.execute(
            """
            update public.profiles set plan = %s::user_plan, updated_at = now()
            where user_id = (
              select user_id from public.subscriptions where stripe_customer_id = %s
            )
            """,
            (plan, customer_id),
        )

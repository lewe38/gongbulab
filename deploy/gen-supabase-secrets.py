"""Génère les secrets Supabase self-host (JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY,
mots de passe Postgres et Dashboard) en local.
Sortie : un block .env ready-to-paste, à scp sur le VPS.

Usage:
    cd deploy && py gen-supabase-secrets.py
"""
from __future__ import annotations

import secrets
import string
import time
from pathlib import Path

import jwt


def rand_password(n: int = 32) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(n))


def sign_supabase_key(role: str, jwt_secret: str) -> str:
    # 10 ans
    iat = int(time.time())
    exp = iat + 10 * 365 * 24 * 3600
    return jwt.encode(
        {"role": role, "iss": "supabase", "iat": iat, "exp": exp},
        jwt_secret,
        algorithm="HS256",
    )


def main() -> None:
    jwt_secret = secrets.token_urlsafe(48)  # ~64 chars
    pg_pw = rand_password(40)
    dashboard_pw = rand_password(24)
    anon_key = sign_supabase_key("anon", jwt_secret)
    service_role_key = sign_supabase_key("service_role", jwt_secret)

    output = f"""\
# ─── Auto-généré le {time.strftime('%Y-%m-%d %H:%M:%S')} — secrets Supabase self-host ───
POSTGRES_PASSWORD={pg_pw}
JWT_SECRET={jwt_secret}
ANON_KEY={anon_key}
SERVICE_ROLE_KEY={service_role_key}
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD={dashboard_pw}

# ─── URLs publiques ─────────────────────────────────────────────────
SUPABASE_PUBLIC_URL=https://gongbulab-supa.lewe.fr
API_EXTERNAL_URL=https://gongbulab-supa.lewe.fr
SITE_URL=https://gongbulab.lewe.fr
ADDITIONAL_REDIRECT_URLS=https://gongbulab.lewe.fr/auth/callback
STUDIO_DEFAULT_ORGANIZATION=gongbulab
STUDIO_DEFAULT_PROJECT=gongbulab

# ─── Ports binding (host) ───────────────────────────────────────────
KONG_HTTP_PORT=13302
KONG_HTTPS_PORT=13343
STUDIO_PORT=13303

# ─── Auth ───────────────────────────────────────────────────────────
DISABLE_SIGNUP=false
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=true
ENABLE_PHONE_SIGNUP=false
ENABLE_PHONE_AUTOCONFIRM=false
ENABLE_ANONYMOUS_USERS=false

# ─── SMTP (à configurer si tu veux les emails de vérif) ─────────────
SMTP_ADMIN_EMAIL=pivatleo@gmail.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_SENDER_NAME=gongbulab
MAILER_URLPATHS_INVITE=/auth/v1/verify
MAILER_URLPATHS_CONFIRMATION=/auth/v1/verify
MAILER_URLPATHS_RECOVERY=/auth/v1/verify
MAILER_URLPATHS_EMAIL_CHANGE=/auth/v1/verify

# ─── Misc ───────────────────────────────────────────────────────────
PGRST_DB_SCHEMAS=public,storage,graphql_public
DOCKER_SOCKET_LOCATION=/var/run/docker.sock
FUNCTIONS_VERIFY_JWT=false
LOGFLARE_LOGGER_BACKEND_API_KEY={rand_password(32)}
LOGFLARE_API_KEY={rand_password(32)}
LOGFLARE_PUBLIC_ACCESS_TOKEN={rand_password(32)}
LOGFLARE_PRIVATE_ACCESS_TOKEN={rand_password(32)}
POOLER_TENANT_ID=gongbulab
POOLER_DEFAULT_POOL_SIZE=20
POOLER_MAX_CLIENT_CONN=100
POOLER_PROXY_PORT_TRANSACTION=13304
SECRET_KEY_BASE={secrets.token_urlsafe(48)}
VAULT_ENC_KEY={secrets.token_urlsafe(24)}
IMGPROXY_ENABLE_WEBP_DETECTION=true

# ─── Postgres internes (laissés par défaut Supabase) ────────────────
POSTGRES_HOST=db
POSTGRES_DB=postgres
POSTGRES_PORT=5432
POSTGRES_NON_POOLER_HOST=db
"""

    out = Path("supabase-vps.env")
    out.write_text(output, encoding="utf-8")
    print(f"✓ Écrit : {out.resolve()}")
    print()
    print("Pour utiliser : scp deploy/supabase-vps.env root@46.224.2.112:/root/gongbulab-supabase/.env")
    print()
    print("Clés générées :")
    print(f"  ANON_KEY  ...{anon_key[-12:]}")
    print(f"  SERVICE   ...{service_role_key[-12:]}")
    print(f"  JWT       ...{jwt_secret[-12:]}")


if __name__ == "__main__":
    main()

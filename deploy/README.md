# deploy/

Déploiement sur le VPS Hetzner. Deux stacks Docker indépendants :
1. **Supabase self-host** (Postgres + Auth + Storage + Studio)
2. **Notre app** (Caddy + Next.js + FastAPI) — ce dossier

Cette séparation permet d'upgrader Supabase sans toucher à l'app, et inversement.

## Pré-requis VPS

- Ubuntu 24.04 LTS (par défaut Hetzner) ou Debian 12
- DNS configuré : `gongbu.tld`, `www.gongbu.tld`, `api.gongbu.tld`, `studio.gongbu.tld`, `auth.gongbu.tld`, `api-db.gongbu.tld` → IP du VPS

## Setup initial du VPS

```bash
ssh root@VPS_IP

# Docker
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker

# user non-root pour déployer
adduser deploy
usermod -aG docker deploy
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh

# firewall
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable
```

## 1. Stack Supabase self-host

```bash
ssh deploy@VPS_IP
mkdir -p ~/supabase && cd ~/supabase
git clone --depth 1 https://github.com/supabase/supabase.git
cp -r supabase/docker/* .
cp .env.example .env

# Génère les secrets — IMPORTANT, ne pas garder les valeurs par défaut !
# https://supabase.com/docs/guides/self-hosting/docker
# Génère : JWT_SECRET (32+ chars), ANON_KEY + SERVICE_ROLE_KEY (signés avec JWT_SECRET),
# POSTGRES_PASSWORD, DASHBOARD_USERNAME/PASSWORD…

docker compose up -d
```

## 2. Stack app (ce dossier)

```bash
ssh deploy@VPS_IP
mkdir -p ~/gongbulab && cd ~/gongbulab
git clone https://github.com/lewe38/gongbulab.git .

cp .env.example .env
nano .env   # remplis avec les valeurs de Supabase + la clé Gemini + Stripe

# Édite deploy/Caddyfile : remplace `gongbu.tld` par ton domaine

cd deploy
docker compose up -d --build
docker compose logs -f caddy   # vérifie que Let's Encrypt a bien émis les certs
```

## Déploiements suivants

```bash
ssh deploy@VPS_IP
cd ~/gongbulab
git pull
cd deploy
docker compose up -d --build
```

Un script `deploy.sh` à la racine du repo automatisera ça (à venir).

## Backups → Google Drive

Voir [`backup/`](../backup/) — script `pg_dump` + tar Supabase Storage + rclone vers Google Drive,
lancé via cron quotidiennement.

## Variables d'environnement attendues (.env)

```env
NEXT_PUBLIC_SUPABASE_URL=https://api-db.gongbu.tld
NEXT_PUBLIC_SUPABASE_ANON_KEY=…           # depuis la stack Supabase
SUPABASE_SERVICE_ROLE_KEY=…
SUPABASE_JWT_SECRET=…

GEMINI_API_KEY=…
NEXT_PUBLIC_API_URL=https://api.gongbu.tld
CORS_ORIGINS=https://gongbu.tld,https://www.gongbu.tld

STRIPE_SECRET_KEY=sk_live_…
STRIPE_WEBHOOK_SECRET=whsec_…
```

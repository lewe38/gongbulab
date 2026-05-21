#!/usr/bin/env bash
#
# Bootstrap gongbulab sur le VPS Hetzner.
# Idempotent — on peut le relancer plusieurs fois.
#
# Pré-requis sur le VPS :
#   - Docker + Docker Compose installés (✓ déjà fait)
#   - stream_nginx + stream_certbot containers actifs (✓ déjà là)
#   - DNS A records configurés en Cloudflare (à plat sous lewe.fr, grey-cloud)
#
# Usage (depuis ta machine locale) :
#   scp deploy/setup-on-vps.sh root@46.224.2.112:/tmp/
#   ssh root@46.224.2.112 'bash /tmp/setup-on-vps.sh'

set -Eeuo pipefail
log() { echo "[$(date -u +%H:%M:%S)] $*"; }

APP_DIR="/root/gongbulab"
SUPA_DIR="/root/gongbulab-supabase"
EMAIL="pivatleo@gmail.com"
DOMAINS=("gongbulab.lewe.fr" "gongbulab-api.lewe.fr" "gongbulab-supa.lewe.fr")

# ─── 1. Clone notre repo ────────────────────────────────────────────
if [[ ! -d "$APP_DIR" ]]; then
  log "Cloning gongbulab repo…"
  git clone https://github.com/lewe38/gongbulab.git "$APP_DIR"
else
  log "Updating gongbulab repo…"
  git -C "$APP_DIR" fetch --depth 1 origin main
  git -C "$APP_DIR" reset --hard origin/main
fi

# ─── 2. Clone Supabase self-host ────────────────────────────────────
if [[ ! -d "$SUPA_DIR" ]]; then
  log "Cloning Supabase self-host…"
  git clone --depth 1 https://github.com/supabase/supabase.git "$SUPA_DIR-src"
  mkdir -p "$SUPA_DIR"
  cp -r "$SUPA_DIR-src/docker/." "$SUPA_DIR/"
  rm -rf "$SUPA_DIR-src"
fi

# Place Kong sur le port 13302 côté host (au lieu du 8000 par défaut)
if [[ ! -f "$SUPA_DIR/.env" ]]; then
  log "Initial Supabase .env (you MUST edit secrets after this script)…"
  cp "$SUPA_DIR/.env.example" "$SUPA_DIR/.env"
  sed -i 's/^KONG_HTTP_PORT=.*$/KONG_HTTP_PORT=13302/' "$SUPA_DIR/.env"
  # Studio écoute en interne uniquement (pas exposé en host) → on désactive son port
  sed -i 's/^STUDIO_PORT=.*$/STUDIO_PORT=13303/' "$SUPA_DIR/.env"
  log "⚠  Édite $SUPA_DIR/.env pour :"
  log "    - POSTGRES_PASSWORD (générer un secret fort)"
  log "    - JWT_SECRET (32+ chars random)"
  log "    - ANON_KEY + SERVICE_ROLE_KEY (signés avec JWT_SECRET via supabase.com/dashboard/project/_/api?op=GenerateJwt)"
  log "    - DASHBOARD_USERNAME + DASHBOARD_PASSWORD"
  log "    - SITE_URL=https://gongbulab.lewe.fr"
  log "    - SMTP_* si tu veux envoyer les emails de signup"
  log "Puis relance ce script."
  exit 0
fi

# ─── 3. Émettre les certs Let's Encrypt via DNS Cloudflare ──────────
for d in "${DOMAINS[@]}"; do
  if docker exec stream_certbot test -f "/etc/letsencrypt/live/$d/fullchain.pem"; then
    log "Cert OK pour $d"
  else
    log "Émission du cert pour $d…"
    docker exec stream_certbot certbot certonly \
      --dns-cloudflare \
      --dns-cloudflare-credentials /etc/cloudflare.ini \
      -d "$d" \
      --email "$EMAIL" \
      --agree-tos --non-interactive --no-eff-email
  fi
done

# ─── 4. Drop le bloc nginx + reload ─────────────────────────────────
log "Copie de gongbulab.conf dans /opt/streaming/nginx/conf.d/"
cp "$APP_DIR/deploy/nginx/gongbulab.conf" /opt/streaming/nginx/conf.d/gongbulab.conf
docker exec stream_nginx nginx -t
docker exec stream_nginx nginx -s reload
log "✓ nginx reloaded"

# ─── 5. Démarre Supabase ────────────────────────────────────────────
log "Démarrage Supabase…"
cd "$SUPA_DIR"
docker compose pull
docker compose up -d

# Attend que Postgres soit prêt
log "Attente Postgres…"
for i in $(seq 1 30); do
  if docker compose exec -T db pg_isready -U postgres > /dev/null 2>&1; then
    log "  ✓ Postgres up"
    break
  fi
  sleep 2
done

# ─── 6. Applique nos migrations ─────────────────────────────────────
log "Application des migrations gongbulab…"
for migration in "$APP_DIR"/supabase/migrations/*.sql; do
  log "  → $(basename "$migration")"
  docker compose -f "$SUPA_DIR/docker-compose.yml" exec -T db \
    psql -U postgres -d postgres -v ON_ERROR_STOP=1 < "$migration"
done

# ─── 7. Démarre notre app ───────────────────────────────────────────
log "Build + démarrage de notre app stack (web + api)…"
cd "$APP_DIR"
if [[ ! -f .env ]]; then
  log "⚠  Crée $APP_DIR/.env avant de continuer (cf. .env.example + valeurs de $SUPA_DIR/.env)"
  exit 0
fi
docker compose -f deploy/docker-compose.yml up -d --build

# ─── 8. Attache nos containers au network streaming_stream_net ──────
# Compose ne le fait pas correctement même avec networks: external. À refaire
# à chaque recreate. Idempotent : si déjà connecté, on ignore l'erreur.
for c in gongbulab-web-1 gongbulab-api-1 gongbulab-supabase-kong-1; do
  docker network connect streaming_stream_net "$c" 2>/dev/null || true
done
log "✓ containers attachés à streaming_stream_net"

log "✓ Setup terminé. Vérifie :"
log "    https://gongbulab.lewe.fr"
log "    https://gongbulab-api.lewe.fr/health"
log "    https://gongbulab-supa.lewe.fr"

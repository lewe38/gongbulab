#!/usr/bin/env bash
#
# Restauration d'un backup gongbulab depuis Google Drive.
#
# Usage:
#   ./restore.sh                    # restaure le dernier daily
#   ./restore.sh 2026-05-18         # restaure une date précise
#   ./restore.sh 2026-05-18 weekly  # depuis weekly/ au lieu de daily/
#
# ⚠ Destructif : truncate la DB et restaure le dump.
# Toujours tester d'abord sur une instance staging.

set -Eeuo pipefail

SUPABASE_DIR="${SUPABASE_DIR:-/home/deploy/supabase/docker}"
RCLONE_REMOTE="${RCLONE_REMOTE:-gdrive:gongbulab-backups}"
LOCAL_TMP="${LOCAL_TMP:-/var/backups/gongbulab/restore}"

DATE_ARG="${1:-}"
BUCKET="${2:-daily}"

mkdir -p "$LOCAL_TMP"
log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"; }

# ─── 1. Trouver le bon fichier ─────────────────────────────────────
if [[ -z "$DATE_ARG" ]]; then
  log "No date given → fetching most recent daily backup"
  REMOTE_FILE=$(rclone lsf "$RCLONE_REMOTE/$BUCKET/" --include "db-*.sql.gz" | sort | tail -n 1)
  if [[ -z "$REMOTE_FILE" ]]; then
    echo "Aucun backup trouvé dans $RCLONE_REMOTE/$BUCKET/" >&2
    exit 1
  fi
else
  REMOTE_FILE="db-${DATE_ARG}.sql.gz"
fi

log "Restoring from $RCLONE_REMOTE/$BUCKET/$REMOTE_FILE"

# ─── 2. Téléchargement ─────────────────────────────────────────────
rclone copy "$RCLONE_REMOTE/$BUCKET/$REMOTE_FILE" "$LOCAL_TMP/"
LOCAL_DUMP="$LOCAL_TMP/$REMOTE_FILE"

# ─── 3. Confirmation (sauf si --yes) ───────────────────────────────
if [[ "${3:-}" != "--yes" ]]; then
  read -r -p "⚠ Va RÉINITIALISER la DB postgres. Confirmer ? [yes/NO] " CONFIRM
  [[ "$CONFIRM" == "yes" ]] || { echo "Annulé."; exit 0; }
fi

# ─── 4. Restore via psql dans le container db ──────────────────────
log "Streaming dump into Postgres container…"
gunzip -c "$LOCAL_DUMP" \
  | docker compose -f "$SUPABASE_DIR/docker-compose.yml" exec -T db \
      psql -U postgres -d postgres -v ON_ERROR_STOP=1

log "✓ Restore terminé. Pense à redémarrer les autres services :"
log "  docker compose -f $SUPABASE_DIR/docker-compose.yml restart auth rest storage realtime"

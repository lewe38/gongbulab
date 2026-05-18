#!/usr/bin/env bash
#
# Backup quotidien gongbulab → Google Drive (via rclone).
#
# Setup (sur le VPS, une seule fois) :
#   curl https://rclone.org/install.sh | sudo bash
#   rclone config        # configure le remote "gdrive" (OAuth Google)
#   rclone mkdir gdrive:gongbulab-backups
#
# Cron (sur le VPS) :
#   0 3 * * * /home/deploy/gongbulab/backup/backup.sh >> /var/log/gongbulab-backup.log 2>&1
#
# Rotation : 7 daily, 4 weekly (dimanche), 12 monthly (1er du mois).
# Stratégie 3-2-1 : tu peux dupliquer le `rclone copy` vers une 2e destination (B2, OneDrive…).

set -Eeuo pipefail

# ─── Config ────────────────────────────────────────────────────────
# À adapter selon ton setup VPS
SUPABASE_DIR="${SUPABASE_DIR:-/home/deploy/supabase/docker}"
RCLONE_REMOTE="${RCLONE_REMOTE:-gdrive:gongbulab-backups}"
LOCAL_TMP="${LOCAL_TMP:-/var/backups/gongbulab}"

DATE_ISO=$(date -u +%Y-%m-%d)
DAY_OF_WEEK=$(date -u +%u)   # 1=Mon, 7=Sun
DAY_OF_MONTH=$(date -u +%d)

mkdir -p "$LOCAL_TMP"

DUMP_FILE="$LOCAL_TMP/db-$DATE_ISO.sql.gz"
STORAGE_FILE="$LOCAL_TMP/storage-$DATE_ISO.tar.gz"

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"; }

# ─── 1. Dump Postgres ──────────────────────────────────────────────
log "Dumping Postgres → $DUMP_FILE"
docker compose -f "$SUPABASE_DIR/docker-compose.yml" exec -T db \
  pg_dump -U postgres --no-owner --no-privileges postgres \
  | gzip -9 > "$DUMP_FILE"
log "  size: $(du -h "$DUMP_FILE" | cut -f1)"

# ─── 2. Archive Supabase Storage ───────────────────────────────────
log "Archiving Supabase Storage → $STORAGE_FILE"
docker run --rm \
  --volumes-from "$(docker compose -f "$SUPABASE_DIR/docker-compose.yml" ps -q storage)" \
  -v "$LOCAL_TMP:/backup" \
  alpine:3 \
  tar czf "/backup/$(basename "$STORAGE_FILE")" -C / var/lib/storage 2>/dev/null || \
  log "  (storage volume vide ou container absent — skip)"

# ─── 3. Upload vers Google Drive ───────────────────────────────────
log "Uploading to $RCLONE_REMOTE/daily/"
rclone copy "$DUMP_FILE"    "$RCLONE_REMOTE/daily/"
[[ -f "$STORAGE_FILE" ]] && rclone copy "$STORAGE_FILE" "$RCLONE_REMOTE/daily/"

if [[ "$DAY_OF_WEEK" == "7" ]]; then
  log "Sunday → copying to weekly/"
  rclone copy "$DUMP_FILE"    "$RCLONE_REMOTE/weekly/"
  [[ -f "$STORAGE_FILE" ]] && rclone copy "$STORAGE_FILE" "$RCLONE_REMOTE/weekly/"
fi

if [[ "$DAY_OF_MONTH" == "01" ]]; then
  log "First of month → copying to monthly/"
  rclone copy "$DUMP_FILE"    "$RCLONE_REMOTE/monthly/"
  [[ -f "$STORAGE_FILE" ]] && rclone copy "$STORAGE_FILE" "$RCLONE_REMOTE/monthly/"
fi

# ─── 4. Rotation côté Google Drive ─────────────────────────────────
log "Rotating remote: keep 7 daily / 4 weekly / 12 monthly"
rclone delete --min-age 7d  "$RCLONE_REMOTE/daily/"
rclone delete --min-age 4w  "$RCLONE_REMOTE/weekly/"
rclone delete --min-age 12M "$RCLONE_REMOTE/monthly/"

# ─── 5. Cleanup local (garde juste 2 jours en cache) ───────────────
find "$LOCAL_TMP" -type f -mtime +2 -delete

log "✓ Backup terminé"

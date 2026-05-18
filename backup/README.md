# backup/

Backups quotidiens de la DB et du storage Supabase vers Google Drive (via rclone).

## Setup (sur le VPS)

```bash
# 1. Install rclone
curl https://rclone.org/install.sh | sudo bash

# 2. Configure le remote Google Drive (interactif)
rclone config
# → choisir "n" (new remote), nommer "gdrive", type "drive",
#    suivre le flow OAuth (lien à ouvrir dans un navigateur local)

# 3. Test
rclone lsd gdrive:

# 4. Crée les répertoires de destination
rclone mkdir gdrive:gongbulab-backups/daily
rclone mkdir gdrive:gongbulab-backups/weekly
rclone mkdir gdrive:gongbulab-backups/monthly

# 5. Cron : backup quotidien à 3h du matin
crontab -e
# 0 3 * * * /home/deploy/gongbulab/backup/backup.sh >> /var/log/gongbulab-backup.log 2>&1
```

## Stratégie

- **daily** : 7 derniers jours
- **weekly** : 4 dernières semaines (dump du dimanche)
- **monthly** : 12 derniers mois (dump du 1er)

Rotation gérée par `rclone delete --min-age`.

## Restauration

```bash
./restore.sh <date-du-backup>
# ex: ./restore.sh 2026-05-18
```

(Scripts `backup.sh` et `restore.sh` à finaliser une fois Supabase déployé.)

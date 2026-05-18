# gongbulab

Plateforme self-host de révision du coréen (web → app iOS Swift).

- 📚 Leçons de grammaire structurées (extraites par IA depuis des PDF)
- 🧠 Système SRS type Anki pour le vocabulaire (algo FSRS)
- 💬 Chatbot Gemini contextuel (tier payant)
- 🌍 Multi-langues (FR, EN au lancement)

## Stack

| Couche | Techno |
|---|---|
| Frontend web | Next.js 15 (App Router) + Tailwind + next-intl |
| Backend API | FastAPI + uv + Pydantic v2 |
| Database / Auth / Storage | Supabase self-host (Postgres, GoTrue, Storage) |
| Design tokens | Style Dictionary → Tailwind config + Swift (plus tard) |
| Reverse proxy / HTTPS | Caddy (Let's Encrypt auto) |
| Paiement | Stripe |
| IA | Gemini (`gemini-3.1-pro` extraction, `gemini-2.5-flash` chatbot) |
| Backup | pg_dump + rclone → Google Drive |
| Container runtime | Docker (Rancher Desktop en dev) |

## Dev local

Prérequis : Node 24+, pnpm 10+, Python 3.11+ (uv le gère), Rancher Desktop avec moby/dockerd.

```bash
cp .env.example .env
# remplis les valeurs (clé Gemini, secrets Supabase locaux)

# 1. Démarre Supabase en local (via Supabase CLI)
cd supabase && pnpm dlx supabase start

# 2. Démarre le backend
cd ../api && uv sync && uv run uvicorn app.main:app --reload

# 3. Démarre le frontend (autre terminal)
cd web && pnpm install && pnpm dev
```

- Web : http://localhost:3000
- API : http://localhost:8000
- Supabase Studio : http://localhost:54323

## Déploiement VPS

Voir [`deploy/README.md`](deploy/README.md).

## Structure

```
gongbulab/
├── tokens/        # design tokens (source de vérité visuelle)
├── web/           # Next.js
├── api/           # FastAPI
├── supabase/      # config CLI + migrations SQL
├── deploy/        # docker-compose + Caddy pour VPS
├── backup/        # scripts de backup vers Google Drive
├── scripts/       # utilitaires divers
└── docs/          # documentation, mockups, etc.
```

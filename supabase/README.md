# supabase/

Stack Supabase (Postgres + Auth + Storage + Studio) — gère DB, auth et fichiers.

## Local (dev)

Le CLI Supabase orchestre tout via Docker (Rancher Desktop fait tourner les containers).

```bash
# première fois : installer le CLI globalement
pnpm add -g supabase

# dans le dossier supabase/
cd supabase
supabase start              # lance Postgres + Auth + Studio + Storage + Inbucket (mail catcher)
supabase status             # voir les URL et clés générées
supabase db reset           # re-applique migrations + seed à partir de zéro
supabase stop               # arrête les containers
```

Après `supabase start`, ajoute les valeurs affichées dans le `.env` racine :
- `NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=…`
- `SUPABASE_SERVICE_ROLE_KEY=…`
- `SUPABASE_JWT_SECRET=…`

URL utiles en local :
- **Studio** (admin DB) : http://localhost:54323
- **API** : http://localhost:54321
- **Inbucket** (mails catchés) : http://localhost:54324

## Production (VPS)

Suivre [`deploy/README.md`](../deploy/README.md). On utilise le docker-compose self-host officiel
de Supabase, configuré pour notre domaine.

## Migrations

```bash
supabase migration new <nom>      # crée un fichier dans migrations/
supabase db push                  # applique aux instances liées
```

Les migrations sont versionnées dans `migrations/`. **Ne jamais éditer une migration déjà appliquée** — créer une nouvelle migration à la place.

## Schéma

Voir [`migrations/20260518000001_init_schema.sql`](migrations/20260518000001_init_schema.sql) — schéma initial avec :
- `profiles` (extension de auth.users avec plan free/premium)
- `lessons`, `grammar_points`, `examples` + tables `*_translations` pour i18n
- `words` + `word_translations` pour le vocab
- `srs_cards`, `srs_reviews` (algo FSRS)
- `chat_threads`, `chat_messages`, `chat_usage`
- `subscriptions` (Stripe)
- RLS activé partout, policies "owner only" pour les données privées
- Trigger d'auto-création du profile au signup

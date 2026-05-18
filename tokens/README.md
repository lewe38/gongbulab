# Design tokens

**Source de vérité visuelle unique** pour le web (Tailwind) et plus tard iOS (Swift).

## Pourquoi

Une seule couleur, une seule taille, un seul radius — défini ici, propagé partout. Tu changes `tokens.json` → tu lances `pnpm build` → web et iOS sont à jour.

## Structure

- **primitive** : la palette brute (graphite-500, turquoise-700…). On n'utilise jamais ça directement dans le code.
- **semantic** : les rôles UI (`primary`, `accent`, `border`, `text-muted`…). C'est ce que les composants consomment. Si demain on change le turquoise pour un autre vert, seules les références primitives changent ici, le code reste intact.

## Build

```bash
pnpm install
pnpm build
```

Génère :
- `build/css/tokens.css` — variables CSS (fallback / non-Tailwind)
- `build/web/tailwind-preset.cjs` — preset Tailwind importé par `web/tailwind.config.ts`
- `build/json/tokens.flat.json` — JSON plat pour codegen Swift plus tard

## Règle d'or

**Aucun hex code en dur dans les composants.** Si tu écris `bg-[#14b8a6]`, c'est un bug. Tu écris `bg-accent`.

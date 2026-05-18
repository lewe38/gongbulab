# Design system — gongbulab

Décisions de design figées, validées. Source unique pour les générateurs d'UI (Claude Design, designers) et pour tous les développeurs.

> Pour les valeurs exactes (hex, sizes, …), source de vérité = [`tokens/tokens.json`](../tokens/tokens.json). Ce document explique le **pourquoi** et les **conventions**.

---

## 1. Brand & mood

**Nom** : `gongbulab` (공부 = étudier, en coréen + lab).

**Mood** : austère & studieux **mais pas terne**. Amical sans être ludique-gamifié.
- ✅ Inspirations : Notion, Linear, Anthropic — outils sérieux où on passe du temps.
- ❌ À éviter : Duolingo gamifié, esthétique zen/japonisante, néo-coréen Y2K, obangsaek (couleurs traditionnelles coréennes).

**Logo** : monogramme `공` dans un badge arrondi (radius ~25 %). Le **bambou** est un fil conducteur métaphorique (vert turquoise → tige de bambou, étude continue). Logo généré séparément (ChatGPT image 2.0).

**Tagline** :
- FR : "Réviser le coréen, autrement."
- EN : "Learn Korean, your way."

---

## 2. Palette

Tout vit en CSS variables, générées depuis `tokens/tokens.json` → `tokens/build/css/tokens.css`. **Jamais de hex en dur dans un composant.**

### Couleurs primitives
- **Graphite** (`graphite-50` → `graphite-950`) : la couleur de fond, du texte, des borders. Échelle zinc.
- **Turquoise** (`turquoise-50` → `turquoise-900`) : la couleur de marque. Évoque le bambou (lien sémantique avec 공부).
- **SRS** : 4 couleurs Anki classiques pour les boutons de grade
  - `srs-again` `#ef4444` (rouge)
  - `srs-hard` `#f59e0b` (amber)
  - `srs-good` `#10b981` (vert)
  - `srs-easy` `#3b82f6` (bleu)

### Tokens sémantiques (= ce qu'on utilise dans le code)
- `primary` : graphite-900 (light) / graphite-50 (dark) — boutons principaux, texte de focus
- `primary-fg` : la couleur de texte qui contraste avec primary
- `accent` : turquoise-500 — liens, badges, focus rings, hover states, progress bars
- `accent-strong` : turquoise-700 (light) / turquoise-300 (dark) — texte coloré sur fond clair
- `accent-soft` : turquoise-100 (light) / rgba(20,184,166,0.14) (dark) — fonds de badges, hover backgrounds
- `bg`, `surface`, `card`, `text`, `text-muted`, `border` : tokens d'UI standard

### Règle d'or
```tsx
// ❌ NE JAMAIS faire
<button className="bg-[#14b8a6] text-white">

// ✅ TOUJOURS faire
<button className="bg-accent text-white">
```
Tailwind v4 génère automatiquement les utilities `bg-*`, `text-*`, `border-*` à partir des tokens (`--color-*` dans `@theme`).

---

## 3. Typographie

**Pretendard** partout (web + iOS plus tard). Choisie pour l'harmonie parfaite Hangul + latin — même métriques, même rythme. Chargée via CDN jsdelivr dans `globals.css`.

- Tailles : `--text-xs` (12px) → `--text-4xl` (36px). Voir tokens.
- Poids : `regular` (400), `medium` (500), `semibold` (600), `bold` (700), `extrabold` (800).

Hiérarchie typique d'une page :
- h1 : `text-3xl md:text-4xl font-extrabold tracking-tight`
- h2 : `text-lg font-semibold`
- label discret : `text-xs font-semibold uppercase tracking-wider text-text-muted`
- corps : default (`text-base` = 14px)

---

## 4. Layout & navigation

**Mobile-first** mais desktop pas négligé. Patterns définis :

### Desktop (md+)
- **Sidebar gauche** fixe (240px), liens icônes + labels
- **Topbar** minimale (h-14) : juste le toggle theme à droite, logo invisible
- Contenu scrollable au centre

### Mobile (<md)
- **Bottom tab bar** liquid-glass (`backdrop-blur-xl`, fond surface/75)
- **Topbar** : logo à gauche + theme toggle à droite
- Pas de sidebar
- Contenu : `pb-24` pour ne pas être masqué par la bottom nav

### Items de nav (ordre fixe — `web/components/layout/nav-items.tsx`)
1. Dashboard (home)
2. Lessons
3. SRS (révisions)
4. Chat
5. Profile

---

## 5. Dark mode

- Activé via `.dark` sur `<html>`
- **Auto par défaut** : suit `prefers-color-scheme`
- **Override user** persisté dans `localStorage.theme = 'light'|'dark'`
- Script anti-FOUC dans `<head>` (inline, applique avant l'hydratation React)
- Toggle dans la topbar (composant `ThemeToggle`)

---

## 6. Composants — conventions

### Cartes
- Border `border-border`, fond `bg-surface` ou `bg-card`
- Radius : `rounded-2xl` (20px) pour les grandes cartes, `rounded-xl` (16px) pour les médianes
- Padding intérieur : `p-5` à `p-8` selon densité

### Boutons
- **Primary** : `bg-primary text-primary-fg rounded-xl px-5 py-2.5 font-semibold text-sm hover:opacity-90`
- **Accent** : `bg-accent text-white …` (mêmes proportions)
- **Ghost** : `bg-transparent border border-border …`
- **Boutons SRS** : ⚠ **OUTLINE** (bord + texte coloré, fond transparent, léger tint au hover). Pas de fond plein. C'est notre signature.

```tsx
// Exemple bouton SRS "Good"
<button className="rounded-xl border-[1.5px] border-srs-good text-srs-good hover:bg-srs-good/10 px-2 py-3 font-semibold text-sm transition-colors">
  Good
</button>
```

### Badges
- `bg-accent-soft text-accent-strong px-3 py-1 rounded-full text-xs font-semibold`

### Links
- `text-accent-strong dark:text-accent font-semibold`

---

## 7. Chatbot — pattern UX

- **Bulle flottante** (bas-droite) sur **toutes les pages** sauf `/chat` — pour poser une question sur le contenu de la page en cours. Le contexte de la page (leçon courante, grammar point, mot SRS) est injecté en **system prompt invisible**.
- **Page `/chat` dédiée** : conversations longues multi-thread, sans contexte de page (questions générales).
- **Tier gratuit : 0 messages.** Le chatbot est le différenciateur clé du tier payant.

---

## 8. i18n

- **next-intl** côté web, URLs en subpath (`/fr/...`, `/en/...`)
- **fr** par défaut, **en** au lancement, structure prête pour N langues
- UI : `messages/{locale}.json`
- Contenu pédagogique : colonne `locale` dans les tables `*_translations` de Supabase

---

## 9. Cross-platform (iOS plus tard)

L'app iOS Swift (post-MVP) consommera la même API REST. Pour garantir une cohérence visuelle parfaite :
- Les **design tokens sont la source unique** : `tokens/tokens.json` → généré en Swift (`Colors.swift`, `Typography.swift`) via le même `tokens/build.mjs`
- Mêmes noms sémantiques (`primary`, `accent`, `srs-good`, …) → composants iOS et web partagent le vocabulaire
- Pretendard est aussi disponible sur iOS (la même police partout)

---

## 10. Tonalité (copywriting)

- **Tutoiement** (préférence personnelle de Léo, le ton est familier mais pas relâché)
- Phrases courtes, claires
- Pas de jargon non expliqué
- Pas de micro-encouragements façon Duolingo ("Super !", confettis…) — l'utilisateur est un adulte qui étudie sérieusement
- Pour les vides : descriptifs, pas neutres ("Rien à réviser aujourd'hui — bonne journée !" plutôt que "Aucun élément")

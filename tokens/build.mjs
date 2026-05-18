// gongbulab — design tokens build
//
// Produit deux artefacts à partir de tokens.json :
//   1. build/css/tokens.css   → consommé par web/ (Tailwind v4 @theme + :root/.dark)
//   2. build/json/tokens.json → consommé plus tard par l'app iOS (codegen Swift)
//
// Convention :
//   - primitive  → utilitaires Tailwind statiques (text-graphite-500, bg-turquoise-700, …)
//   - semantic   → variables runtime qui basculent avec le dark mode (bg-bg, text-text, bg-accent, …)
//
// On reste volontairement sans Style Dictionary tant qu'on n'a pas iOS — moins de magie, plus de contrôle.

import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname } from 'node:path';

const tokens = JSON.parse(readFileSync(new URL('./tokens.json', import.meta.url), 'utf8'));

// ─── helpers ────────────────────────────────────────────────────────
const walk = (obj, prefix = []) => {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object' && 'value' in v) {
      out.push([[...prefix, k], v.value]);
    } else if (v && typeof v === 'object') {
      out.push(...walk(v, [...prefix, k]));
    }
  }
  return out;
};

const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const cssVar = (parts) => '--' + parts.map(kebab).join('-');

const write = (path, content) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
  console.log(`  ✓ ${path}`);
};

// ─── 1. tokens.css (Tailwind v4 @theme) ─────────────────────────────
const lines = [
  '/* AUTO-GENERATED — do not edit. Source: tokens/tokens.json — regenerate with `pnpm build`. */',
  '',
  '@theme {',
];

// Color primitives → flat utilities (text-graphite-500, bg-turquoise-700, bg-srs-again)
for (const [path, value] of walk(tokens.color.primitive)) {
  // path = ['graphite', '500']  →  --color-graphite-500: #71717a;
  lines.push(`  --color-${path.map(kebab).join('-')}: ${value};`);
}
lines.push('');

// Semantic tokens → CSS variables that swap at runtime (bg-bg, text-text, bg-accent)
// These map to runtime variables (--sem-*) so dark mode works via class toggle.
const semanticNames = Object.keys(tokens.color.semantic.light);
for (const name of semanticNames) {
  lines.push(`  --color-${kebab(name)}: var(--sem-${kebab(name)});`);
}
lines.push('');

// Typography
for (const [path, value] of walk(tokens.font.family)) {
  lines.push(`  --font-${path.map(kebab).join('-')}: ${value};`);
}
for (const [path, value] of walk(tokens.font.size)) {
  lines.push(`  --text-${path.map(kebab).join('-')}: ${value};`);
}
for (const [path, value] of walk(tokens.font.weight)) {
  lines.push(`  --font-weight-${path.map(kebab).join('-')}: ${value};`);
}

// Spacing & radius
for (const [path, value] of walk(tokens.space)) {
  lines.push(`  --spacing-${path.map(kebab).join('-')}: ${value};`);
}
for (const [path, value] of walk(tokens.radius)) {
  lines.push(`  --radius-${path.map(kebab).join('-')}: ${value};`);
}

lines.push('}', '');

// Resolve token reference like {color.primitive.graphite.900} → var name
const resolveRef = (val) => {
  if (typeof val !== 'string') return val;
  const m = val.match(/^\{(.+)\}$/);
  if (!m) return val;
  const parts = m[1].split('.');
  // {color.primitive.graphite.900} → var(--color-graphite-900) (skip "primitive")
  if (parts[0] === 'color' && parts[1] === 'primitive') {
    return `var(--color-${parts.slice(2).map(kebab).join('-')})`;
  }
  return val;
};

// :root + .dark semantic values
lines.push('/* light mode (default) */');
lines.push(':root {');
for (const [name, { value }] of Object.entries(tokens.color.semantic.light)) {
  lines.push(`  --sem-${kebab(name)}: ${resolveRef(value)};`);
}
lines.push('}', '');

lines.push('/* dark mode — opt-in via .dark class on <html> */');
lines.push('.dark {');
for (const [name, { value }] of Object.entries(tokens.color.semantic.dark)) {
  lines.push(`  --sem-${kebab(name)}: ${resolveRef(value)};`);
}
lines.push('}', '');

// Clean build dir then write outputs
rmSync(new URL('./build', import.meta.url), { recursive: true, force: true });

write('build/css/tokens.css', lines.join('\n'));

// ─── 2. tokens.flat.json (for Swift codegen later) ──────────────────
const flat = {};
for (const [path, value] of walk(tokens)) {
  flat[path.join('.')] = value;
}
write('build/json/tokens.flat.json', JSON.stringify(flat, null, 2));

console.log('\n✓ tokens built');

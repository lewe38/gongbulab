import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
  // Si la locale est dans l'URL, on la garde. Sinon /chemin → /fr/chemin (default locale).
  // 'as-needed' = pas de préfixe pour la default locale, mais on le force ici pour SEO et clarté.
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

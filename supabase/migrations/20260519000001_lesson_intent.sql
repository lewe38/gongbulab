-- Ajoute un champ "intent" sur les traductions de leçon.
-- Un intent = description courte du BUT pédagogique d'une section (ex: "Parler de ses
-- projets du week-end") — distinct du titre coréen littéral. Généré par Gemini à partir
-- du contenu de la section.

alter table public.lesson_translations
  add column intent text;

comment on column public.lesson_translations.intent is
  'Description courte (1 phrase) du but pédagogique de la section dans la locale donnée. Généré par scripts/generate_intents.py.';

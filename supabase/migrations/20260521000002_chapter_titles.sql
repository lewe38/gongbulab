-- Ajoute le titre du chapitre (1과 = "인사와 소개", etc.) en plus du titre de la section.
-- Le PDF source contient à la fois un titre d'unité ET des titres de sections ;
-- on n'avait gardé que ceux de sections jusqu'ici.

alter table public.lessons
  add column if not exists chapter_title_ko text;

alter table public.lesson_translations
  add column if not exists chapter_title text;

comment on column public.lessons.chapter_title_ko is
  'Titre coréen du chapitre (1과 …) partagé par toutes les sections du même (level, unit_number).';
comment on column public.lesson_translations.chapter_title is
  'Titre du chapitre traduit dans la locale. Backfill via scripts/backfill_chapter_titles.py.';

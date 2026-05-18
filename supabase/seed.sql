-- Seed minimal pour dev local.
-- Le vrai contenu (leçons, vocab) sera importé via scripts/extract_pdf.py + script d'insert.
-- Ici juste un user et un mot pour smoke-tester la UI.

-- Note : pas de user seed direct (auth.users géré par Supabase Auth, le profile est créé par trigger).
-- Crée un user via Supabase Studio (localhost:54323) > Authentication > Users > Add user.

-- Exemple de leçon + mot pour smoke-test
insert into public.lessons (level, unit_number, section_number, title_ko, source_pdf)
values (1, 1, 1, '저는 미국 사람입니다', 'lesson 1-1.pdf')
on conflict do nothing;

insert into public.lesson_translations (lesson_id, locale, title)
select id, 'fr', 'Je suis Américain' from public.lessons where level = 1 and unit_number = 1 and section_number = 1
on conflict do nothing;

insert into public.lesson_translations (lesson_id, locale, title)
select id, 'en', 'I am an American' from public.lessons where level = 1 and unit_number = 1 and section_number = 1
on conflict do nothing;

insert into public.words (hangeul, romanization, part_of_speech, level, source_lesson_id)
select '학교', 'hakgyo', 'noun', 1, id from public.lessons where level = 1 and unit_number = 1 and section_number = 1
on conflict do nothing;

insert into public.word_translations (word_id, locale, translation)
select id, 'fr', 'école' from public.words where hangeul = '학교'
on conflict do nothing;
insert into public.word_translations (word_id, locale, translation)
select id, 'en', 'school' from public.words where hangeul = '학교'
on conflict do nothing;

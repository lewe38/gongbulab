-- Le contenu pédagogique (leçons, grammaire, exemples, vocabulaire) doit être
-- accessible en lecture par tout le monde (anon + authenticated), pas seulement
-- les utilisateurs connectés. Permet le SEO, la landing publique, et la phase
-- d'exploration avant signup.
--
-- Les données privées (profiles, srs_cards, chat_*, subscriptions) restent
-- strictement isolées par user_id.

drop policy if exists "content readable by authenticated" on public.lessons;
drop policy if exists "content readable by authenticated" on public.lesson_translations;
drop policy if exists "content readable by authenticated" on public.grammar_points;
drop policy if exists "content readable by authenticated" on public.grammar_translations;
drop policy if exists "content readable by authenticated" on public.examples;
drop policy if exists "content readable by authenticated" on public.example_translations;
drop policy if exists "content readable by authenticated" on public.words;
drop policy if exists "content readable by authenticated" on public.word_translations;

create policy "content readable by all" on public.lessons               for select using (true);
create policy "content readable by all" on public.lesson_translations   for select using (true);
create policy "content readable by all" on public.grammar_points        for select using (true);
create policy "content readable by all" on public.grammar_translations  for select using (true);
create policy "content readable by all" on public.examples              for select using (true);
create policy "content readable by all" on public.example_translations  for select using (true);
create policy "content readable by all" on public.words                 for select using (true);
create policy "content readable by all" on public.word_translations     for select using (true);

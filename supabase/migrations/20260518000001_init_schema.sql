-- ────────────────────────────────────────────────────────────────────
-- Initial schema for gongbulab
--
-- Tables sont volontairement étendues pour i18n dès le départ :
-- contenu KO en table principale, traductions par locale en table associée.
--
-- Auth est géré par Supabase (auth.users) — on étend juste avec une table
-- profiles pour les champs métier (plan, langue interface, niveau cible…).
-- ────────────────────────────────────────────────────────────────────

-- ─── ENUMs ──────────────────────────────────────────────────────────
create type user_plan as enum ('free', 'premium');
create type srs_state as enum ('new', 'learning', 'review', 'relearning');
create type srs_rating as enum ('again', 'hard', 'good', 'easy');
create type chat_role as enum ('user', 'assistant', 'system');

-- ─── profiles : extension de auth.users ─────────────────────────────
create table public.profiles (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  display_name   text,
  interface_lang text not null default 'fr',   -- 'fr' | 'en' (extensible)
  plan           user_plan not null default 'free',
  current_level  int not null default 1,       -- niveau cible (1..6)
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ─── LEÇONS & GRAMMAIRE ─────────────────────────────────────────────
create table public.lessons (
  id              bigserial primary key,
  level           int not null,
  unit_number     int not null,
  section_number  int not null,
  title_ko        text not null,
  source_pdf      text,
  created_at      timestamptz not null default now(),
  unique (level, unit_number, section_number)
);

create table public.lesson_translations (
  lesson_id bigint references public.lessons(id) on delete cascade,
  locale    text not null,
  title     text not null,
  dialogue  text,
  primary key (lesson_id, locale)
);

create table public.grammar_points (
  id          bigserial primary key,
  lesson_id   bigint not null references public.lessons(id) on delete cascade,
  order_in_lesson int not null,
  title_ko    text not null,                -- ex: "은/는"
  title_translit text,                       -- ex: "eun/neun"
  form_notes  text,                          -- markdown : règles consonne/voyelle, conjugaison…
  created_at  timestamptz not null default now(),
  unique (lesson_id, order_in_lesson)
);

create table public.grammar_translations (
  grammar_point_id bigint references public.grammar_points(id) on delete cascade,
  locale           text not null,
  summary          text not null,
  explanation      text not null,
  notes            text,
  primary key (grammar_point_id, locale)
);

create table public.examples (
  id                bigserial primary key,
  grammar_point_id  bigint not null references public.grammar_points(id) on delete cascade,
  order_in_point    int not null,
  korean            text not null,
  romanization      text,
  unique (grammar_point_id, order_in_point)
);

create table public.example_translations (
  example_id  bigint references public.examples(id) on delete cascade,
  locale      text not null,
  translation text not null,
  primary key (example_id, locale)
);

-- ─── VOCABULAIRE ────────────────────────────────────────────────────
create table public.words (
  id              bigserial primary key,
  hangeul         text not null,
  romanization    text,
  part_of_speech  text,                          -- noun|verb|adjective|adverb|particle|expression
  level           int not null,
  source_lesson_id bigint references public.lessons(id) on delete set null,
  created_at      timestamptz not null default now(),
  unique (hangeul, level)
);

create index on public.words (level);

create table public.word_translations (
  word_id           bigint references public.words(id) on delete cascade,
  locale            text not null,
  translation       text not null,
  example_korean    text,
  example_translation text,
  primary key (word_id, locale)
);

-- ─── SRS (algo FSRS) ────────────────────────────────────────────────
-- Champs alignés sur FSRS : https://github.com/open-spaced-repetition/fsrs4anki
create table public.srs_cards (
  id          bigserial primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  word_id     bigint not null references public.words(id) on delete cascade,
  state       srs_state not null default 'new',
  due_at      timestamptz not null default now(),
  stability   real not null default 0,
  difficulty  real not null default 0,
  reps        int not null default 0,
  lapses      int not null default 0,
  last_review_at timestamptz,
  created_at  timestamptz not null default now(),
  unique (user_id, word_id)
);

create index on public.srs_cards (user_id, due_at);
create index on public.srs_cards (user_id, state);

create table public.srs_reviews (
  id             bigserial primary key,
  card_id        bigint not null references public.srs_cards(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  rating         srs_rating not null,
  reviewed_at    timestamptz not null default now(),
  time_taken_ms  int,
  stability_before  real,
  stability_after   real,
  difficulty_before real,
  difficulty_after  real
);

create index on public.srs_reviews (user_id, reviewed_at desc);

-- ─── CHAT ───────────────────────────────────────────────────────────
create table public.chat_threads (
  id          bigserial primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text,
  created_at  timestamptz not null default now()
);

create index on public.chat_threads (user_id, created_at desc);

create table public.chat_messages (
  id           bigserial primary key,
  thread_id    bigint not null references public.chat_threads(id) on delete cascade,
  role         chat_role not null,
  content      text not null,
  page_context jsonb,  -- {type:'lesson', lesson_id, grammar_point_id} | {type:'srs', word_id}
  tokens_in    int,
  tokens_out   int,
  created_at   timestamptz not null default now()
);

create index on public.chat_messages (thread_id, created_at);

-- Quota mensuel pour limiter le tier gratuit (qui est à 0 mais on garde l'infra)
create table public.chat_usage (
  user_id       uuid not null references auth.users(id) on delete cascade,
  month         date not null,   -- 1er du mois
  message_count int not null default 0,
  tokens_total  int not null default 0,
  primary key (user_id, month)
);

-- ─── STRIPE ─────────────────────────────────────────────────────────
create table public.subscriptions (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id   text unique,
  stripe_subscription_id text unique,
  plan                 user_plan not null default 'free',
  status               text,  -- active | trialing | past_due | canceled | …
  current_period_end   timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at           timestamptz not null default now()
);

-- ─── TRIGGERS : auto-create profile on signup ───────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── TRIGGERS : updated_at ──────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create trigger subscriptions_touch_updated_at
  before update on public.subscriptions
  for each row execute function public.touch_updated_at();

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────────────
-- Contenu (lessons, words, translations) → lecture publique pour les users connectés
-- Données privées (profile, srs, chat, subscription) → isolation par user_id

alter table public.profiles            enable row level security;
alter table public.lessons             enable row level security;
alter table public.lesson_translations enable row level security;
alter table public.grammar_points      enable row level security;
alter table public.grammar_translations enable row level security;
alter table public.examples            enable row level security;
alter table public.example_translations enable row level security;
alter table public.words               enable row level security;
alter table public.word_translations   enable row level security;
alter table public.srs_cards           enable row level security;
alter table public.srs_reviews         enable row level security;
alter table public.chat_threads        enable row level security;
alter table public.chat_messages       enable row level security;
alter table public.chat_usage          enable row level security;
alter table public.subscriptions       enable row level security;

-- Lecture du contenu pédagogique pour tout utilisateur authentifié
create policy "content readable by authenticated" on public.lessons
  for select using (auth.role() = 'authenticated');
create policy "content readable by authenticated" on public.lesson_translations
  for select using (auth.role() = 'authenticated');
create policy "content readable by authenticated" on public.grammar_points
  for select using (auth.role() = 'authenticated');
create policy "content readable by authenticated" on public.grammar_translations
  for select using (auth.role() = 'authenticated');
create policy "content readable by authenticated" on public.examples
  for select using (auth.role() = 'authenticated');
create policy "content readable by authenticated" on public.example_translations
  for select using (auth.role() = 'authenticated');
create policy "content readable by authenticated" on public.words
  for select using (auth.role() = 'authenticated');
create policy "content readable by authenticated" on public.word_translations
  for select using (auth.role() = 'authenticated');

-- Données privées : owner only
create policy "own profile rw" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own srs cards rw" on public.srs_cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own srs reviews rw" on public.srs_reviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own chat threads rw" on public.chat_threads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own chat messages rw" on public.chat_messages
  for all using (
    exists (select 1 from public.chat_threads t where t.id = thread_id and t.user_id = auth.uid())
  );

create policy "own chat usage read" on public.chat_usage
  for select using (auth.uid() = user_id);

create policy "own subscription read" on public.subscriptions
  for select using (auth.uid() = user_id);

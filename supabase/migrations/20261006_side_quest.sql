-- Signal Side Quest: intermission phone game. Created 2026-10-06.
-- Safe to re-run. Hand-apply in the Supabase SQL editor.
-- RLS is ON with NO policies: anon and authenticated can read
-- nothing. All access is server-side via the service key
-- (lib/side-quest.ts, getAdminSupabase), so puzzle answers
-- never reach a browser.

create table if not exists public.side_quest_challenges (
  id            text primary key,
  title         text not null,
  description   text not null default '',
  category      text not null
    check (category in ('connect', 'capture', 'discover')),
  type          text not null
    check (type in ('social', 'photo', 'qr')),
  points        integer not null default 1,
  sort          integer not null default 100,
  active        boolean not null default true,
  qr_number     integer,
  puzzle_prompt text,
  puzzle_answer text
);

create unique index if not exists side_quest_challenges_qr_idx
  on public.side_quest_challenges (qr_number)
  where qr_number is not null;

create table if not exists public.side_quest_sessions (
  id             uuid primary key default gen_random_uuid(),
  token_hash     text not null unique,
  first_name     text not null,
  score          integer not null default 0,
  prize_eligible boolean not null default false,
  eligible_at    timestamptz,
  photo_notice_at timestamptz,
  created_at     timestamptz not null default now(),
  last_active_at timestamptz not null default now()
);

create table if not exists public.side_quest_completions (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null
    references public.side_quest_sessions (id) on delete cascade,
  challenge_id text not null
    references public.side_quest_challenges (id) on delete cascade,
  points       integer not null,
  completed_at timestamptz not null default now(),
  unique (session_id, challenge_id)
);

create table if not exists public.side_quest_photos (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null
    references public.side_quest_sessions (id) on delete cascade,
  challenge_id text not null
    references public.side_quest_challenges (id) on delete cascade,
  url          text not null,
  thumb_url    text not null,
  uploaded_at  timestamptz not null default now(),
  approved     boolean not null default true,
  on_wall      boolean not null default true,
  unique (session_id, challenge_id)
);

create index if not exists side_quest_photos_wall_idx
  on public.side_quest_photos (uploaded_at desc);

create table if not exists public.side_quest_qr_attempts (
  id           bigint generated always as identity primary key,
  session_id   uuid not null
    references public.side_quest_sessions (id) on delete cascade,
  challenge_id text not null
    references public.side_quest_challenges (id) on delete cascade,
  correct      boolean not null,
  at           timestamptz not null default now()
);

create index if not exists side_quest_qr_attempts_idx
  on public.side_quest_qr_attempts (session_id, at desc);

alter table public.side_quest_challenges enable row level security;
alter table public.side_quest_sessions enable row level security;
alter table public.side_quest_completions enable row level security;
alter table public.side_quest_photos enable row level security;
alter table public.side_quest_qr_attempts enable row level security;

-- Seed. Wording is a starting point, edit it in the admin.
-- The three QR puzzles are PLACEHOLDERS. Replace the prompt
-- and answer in /admin/side-quest before the event.
-- Answers are matched ignoring case, spaces and punctuation.
-- Use a pipe to allow more than one answer, e.g. red|crimson.

insert into public.side_quest_challenges
  (id, title, description, category, type, points, sort)
values
  ('connect_new_person', 'Meet someone new',
   'Say hello to someone you have not met before.',
   'connect', 'social', 1, 10),
  ('connect_idea', 'Swap an idea',
   'Ask someone which idea has stuck with them today.',
   'connect', 'social', 1, 20),
  ('connect_volunteer', 'Thank a volunteer',
   'Find a TEDxNewy volunteer and say thanks.',
   'connect', 'social', 1, 30),
  ('capture_foyer', 'Foyer snapshot',
   'Take a photo of the foyer buzz.',
   'capture', 'photo', 3, 40),
  ('capture_detail', 'Spot the detail',
   'Photograph a small detail most people would miss.',
   'capture', 'photo', 3, 50),
  ('capture_idea', 'Idea in the wild',
   'Photograph something that sparked a thought.',
   'capture', 'photo', 3, 60)
on conflict (id) do nothing;

insert into public.side_quest_challenges
  (id, title, description, category, type, points, sort,
   qr_number, puzzle_prompt, puzzle_answer)
values
  ('discover_1', 'Find the first code',
   'Scan the first hidden QR code and solve it.',
   'discover', 'qr', 5, 70, 1,
   'PLACEHOLDER 1. Type the word alpha.', 'alpha'),
  ('discover_2', 'Find the second code',
   'Scan the second hidden QR code and solve it.',
   'discover', 'qr', 5, 80, 2,
   'PLACEHOLDER 2. Type the word bravo.', 'bravo'),
  ('discover_3', 'Find the third code',
   'Scan the third hidden QR code and solve it.',
   'discover', 'qr', 5, 90, 3,
   'PLACEHOLDER 3. Type the word charlie.', 'charlie')
on conflict (id) do nothing;

-- Signal Side Quest, round 2. Created 2026-10-07.
-- Safe to re-run. Hand-apply in the Supabase SQL editor.
-- Part 1: the prize draw history table (admin only).
-- Part 2: the final quest wording on the live rows.

create table if not exists public.side_quest_draws (
  id           bigint generated always as identity primary key,
  session_id   uuid not null
    references public.side_quest_sessions (id) on delete cascade,
  first_name   text not null,
  score        integer not null,
  eligible_at  timestamptz,
  drawn_at     timestamptz not null default now(),
  status       text not null default 'winner'
    check (status in ('winner', 'skipped'))
);

create index if not exists side_quest_draws_order_idx
  on public.side_quest_draws (drawn_at, id);

alter table public.side_quest_draws enable row level security;

-- Quest wording. Points and categories are unchanged.

update public.side_quest_challenges set
  title = 'First timer',
  description = 'Find someone attending TEDxNewy for the first time.'
where id = 'connect_new_person';

update public.side_quest_challenges set
  title = 'From out of town',
  description = 'Find someone from outside Newcastle.'
where id = 'connect_idea';

update public.side_quest_challenges set
  title = 'Birthday month',
  description = 'Find someone with your birthday month.'
where id = 'connect_volunteer';

update public.side_quest_challenges set
  title = 'With a volunteer',
  description = 'Take a photo with a TEDxNewy volunteer.'
where id = 'capture_foyer';

update public.side_quest_challenges set
  title = 'With a new friend',
  description = 'Take a photo with someone who is a new friend.'
where id = 'capture_detail';

update public.side_quest_challenges set
  title = 'Find the X',
  description = 'Take a photo with an "X" in it.'
where id = 'capture_idea';

update public.side_quest_challenges set
  title = 'Hidden QR Puzzle #1',
  description = 'Find and solve Hidden QR Puzzle #1.'
where id = 'discover_1';

update public.side_quest_challenges set
  title = 'Hidden QR Puzzle #2',
  description = 'Find and solve Hidden QR Puzzle #2.'
where id = 'discover_2';

update public.side_quest_challenges set
  title = 'Hidden QR Puzzle #3',
  description = 'Find and solve Hidden QR Puzzle #3.'
where id = 'discover_3';

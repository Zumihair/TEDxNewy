-- Planning notes on the community calendar.
-- Created 2026-08-18. Apply by hand in the Supabase SQL editor.
-- Safe to re-run. Short lines on purpose.
--
-- Notes are standalone: they carry no link to a social post, a
-- newsletter or an event, and nothing else reads this table. They
-- exist only to be looked at on /admin/calendar.
--
-- `day` is a plain date, not a timestamptz, and that is deliberate.
-- Every other item on that board is anchored to an instant and has to
-- be bucketed into a Sydney day key (see app/admin/calendar/dates.ts).
-- A note has no time, so storing a bare date keeps it out of that
-- conversion entirely and it can never drift a day either way.

create table if not exists public.calendar_notes (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  title text not null,
  body text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text
);

create index if not exists calendar_notes_day_idx
  on public.calendar_notes (day);

alter table public.calendar_notes
  enable row level security;

-- Every admin, both access levels, can read and write notes. The
-- calendar is a Community page and notes are shared planning context,
-- so there is no per-author restriction here on purpose.
drop policy if exists "admins all" on public.calendar_notes;
create policy "admins all" on public.calendar_notes
  for all using (public.is_cms_admin())
  with check (public.is_cms_admin());

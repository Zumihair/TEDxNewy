-- Signal Side Quest: full names. Created 2026-10-08.
-- Safe to re-run. Hand-apply in the Supabase SQL editor.
-- Adds a last name, and a normalised full name key that is unique, so
-- one person cannot register twice under the same name. The key is
-- built by the app: lower case, no accents, letters and digits only,
-- first and last joined with a pipe.
-- Existing rows (first name only) keep a null key, so they are never
-- blocked and never block anyone. Nothing is deleted or changed.

alter table public.side_quest_sessions
  add column if not exists last_name text not null default '';

alter table public.side_quest_sessions
  add column if not exists name_key text;

create unique index if not exists side_quest_sessions_name_key_idx
  on public.side_quest_sessions (name_key)
  where name_key is not null;

-- The draw history keeps the last name too, so a winner reads as a
-- full name in the history.

alter table public.side_quest_draws
  add column if not exists last_name text not null default '';

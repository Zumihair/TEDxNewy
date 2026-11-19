-- =====================================================================
-- Monthly team huddle bot (Slack): polls and votes.
-- Created 2026-11-19. Applied via the supabase-tedx MCP apply_migration.
-- Server-only tables: service role, RLS on, no policies.
-- Safe to re-run.
-- =====================================================================

create table if not exists public.huddle_polls (
  id               uuid primary key default gen_random_uuid(),
  month            text not null,                 -- target month, e.g. '2026-12'
  is_test          boolean not null default false,
  slots            jsonb not null,                -- [{key, startsAt, label}]
  status           text not null default 'open',  -- open | awaiting_confirm | booked | cancelled
  channel_id       text not null,
  message_ts       text,
  closes_at        timestamptz not null,
  dm_channel       text,
  dm_ts            text,
  chosen_slot      text,
  starts_at        timestamptz,
  google_event_id  text,
  google_event_url text,
  agenda_ts        text,
  minutes_ts       text,
  r24_sent         boolean not null default false,
  r1_sent          boolean not null default false,
  created_at       timestamptz not null default now()
);

-- One real poll per month; any number of test polls.
create unique index if not exists huddle_polls_month_real
  on public.huddle_polls (month) where not is_test;

create table if not exists public.huddle_votes (
  poll_id  uuid not null references public.huddle_polls(id) on delete cascade,
  user_id  text not null,
  slot_key text not null,
  created_at timestamptz not null default now(),
  primary key (poll_id, user_id, slot_key)
);

alter table public.huddle_polls enable row level security;
alter table public.huddle_votes enable row level security;

grant select, insert, update, delete on public.huddle_polls to service_role;
grant select, insert, update, delete on public.huddle_votes to service_role;

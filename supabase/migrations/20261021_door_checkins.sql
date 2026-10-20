-- Door check-in: one row per ticket signed in on the day.
-- Safe to re-run. Only the server (service key) touches this table.

create table if not exists public.door_checkins (
  ticket_id text primary key,
  event_id text not null,
  order_id text,
  checked_in_by text,
  checked_in_at timestamptz not null default now()
);

create index if not exists door_checkins_event_idx
  on public.door_checkins (event_id);

alter table public.door_checkins enable row level security;

-- Raw ticket records, copied once from Humanitix so an event's data lives in our
-- own database and no longer depends on Humanitix. One row per ticket; the full
-- Humanitix ticket and order payloads are kept as-is in raw / order_raw.
-- Safe to re-run. Only the server (service key) touches this table.

create table if not exists public.event_ticket_records (
  event_id text not null,
  ticket_id text not null,
  order_id text,
  email text,
  first_name text,
  last_name text,
  ticket_type text,
  status text,
  price numeric,
  checked_in boolean not null default false,
  purchased_at timestamptz,
  raw jsonb not null,
  order_raw jsonb,
  archived_at timestamptz not null default now(),
  primary key (event_id, ticket_id)
);

create index if not exists event_ticket_records_email_idx
  on public.event_ticket_records (event_id, lower(email));

alter table public.event_ticket_records enable row level security;

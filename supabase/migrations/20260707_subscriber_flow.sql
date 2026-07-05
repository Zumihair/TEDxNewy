-- Subscriber welcome flow: a drip sequence sent to new subscribers.
-- Apply by hand in the Supabase SQL editor before deploying Phase 4 code.
-- Safe to re-run.
-- Steps are seeded with empty blocks on purpose: content is authored in the
-- admin block editor. This keeps the SQL free of long JSON literals, which a
-- CRLF paste can corrupt with stray carriage returns.

create table if not exists public.subscriber_flow_steps (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  position     integer not null,
  name         text not null,
  enabled      boolean not null default true,
  delay_days   integer not null default 0,
  subject      text not null default '',
  preheader    text not null default '',
  from_address text not null default 'TEDxNewy <newsletter@tedxnewy.com.au>',
  blocks       jsonb not null default '[]'::jsonb
);

create index if not exists subscriber_flow_steps_position_idx
  on public.subscriber_flow_steps (position);

create table if not exists public.subscriber_flow_sends (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  subscriber_id uuid,
  step_id       uuid,
  unique (subscriber_id, step_id)
);

create index if not exists subscriber_flow_sends_step_idx
  on public.subscriber_flow_sends (step_id);

-- Step 1: Welcome, instant, enabled. Replaces the old confirmation email.
insert into public.subscriber_flow_steps
  (position, name, enabled, delay_days, subject, preheader)
select 1, 'Welcome', true, 0,
  'You''re subscribed to TEDxNewy',
  'Thanks for subscribing. Ideas worth spreading, straight to your inbox.'
where not exists (select 1 from public.subscriber_flow_steps where position = 1);

-- Step 2: You might like, 3 days, enabled.
insert into public.subscriber_flow_steps
  (position, name, enabled, delay_days, subject, preheader)
select 2, 'You might like', true, 3,
  'A few things you might like',
  'Past talks to watch and the speakers behind them.'
where not exists (select 1 from public.subscriber_flow_steps where position = 2);

-- Step 3: Promo slot, 10 days, disabled by default.
insert into public.subscriber_flow_steps
  (position, name, enabled, delay_days, subject, preheader)
select 3, 'Promo slot', false, 10,
  'Something from TEDxNewy',
  'A note from the TEDxNewy team.'
where not exists (select 1 from public.subscriber_flow_steps where position = 3);

-- RLS: admin-only, matching the rest of the CMS. The cron and subscribe route
-- use the service key and bypass RLS, so no anon policies are needed.
alter table public.subscriber_flow_steps enable row level security;
alter table public.subscriber_flow_sends enable row level security;

drop policy if exists "admins all" on public.subscriber_flow_steps;
create policy "admins all" on public.subscriber_flow_steps
  for all using (public.is_cms_admin()) with check (public.is_cms_admin());

drop policy if exists "admins all" on public.subscriber_flow_sends;
create policy "admins all" on public.subscriber_flow_sends
  for all using (public.is_cms_admin()) with check (public.is_cms_admin());

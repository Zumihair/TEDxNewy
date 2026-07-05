-- Subscriber welcome flow: a drip sequence sent to new subscribers.
-- Apply by hand in the Supabase SQL editor before deploying Phase 4 code.
-- Safe to re-run.
-- Note: the seed blocks JSON is kept on a single line each on purpose, so a
-- CRLF paste can never insert a raw carriage return inside a JSON string.

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

-- Step 1: Welcome. Sent instantly on subscribe, replacing the old confirmation.
insert into public.subscriber_flow_steps
  (position, name, enabled, delay_days, subject, preheader, blocks)
select 1, 'Welcome', true, 0,
  'You''re subscribed to TEDxNewy',
  'Thanks for subscribing. Ideas worth spreading, straight to your inbox.',
  '[{"id":"welcome-header","type":"header","text":"Welcome to TEDxNewy.","size":"lg"},{"id":"welcome-text","type":"text","html":"<p>Thanks for subscribing. You''ll be first to hear about new talks, events, speaker line-ups and the next TEDxNewy.</p><p>No spam, just ideas worth spreading. While you wait, dive into the talks from our past events.</p>"},{"id":"welcome-button","type":"button","label":"Explore past talks","href":"https://tedxnewy.com.au/talks","align":"center"}]'::jsonb
where not exists (select 1 from public.subscriber_flow_steps where position = 1);

-- Step 2: You might like. Sent 3 days after subscribing.
insert into public.subscriber_flow_steps
  (position, name, enabled, delay_days, subject, preheader, blocks)
select 2, 'You might like', true, 3,
  'A few things you might like',
  'Past talks to watch and the speakers behind them.',
  '[{"id":"like-header","type":"header","text":"As a new subscriber, you might like...","size":"lg"},{"id":"like-text","type":"text","html":"<p>Now that you are on the list, here are a couple of good places to start. Watch a talk from a past event, then meet the people who gave them. There is always something new coming up, so keep an eye on your inbox.</p>"},{"id":"like-button-talks","type":"button","label":"Watch past talks","href":"https://tedxnewy.com.au/talks","align":"center"},{"id":"like-button-speakers","type":"button","label":"Meet our speakers","href":"https://tedxnewy.com.au/speakers","align":"center"}]'::jsonb
where not exists (select 1 from public.subscriber_flow_steps where position = 2);

-- Step 3: Promo slot. Sent 10 days after subscribing. Seeded DISABLED.
insert into public.subscriber_flow_steps
  (position, name, enabled, delay_days, subject, preheader, blocks)
select 3, 'Promo slot', false, 10,
  'Something from TEDxNewy',
  'A note from the TEDxNewy team.',
  '[{"id":"promo-header","type":"header","text":"Your promo goes here","size":"lg"},{"id":"promo-text","type":"text","html":"<p>This step is a spare slot in the welcome flow. It is turned off by default. Edit this content, set when it should send, then switch it on when you have something to promote.</p>"}]'::jsonb
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

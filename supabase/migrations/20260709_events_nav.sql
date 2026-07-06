-- Phase 4: Events as a first class CMS entity, plus an admin editable header nav.
-- Apply by hand in the Supabase SQL editor before deploying Phase 4 code.
-- Safe to re-run. Short lines on purpose: long lines got CRLF corrupted before.

-- ============================================================
-- Events
-- ============================================================
create table if not exists public.cms_events (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  slug           text not null unique,
  title          text not null,
  tagline        text,
  blurb          text,
  kind           text not null default 'salon'
                 check (kind in ('flagship', 'salon', 'special')),
  status         text not null default 'draft'
                 check (status in ('draft', 'announced', 'past')),
  starts_at      timestamptz,
  date_label     text,
  short_date     text,
  venue          text,
  hero_image_url text,
  link_url       text,
  link_label     text,
  ticket_url     text,
  show_in_nav    boolean not null default true,
  display_order  integer not null default 999
);

-- Link talks and speakers back to an event. Nullable, and set null on delete so
-- removing an event never deletes its talks or speakers.
alter table public.cms_talks
  add column if not exists event_id uuid
  references public.cms_events(id) on delete set null;

alter table public.cms_speakers
  add column if not exists event_id uuid
  references public.cms_events(id) on delete set null;

-- ============================================================
-- Navigation groups + items
-- ============================================================
create table if not exists public.cms_nav_groups (
  key           text primary key,
  label         text not null,
  style         text not null default 'list'
                check (style in ('list', 'cards')),
  kicker        text,
  heading       text,
  blurb         text,
  display_order integer default 999
);

create table if not exists public.cms_nav_items (
  id            uuid primary key default gen_random_uuid(),
  group_key     text not null
                references public.cms_nav_groups(key) on delete cascade,
  label         text not null,
  href          text,
  description   text,
  badge         text,
  image_url     text,
  gradient      text,
  cta_label     text,
  display_order integer default 999,
  is_active     boolean not null default true
);

create index if not exists cms_nav_items_group_idx
  on public.cms_nav_items (group_key, display_order);

-- ============================================================
-- Row level security
-- ============================================================
alter table public.cms_events enable row level security;
alter table public.cms_nav_groups enable row level security;
alter table public.cms_nav_items enable row level security;

-- Public read: everyone can see non draft events.
drop policy if exists "anon read events" on public.cms_events;
create policy "anon read events" on public.cms_events
  for select using (status <> 'draft');

-- Public read: nav groups are all public; items only when active.
drop policy if exists "anon read nav groups" on public.cms_nav_groups;
create policy "anon read nav groups" on public.cms_nav_groups
  for select using (true);

drop policy if exists "anon read nav items" on public.cms_nav_items;
create policy "anon read nav items" on public.cms_nav_items
  for select using (is_active);

-- Admins can do everything, matching the rest of the CMS.
drop policy if exists "admins all" on public.cms_events;
create policy "admins all" on public.cms_events
  for all using (public.is_cms_admin()) with check (public.is_cms_admin());

drop policy if exists "admins all" on public.cms_nav_groups;
create policy "admins all" on public.cms_nav_groups
  for all using (public.is_cms_admin()) with check (public.is_cms_admin());

drop policy if exists "admins all" on public.cms_nav_items;
create policy "admins all" on public.cms_nav_items
  for all using (public.is_cms_admin()) with check (public.is_cms_admin());

-- ============================================================
-- Seed events (re-runnable, keyed on slug)
-- ============================================================
insert into public.cms_events
  (slug, title, tagline, blurb, kind, status,
   starts_at, date_label, short_date, venue,
   hero_image_url, link_url, show_in_nav, display_order)
select
  'student-speaker-competition',
  'Student Speaker Competition',
  'The stage is set for the next generation.',
  'A competition for students across the Hunter to develop and deliver an idea worth spreading.',
  'special', 'announced',
  '2026-08-15T08:00:00Z',
  'Submissions close 15 August 2026',
  'Submissions close 15 August',
  null,
  null, '/student-speaker-competition', true, 10
where not exists (
  select 1 from public.cms_events where slug = 'student-speaker-competition'
);

insert into public.cms_events
  (slug, title, tagline, blurb, kind, status,
   starts_at, date_label, short_date, venue,
   hero_image_url, link_url, show_in_nav, display_order)
select
  '60-second-talk-night',
  '60-Second Talk Night',
  'One idea, one minute.',
  'An intimate evening in Newcastle West where Novocastrians share or simply listen to ideas, each in 60 seconds. Spots are limited, so register to lock in your place to speak or come along.',
  'special', 'announced',
  '2026-07-16T08:00:00Z',
  'Thursday 16 July 2026',
  '16 July',
  'Newcastle West',
  null, '/60-second-talk-night', true, 20
where not exists (
  select 1 from public.cms_events where slug = '60-second-talk-night'
);

insert into public.cms_events
  (slug, title, tagline, blurb, kind, status,
   starts_at, date_label, short_date, venue,
   hero_image_url, link_url, show_in_nav, display_order)
select
  'youth-futures-lab',
  'Youth Futures Lab',
  'Young Novocastrians shaping what comes next.',
  'A hands on lab for young people to explore the ideas and skills that will shape their future.',
  'special', 'announced',
  '2026-08-07T08:00:00Z',
  'Friday 7 August 2026',
  '7 August',
  'NUspace',
  null, '/youth-futures-lab', true, 30
where not exists (
  select 1 from public.cms_events where slug = 'youth-futures-lab'
);

insert into public.cms_events
  (slug, title, tagline, blurb, kind, status,
   starts_at, date_label, short_date, venue,
   hero_image_url, link_url, show_in_nav, display_order)
select
  'flagship-2026',
  'Flagship TEDxNewy 2026',
  'Our biggest stage of the year.',
  'The flagship TEDxNewy event returns in 2026 at the Conservatorium of Music. Details to be announced.',
  'flagship', 'announced',
  '2026-10-24T08:00:00Z',
  'Saturday 24 October 2026',
  '24 October',
  'Conservatorium of Music',
  null, null, true, 40
where not exists (
  select 1 from public.cms_events where slug = 'flagship-2026'
);

insert into public.cms_events
  (slug, title, tagline, blurb, kind, status,
   starts_at, date_label, short_date, venue,
   hero_image_url, link_url, show_in_nav, display_order)
select
  'newcastle-2050-salon',
  'Newcastle 2050: What If?',
  'An evening of bold questions, creative thinking and new perspectives.',
  'The first event of the 2026 season brought Novocastrians together at the Q Building to ask one question: what can Newcastle look like in 2050? Across a packed out evening we worked through transport, health and the night economy, turning a room of strangers into a room of collaborators.',
  'salon', 'past',
  '2026-04-30T08:00:00Z',
  'Thursday 30 April 2026',
  '30 April 2026',
  'Q Building, Honeysuckle',
  '/images/salon-whatif.jpg', '/newcastle-2050-salon', false, 50
where not exists (
  select 1 from public.cms_events where slug = 'newcastle-2050-salon'
);

insert into public.cms_events
  (slug, title, tagline, blurb, kind, status,
   starts_at, date_label, short_date, venue,
   hero_image_url, link_url, show_in_nav, display_order)
select
  'reframe-2025',
  'Reframe',
  'TEDxCooksHill 2025.',
  'Our 2025 flagship at the Conservatorium of Music. Ten speakers reframing the way we see quitting, discomfort, attention, teaching and more.',
  'flagship', 'past',
  '2025-10-01T08:00:00Z',
  'October 2025',
  'October 2025',
  'Conservatorium of Music',
  '/images/past-2025.jpg', null, false, 60
where not exists (
  select 1 from public.cms_events where slug = 'reframe-2025'
);

insert into public.cms_events
  (slug, title, tagline, blurb, kind, status,
   starts_at, date_label, short_date, venue,
   hero_image_url, link_url, show_in_nav, display_order)
select
  'beyond-boundaries-2024',
  'Beyond Boundaries',
  'TEDxCooksHill 2024.',
  'Our 2024 flagship at The Playhouse. Eleven speakers pushing past the boundaries of health, work, play and belonging.',
  'flagship', 'past',
  '2024-10-01T08:00:00Z',
  'October 2024',
  'October 2024',
  'The Playhouse',
  '/images/past-2024.jpg', null, false, 70
where not exists (
  select 1 from public.cms_events where slug = 'beyond-boundaries-2024'
);

-- ============================================================
-- Seed nav groups (re-runnable, keyed on key)
-- ============================================================
insert into public.cms_nav_groups
  (key, label, style, kicker, heading, blurb, display_order)
select
  'upcoming', 'Upcoming', 'list',
  'On the horizon', 'What''s coming up',
  'The events we''re building toward across the season.', 10
where not exists (
  select 1 from public.cms_nav_groups where key = 'upcoming'
);

insert into public.cms_nav_groups
  (key, label, style, kicker, heading, blurb, display_order)
select
  'past', 'Past Events', 'cards',
  null, null, null, 20
where not exists (
  select 1 from public.cms_nav_groups where key = 'past'
);

insert into public.cms_nav_groups
  (key, label, style, kicker, heading, blurb, display_order)
select
  'participate', 'Participate', 'cards',
  null, null, null, 30
where not exists (
  select 1 from public.cms_nav_groups where key = 'participate'
);

insert into public.cms_nav_groups
  (key, label, style, kicker, heading, blurb, display_order)
select
  'about', 'About', 'list',
  'About TEDxNewy', 'Who we are',
  'What we stand for and the people behind the season.', 40
where not exists (
  select 1 from public.cms_nav_groups where key = 'about'
);

-- ============================================================
-- Seed nav items (re-runnable, keyed on group_key + label)
-- The Upcoming group is filled automatically by announced events, so it seeds
-- with no manual items here.
-- ============================================================

-- Past Events (card style)
insert into public.cms_nav_items
  (group_key, label, href, description, image_url, gradient, cta_label,
   display_order)
select
  'past', 'Talks', '/talks', 'Watch every TEDxNewy talk',
  '/images/past-2025.jpg',
  'linear-gradient(135deg, #2a3a88 0%, #1f1f4a 50%, #050818 100%)',
  'Watch talks', 10
where not exists (
  select 1 from public.cms_nav_items
  where group_key = 'past' and label = 'Talks'
);

insert into public.cms_nav_items
  (group_key, label, href, description, image_url, gradient, cta_label,
   display_order)
select
  'past', 'Salons', '/salons', 'Our intimate idea nights',
  '/images/salon-whatif.jpg',
  'linear-gradient(135deg, #1f4a5c 0%, #0c2430 60%, #050f15 100%)',
  'Explore salons', 20
where not exists (
  select 1 from public.cms_nav_items
  where group_key = 'past' and label = 'Salons'
);

insert into public.cms_nav_items
  (group_key, label, href, description, image_url, gradient, cta_label,
   display_order)
select
  'past', 'Speakers', '/speakers', 'Past TEDxNewy voices',
  '/images/stage-benjie.jpg',
  'linear-gradient(135deg, #2a0604 0%, #8c0d05 50%, #b91404 100%)',
  'Meet the speakers', 30
where not exists (
  select 1 from public.cms_nav_items
  where group_key = 'past' and label = 'Speakers'
);

-- Participate (card style)
insert into public.cms_nav_items
  (group_key, label, href, description, image_url, gradient, cta_label,
   display_order)
select
  'participate', 'Volunteer with us', '/volunteer', 'Join the crew',
  '/images/stage-dialogue.jpg',
  'linear-gradient(135deg, #1f4a5c 0%, #0c2430 60%, #050f15 100%)',
  'Learn more', 10
where not exists (
  select 1 from public.cms_nav_items
  where group_key = 'participate' and label = 'Volunteer with us'
);

insert into public.cms_nav_items
  (group_key, label, href, description, image_url, gradient, cta_label,
   display_order)
select
  'participate', 'Partner with us', '/partner', 'Support the season',
  '/images/youth-futures/yfl-brand.jpg',
  'linear-gradient(135deg, #2a0604 0%, #8c0d05 50%, #b91404 100%)',
  'Start a conversation', 20
where not exists (
  select 1 from public.cms_nav_items
  where group_key = 'participate' and label = 'Partner with us'
);

insert into public.cms_nav_items
  (group_key, label, href, description, image_url, gradient, cta_label,
   display_order)
select
  'participate', 'Nominate a speaker', '/speak', 'Tell us who we''re missing',
  '/images/stage-welcome.jpg',
  'linear-gradient(135deg, #2a3a88 0%, #1f1f4a 50%, #050818 100%)',
  'Learn more', 30
where not exists (
  select 1 from public.cms_nav_items
  where group_key = 'participate' and label = 'Nominate a speaker'
);

-- About (list style)
insert into public.cms_nav_items
  (group_key, label, href, description, display_order)
select
  'about', 'Mission', '/mission', 'What TEDxNewy stands for', 10
where not exists (
  select 1 from public.cms_nav_items
  where group_key = 'about' and label = 'Mission'
);

insert into public.cms_nav_items
  (group_key, label, href, description, display_order)
select
  'about', 'Sponsors', '/sponsors', 'The partners behind the season', 20
where not exists (
  select 1 from public.cms_nav_items
  where group_key = 'about' and label = 'Sponsors'
);

insert into public.cms_nav_items
  (group_key, label, href, description, display_order)
select
  'about', 'Team', '/team', 'The volunteer crew', 30
where not exists (
  select 1 from public.cms_nav_items
  where group_key = 'about' and label = 'Team'
);

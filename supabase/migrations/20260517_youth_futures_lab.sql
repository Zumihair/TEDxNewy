-- =====================================================================
-- Youth Futures Lab — registrations + notification recipients
-- Created 2026-05-17 for the 5 Aug 2026 hackathon.
--
-- Apply via Supabase dashboard → SQL editor. Safe to re-run (uses
-- `create table if not exists` and `on conflict do nothing` for the seed).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. youth_futures_registrations — school EOI submissions
-- ---------------------------------------------------------------------
create table if not exists public.youth_futures_registrations (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  school_name         text not null,
  suburb              text not null,
  contact_name        text not null,
  contact_role        text not null,
  email               text not null,
  phone               text not null,
  student_count       int  not null check (student_count between 1 and 30),
  year_levels         text not null,
  comments            text,
  marketing_consent   boolean not null default false,
  school_authorised   boolean not null default false,
  user_agent          text,
  ip                  text
);

alter table public.youth_futures_registrations enable row level security;

drop policy if exists "anon can insert" on public.youth_futures_registrations;
create policy "anon can insert"
  on public.youth_futures_registrations
  for insert
  to anon
  with check (true);

drop policy if exists "admins can read" on public.youth_futures_registrations;
create policy "admins can read"
  on public.youth_futures_registrations
  for select
  using (public.is_cms_admin());

-- ---------------------------------------------------------------------
-- 2. notification_recipients — generalised email-alert recipients,
--    keyed by form_source so other forms can reuse the table.
-- ---------------------------------------------------------------------
create table if not exists public.notification_recipients (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  form_source   text not null,
  email         text not null,
  label         text,
  active        boolean not null default true,
  unique (form_source, email)
);

alter table public.notification_recipients enable row level security;

drop policy if exists "admins can read" on public.notification_recipients;
create policy "admins can read"
  on public.notification_recipients
  for select
  using (public.is_cms_admin());

drop policy if exists "admins can write" on public.notification_recipients;
create policy "admins can write"
  on public.notification_recipients
  for all
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

-- Form API routes need to read recipients with the anon key (no admin
-- session). Add a narrow anon-select policy scoped to active rows only,
-- so leaking the list isn't catastrophic.
drop policy if exists "anon can read active" on public.notification_recipients;
create policy "anon can read active"
  on public.notification_recipients
  for select
  to anon
  using (active = true);

-- ---------------------------------------------------------------------
-- 3. Seed: default recipient for Youth Futures Lab
-- ---------------------------------------------------------------------
insert into public.notification_recipients (form_source, email, label, active)
values ('youth-futures', 'hello@tedxnewy.com.au', 'Default', true)
on conflict (form_source, email) do nothing;

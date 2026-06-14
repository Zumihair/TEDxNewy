-- =====================================================================
-- TEDxNewy 60-Second Talk Night — EOI registrations
-- Created 2026-06-14 for the 16 July 2026 community event at The Base.
--
-- Apply via Supabase dashboard -> SQL editor. Safe to re-run (uses
-- `create table if not exists`, `add column if not exists`,
-- `drop policy if exists`, and `on conflict do nothing` for the seed).
-- =====================================================================

-- ---------------------------------------------------------------------
-- talk_night_registrations — expression-of-interest submissions.
-- One row per person; `attendance_type` records whether they want to
-- speak, attend, or both.
-- ---------------------------------------------------------------------
create table if not exists public.talk_night_registrations (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  full_name           text not null,
  email               text not null,
  phone               text,
  attendance_type     text not null check (attendance_type in ('speak', 'attend', 'both')),
  idea                text,
  comments            text,
  marketing_consent   boolean not null default false,
  contacted           boolean not null default false,
  user_agent          text,
  ip                  text
);

alter table public.talk_night_registrations enable row level security;

-- Public form posts with the anon key — insert only.
drop policy if exists "anon can insert" on public.talk_night_registrations;
create policy "anon can insert"
  on public.talk_night_registrations
  for insert
  to anon
  with check (true);

-- Admins (CMS session) can read every submission.
drop policy if exists "admins can read" on public.talk_night_registrations;
create policy "admins can read"
  on public.talk_night_registrations
  for select
  using (public.is_cms_admin());

-- Admins can flip the `contacted` follow-up flag.
drop policy if exists "admins can update" on public.talk_night_registrations;
create policy "admins can update"
  on public.talk_night_registrations
  for update
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

-- ---------------------------------------------------------------------
-- Seed: default notification recipient for this form source.
-- (notification_recipients table created in 20260517_youth_futures_lab.sql)
-- ---------------------------------------------------------------------
insert into public.notification_recipients (form_source, email, label, active)
values ('talk-night', 'hello@tedxnewy.com.au', 'Default', true)
on conflict (form_source, email) do nothing;

-- =====================================================================
-- Student Speaker Competition — entries
-- Created 2026-05-21 for the 2026 student speaker comp (entries close
-- 15 August 2026, finalists may speak at TEDxNewy 2026).
--
-- Apply via Supabase dashboard → SQL editor. Safe to re-run (uses
-- `create table if not exists` and `on conflict do nothing` for the seed).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. student_speaker_submissions — one row per student entry
-- ---------------------------------------------------------------------
create table if not exists public.student_speaker_submissions (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  full_name    text not null,
  email        text not null,
  phone        text not null,
  school       text not null,
  post_code    text not null,
  city         text not null,
  talk_title   text not null,
  video_url    text not null,
  user_agent   text,
  ip           text
);

alter table public.student_speaker_submissions enable row level security;

drop policy if exists "anon can insert" on public.student_speaker_submissions;
create policy "anon can insert"
  on public.student_speaker_submissions
  for insert
  to anon
  with check (true);

drop policy if exists "admins can read" on public.student_speaker_submissions;
create policy "admins can read"
  on public.student_speaker_submissions
  for select
  using (public.is_cms_admin());

-- ---------------------------------------------------------------------
-- 2. Seed a sensible default notification recipient set so submissions
--    fire emails out-of-the-box once RESEND_API_KEY is configured.
--    Mirrors the YFL seed pattern. Safe to re-run.
-- ---------------------------------------------------------------------
insert into public.notification_recipients (form_source, email, label, active)
values
  ('student-speaker', 'activations@tedxnewy.com.au', 'Activations team', true),
  ('student-speaker', 'will@tedxnewy.com.au',        'Will (co-director)', true),
  ('student-speaker', 'jake@tedxnewy.com.au',        'Jake (co-director)', true)
on conflict (form_source, email) do nothing;

-- =====================================================================
-- Admin email send history
-- Created 2026-07-02. Records every one-off email composed and sent from
-- the admin (Settings -> Emails), one row per recipient, so the team can
-- see exactly who a message went to and whether Resend accepted it —
-- without needing access to the Resend dashboard.
--
-- `status` is 'sent' (Resend accepted the message) or 'failed' (it was
-- rejected, e.g. rate limit or bad address); `error` holds the reason for
-- failures. Rows sharing a `batch_id` were one compose action.
--
-- Written from admin server actions, which carry the CMS admin session, so
-- RLS restricts both read and write to is_cms_admin().
--
-- Apply via Supabase dashboard -> SQL editor. Safe to re-run.
-- =====================================================================

create table if not exists public.email_sends (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  batch_id    uuid not null,
  from_email  text,
  to_email    text not null,
  cc          text,
  subject     text not null,
  body        text,
  status      text not null check (status in ('sent', 'failed')),
  error       text,
  resend_id   text
);

create index if not exists email_sends_batch_id_idx
  on public.email_sends (batch_id);
create index if not exists email_sends_created_at_idx
  on public.email_sends (created_at desc);

alter table public.email_sends enable row level security;

drop policy if exists "admins can read" on public.email_sends;
create policy "admins can read"
  on public.email_sends
  for select
  using (public.is_cms_admin());

drop policy if exists "admins can insert" on public.email_sends;
create policy "admins can insert"
  on public.email_sends
  for insert
  with check (public.is_cms_admin());

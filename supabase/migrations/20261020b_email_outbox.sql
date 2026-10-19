-- =====================================================================
-- Email outbox
-- Created 2026-10-20. When Resend refuses a form notification or a
-- confirmation email because the daily or monthly quota is used up (or is
-- briefly unavailable), the email is parked here and the 5-minute cron
-- (app/api/cron/newsletter) sends it once Resend accepts mail again, so
-- nothing is lost on a busy day.
--
-- Written and read only by server code using the service role, which bypasses
-- row level security, so RLS is on with no policies (nobody else can see it).
--
-- Apply via Supabase dashboard -> SQL editor. Safe to re-run. The site works
-- without it: until it exists, a refused email is just logged as before.
-- =====================================================================

create table if not exists public.email_outbox (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  tag         text,
  from_email  text not null,
  to_emails   text[] not null,
  cc_emails   text[],
  subject     text not null,
  text_body   text,
  html_body   text,
  status      text not null default 'pending'
              check (status in ('pending', 'sent', 'dead')),
  attempts    int not null default 0,
  last_error  text,
  sent_at     timestamptz
);

create index if not exists email_outbox_pending_idx
  on public.email_outbox (created_at)
  where status = 'pending';

alter table public.email_outbox enable row level security;

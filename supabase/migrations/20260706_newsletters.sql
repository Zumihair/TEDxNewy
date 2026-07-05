-- Newsletters, saved templates, and subscriber unsubscribe support.
-- Apply by hand in the Supabase SQL editor before deploying Phase 2 code.
-- Safe to re-run.

-- Campaigns. blocks holds the block-editor JSON; status drives the
-- drafts / scheduled / sent tabs. 'sending' is a transient claim used by the
-- cron to stop two runs dispatching the same campaign.
create table if not exists public.newsletters (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  title         text not null default 'Untitled newsletter',
  subject       text not null default '',
  preheader     text not null default '',
  from_address  text not null default 'TEDxNewy <newsletter@tedxnewy.com.au>',
  audience      text not null default 'subscribers',
  blocks        jsonb not null default '[]'::jsonb,
  status        text not null default 'draft'
                check (status in ('draft', 'scheduled', 'sending', 'sent')),
  scheduled_at  timestamptz,
  sent_at       timestamptz,
  sent_count    integer,
  failed_count  integer,
  send_batch_id uuid
);

create index if not exists newsletters_status_sched_idx
  on public.newsletters (status, scheduled_at);

-- Reusable starting points for a new campaign.
create table if not exists public.newsletter_templates (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name       text not null,
  subject    text not null default '',
  preheader  text not null default '',
  blocks     jsonb not null default '[]'::jsonb
);

-- Unsubscribe support on the existing subscriber list. The token backfills
-- onto existing rows automatically via the default.
alter table public.subscribers
  add column if not exists unsubscribe_token uuid not null default gen_random_uuid();
alter table public.subscribers
  add column if not exists unsubscribed_at timestamptz;

create unique index if not exists subscribers_unsub_token_idx
  on public.subscribers (unsubscribe_token);

-- RLS: admin-only, matching the rest of the CMS. The cron and unsubscribe
-- routes use the service key and bypass RLS, so no anon policies are needed.
alter table public.newsletters enable row level security;
alter table public.newsletter_templates enable row level security;

drop policy if exists "admins all" on public.newsletters;
create policy "admins all" on public.newsletters
  for all using (public.is_cms_admin()) with check (public.is_cms_admin());

drop policy if exists "admins all" on public.newsletter_templates;
create policy "admins all" on public.newsletter_templates
  for all using (public.is_cms_admin()) with check (public.is_cms_admin());

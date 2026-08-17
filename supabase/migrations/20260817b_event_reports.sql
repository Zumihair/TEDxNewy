-- Impact reports: per-event, admin-authored, exported to PDF.
-- Apply by hand in the Supabase SQL editor before deploying.
-- Safe to re-run. Short lines on purpose.

create table if not exists public.event_reports (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null
    references public.cms_events(id) on delete cascade,
  title text not null default 'Impact report',
  kind text not null default 'overview',
  status text not null default 'draft',
  config jsonb not null default '{}'::jsonb,
  pdf_url text,
  pdf_generated_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.event_reports
  drop constraint if exists event_reports_kind_check;
alter table public.event_reports
  add constraint event_reports_kind_check
  check (kind in ('overview', 'highlight'));

alter table public.event_reports
  drop constraint if exists event_reports_status_check;
alter table public.event_reports
  add constraint event_reports_status_check
  check (status in ('draft', 'final'));

create index if not exists event_reports_event_idx
  on public.event_reports (event_id, updated_at desc);

alter table public.event_reports enable row level security;

-- Admin only. No anon policy: reports are internal until someone
-- shares the exported PDF.
drop policy if exists "admins all" on public.event_reports;
create policy "admins all" on public.event_reports
  for all
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

-- Only full admins may write.
drop policy if exists "full admins write reports"
  on public.event_reports;
create policy "full admins write reports"
  on public.event_reports
  as restrictive
  for all
  to authenticated
  using (public.is_full_cms_admin())
  with check (public.is_full_cms_admin());

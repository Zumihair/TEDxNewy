-- Partnerships portal: a light CRM for prospecting, contacting and tracking
-- potential partners, plus a per-partner generated prospectus PDF.
-- Applied 2026-08-18 via the Supabase MCP. Safe to re-run.

create table if not exists public.cms_partners (
  id uuid primary key default gen_random_uuid(),
  org_name text not null,
  contact_name text,
  email text,
  phone text,
  website text,
  category text,                 -- e.g. "University", "Health", "Property"
  target_tier text,              -- presenting | platinum | gold | community
  status text not null default 'prospect',
  notes text,
  prospectus_url text,
  prospectus_generated_at timestamptz,
  last_contacted_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cms_partners
  drop constraint if exists cms_partners_status_check;
alter table public.cms_partners
  add constraint cms_partners_status_check
  check (status in ('prospect','contacted','in_discussion','confirmed','declined','dormant'));

create index if not exists cms_partners_status_idx
  on public.cms_partners (status, updated_at desc);

alter table public.cms_partners enable row level security;

drop policy if exists "admins all" on public.cms_partners;
create policy "admins all" on public.cms_partners
  for all using (public.is_cms_admin()) with check (public.is_cms_admin());

drop policy if exists "full admins write partners" on public.cms_partners;
create policy "full admins write partners" on public.cms_partners
  as restrictive for all to authenticated
  using (public.is_full_cms_admin()) with check (public.is_full_cms_admin());

-- Contact / activity log: emails sent, status changes, notes with a timestamp.
create table if not exists public.cms_partner_events (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.cms_partners(id) on delete cascade,
  kind text not null,            -- email | status | note | prospectus
  summary text not null,
  detail text,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists cms_partner_events_partner_idx
  on public.cms_partner_events (partner_id, created_at desc);

alter table public.cms_partner_events enable row level security;

drop policy if exists "admins all" on public.cms_partner_events;
create policy "admins all" on public.cms_partner_events
  for all using (public.is_cms_admin()) with check (public.is_cms_admin());

drop policy if exists "full admins write partner events" on public.cms_partner_events;
create policy "full admins write partner events" on public.cms_partner_events
  as restrictive for all to authenticated
  using (public.is_full_cms_admin()) with check (public.is_full_cms_admin());

-- Redesign partner logos as an open-ended list rather than two fixed
-- light/dark slots (the two-field layout didn't fit the confirmed-state
-- column width), and add a commitments checklist for confirmed partners.
-- Applied 2026-08-19 via the Supabase Management API. Safe to re-run.

alter table public.cms_partners
  add column if not exists logo_urls text[] not null default '{}';

-- Backfill anything already uploaded under the old two-column shape before
-- dropping it (defensive: this shipped only hours earlier, so likely a
-- no-op, but cheap to do correctly).
update public.cms_partners
set logo_urls = array_remove(array[logo_light_url, logo_dark_url], null)
where logo_urls = '{}' and (logo_light_url is not null or logo_dark_url is not null);

alter table public.cms_partners
  drop column if exists logo_light_url,
  drop column if exists logo_dark_url;

create table if not exists public.cms_partner_commitments (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.cms_partners(id) on delete cascade,
  label text not null,
  done boolean not null default false,
  created_at timestamptz not null default now(),
  done_at timestamptz
);

create index if not exists cms_partner_commitments_partner_idx
  on public.cms_partner_commitments (partner_id, created_at);

alter table public.cms_partner_commitments enable row level security;

drop policy if exists "admins all" on public.cms_partner_commitments;
create policy "admins all" on public.cms_partner_commitments
  for all using (public.is_cms_admin()) with check (public.is_cms_admin());

drop policy if exists "full admins write partner commitments"
  on public.cms_partner_commitments;
create policy "full admins write partner commitments"
  on public.cms_partner_commitments
  as restrictive
  for all
  to authenticated
  using (public.is_full_cms_admin())
  with check (public.is_full_cms_admin());

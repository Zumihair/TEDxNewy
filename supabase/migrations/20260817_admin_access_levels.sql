-- Tiered admin access: full vs community.
-- Apply by hand in the Supabase SQL editor before deploying.
-- Safe to re-run. Short lines on purpose: long lines got CRLF corrupted before.

-- ============================================================
-- The level itself
-- ============================================================
alter table public.cms_admins
  add column if not exists access_level text not null default 'full';

alter table public.cms_admins
  drop constraint if exists cms_admins_access_level_check;

alter table public.cms_admins
  add constraint cms_admins_access_level_check
  check (access_level in ('full', 'community'));

-- ============================================================
-- is_full_cms_admin()
-- ============================================================
-- security definer so the policies below can read cms_admins without
-- recursing through cms_admins' own RLS. Mirrors is_cms_admin().
create or replace function public.is_full_cms_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.cms_admins a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and a.access_level = 'full'
  );
$$;

revoke all on function public.is_full_cms_admin() from public;
grant execute on function public.is_full_cms_admin() to authenticated;

-- ============================================================
-- Only full admins may change the allowlist
-- ============================================================
-- Restrictive, so these AND with whatever permissive policies already exist
-- (the originals were created in the CMS setup migration, which is not in
-- this repo, so their names are unknown). Reads stay open to any admin:
-- requireAdmin() needs to look up its own row.
drop policy if exists "full admins insert admins" on public.cms_admins;
create policy "full admins insert admins"
  on public.cms_admins
  as restrictive
  for insert
  to authenticated
  with check (public.is_full_cms_admin());

drop policy if exists "full admins update admins" on public.cms_admins;
create policy "full admins update admins"
  on public.cms_admins
  as restrictive
  for update
  to authenticated
  using (public.is_full_cms_admin())
  with check (public.is_full_cms_admin());

drop policy if exists "full admins delete admins" on public.cms_admins;
create policy "full admins delete admins"
  on public.cms_admins
  as restrictive
  for delete
  to authenticated
  using (public.is_full_cms_admin());

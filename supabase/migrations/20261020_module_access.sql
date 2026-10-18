-- Per-module access, team socials and phone. Run in the Supabase SQL editor after 20261019_access_permissions.sql.
-- Safe to run more than once.

-- 1. Each sign-in has read or write for each module: {"events":true,"comms":false,...} (true = can write).
--    Admins can write everywhere and are the only ones who open Settings.
alter table public.cms_admins add column if not exists module_access jsonb;

update public.cms_admins
   set module_access = jsonb_build_object(
         'events',   coalesce(can_edit, false),
         'comms',    coalesce(can_edit, false),
         'partners', coalesce(can_edit, false),
         'inbox',    coalesce(can_edit, false),
         'library',  coalesce(can_edit, false)
       )
 where module_access is null;

create or replace function public.set_admin_modules(p_email text, p_modules jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_any boolean;
begin
  if not public.is_admin_access() then
    raise exception 'Only an admin can change access';
  end if;
  if not exists (select 1 from public.cms_admins where lower(email) = lower(p_email) and shared) then
    raise exception 'That access does not exist';
  end if;
  select coalesce(bool_or(value::text = 'true'), false) into v_any from jsonb_each(coalesce(p_modules, '{}'::jsonb));
  update public.cms_admins
     set module_access = coalesce(p_modules, '{}'::jsonb),
         can_edit = v_any or coalesce(is_admin, false),
         access_level = case when v_any or coalesce(is_admin, false) then 'full' else 'community' end
   where lower(email) = lower(p_email);
end;
$$;
grant execute on function public.set_admin_modules(text, jsonb) to authenticated;

-- 2. Team members: any number of social links (catalogue in lib/social-catalogue.ts) and a phone for signatures.
alter table public.cms_team_members add column if not exists socials jsonb not null default '[]'::jsonb;
alter table public.cms_team_members add column if not exists phone text;

update public.cms_team_members
   set socials = (
     select coalesce(jsonb_agg(x), '[]'::jsonb) from (
       select jsonb_build_object('key', 'linkedin', 'url', linkedin_url) as x where coalesce(linkedin_url, '') <> ''
       union all
       select jsonb_build_object('key', 'instagram', 'url', instagram_url) where coalesce(instagram_url, '') <> ''
     ) s
   )
 where socials = '[]'::jsonb;

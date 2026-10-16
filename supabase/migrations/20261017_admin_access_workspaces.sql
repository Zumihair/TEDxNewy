-- Admin access: passwords you create in the dashboard, each with its own workspaces.
-- Run once in the Supabase SQL editor (safe to re-run).
-- It builds on 20261016_admin_password_accounts.sql (the two first accounts).

create extension if not exists pgcrypto;

-- What a sign-in can see. NULL means "use the level": full sees everything,
-- community sees Comms and Library.
alter table public.cms_admins add column if not exists workspaces text[];
alter table public.cms_admins add column if not exists label text;
alter table public.cms_admins add column if not exists shared boolean not null default false;

-- The two accounts from the first migration become named, shared accesses.
update public.cms_admins
   set shared = true, label = 'Full access'
 where lower(email) = 'full@admin.tedxnewy.com.au';
update public.cms_admins
   set shared = true, label = 'Comms access'
 where lower(email) = 'community@admin.tedxnewy.com.au';

-- The sign-in page needs to know which shared accounts exist, before anyone is
-- signed in. It only returns the account addresses, never labels or passwords.
create or replace function public.admin_access_logins()
returns table (email text)
language sql
security definer
set search_path = public
as $$
  select a.email from public.cms_admins a where a.shared order by a.email;
$$;
grant execute on function public.admin_access_logins() to anon, authenticated;

-- Create a new shared access. Only a full admin can call this.
create or replace function public.create_admin_access(
  p_label text,
  p_password text,
  p_workspaces text[]
) returns text
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_email text;
  v_slug text;
  v_uid uuid := gen_random_uuid();
  v_all text[] := array['events','comms','partners','inbox','library','settings'];
  v_level text;
begin
  if not public.is_full_cms_admin() then
    raise exception 'Only a full admin can create access';
  end if;
  if coalesce(trim(p_label), '') = '' or length(coalesce(p_password, '')) < 8 then
    raise exception 'A name and a password of at least 8 characters are required';
  end if;
  v_slug := regexp_replace(lower(trim(p_label)), '[^a-z0-9]+', '-', 'g');
  v_slug := trim(both '-' from v_slug);
  if v_slug = '' then v_slug := 'access'; end if;
  v_email := v_slug || '@admin.tedxnewy.com.au';
  if exists (select 1 from auth.users where email = v_email) then
    v_email := v_slug || '-' || substr(replace(v_uid::text, '-', ''), 1, 4) || '@admin.tedxnewy.com.au';
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', v_email,
    crypt(p_password, gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
  );
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_uid, v_uid::text,
    jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true),
    'email', now(), now(), now());

  -- full only if every workspace is ticked
  v_level := case when (v_all <@ coalesce(p_workspaces, '{}')) then 'full' else 'community' end;
  insert into public.cms_admins (email, access_level, workspaces, label, shared)
  values (v_email, v_level, p_workspaces, trim(p_label), true);
  return v_email;
end;
$$;
grant execute on function public.create_admin_access(text, text, text[]) to authenticated;

-- Rename, change workspaces, and optionally set a new password.
create or replace function public.update_admin_access(
  p_email text,
  p_label text,
  p_workspaces text[],
  p_password text default null
) returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_all text[] := array['events','comms','partners','inbox','library','settings'];
  v_level text;
begin
  if not public.is_full_cms_admin() then
    raise exception 'Only a full admin can change access';
  end if;
  if not exists (select 1 from public.cms_admins where lower(email) = lower(p_email) and shared) then
    raise exception 'That access does not exist';
  end if;
  if lower(p_email) = lower(coalesce(auth.jwt() ->> 'email', '')) then
    raise exception 'You cannot change the access you are signed in with. Ask another full access.';
  end if;
  v_level := case when (v_all <@ coalesce(p_workspaces, '{}')) then 'full' else 'community' end;
  update public.cms_admins
     set label = trim(p_label), workspaces = p_workspaces, access_level = v_level
   where lower(email) = lower(p_email);
  if p_password is not null and p_password <> '' then
    if length(p_password) < 8 then raise exception 'A password needs at least 8 characters'; end if;
    update auth.users set encrypted_password = crypt(p_password, gen_salt('bf')), updated_at = now()
     where lower(email) = lower(p_email);
  end if;
end;
$$;
grant execute on function public.update_admin_access(text, text, text[], text) to authenticated;

-- Remove an access entirely (the sign-in and its password).
create or replace function public.delete_admin_access(p_email text)
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
begin
  if not public.is_full_cms_admin() then
    raise exception 'Only a full admin can remove access';
  end if;
  if lower(p_email) = lower(coalesce(auth.jwt() ->> 'email', '')) then
    raise exception 'You cannot remove the access you are signed in with. Ask another full access.';
  end if;
  if not exists (
    select 1 from public.cms_admins
     where shared and access_level = 'full' and lower(email) <> lower(p_email)
  ) then
    raise exception 'At least one full access has to remain';
  end if;
  delete from public.cms_admins where lower(email) = lower(p_email) and shared;
  delete from auth.identities where user_id in (select id from auth.users where lower(email) = lower(p_email));
  delete from auth.users where lower(email) = lower(p_email);
end;
$$;
grant execute on function public.delete_admin_access(text) to authenticated;

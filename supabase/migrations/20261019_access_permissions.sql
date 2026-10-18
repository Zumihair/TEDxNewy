-- Access becomes two switches instead of a list of workspaces:
--   can_edit  add, edit, delete, send, move (off = view only)
--   is_admin  also opens Settings (access, team, notifications); admins can always edit
-- Everyone signed in can see every page except Settings.
-- An access can be linked to a team member (team_slug), and password-only sign-in picks the account
-- from the password itself. Run once in the Supabase SQL editor (safe to re-run).
-- Run this BEFORE the personal logins SQL (kept outside the repo, it holds passwords).

create extension if not exists pgcrypto;

alter table public.cms_admins add column if not exists can_edit boolean;
alter table public.cms_admins add column if not exists is_admin boolean;
alter table public.cms_admins add column if not exists team_slug text;
alter table public.cms_admins add column if not exists personal boolean not null default false;

-- Existing accesses keep what they could do before: full ones become admins, the rest keep editing.
update public.cms_admins set is_admin = (access_level = 'full') where is_admin is null;
update public.cms_admins set can_edit = true where can_edit is null;

create or replace function public.is_admin_access()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.cms_admins a
     where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
       and coalesce(a.is_admin, a.access_level = 'full')
  );
$$;
grant execute on function public.is_admin_access() to authenticated;

-- Password-only sign-in: which account does this password belong to? Throttled: after 25 wrong
-- guesses in 10 minutes it stops answering for a while.
create table if not exists public.admin_login_failures (
  id bigserial primary key,
  at timestamptz not null default now()
);
alter table public.admin_login_failures enable row level security;

create or replace function public.admin_login_email(p_password text)
returns text
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v text;
begin
  delete from public.admin_login_failures where at < now() - interval '1 hour';
  if (select count(*) from public.admin_login_failures where at > now() - interval '10 minutes') >= 25 then
    return null;
  end if;
  select u.email into v
    from auth.users u
    join public.cms_admins a on lower(a.email) = lower(u.email)
   where a.shared and u.encrypted_password = crypt(p_password, u.encrypted_password)
   limit 1;
  if v is null then
    insert into public.admin_login_failures default values;
  end if;
  return v;
end;
$$;
grant execute on function public.admin_login_email(text) to anon, authenticated;

-- The shared-password scan on the sign-in page (fallback) should not try personal accounts.
create or replace function public.admin_access_logins()
returns table (email text)
language sql
security definer
set search_path = public
as $$
  select a.email from public.cms_admins a where a.shared and not a.personal order by a.email;
$$;
grant execute on function public.admin_access_logins() to anon, authenticated;

drop function if exists public.create_admin_access(text, text, text[]);
drop function if exists public.update_admin_access(text, text, text[], text);

create or replace function public.create_admin_access(
  p_label text,
  p_password text,
  p_can_edit boolean,
  p_admin boolean,
  p_team_slug text default null,
  p_username text default null
) returns text
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_email text;
  v_slug text;
  v_uid uuid := gen_random_uuid();
begin
  if not public.is_admin_access() then
    raise exception 'Only an admin can create access';
  end if;
  if coalesce(trim(p_label), '') = '' or length(coalesce(p_password, '')) < 8 then
    raise exception 'A name and a password of at least 8 characters are required';
  end if;
  v_slug := regexp_replace(lower(trim(coalesce(nullif(trim(p_username), ''), p_label))), '[^a-z0-9]+', '-', 'g');
  v_slug := trim(both '-' from v_slug);
  if v_slug = '' then v_slug := 'access'; end if;
  v_email := v_slug || '@admin.tedxnewy.com.au';
  if exists (select 1 from auth.users where email = v_email) then
    v_email := v_slug || '-' || substr(replace(v_uid::text, '-', ''), 1, 4) || '@admin.tedxnewy.com.au';
  end if;
  if exists (
    select 1 from auth.users u where u.encrypted_password = crypt(p_password, u.encrypted_password)
  ) then
    raise exception 'That password is already in use. Pick another.';
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

  insert into public.cms_admins (email, access_level, label, shared, personal, can_edit, is_admin, team_slug)
  values (
    v_email,
    case when p_can_edit or p_admin then 'full' else 'community' end,
    trim(p_label), true, p_team_slug is not null, p_can_edit or p_admin, p_admin, nullif(trim(p_team_slug), '')
  );
  return v_email;
end;
$$;
grant execute on function public.create_admin_access(text, text, boolean, boolean, text, text) to authenticated;

create or replace function public.update_admin_access(
  p_email text,
  p_label text,
  p_can_edit boolean,
  p_admin boolean,
  p_password text default null
) returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
begin
  if not public.is_admin_access() then
    raise exception 'Only an admin can change access';
  end if;
  if not exists (select 1 from public.cms_admins where lower(email) = lower(p_email) and shared) then
    raise exception 'That access does not exist';
  end if;
  if lower(p_email) = lower(coalesce(auth.jwt() ->> 'email', '')) and not p_admin then
    raise exception 'You cannot take admin away from the access you are signed in with.';
  end if;
  if not p_admin and not exists (
    select 1 from public.cms_admins
     where shared and coalesce(is_admin, access_level = 'full') and lower(email) <> lower(p_email)
  ) then
    raise exception 'At least one admin has to remain';
  end if;
  update public.cms_admins
     set label = trim(p_label),
         can_edit = p_can_edit or p_admin,
         is_admin = p_admin,
         access_level = case when p_can_edit or p_admin then 'full' else 'community' end
   where lower(email) = lower(p_email);
  if p_password is not null and p_password <> '' then
    if length(p_password) < 8 then raise exception 'A password needs at least 8 characters'; end if;
    if exists (
      select 1 from auth.users u
       where lower(u.email) <> lower(p_email) and u.encrypted_password = crypt(p_password, u.encrypted_password)
    ) then
      raise exception 'That password is already in use. Pick another.';
    end if;
    update auth.users set encrypted_password = crypt(p_password, gen_salt('bf')), updated_at = now()
     where lower(email) = lower(p_email);
  end if;
end;
$$;
grant execute on function public.update_admin_access(text, text, boolean, boolean, text) to authenticated;

create or replace function public.delete_admin_access(p_email text)
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
begin
  if not public.is_admin_access() then
    raise exception 'Only an admin can remove access';
  end if;
  if lower(p_email) = lower(coalesce(auth.jwt() ->> 'email', '')) then
    raise exception 'You cannot remove the access you are signed in with. Ask another admin.';
  end if;
  if not exists (
    select 1 from public.cms_admins
     where shared and coalesce(is_admin, access_level = 'full') and lower(email) <> lower(p_email)
  ) then
    raise exception 'At least one admin has to remain';
  end if;
  delete from public.cms_admins where lower(email) = lower(p_email) and shared;
  delete from auth.identities where user_id in (select id from auth.users where lower(email) = lower(p_email));
  delete from auth.users where lower(email) = lower(p_email);
end;
$$;
grant execute on function public.delete_admin_access(text) to authenticated;

-- Event reports: one report (a link or a file) can be attached to any event.
alter table public.cms_events add column if not exists report_url text;
alter table public.cms_events add column if not exists report_title text;

-- The Student Speaker Competition has closed: mark it as a past event and take it out of the menu.
update public.cms_events
   set status = 'past', show_in_nav = false
 where slug = 'student-speaker-competition' or title ilike '%student speaker%';

-- Anyone signed in can change their own password (it must stay unique, because the password alone
-- decides which account signs in).
create or replace function public.change_own_password(p_password text)
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if v_email = '' or not exists (select 1 from public.cms_admins where lower(email) = v_email) then
    raise exception 'Not signed in';
  end if;
  if length(coalesce(p_password, '')) < 8 then
    raise exception 'A password needs at least 8 characters';
  end if;
  if exists (
    select 1 from auth.users u
     where lower(u.email) <> v_email and u.encrypted_password = crypt(p_password, u.encrypted_password)
  ) then
    raise exception 'That password is already in use. Pick another.';
  end if;
  update auth.users set encrypted_password = crypt(p_password, gen_salt('bf')), updated_at = now()
   where lower(email) = v_email;
end;
$$;
grant execute on function public.change_own_password(text) to authenticated;

-- Shared admin accounts for password sign-in (one per access level).
-- Run in the Supabase SQL editor AFTER replacing the two passwords below.
-- Rotating a password later: Auth > Users > the account > Reset password.
create extension if not exists pgcrypto;

do $$
declare
  acct record;
  uid uuid;
begin
  for acct in
    select * from (values
      ('full@admin.tedxnewy.com.au', 'REPLACE_FULL_PASSWORD', 'full'),
      ('community@admin.tedxnewy.com.au', 'REPLACE_COMMUNITY_PASSWORD', 'community')
    ) as t(email, pw, lvl)
  loop
    select id into uid from auth.users where email = acct.email;
    if uid is null then
      uid := gen_random_uuid();
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change
      ) values (
        '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', acct.email,
        crypt(acct.pw, gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
      );
      insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      values (gen_random_uuid(), uid, uid::text,
        jsonb_build_object('sub', uid::text, 'email', acct.email, 'email_verified', true),
        'email', now(), now(), now());
    else
      update auth.users set encrypted_password = crypt(acct.pw, gen_salt('bf')), updated_at = now() where id = uid;
    end if;

    insert into cms_admins (email, access_level) values (acct.email, acct.lvl)
    on conflict (email) do update set access_level = excluded.access_level;
  end loop;
end $$;

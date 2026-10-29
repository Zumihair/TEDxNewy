-- Volunteer roles posted on /volunteer, edited at
-- /admin/volunteer-roles. Only 'open' roles are public.
-- The general "Join the crew" card lives in code
-- (lib/volunteer-roles.ts) and always shows first.
-- Safe to re-run. No drop statements on purpose.

create table if not exists public.volunteer_roles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  crew text not null default '',
  time_commitment text not null default '',
  location text not null default '',
  summary text not null default '',
  does text[] not null default '{}',
  helps text[] not null default '{}',
  status text not null default 'draft'
    constraint volunteer_roles_status_check
    check (status in ('open', 'draft', 'closed')),
  display_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.volunteer_roles enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'volunteer_roles'
      and policyname = 'public reads open') then
    create policy "public reads open" on public.volunteer_roles
      for select using (status = 'open');
  end if;
  if not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'volunteer_roles'
      and policyname = 'admins all') then
    create policy "admins all" on public.volunteer_roles
      for all using (public.is_cms_admin())
      with check (public.is_cms_admin());
  end if;
end $$;

-- New tables no longer get Data API grants automatically.
grant select on public.volunteer_roles to anon;
grant select, insert, update, delete
  on public.volunteer_roles to authenticated;
grant select, insert, update, delete
  on public.volunteer_roles to service_role;

-- Seed: the first posted role. Skipped if already there.
insert into public.volunteer_roles
  (slug, title, crew, time_commitment, location, summary,
   does, helps, status, display_order)
select
  'partnerships-manager',
  'Partnerships manager',
  'Partnerships',
  'A few hours a week',
  'Newcastle and online',
  'Our events only happen because local businesses and '
    || 'organisations back them. Look after those '
    || 'relationships across the 2027 season, from the '
    || 'first conversation to the thank-you after the event.',
  array[
    'Find and reach out to businesses and organisations '
      || 'that share our values',
    'Meet potential partners, talk through what a '
      || 'partnership could look like and follow up',
    'Look after current partners through the season so '
      || 'they get what was agreed, and then some',
    'Work with the directors on partnership packages and '
      || 'keep the pipeline moving',
    'Help partners show up well on the day, from logos '
      || 'and signage to activations'
  ],
  array[
    'Experience in sales, business development, account '
      || 'management or events',
    'Confidence picking up the phone and walking into a room',
    'A good feel for Newcastle''s business community',
    'Being organised: you keep track of who said what '
      || 'and when'
  ],
  'open',
  10
where not exists (
  select 1 from public.volunteer_roles
  where slug = 'partnerships-manager'
);

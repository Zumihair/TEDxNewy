-- Sponsors as a first class CMS entity, with a logo upload point in the
-- admin (previously a hardcoded, logo-less array in lib/data.ts).
-- Safe to re-run. Short lines on purpose, per the paste-corruption gotcha.

create table if not exists public.cms_sponsors (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  name          text not null,
  tier          text not null default 'Community'
                check (tier in ('Presenting', 'Platinum', 'Gold', 'Community')),
  partner_type  text,
  logo_url      text,
  website_url   text,
  display_order integer not null default 999,
  is_active     boolean not null default true
);

alter table public.cms_sponsors enable row level security;

drop policy if exists "anon read sponsors" on public.cms_sponsors;
create policy "anon read sponsors" on public.cms_sponsors
  for select using (is_active);

drop policy if exists "admins all" on public.cms_sponsors;
create policy "admins all" on public.cms_sponsors
  for all using (public.is_cms_admin()) with check (public.is_cms_admin());

-- Seed from the existing static list in lib/data.ts, so nothing changes on
-- /sponsors until you edit or add to them in the admin. Keyed on name.
insert into public.cms_sponsors (name, tier, partner_type, display_order)
select 'University of Newcastle', 'Presenting', null, 10
where not exists (
  select 1 from public.cms_sponsors where name = 'University of Newcastle'
);

insert into public.cms_sponsors (name, tier, partner_type, display_order)
select 'Henderson', 'Platinum', null, 20
where not exists (
  select 1 from public.cms_sponsors where name = 'Henderson'
);

insert into public.cms_sponsors (name, tier, partner_type, display_order)
select 'Frekl', 'Gold', null, 30
where not exists (
  select 1 from public.cms_sponsors where name = 'Frekl'
);

insert into public.cms_sponsors (name, tier, partner_type, display_order)
select 'Newy Digital', 'Gold', 'Media Partner', 40
where not exists (
  select 1 from public.cms_sponsors where name = 'Newy Digital'
);

insert into public.cms_sponsors (name, tier, partner_type, display_order)
select 'Super Radio Network', 'Gold', 'Radio Partner', 50
where not exists (
  select 1 from public.cms_sponsors where name = 'Super Radio Network'
);

insert into public.cms_sponsors (name, tier, partner_type, display_order)
select 'Elqo', 'Gold', null, 60
where not exists (
  select 1 from public.cms_sponsors where name = 'Elqo'
);

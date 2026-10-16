-- Simple sponsorship tracker: who has pledged what, per year, and a fundraising goal.
-- Run once in the Supabase SQL editor (safe to re-run).

create table if not exists public.sponsorship_pledges (
  id uuid primary key default gen_random_uuid(),
  year int not null default 2027,
  org_name text not null,
  contact_name text,
  email text,
  status text not null default 'talking',
  kind text not null default 'cash',
  amount numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sponsorship_pledges
  drop constraint if exists sponsorship_pledges_status_check;
alter table public.sponsorship_pledges
  add constraint sponsorship_pledges_status_check
  check (status in ('talking','committed','paid','declined'));

alter table public.sponsorship_pledges
  drop constraint if exists sponsorship_pledges_kind_check;
alter table public.sponsorship_pledges
  add constraint sponsorship_pledges_kind_check
  check (kind in ('cash','in_kind'));

create index if not exists sponsorship_pledges_year_idx
  on public.sponsorship_pledges (year, status);

create table if not exists public.sponsorship_goals (
  year int primary key,
  goal numeric(12,2) not null default 0
);

alter table public.sponsorship_pledges enable row level security;
alter table public.sponsorship_goals enable row level security;

drop policy if exists "admins all" on public.sponsorship_pledges;
create policy "admins all" on public.sponsorship_pledges
  for all using (public.is_cms_admin()) with check (public.is_cms_admin());
drop policy if exists "admins all" on public.sponsorship_goals;
create policy "admins all" on public.sponsorship_goals
  for all using (public.is_cms_admin()) with check (public.is_cms_admin());

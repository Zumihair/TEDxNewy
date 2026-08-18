-- Partnerships portal: prospects pipeline, activity log, per-partner
-- prospectus. Applied 2026-08-18 via the Supabase MCP. Safe to re-run.

create table if not exists public.partner_prospects (
  id uuid primary key default gen_random_uuid(),
  org_name text not null,
  sector text,
  website text,
  contact_name text,
  contact_role text,
  contact_email text,
  contact_phone text,
  suggested_tier text not null default 'gold',
  stage text not null default 'idea',
  why_them text,
  notes text,
  source text,
  owner text,
  value_estimate numeric,
  next_action text,
  next_action_at date,
  last_contacted_at timestamptz,
  prospectus_url text,
  prospectus_generated_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.partner_prospects
  drop constraint if exists partner_prospects_stage_check;
alter table public.partner_prospects
  add constraint partner_prospects_stage_check
  check (stage in ('idea','contacted','conversation','proposal','confirmed','declined'));

alter table public.partner_prospects
  drop constraint if exists partner_prospects_tier_check;
alter table public.partner_prospects
  add constraint partner_prospects_tier_check
  check (suggested_tier in ('presenting','platinum','gold','community','inkind'));

create index if not exists partner_prospects_stage_idx
  on public.partner_prospects (stage, updated_at desc);

create table if not exists public.partner_activities (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null
    references public.partner_prospects(id) on delete cascade,
  kind text not null default 'note',
  summary text not null,
  body text,
  email_batch_id uuid,
  created_by text,
  created_at timestamptz not null default now()
);

alter table public.partner_activities
  drop constraint if exists partner_activities_kind_check;
alter table public.partner_activities
  add constraint partner_activities_kind_check
  check (kind in ('note','email','call','meeting','stage','prospectus'));

create index if not exists partner_activities_prospect_idx
  on public.partner_activities (prospect_id, created_at desc);

alter table public.partner_prospects enable row level security;
alter table public.partner_activities enable row level security;

drop policy if exists "admins all" on public.partner_prospects;
create policy "admins all" on public.partner_prospects
  for all using (public.is_cms_admin()) with check (public.is_cms_admin());
drop policy if exists "full admins write prospects" on public.partner_prospects;
create policy "full admins write prospects" on public.partner_prospects
  as restrictive for all to authenticated
  using (public.is_full_cms_admin()) with check (public.is_full_cms_admin());

drop policy if exists "admins all" on public.partner_activities;
create policy "admins all" on public.partner_activities
  for all using (public.is_cms_admin()) with check (public.is_cms_admin());
drop policy if exists "full admins write activities" on public.partner_activities;
create policy "full admins write activities" on public.partner_activities
  as restrictive for all to authenticated
  using (public.is_full_cms_admin()) with check (public.is_full_cms_admin());

-- Starter list of Newcastle / Hunter organisations worth a conversation.
-- These are IDEAS, not contacts: no names or emails, and every one should be
-- verified before an approach. Skipped if an org of the same name exists.
insert into public.partner_prospects (org_name, sector, website, suggested_tier, stage, why_them, source)
select v.org_name, v.sector, v.website, v.tier, 'idea', v.why, 'seed'
from (values
 ('nib', 'Health insurance', 'https://www.nib.com.au', 'presenting', 'Newcastle-headquartered, health and wellbeing brand, large local workforce; our salons and Youth Futures Lab sit squarely in their community remit.'),
 ('Greater Bank (NGM Group)', 'Banking', 'https://www.greater.com.au', 'pres
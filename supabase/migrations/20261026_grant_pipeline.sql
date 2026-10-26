-- Grant pipeline: every grant we are watching, writing,
-- waiting on or have heard back from. /admin/grants.
-- Safe to re-run. No drop statements on purpose: the
-- Supabase MCP asks to confirm those and the prompt never
-- reaches a cloud session. Applied 2026-10-26.

create table if not exists public.grant_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  funder text,
  url text,
  stage text not null default 'researching'
    constraint grant_applications_stage_check
    check (stage in (
      'watching', 'researching', 'drafting', 'submitted',
      'successful', 'unsuccessful', 'not_applying'
    )),
  project text,
  owner text,
  amount_min numeric(12,2),
  amount_max numeric(12,2),
  amount_requested numeric(12,2),
  amount_awarded numeric(12,2),
  closes_on date,
  closes_note text,
  decision_note text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists grant_applications_stage_idx
  on public.grant_applications (stage, closes_on);

alter table public.grant_applications enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'grant_applications'
      and policyname = 'admins all') then
    create policy "admins all" on public.grant_applications
      for all using (public.is_cms_admin())
      with check (public.is_cms_admin());
  end if;
end $$;

-- New tables no longer get Data API grants automatically.
grant select, insert, update, delete
  on public.grant_applications to authenticated;
grant select, insert, update, delete
  on public.grant_applications to service_role;

-- Seed: the rounds found in October 2026. Skipped if a
-- grant of the same name is already there.
insert into public.grant_applications
  (name, funder, stage, project, amount_min, amount_max,
   amount_requested, closes_on, closes_note, decision_note, url)
select v.* from (values
  ('Connect IRL Phase 2', 'NSW Office for Youth (DCJ)',
   'drafting', 'Futures Lab Hunter',
   50000::numeric, 150000::numeric, 132000::numeric,
   date '2026-11-06', '4pm', 'January 2027',
   'https://www.nsw.gov.au/grants-and-funding/connect-real-life-irl-phase-2-2026/27'),
  ('Newcastle Port Community Contribution Fund, Round 10',
   'NSW Government', 'researching', 'Sea salon on the harbour',
   25000, 250000, null,
   date '2026-11-09', '2pm', 'From late January 2027',
   'https://www.nsw.gov.au/grants-and-funding/newcastle-port-community-contribution-fund'),
  ('Grassroots Grants', 'Newcastle Permanent Charitable Foundation',
   'researching', 'Youth Futures Lab', 25000, 50000, null,
   date '2026-10-31', '11:59pm', 'March 2027',
   'https://www.newcastlepermanent.com.au/charitable-foundation/funding'),
  ('Event Sponsorship', 'City of Newcastle',
   'watching', 'Marquee event', null, 25000, null,
   null, 'Round usually opens in May', null,
   'https://newcastle.nsw.gov.au/community/grants-and-sponsorships'),
  ('Regional Event Fund, Incubator stream', 'Destination NSW',
   'watching', 'Marquee event', null, 20000, null,
   null, 'Round usually opens in March', null,
   'https://www.destinationnsw.com.au/destination-nsw-business-support/grants-and-funding'),
  ('Love Water Grants', 'Hunter Water',
   'watching', 'Land salon', null, 10000, null,
   null, 'Opens 14 February, closes 14 March', null,
   'https://www.hunterwater.com.au/Community/Community-Funding-Program/Community-Funding-Program.aspx'),
  ('Community Foundation grants', 'IMB Bank Community Foundation',
   'watching', 'Youth Futures Lab', null, null, null,
   null, 'Usually closes mid-June', null,
   'https://www.imb.com.au/community'),
  ('Your Port, Our Community', 'Port of Newcastle',
   'watching', 'Sea salon', null, null, null,
   null, 'Usually opens September, closes October', null,
   'https://pon.com.au/community-and-news/grants/')
) as v(name, funder, stage, project, amount_min, amount_max,
       amount_requested, closes_on, closes_note, decision_note, url)
where not exists (
  select 1 from public.grant_applications g where g.name = v.name
);

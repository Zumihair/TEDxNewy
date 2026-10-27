-- Grant bench: the working page behind each grant
-- (/admin/grants/<id>). One table for every kind of item:
--   question  title = the form's question, body = our answer
--   task      title = what needs doing, done/due_on/owner
--   budget    title = line item, amount, body = note
--   link      title = label, url
-- Apply after 20261026_grant_pipeline.sql. Safe to re-run. Applied 2026-10-26.

create table if not exists public.grant_items (
  id uuid primary key default gen_random_uuid(),
  grant_id uuid not null
    references public.grant_applications (id) on delete cascade,
  kind text not null
    constraint grant_items_kind_check
    check (kind in ('question', 'task', 'budget', 'link')),
  position int not null default 0,
  title text not null default '',
  body text,
  word_limit int,
  amount numeric(12,2),
  url text,
  done boolean not null default false,
  due_on date,
  owner text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists grant_items_grant_idx
  on public.grant_items (grant_id, kind, position);

alter table public.grant_items enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'grant_items'
      and policyname = 'admins all') then
    create policy "admins all" on public.grant_items
      for all using (public.is_cms_admin())
      with check (public.is_cms_admin());
  end if;
end $$;

-- New tables no longer get Data API grants automatically.
grant select, insert, update, delete
  on public.grant_items to authenticated;
grant select, insert, update, delete
  on public.grant_items to service_role;

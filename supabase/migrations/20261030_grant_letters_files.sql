-- Reference letters and evidence files for grant applications.
-- /admin/grants/library, and the Letters and files card on each
-- grant's bench. Safe to re-run. No drop statements on purpose:
-- the Supabase MCP asks to confirm those and the prompt never
-- reaches a cloud session.

create table if not exists public.grant_letters (
  id uuid primary key default gen_random_uuid(),
  referee text not null,
  role text,
  letter_type text not null default 'partner'
    constraint grant_letters_type_check
    check (letter_type in (
      'partner', 'participant', 'community', 'youth', 'other'
    )),
  status text not null default 'to_ask'
    constraint grant_letters_status_check
    check (status in ('to_ask', 'asked', 'drafting', 'received')),
  asked_on date,
  due_on date,
  received_on date,
  file_url text,
  file_name text,
  storage_path text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.grant_files (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind text not null default 'other'
    constraint grant_files_kind_check
    check (kind in (
      'certificate', 'incorporation', 'constitution', 'registration',
      'bank', 'financials', 'signatories', 'licence', 'report', 'other'
    )),
  file_url text,
  file_name text,
  storage_path text,
  dated_on date,
  expires_on date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.grant_letter_links (
  grant_id uuid not null
    references public.grant_applications (id) on delete cascade,
  letter_id uuid not null
    references public.grant_letters (id) on delete cascade,
  primary key (grant_id, letter_id)
);

create table if not exists public.grant_file_links (
  grant_id uuid not null
    references public.grant_applications (id) on delete cascade,
  file_id uuid not null
    references public.grant_files (id) on delete cascade,
  primary key (grant_id, file_id)
);

create index if not exists grant_letter_links_letter_idx
  on public.grant_letter_links (letter_id);
create index if not exists grant_file_links_file_idx
  on public.grant_file_links (file_id);
create index if not exists grant_letters_status_idx
  on public.grant_letters (status, due_on);
create index if not exists grant_files_expiry_idx
  on public.grant_files (expires_on);

alter table public.grant_letters enable row level security;
alter table public.grant_files enable row level security;
alter table public.grant_letter_links enable row level security;
alter table public.grant_file_links enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'grant_letters'
      and policyname = 'admins all') then
    create policy "admins all" on public.grant_letters
      for all using (public.is_cms_admin())
      with check (public.is_cms_admin());
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'grant_files'
      and policyname = 'admins all') then
    create policy "admins all" on public.grant_files
      for all using (public.is_cms_admin())
      with check (public.is_cms_admin());
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'grant_letter_links'
      and policyname = 'admins all') then
    create policy "admins all" on public.grant_letter_links
      for all using (public.is_cms_admin())
      with check (public.is_cms_admin());
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'grant_file_links'
      and policyname = 'admins all') then
    create policy "admins all" on public.grant_file_links
      for all using (public.is_cms_admin())
      with check (public.is_cms_admin());
  end if;
end $$;

-- New tables no longer get Data API grants automatically.
grant select, insert, update, delete
  on public.grant_letters to authenticated, service_role;
grant select, insert, update, delete
  on public.grant_files to authenticated, service_role;
grant select, insert, update, delete
  on public.grant_letter_links to authenticated, service_role;
grant select, insert, update, delete
  on public.grant_file_links to authenticated, service_role;

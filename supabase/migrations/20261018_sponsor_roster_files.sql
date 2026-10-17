-- Sponsors: current or past, and a files shelf per sponsor.
-- Run once in the Supabase SQL editor (safe to re-run).

alter table public.cms_sponsors
  add column if not exists is_current boolean not null default true;

create table if not exists public.sponsor_files (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid not null references public.cms_sponsors(id) on delete cascade,
  name text not null,
  kind text not null default 'other',
  file_url text not null,
  storage_path text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

create index if not exists sponsor_files_sponsor_idx
  on public.sponsor_files (sponsor_id, created_at desc);

alter table public.sponsor_files enable row level security;

drop policy if exists "admins all" on public.sponsor_files;
create policy "admins all" on public.sponsor_files
  for all using (public.is_cms_admin()) with check (public.is_cms_admin());

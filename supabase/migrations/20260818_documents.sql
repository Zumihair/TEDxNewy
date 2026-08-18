-- Documents library: admin-uploaded files (impact reports, decks, PDFs)
-- listed at /admin/documents for download and sharing.
-- Applied 2026-08-18 via the Supabase MCP. Safe to re-run.

create table if not exists public.cms_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null default 'General',
  file_url text not null,
  storage_path text,
  file_name text,
  size_bytes bigint,
  mime_type text,
  sort_order int not null default 0,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists cms_documents_category_idx
  on public.cms_documents (category, sort_order, created_at desc);

alter table public.cms_documents enable row level security;

-- Admin only. No anon policy: the list is internal. The files themselves
-- live in a public bucket so a copied download link works for anyone.
drop policy if exists "admins all" on public.cms_documents;
create policy "admins all" on public.cms_documents
  for all
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

drop policy if exists "full admins write documents"
  on public.cms_documents;
create policy "full admins write documents"
  on public.cms_documents
  as restrictive
  for all
  to authenticated
  using (public.is_full_cms_admin())
  with check (public.is_full_cms_admin());

-- Storage bucket for the files. Public read (shareable links), 60 MB cap,
-- documents and images only. Admin-gated writes mirror cms-uploads.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents', 'documents', true, 62914560,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'text/csv',
    'text/plain',
    'image/png',
    'image/jpeg',
    'image/webp'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read documents" on storage.objects;
create policy "Public read documents" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'documents');

drop policy if exists "Admin insert documents" on storage.objects;
create policy "Admin insert documents" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documents' and public.is_cms_admin());

drop policy if exists "Admin update documents" on storage.objects;
create policy "Admin update documents" on storage.objects
  for update to authenticated
  using (bucket_id = 'documents' and public.is_cms_admin())
  with check (bucket_id = 'documents' and public.is_cms_admin());

drop policy if exists "Admin delete documents" on storage.objects;
create policy "Admin delete documents" on storage.objects
  for delete to authenticated
  using (bucket_id = 'documents' and public.is_cms_admin());

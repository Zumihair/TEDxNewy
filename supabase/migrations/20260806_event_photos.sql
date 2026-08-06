-- Per-event photo galleries, tied to cms_events. Created 2026-08-06.
-- Safe to re-run. Photos are hosted on Vercel Blob; this table only holds
-- the resulting URLs + basic metadata. Public read (no token needed to
-- browse a gallery, matching "send people a link"); writes are admin/
-- service-role only via scripts/upload-event-photos.mjs.

create table if not exists public.event_photos (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null
    references public.cms_events (id) on delete cascade,
  url           text not null,
  thumb_url     text not null,
  width         integer,
  height        integer,
  display_order integer not null default 999,
  created_at    timestamptz not null default now()
);

create index if not exists event_photos_event_idx
  on public.event_photos (event_id, display_order);

alter table public.event_photos enable row level security;

drop policy if exists "anon read event photos" on public.event_photos;
create policy "anon read event photos" on public.event_photos
  for select using (true);

drop policy if exists "admins all" on public.event_photos;
create policy "admins all" on public.event_photos
  for all using (public.is_cms_admin()) with check (public.is_cms_admin());

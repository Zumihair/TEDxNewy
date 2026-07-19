-- Socials drafts log: posts prepared in /admin/socials and then
-- posted BY HAND to Instagram, Facebook and LinkedIn. Nothing in
-- these tables auto-publishes; a scheduler (Buffer, Composio or
-- similar) can hook in later.
-- Apply by hand in the Supabase SQL editor before using
-- /admin/socials. Safe to re-run. Short lines on purpose.

create table if not exists public.social_posts (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  text,
  title       text not null default 'Untitled post',
  caption     text not null default '',
  channel_captions jsonb not null default '{}'::jsonb,
  channels    text[] not null default '{}',
  status      text not null default 'draft'
              check (status in
                ('draft', 'needs_changes', 'ready', 'posted')),
  status_note text,
  publish_at  timestamptz,
  posted_at   timestamptz,
  posted_by   text,
  constraint social_posts_channels_valid check (
    channels <@
      array['instagram', 'facebook', 'linkedin']::text[]
  )
);

create table if not exists public.social_post_media (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  post_id       uuid not null
                references public.social_posts(id)
                on delete cascade,
  display_order integer not null default 999,
  image_url     text not null,
  source_image_url text,
  spec          jsonb
);

create index if not exists social_post_media_post_idx
  on public.social_post_media (post_id, display_order);

create index if not exists social_posts_status_idx
  on public.social_posts (status, publish_at);

alter table public.social_posts
  enable row level security;
alter table public.social_post_media
  enable row level security;

-- Internal drafts: admins only, no public read.
drop policy if exists "admins all" on public.social_posts;
create policy "admins all" on public.social_posts
  for all using (public.is_cms_admin())
  with check (public.is_cms_admin());

drop policy if exists "admins all" on public.social_post_media;
create policy "admins all" on public.social_post_media
  for all using (public.is_cms_admin())
  with check (public.is_cms_admin());

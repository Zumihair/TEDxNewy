-- Real publishing for /admin/socials via Composio (TEDxNewy's own Composio
-- project, separate from any other business's). social_connections tracks
-- one row per channel with the Composio connected account and the resolved
-- platform account id needed at publish time. channel_results on
-- social_posts stores what happened when a post was actually published.
-- Apply by hand in the Supabase SQL editor. Safe to re-run. Short lines.

create table if not exists public.social_connections (
  channel     text primary key
              check (channel in
                ('instagram', 'facebook', 'linkedin')),
  connected_account_id  text,
  external_account_id   text,
  external_account_name text,
  status      text not null default 'disconnected'
              check (status in
                ('disconnected', 'pending', 'connected', 'failed')),
  connected_at timestamptz,
  connected_by text
);

alter table public.social_connections
  enable row level security;

drop policy if exists "admins all" on public.social_connections;
create policy "admins all" on public.social_connections
  for all using (public.is_cms_admin())
  with check (public.is_cms_admin());

alter table public.social_posts
  add column if not exists channel_results jsonb
  not null default '{}'::jsonb;

-- A personal login can manage more than one Facebook Page or LinkedIn
-- Company Page, so finalizeConnection() can't always guess which is
-- TEDxNewy's. This adds a "needs_pick" status plus a spot to hold the
-- candidates until an admin picks the right one.
-- Apply by hand in the Supabase SQL editor. Safe to re-run. Short lines.

alter table public.social_connections
  drop constraint if exists social_connections_status_check;

alter table public.social_connections
  add constraint social_connections_status_check
  check (status in
    ('disconnected', 'pending', 'needs_pick', 'connected', 'failed'));

alter table public.social_connections
  add column if not exists pending_candidates jsonb;

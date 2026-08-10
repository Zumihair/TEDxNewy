-- Aligns /admin/socials with the newsletter campaigns status model
-- (Draft/Scheduled/Sent -> Draft/Scheduled/Posted here). Drops the separate
-- "needs changes" review status; status_note becomes a plain notes field.
-- Apply by hand in the Supabase SQL editor. Safe to re-run. Short lines.

update public.social_posts
  set status = 'draft'
  where status = 'needs_changes';

update public.social_posts
  set status = 'scheduled'
  where status = 'ready';

alter table public.social_posts
  drop constraint if exists social_posts_status_check;

alter table public.social_posts
  add constraint social_posts_status_check
  check (status in ('draft', 'scheduled', 'posted'));

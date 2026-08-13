-- Draft stage for social posts and newsletter campaigns.
-- Created 2026-08-14. Apply by hand in the Supabase SQL editor.
-- Safe to re-run. Short lines on purpose.
--
-- This is NOT the lifecycle status (draft / scheduled / posted|sent).
-- That stays derived from the dates: a social post with a planned date
-- is scheduled, a newsletter with a schedule set is scheduled.
-- `stage` is the editorial read on a draft: how finished is it.

alter table public.social_posts
  add column if not exists stage text not null default 'early';

alter table public.newsletters
  add column if not exists stage text not null default 'early';

alter table public.social_posts
  drop constraint if exists social_posts_stage_valid;
alter table public.social_posts
  add constraint social_posts_stage_valid
  check (stage in ('early', 'polish', 'ready'));

alter table public.newsletters
  drop constraint if exists newsletters_stage_valid;
alter table public.newsletters
  add constraint newsletters_stage_valid
  check (stage in ('early', 'polish', 'ready'));

-- Anything already approved under the old manual workflow was, in the
-- old model, past the drafting stage: carry that across so nothing
-- lands back on "early draft" by accident.
update public.social_posts
  set stage = 'ready'
  where status in ('scheduled', 'posted');

update public.newsletters
  set stage = 'ready'
  where status in ('scheduled', 'sending', 'sent');

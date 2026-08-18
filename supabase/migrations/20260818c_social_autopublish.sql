-- Scheduled social posts publish themselves on the cron.
-- Created 2026-08-18. Apply by hand in the Supabase SQL editor.
-- Safe to re-run. Short lines on purpose.
--
-- Before this, publish_at was decoration: it drove the Scheduled chip
-- and nothing else, so a post sat at its schedule time waiting for
-- somebody to press Publish. /api/cron/newsletter now picks up due
-- posts (see lib/social-publish.ts) and these two columns are its
-- bookkeeping.
--
-- Two columns, not one, because they answer different questions:
--
--   autopublish_claimed_at  a run is working on this post right now.
--     Set by an atomic claim so overlapping cron passes cannot both
--     publish it. Reset on release; treated as stale after 10
--     minutes in case a run dies mid-flight.
--
--     It is NOT NULL, defaulting to -infinity, and "released" means
--     back to -infinity rather than null. That is what lets the claim
--     be a single comparison, `autopublish_claimed_at < cutoff`, which
--     matches an unclaimed post and a stale one alike. Nullable would
--     need an OR against null in every claim, hand-built as a
--     PostgREST filter string with a timestamp inside it, for no gain.
--
--   autopublish_done_at     the cron has nothing further to do here.
--     Set when every connected channel has gone out, or when the only
--     channels left are manual ones or have exhausted their retries.
--     Without it a post with a manual channel could never reach
--     "posted" and would be re-claimed every 5 minutes forever.
--
-- Saving a post clears autopublish_done_at (see updatePost in
-- app/admin/socials/actions.ts) so an edited or rescheduled post is
-- reconsidered. It deliberately does NOT clear the claim: that would
-- reopen the double-publish window a claim exists to close.

alter table public.social_posts
  add column if not exists autopublish_claimed_at timestamptz
  not null default '-infinity';

alter table public.social_posts
  add column if not exists autopublish_done_at timestamptz;

-- The cron's due query: scheduled posts past their time that are not
-- yet settled. Partial, because that is a small slice of the table and
-- the index should not carry every draft and posted row.
create index if not exists social_posts_autopublish_due_idx
  on public.social_posts (publish_at)
  where status = 'scheduled' and autopublish_done_at is null;

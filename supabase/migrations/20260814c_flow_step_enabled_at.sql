-- Welcome flow: a step only sends to people who joined while it was on.
-- Created 2026-08-14. Apply by hand in the Supabase SQL editor.
-- Safe to re-run.
--
-- enabled_at is the moment a step was last switched on. A subscriber
-- receives the step only if they entered the flow at or after that
-- moment, so switching a step on never reaches back to people who
-- joined while it was off.

alter table public.subscriber_flow_steps
  add column if not exists enabled_at timestamptz;

-- Steps that are already on are treated as having been on since they
-- were created. Without this, adding the column would cut off everyone
-- currently part way through the sequence.
update public.subscriber_flow_steps
  set enabled_at = created_at
  where enabled = true
    and enabled_at is null;

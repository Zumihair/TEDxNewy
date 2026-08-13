-- Welcome flow enrolment. Created 2026-08-14.
-- Apply by hand in the Supabase SQL editor. Safe to re-run.
--
-- Before this, the flow worked out who was due a step from
-- subscribers.created_at plus a 3 day grace window. That let two things
-- go wrong: people added straight to the table (the Mailchimp webhook)
-- were never sent step 1 but were still picked up by the later steps,
-- and anyone outside the 3 day window was skipped entirely.
--
-- Now enrolment is explicit. flow_started_at is the moment an address
-- entered the flow. NULL means it never entered and never will, unless
-- something enrols it.

alter table public.subscribers
  add column if not exists flow_started_at timestamptz;

create index if not exists subscribers_flow_started_idx
  on public.subscribers (flow_started_at);

-- Backfill, deliberately conservative: only people who are ALREADY in
-- the flow (they have at least one send on record) are enrolled, dated
-- from their original signup so their timeline does not move.
--
-- Everyone else stays NULL. That is what keeps the imported historical
-- list out of it: with the grace window gone, enrolling the whole base
-- would send them every step they are already past, all at once.
update public.subscribers s
  set flow_started_at = s.created_at
  where s.flow_started_at is null
    and exists (
      select 1
      from public.subscriber_flow_sends f
      where f.subscriber_id = s.id
    );

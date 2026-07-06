-- =====================================================================
-- Correctness + security: subscriber indexes, flow-send FKs, and
-- locking down notification_recipients reads.
--
-- Apply via Supabase dashboard SQL editor. Safe to re-run.
-- Short lines on purpose: a long-line paste got corrupted by CRLF once.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Subscriber lookup indexes.
--    unsubscribed_at: newsletter/flow recipient filters (is null).
--    created_at: drip window queries (lte / gt).
--    lower(email): case-insensitive email lookups.
-- ---------------------------------------------------------------------
create index if not exists subscribers_unsub_idx
  on public.subscribers (unsubscribed_at);

create index if not exists subscribers_created_idx
  on public.subscribers (created_at);

create index if not exists subscribers_email_lower_idx
  on public.subscribers (lower(email));

-- ---------------------------------------------------------------------
-- 2. subscriber_flow_sends foreign keys.
--    First delete orphan rows (a parent id missing, or either id null)
--    so the constraint can be added. Then add the FKs, guarded so a
--    re-run does not error on the already-present constraint.
-- ---------------------------------------------------------------------
delete from public.subscriber_flow_sends s
where s.subscriber_id is null
   or s.step_id is null
   or not exists (
     select 1 from public.subscribers p
     where p.id = s.subscriber_id
   )
   or not exists (
     select 1 from public.subscriber_flow_steps p
     where p.id = s.step_id
   );

do $$
begin
  alter table public.subscriber_flow_sends
    add constraint subscriber_flow_sends_subscriber_fk
    foreign key (subscriber_id)
    references public.subscribers (id)
    on delete cascade;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.subscriber_flow_sends
    add constraint subscriber_flow_sends_step_fk
    foreign key (step_id)
    references public.subscriber_flow_steps (id)
    on delete cascade;
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------
-- 3. Lock down notification_recipients reads.
--    Drop the broad anon-select policy (added in 20260517) so the
--    recipient list is no longer readable with the public anon key.
--    Server code now reads it with the service client instead.
--    Keep an admin-read policy so the admin notifications page works.
-- ---------------------------------------------------------------------
drop policy if exists "anon can read active"
  on public.notification_recipients;

drop policy if exists "admins can read"
  on public.notification_recipients;
create policy "admins can read"
  on public.notification_recipients
  for select
  using (public.is_cms_admin());

-- Backfill event_id on the 2024/2025 flagship talks and speakers so their
-- lineups actually render on /events/beyond-boundaries-2024 and
-- /events/reframe-2025. These rows predate the events CMS table and were
-- never linked. Only fills nulls, safe to re-run.

update public.cms_talks
set event_id = (
  select id from public.cms_events where slug = 'beyond-boundaries-2024'
)
where event = 'Beyond Boundaries'
  and event_id is null;

update public.cms_talks
set event_id = (
  select id from public.cms_events where slug = 'reframe-2025'
)
where event = 'Reframe'
  and event_id is null;

update public.cms_speakers
set event_id = (
  select id from public.cms_events where slug = 'beyond-boundaries-2024'
)
where year = 2024
  and event_id is null;

update public.cms_speakers
set event_id = (
  select id from public.cms_events where slug = 'reframe-2025'
)
where year = 2025
  and event_id is null;

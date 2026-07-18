-- Per-event attendees + feedback, tied to cms_events. Created 2026-07-18.
-- Safe to re-run.
--
-- Generic by design: any event can list its attendees, collect feedback on a
-- tokenised per-attendee link, chase non-responders, and export. The first
-- population path is the 60-Second Talk Night (imported from
-- talk_night_registrations); future events reuse the same tables.
--
-- All access is server-only via the service-role client (admin pages, the
-- send actions, the token feedback route, and the reminder cron), so RLS is
-- enabled with no anon policies: the anon key can touch neither table.

-- One row per person at an event (guests get their own row). `details` holds
-- the flexible, per-event fields (e.g. attendance_type, idea, phone) so the
-- table stays generic. The feedback_* columns drive the reminder cron.
create table if not exists public.event_attendees (
  id                    uuid primary key default gen_random_uuid(),
  event_id              uuid not null
    references public.cms_events (id) on delete cascade,
  full_name             text not null,
  email                 text not null,
  role                  text not null default 'attendee'
    check (role in ('attendee', 'speaker', 'guest')),
  details               jsonb not null default '{}'::jsonb,
  source                text,
  feedback_token        text unique,
  feedback_requested_at timestamptz,
  feedback_reminded_at  timestamptz,
  feedback_completed_at timestamptz,
  created_at            timestamptz not null default now()
);

-- One attendee per email per event. Email is always stored lowercased by the
-- import/CSV code, so a plain composite unique index is enough.
create unique index if not exists event_attendees_event_email_key
  on public.event_attendees (event_id, email);

create table if not exists public.event_feedback_responses (
  id                  uuid primary key default gen_random_uuid(),
  event_id            uuid not null
    references public.cms_events (id) on delete cascade,
  attendee_id         uuid
    references public.event_attendees (id) on delete set null,
  overall_rating      int check (overall_rating between 1 and 5),
  highlight           text,
  improve             text,
  return_likelihood   text,
  testimonial         text,
  testimonial_consent boolean not null default false,
  submitted_at        timestamptz not null default now()
);

alter table public.event_attendees enable row level security;
alter table public.event_feedback_responses enable row level security;

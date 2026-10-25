-- Signal feedback: "listened to all talks", the partner that stood out, and
-- the daily send queue. The site keeps working without this: responses save
-- without the two new answers, and people past the daily cap are not queued
-- (they stay on the list for the next click).
alter table public.event_feedback_responses
  add column if not exists heard_all_talks boolean;
alter table public.event_feedback_responses
  add column if not exists standout_partner text;
alter table public.event_attendees
  add column if not exists feedback_queued boolean not null default false;

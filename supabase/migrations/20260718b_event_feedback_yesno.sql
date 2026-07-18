-- Adds the opening yes/no questions to event feedback. Created 2026-07-18.
-- Safe to re-run. Apply after 20260718_talk_night_feedback.sql.

alter table public.event_feedback_responses
  add column if not exists been_before boolean;
alter table public.event_feedback_responses
  add column if not exists met_someone boolean;
alter table public.event_feedback_responses
  add column if not exists new_ideas boolean;

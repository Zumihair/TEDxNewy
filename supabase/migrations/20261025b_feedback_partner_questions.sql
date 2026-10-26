-- Signal feedback asks about the activating partners in the foyer.
-- The site saves responses without these two columns until this is run.
alter table public.event_feedback_responses
  add column if not exists engaged_partners boolean;
alter table public.event_feedback_responses
  add column if not exists partners_added_value boolean;

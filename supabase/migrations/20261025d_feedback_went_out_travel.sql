-- Signal feedback: "went out in Newcastle this weekend" and "how did you get
-- to the event". Responses still save without these two columns until this is run.
alter table public.event_feedback_responses
  add column if not exists went_out boolean;
alter table public.event_feedback_responses
  add column if not exists travel_mode text;

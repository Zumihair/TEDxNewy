-- Clear the Signal Side Quest data (the game is retired). Keeps the tables so
-- the game can come back for a future event. door_checkins is NOT touched:
-- it is the record of who was scanned in on the day.
-- Safe to re-run.

truncate table
  public.side_quest_photos,
  public.side_quest_completions,
  public.side_quest_qr_attempts,
  public.side_quest_draws,
  public.side_quest_sessions
restart identity cascade;

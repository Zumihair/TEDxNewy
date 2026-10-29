-- Volunteer applications record which role they applied for.
-- Holds the role's title (lib/volunteer-roles.ts). Null on rows from
-- before roles existed. Safe to re-run.
alter table public.applications
  add column if not exists role text;

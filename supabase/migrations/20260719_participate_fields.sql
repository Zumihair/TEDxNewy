-- Participate form field changes (2026-07-19)
--
-- Volunteer form: dropped the fixed "crew" choice in favour of how much time a
-- person can give plus where they are based. Speaker nominations: added where
-- the nominee is from. All columns are nullable so old rows and re-runs are
-- safe. The legacy applications.crew column is kept for historical rows but is
-- no longer written to, so its NOT NULL constraint (if any) is dropped.

alter table applications add column if not exists availability text;
alter table applications add column if not exists location text;
alter table applications alter column crew drop not null;

alter table nominations add column if not exists nominee_location text;

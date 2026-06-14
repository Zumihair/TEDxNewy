-- =====================================================================
-- 60-Second Talk Night — speak/listen + bring-a-guest
-- Created 2026-06-15. Revises the table from 20260614_talk_night.sql:
--   * attendance_type is now 'speak' or 'listen' (no 'both' — everyone in
--     the room is an audience participant either way)
--   * adds `reason` (the "why would you like to come?" answer for listeners)
--   * adds an optional +1 guest, mirroring the registrant's fields
--
-- Apply via Supabase dashboard -> SQL editor. Safe to re-run.
-- =====================================================================

-- Re-point the attendance_type check from (speak, attend, both) to
-- (speak, listen). No rows exist yet, so nothing to backfill.
alter table public.talk_night_registrations
  drop constraint if exists talk_night_registrations_attendance_type_check;
alter table public.talk_night_registrations
  add constraint talk_night_registrations_attendance_type_check
  check (attendance_type in ('speak', 'listen'));

-- New columns: listener reason + optional guest mirror.
alter table public.talk_night_registrations
  add column if not exists reason               text,
  add column if not exists guest_name           text,
  add column if not exists guest_email          text,
  add column if not exists guest_attendance_type text,
  add column if not exists guest_idea           text,
  add column if not exists guest_reason         text;

-- Guest attendance, when present, follows the same vocabulary.
alter table public.talk_night_registrations
  drop constraint if exists talk_night_registrations_guest_attendance_type_check;
alter table public.talk_night_registrations
  add constraint talk_night_registrations_guest_attendance_type_check
  check (
    guest_attendance_type is null
    or guest_attendance_type in ('speak', 'listen')
  );

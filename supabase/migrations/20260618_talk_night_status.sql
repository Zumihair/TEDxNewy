-- =====================================================================
-- Talk Night applicant status — lightweight CRM pipeline
-- Created 2026-06-18. Adds a `status` column to talk_night_registrations
-- so admins can advance an expression of interest from `new` to
-- `accepted` (the quality pool) or `declined`, without emailing anyone.
-- Accepted applicants are emailed later, in one batch, from Settings ->
-- Emails (each gets their own message).
--
-- The "admins can update" RLS policy already exists on this table (added
-- in 20260614_talk_night.sql), and it covers every column, so no new
-- policy is needed — this migration is just the column.
--
-- Apply via Supabase dashboard -> SQL editor. Safe to re-run.
-- =====================================================================

alter table public.talk_night_registrations
  add column if not exists status text not null default 'new'
    check (status in ('new', 'accepted', 'declined'));

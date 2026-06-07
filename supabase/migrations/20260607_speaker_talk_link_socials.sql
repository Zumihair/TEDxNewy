-- =====================================================================
-- Speakers: link to an existing talk + add social profiles
-- Created 2026-06-07.
--
-- Apply via Supabase dashboard → SQL editor. Safe to re-run.
--   - talk_id   → references cms_talks(id); the speaker's talk is now a
--                 link rather than free text. On talk delete, set null.
--   - linkedin_url / instagram_url → optional social profiles.
-- The legacy free-text `talk` column is left in place as a fallback for
-- any speaker that isn't linked to a talk yet.
-- =====================================================================

alter table public.cms_speakers
  add column if not exists talk_id text
    references public.cms_talks(id) on delete set null,
  add column if not exists linkedin_url text,
  add column if not exists instagram_url text;

-- =====================================================================
-- Attribute each admin email send to the admin who sent it.
-- Created 2026-07-06. Adds a nullable sender column to email_sends; the
-- Compose server action fills it from the signed-in admin's email. Older
-- rows stay null (unknown). Apply via Supabase dashboard SQL editor.
-- Safe to re-run.
-- =====================================================================

alter table public.email_sends
  add column if not exists sent_by text;

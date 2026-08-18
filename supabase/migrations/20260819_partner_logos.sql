-- Brand assets on a confirmed partner: a light-background and a
-- dark-background logo, uploaded once they're locked in.
-- Applied 2026-08-19 via the Supabase Management API. Safe to re-run.

alter table public.cms_partners
  add column if not exists logo_light_url text,
  add column if not exists logo_dark_url text;

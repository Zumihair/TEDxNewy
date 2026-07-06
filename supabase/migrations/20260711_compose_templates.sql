-- =====================================================================
-- Admin-authored Quick Compose templates.
-- Created 2026-07-06. A saved template is a reusable message (subject +
-- the same block JSON the composer/newsletter use). Admins create and
-- delete these from Quick Compose; the built-in code templates are
-- separate and unaffected.
--
-- RLS: read + write limited to CMS admins, matching email_sends.
-- Apply via Supabase dashboard SQL editor. Safe to re-run.
-- =====================================================================

create table if not exists public.compose_templates (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  label       text not null,
  subject     text not null,
  blocks      jsonb not null default '[]'::jsonb,
  created_by  text
);

create index if not exists compose_templates_created_at_idx
  on public.compose_templates (created_at desc);

alter table public.compose_templates enable row level security;

drop policy if exists "admins manage templates" on public.compose_templates;
create policy "admins manage templates"
  on public.compose_templates
  for all
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

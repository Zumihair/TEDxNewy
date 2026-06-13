-- =====================================================================
-- "Contacted" tracking for form submissions
-- Created 2026-06-13. Adds a `contacted` flag to each enquiry/application
-- table so admins can tick off submissions they've followed up, and an
-- "admins can update" RLS policy so the toggle actually writes.
--
-- Scope: the six enquiry forms (not the newsletter subscriber list).
--
-- Apply via Supabase dashboard -> SQL editor. Safe to re-run: uses
-- `add column if not exists` and `drop policy if exists` throughout.
-- =====================================================================

do $$
declare
  t text;
  tables text[] := array[
    'applications',
    'nominations',
    'contact_messages',
    'partner_enquiries',
    'youth_futures_registrations',
    'student_speaker_submissions'
  ];
begin
  foreach t in array tables loop
    -- 1. The flag itself. Defaults to false so existing rows read as "not
    --    contacted" and new submissions start untouched.
    execute format(
      'alter table public.%I add column if not exists contacted boolean not null default false;',
      t
    );

    -- 2. Let admins flip the flag. These tables already have RLS enabled
    --    with an "admins can read" select policy but no update policy, so
    --    without this the toggle would silently no-op under RLS.
    execute format('drop policy if exists "admins can update" on public.%I;', t);
    execute format(
      'create policy "admins can update" on public.%I for update using (public.is_cms_admin()) with check (public.is_cms_admin());',
      t
    );
  end loop;
end $$;

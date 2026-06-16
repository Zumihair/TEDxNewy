-- =====================================================================
-- DELETE policies for form-submission tables
-- Created 2026-06-16. Each of these tables has RLS enabled with an
-- "admins can read" (select) and "admins can update" policy, but NO
-- delete policy. Under RLS a missing delete policy means every delete
-- silently affects zero rows: the /admin "Delete" button appears to work
-- (the request succeeds) but the row stays. This adds the missing
-- "admins can delete" policy so deletes actually take effect.
--
-- Scope: every table the admin delete actions target
-- (app/admin/submissions-actions.ts), including the subscriber list.
--
-- Apply via Supabase dashboard -> SQL editor. Safe to re-run: uses
-- `drop policy if exists` throughout.
-- =====================================================================

do $$
declare
  t text;
  tables text[] := array[
    'subscribers',
    'applications',
    'nominations',
    'contact_messages',
    'partner_enquiries',
    'youth_futures_registrations',
    'student_speaker_submissions',
    'talk_night_registrations'
  ];
begin
  foreach t in array tables loop
    execute format('drop policy if exists "admins can delete" on public.%I;', t);
    execute format(
      'create policy "admins can delete" on public.%I for delete using (public.is_cms_admin());',
      t
    );
  end loop;
end $$;

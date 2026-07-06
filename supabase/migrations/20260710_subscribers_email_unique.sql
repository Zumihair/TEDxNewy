-- The subscribers table never had a unique constraint on email, even though
-- the subscribe route's duplicate detection and the sync upserts assume one.
-- Normalise case, remove any duplicates, then add the unique index.
-- Apply by hand in the Supabase SQL editor. Safe to re-run.

update public.subscribers
set email = lower(email)
where email <> lower(email);

-- Keep the oldest row per email; duplicates cascade-clean their flow ledger
-- rows via the existing foreign keys.
delete from public.subscribers s
using public.subscribers k
where s.email = k.email
  and s.id <> k.id
  and (
    k.created_at < s.created_at
    or (k.created_at = s.created_at and k.id < s.id)
  );

create unique index if not exists subscribers_email_unique_idx
  on public.subscribers (email);

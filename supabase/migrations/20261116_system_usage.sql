-- =====================================================================
-- System caps: daily usage history for /admin/system-caps
-- Created 2026-11-16. NOT applied yet: apply via Supabase dashboard ->
-- SQL editor (or the supabase-tedx MCP apply_migration) when approved.
-- Safe to re-run.
--
-- 1. system_usage_daily: one row per day per metric, written once a day by
--    the existing daily cron (/api/cron/ticket-holders) through
--    record_system_usage(). Holds the "level" numbers that cannot be derived
--    from existing tables (database size, storage size, ...), so a growth
--    trend can be drawn.
-- 2. email_sends_daily(days): emails per UTC day from email_sends, read with
--    the signed-in admin's session (RLS on email_sends applies).
-- =====================================================================

create table if not exists public.system_usage_daily (
  day    date   not null,
  metric text   not null,
  value  bigint not null,
  primary key (day, metric)
);

alter table public.system_usage_daily enable row level security;

drop policy if exists "admins can read" on public.system_usage_daily;
create policy "admins can read"
  on public.system_usage_daily
  for select
  using (public.is_cms_admin());

-- Records today's levels. SECURITY DEFINER so it can read storage.objects and
-- auth.users, and only the service role (the cron) may call it.
create or replace function public.record_system_usage()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  d date := (now() at time zone 'utc')::date;
begin
  insert into public.system_usage_daily (day, metric, value) values
    (d, 'db_bytes',        pg_database_size(current_database())),
    (d, 'storage_bytes',   coalesce((select sum((metadata->>'size')::bigint) from storage.objects), 0)),
    (d, 'storage_objects', (select count(*) from storage.objects)),
    (d, 'auth_users',      (select count(*) from auth.users)),
    (d, 'subscribers',     (select count(*) from public.subscribers))
  on conflict (day, metric) do update set value = excluded.value;
end;
$$;

revoke all on function public.record_system_usage() from public, anon, authenticated;
grant execute on function public.record_system_usage() to service_role;

-- Emails sent per UTC day (status 'sent') for the last `days` days.
create or replace function public.email_sends_daily(days int default 35)
returns table (day date, sent bigint)
language sql
stable
as $$
  select (created_at at time zone 'utc')::date as day, count(*) as sent
  from public.email_sends
  where status = 'sent'
    and created_at >= (now() at time zone 'utc')::date - (days - 1)
  group by 1
  order by 1;
$$;

-- Clean up the duplicate "Signal" event row: a stray draft (slug 'signal',
-- show_in_nav false, never linked to any talks/speakers/attendees/feedback/
-- photos) sat alongside the real flagship row. Delete the duplicate and
-- rename the real row's slug from the placeholder 'flagship-2026' to
-- 'signal-2026', matching the <name>-<year> convention of the other
-- flagship slugs (reframe-2025, beyond-boundaries-2024).
delete from public.cms_events
where slug = 'signal' and status = 'draft';

update public.cms_events
set slug = 'signal-2026'
where slug = 'flagship-2026';

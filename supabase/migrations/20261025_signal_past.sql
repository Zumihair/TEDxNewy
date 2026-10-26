-- Signal happened on 24 October 2026. Mark it Past and take it out of the menu.
-- The site already treats it as past (SIGNAL_PAST in lib/feature-flags.ts); this
-- makes /admin/events agree and moves it out of "Coming up".
-- Run AFTER the final ticket-buyer sync (past events are skipped by the hourly sync).
update public.cms_events
set status = 'past', show_in_nav = false
where slug = 'signal-2026';

-- Optional, once the preview is approved: take Peter Richardson off the Signal
-- lineup. The site hides him in code either way, so this is housekeeping.
-- update public.cms_speakers set event_id = null where slug = 'peter-richardson';

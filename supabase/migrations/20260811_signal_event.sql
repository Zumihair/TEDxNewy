-- Rebrand the flagship-2026 placeholder event as Signal, with a bespoke
-- page and ticket link, now that it is ready to promote for ticket sales.
-- Safe to re-run.

update public.cms_events
set title = 'Signal'
where slug = 'flagship-2026';

update public.cms_events
set tagline = 'A full day on our biggest stage yet.'
where slug = 'flagship-2026';

update public.cms_events
set blurb = 'TEDxNewy is more than a stage. It''s a room full of curious people who believe one idea can change the direction of a life. Signal is our fourth event of 2026, bringing talks and performances to the Conservatorium of Music.'
where slug = 'flagship-2026';

update public.cms_events
set link_url = '/signal'
where slug = 'flagship-2026';

update public.cms_events
set link_label = 'Get tickets'
where slug = 'flagship-2026';

update public.cms_events
set ticket_url = 'https://events.humanitix.com/tedxnewy-signature-event'
where slug = 'flagship-2026';

-- Replace the stored partners with the 2026 set. Safe to re-run.
-- Public pages (/sponsors, /signal) read lib/signal-links-partners.ts now;
-- this keeps /admin/sponsors showing the same six. Short lines on purpose.

update public.cms_sponsors set is_active = false
where name not in (
  'University of Newcastle', 'Henderson', 'Hey Zomi',
  'Frekl', 'Newy Digital', 'Sketch It Live'
);

insert into public.cms_sponsors
  (name, tier, partner_type, logo_url, website_url, display_order)
select v.name, v.tier, null, v.logo_url, v.website_url, v.display_order
from (values
  ('University of Newcastle', 'Presenting',
   '/images/signal-links/partners/university-of-newcastle.svg',
   'https://www.newcastle.edu.au', 10),
  ('Henderson', 'Platinum',
   '/images/signal-links/partners/henderson.png',
   'https://henderson.com.au', 20),
  ('Hey Zomi', 'Gold',
   '/images/signal-links/partners/hey-zomi.png',
   'https://www.heyzomi.com', 30),
  ('Frekl', 'Gold',
   '/images/signal-links/partners/frekl.png',
   'https://www.frekl.com.au', 40),
  ('Newy Digital', 'Gold',
   '/images/signal-links/partners/newy-digital.png',
   'https://www.newydigital.com', 50),
  ('Sketch It Live', 'Gold',
   '/images/signal-links/partners/sketch-it-live.png',
   'http://sketchitlive.com.au', 60)
) as v(name, tier, logo_url, website_url, display_order)
where not exists (
  select 1 from public.cms_sponsors s where s.name = v.name
);

update public.cms_sponsors s set
  is_active = true, logo_url = v.logo_url,
  website_url = v.website_url, display_order = v.display_order
from (values
  ('University of Newcastle', '/images/signal-links/partners/university-of-newcastle.svg', 'https://www.newcastle.edu.au', 10),
  ('Henderson', '/images/signal-links/partners/henderson.png', 'https://henderson.com.au', 20),
  ('Hey Zomi', '/images/signal-links/partners/hey-zomi.png', 'https://www.heyzomi.com', 30),
  ('Frekl', '/images/signal-links/partners/frekl.png', 'https://www.frekl.com.au', 40),
  ('Newy Digital', '/images/signal-links/partners/newy-digital.png', 'https://www.newydigital.com', 50),
  ('Sketch It Live', '/images/signal-links/partners/sketch-it-live.png', 'http://sketchitlive.com.au', 60)
) as v(name, logo_url, website_url, display_order)
where s.name = v.name;

-- Replace the one-line blurb on the 2024 and 2025 flagship events with a
-- short two-paragraph story. Short quoted pieces joined with || on purpose,
-- paragraph break via chr(10)||chr(10), matching the paste-safe style used
-- in 20260709_events_nav.sql. Safe to re-run.

update public.cms_events
set blurb =
  'In October 2024, eleven speakers took the stage '
  || 'at The Playhouse for our first flagship event, '
  || 'staged under our original name, TEDxCooksHill. '
  || 'Beyond Boundaries asked a simple question: what '
  || 'happens when we stop accepting the limits we '
  || 'have been handed?'
  || chr(10) || chr(10)
  || 'Across a single day the lineup moved through '
  || 'health, work, play and belonging, each speaker '
  || 'pushing on a boundary they had tested themselves, '
  || 'in the clinic, the workplace, the studio, the '
  || 'family home. It was the event that proved '
  || 'Newcastle had an appetite for this, and the one '
  || 'that set the shape for everything that has '
  || 'followed.'
where slug = 'beyond-boundaries-2024';

update public.cms_events
set blurb =
  'A year on from Beyond Boundaries, we moved into '
  || 'the Conservatorium of Music for Reframe: ten '
  || 'speakers, one shared instruction, look again. '
  || 'Where Beyond Boundaries asked what could be '
  || 'pushed past, Reframe asked what could be seen '
  || 'differently: quitting, discomfort, attention, '
  || 'teaching, and the stories we tell ourselves '
  || 'about all of them.'
  || chr(10) || chr(10)
  || 'Reframe was the last flagship staged under the '
  || 'TEDxCooksHill name. Not long after, the licence '
  || 'became TEDxNewy, and the salons, talk nights and '
  || 'Signal that followed all carry the same '
  || 'instruction this stage set: look again.'
where slug = 'reframe-2025';

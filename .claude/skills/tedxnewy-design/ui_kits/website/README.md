# UI kit: tedxnewy.com.au

A click-through recreation of the public TEDxNewy website, built from the site's
own source (`Zumihair/TEDxNewy`, `app/` and `components/`) rather than from
screenshots. Open `index.html`; the pill switcher at the bottom moves between
screens.

| Screen | File | Recreated from |
|---|---|---|
| Home | `HomeScreen.jsx` | `app/page.tsx`, `components/CursorSpotlightHero.tsx` |
| Signal (flagship event page) | `EventScreen.jsx` | `app/signal/page.tsx` treatment, `CountdownClock`, `SpeakerCarousel`, `SpeakerModal`, `FaqAccordion`, `EditionStamp` |
| Archive | `EventsScreen.jsx` | `app/events/page.tsx`, `components/EventRow.tsx` |
| Nominate a speaker | `ParticipateScreen.jsx` | `app/speak/page.tsx`, `components/FormField.tsx`, `ParticipateHero` |

`Chrome.jsx` wires the shared header and footer (`components/Nav.tsx`,
`components/Footer.tsx`) plus the `Section`/`SectionTitle` helpers that carry the
site's vertical rhythm. `data.js` holds the copy and nav config, lifted from
`lib/nav-fallback.ts`, `app/page.tsx` and `public/llms.txt`.

## What is faithful, and what is cut

Faithful: palette, type scale, section rhythm, the dark-hero / cream-surface
split, the mega-menu's two panel shapes, the pill buttons and their hover lift,
the red circle-arrow CTA, card radii and hover behaviour, the grain overlay, the
node-network motif, the countdown, the speaker modal.

Cut on purpose: real routing and data (everything is local state), the mobile
drawer and breakpoints (screens are drawn at desktop width), the Humanitix
ticket widget, the newsletter pop-up, analytics, and the admin CMS and team brand
portal, which were not read for this kit.

Interaction to try: hover the four header groups to open both mega-menu shapes,
move the cursor across the home hero to drag the spotlight, click a speaker on
Signal to open the bio modal, filter the archive, and submit the nomination form
to see the confirmation state.

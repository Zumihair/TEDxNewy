# Source repository

repo: Zumihair/TEDxNewy
branch: main

## Last sync

date: 2026-08-25T01:13:14Z

### Updated in this project

- Built the design system from `app/globals.css`, `app/layout.tsx` and `app/page.tsx`.
- Authored 23 components from the `components/` inventory.
- Copied brand assets, the Bricolage Grotesque font, and event/speaker photography from `public/`.
- Recreated four public site screens as a UI kit.
- **2026-08-25:** this skill moved from a standalone package into the repo
  itself, at `.claude/skills/tedxnewy-design/`. The copied `assets/` folder
  (a byte-identical duplicate of `public/`) was deleted and every reference
  repointed at the real `public/` files, so there is exactly one copy of
  every logo, icon, photo and font from here on. If this project is ever
  pushed back to the claude.ai Design System pane via `/design-sync`, note
  that the local `assets/` folder no longer exists — a push needs to source
  fresh copies from `public/` at push time rather than expecting them already
  bundled here, and the compiled `_ds_bundle.js` / `_ds_manifest.json` still
  carry the old `assets/...` paths until regenerated.

## Screen map

| Project screen | Built from |
|---|---|
| `ui_kits/website/HomeScreen.jsx` | `app/page.tsx`, `components/CursorSpotlightHero.tsx` |
| `ui_kits/website/EventScreen.jsx` | `components/CountdownClock.tsx`, `SpeakerCarousel.tsx`, `SpeakerModal.tsx`, `FaqAccordion.tsx`, `EditionStamp.tsx` |
| `ui_kits/website/EventsScreen.jsx` | `components/EventRow.tsx`, `components/PageHero.tsx` |
| `ui_kits/website/ParticipateScreen.jsx` | `components/FormField.tsx`, `components/ParticipateHero.tsx` |
| `ui_kits/website/Chrome.jsx` | `components/Nav.tsx`, `components/Footer.tsx`, `lib/nav-fallback.ts` |
| `tokens/*.css` | `app/globals.css` |
| `components/**` | `components/*.tsx` |

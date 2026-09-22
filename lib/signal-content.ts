/**
 * Small, plain-data constants shared between `/signal` and `/signal/links`
 * (the QR-code link-tree microsite). Pulled out of `app/signal/page.tsx` so
 * the link tree's Program and Sponsors modals can reuse the exact same
 * agenda copy and per-logo sizing overrides rather than a hand-copied
 * duplicate that drifts the moment one page is edited and the other isn't.
 *
 * No "use client" / "server-only" directive on purpose (same reasoning as
 * `app/admin/newsletter/campaigns/shared.ts` in this codebase): it's pure
 * data, so both a server component (the page fetching CMS data) and a
 * client component (the modal rendering it) can import it directly.
 */

export type AgendaItem = {
  time: string;
  title: string;
  body: string;
};

export const SIGNAL_AGENDA: AgendaItem[] = [
  {
    time: "1:30pm to 2:00pm",
    title: "Arrival & registration",
    body: "Doors open. Check in, grab your name badge and find your seat before we begin.",
  },
  {
    time: "2:00pm to 3:30pm",
    title: "Session 1",
    body: "Event commencement, followed by talks and performances.",
  },
  {
    time: "3:30pm to 4:00pm",
    title: "Intermission",
    body: "A short break out in the foyer. Grab a coffee, stretch your legs and meet some new people before we head back in.",
  },
  {
    time: "4:00pm to 5:30pm",
    title: "Session 2",
    body: "We recommence with a secret showcase, followed by the second round of talks.",
  },
  {
    time: "5:30pm to 6:30pm",
    title: "Drinks hour",
    body: "Join us for drinks in the foyer afterwards to unpack the afternoon, enjoy a drink, share with others and relish in the TEDx community.",
  },
];

// Sponsors Will has asked to keep off the Signal teaser (still shown in full
// on /sponsors). Shared so /signal/links' Sponsors modal matches exactly.
export const SIGNAL_SPONSOR_EXCLUDE = new Set(["Elqo", "Newy Digital", "Frekl"]);

/**
 * Per-partner logo sizing, as a multiplier on the shared cap. Logos differ
 * wildly in how much of their own file is actually ink: a long thin wordmark
 * reads far smaller than a crest at the same height cap, so a couple need a
 * bigger box to sit at even visual weight beside the others.
 *
 * These are tuned against the logo files CURRENTLY uploaded. Re-cropping a
 * logo to remove baked-in transparent padding changes how much of its box is
 * ink, so a re-upload means re-checking the number here.
 *
 * Updated 2026-08-21 for the re-cropped Henderson and University of Newcastle
 * files. Both were mostly transparent margin (Henderson 16% ink in a 1080x398
 * canvas, UoN 71% in 1277x538) and are now 100% ink, so the multipliers that
 * compensated for that padding come down. The new numbers hold each logo at
 * the size it rendered at before the swap, measured against Super Radio
 * Network, which never had padding and sits at 1. Henderson lands back at 1
 * and drops out of the map entirely.
 *
 * **This file and the uploaded logo have to change together.** Either half
 * alone is visibly wrong: a cropped file at the old multiplier renders about
 * twice the intended size, and the old padded file at the new multiplier
 * about half. Masters and the measurements are in
 * ../Source-Images/partners/README.md (outside the repo).
 *
 * Henderson's 0.75, added 2026-09-14, is a different kind of entry from the
 * others: not padding compensation, a deliberate "render smaller than the
 * shared cap" per Will, scoped to Signal only (`/sponsors` sizes its own
 * logos with a fixed box in app/sponsors/page.tsx and doesn't read this map
 * at all). Applies on top of whatever the uploaded file measures at, so it
 * holds even once the re-cropped, currently-padded Henderson file (see the
 * README) is swapped in.
 */
export const SIGNAL_LOGO_SCALE: Record<string, number> = {
  "University of Newcastle": 1.15,
  Henderson: 0.75,
};

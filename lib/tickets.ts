/**
 * The Humanitix listing for Signal, in one place.
 *
 * **The slug has silently changed under us once already** (it was
 * `tedxnewy-signature-event` until 2026-08-19, when the listing moved and the
 * old URL started 404ing while every page here kept rendering perfectly). It
 * used to be written out in three separate files, so this module exists to
 * make the next move a one-line change.
 *
 * `TICKET_POPUP_URL` is the one to link to for "buy a ticket": the widget
 * script loaded on /signal intercepts clicks on it and opens checkout in a
 * pop-up. The href is a real working URL either way, so a page where the
 * widget hasn't loaded just navigates there instead of doing nothing.
 *
 * `TICKET_URL` is the listing itself, for anything that ISN'T buying, such as
 * refunds or the full terms, where routing someone into the buy flow would be
 * the wrong answer.
 */
export const TICKET_URL = "https://events.humanitix.com/tedxnewy-signal";
export const TICKET_POPUP_URL = `${TICKET_URL}/tickets?widget=popup`;

/**
 * `source` value written to `subscribers` (via the existing /api/subscribe
 * route) for a Signal waitlist signup, so a sold-out sign-up is tagged the
 * same way every other capture form on the site tags itself, and shows up as
 * its own row in /admin/subscribers with no code change there. Reused rather
 * than a new table: see SIGNAL_SOLD_OUT in lib/feature-flags.ts.
 */
export const SIGNAL_WAITLIST_SOURCE = "signal-waitlist";

/** Anchor on /signal that the waitlist form sits at, so any CTA elsewhere on
 * the site (nav, banners, pop-up) can link straight to it with `/signal#…`. */
export const SIGNAL_WAITLIST_HREF = "/signal#waitlist";

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

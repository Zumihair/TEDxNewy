import { track } from "@vercel/analytics";

/**
 * Conversion events (see components/MetaPixel.tsx for the base pixel
 * install). Two only, matching what's actually trackable on this site: a
 * "Get tickets" click (InitiateCheckout: the real purchase happens off-site
 * on Humanitix, so this is as close to a checkout signal as we can honestly
 * report) and a completed subscribe form (Lead). No Purchase event exists
 * anywhere: there is nothing here that confirms a ticket was actually bought.
 *
 * Each also goes to Vercel Web Analytics as a custom event ("Ticket click",
 * "Newsletter signup"), which is what the admin's Website page reads to put
 * clicks and sign-ups beside the page that drove them (lib/web-analytics.ts).
 */

/**
 * `placement` names the button ("Nav", "Signal tickets"). It is typed loosely
 * because older call sites pass this straight to onPointerDown, which hands
 * it a PointerEvent; anything that is not a string is ignored.
 */
export function trackGetTickets(placement?: unknown) {
  window.fbq?.("track", "InitiateCheckout");
  try {
    track("Ticket click", {
      placement: typeof placement === "string" ? placement : "Other",
      path: window.location.pathname,
    });
  } catch {
    // Analytics must never get in the way of the click.
  }
}

/** `from` is the path of the page the sign-up form was on. */
export function trackSubscribeLead(from?: string) {
  window.fbq?.("track", "Lead");
  try {
    track("Newsletter signup", { from: from || window.location.pathname });
  } catch {
    // As above.
  }
}

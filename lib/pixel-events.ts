/**
 * Meta ads conversion events (see components/MetaPixel.tsx for the base
 * pixel install). Two events only, matching what's actually trackable on
 * this site: a "Get tickets" click (InitiateCheckout — the real purchase
 * happens off-site on Humanitix, so this is as close to a checkout signal
 * as we can honestly report) and a completed subscribe form (Lead). No
 * Purchase event exists anywhere: there is nothing here that confirms a
 * ticket was actually bought.
 */

export function trackGetTickets() {
  window.fbq?.("track", "InitiateCheckout");
}

export function trackSubscribeLead() {
  window.fbq?.("track", "Lead");
}

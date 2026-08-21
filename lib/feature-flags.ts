/**
 * Site-wide feature flags. Flip and push to main to change behaviour in prod.
 */

// Signal (the 2026 flagship, /signal) and the whole ticket-sales dressing.
// TRUE since 2026-08-21: tickets are on sale.
//
// On, this opens /signal and /events/signal-2026, swaps the homepage hero to
// SignalHomeHero, mounts the site-wide SiteBanner, switches the season pop-up
// to its tickets-on-sale variant, and moves the nav CTA and HOME_TITLE.
// Off, /signal and /events/signal-2026 redirect to /signature, the nav
// "Upcoming" item reads "Signal · Coming soon" with no href, the homepage
// returns to CursorSpotlightHero, and the nav CTA reverts to Subscribe.
//
// Set it back to false and push to main when sales close; nothing else needs
// touching, and nothing new for a sales window should get its own switch.
export const SIGNAL_LIVE = true;

// Lets /signal render for a direct link even while SIGNAL_LIVE is off, via
// /signal?preview=<this value>. Not linked from anywhere on the site and the
// page is noindex while gated, so this is obscurity, not real access
// control — don't treat it as a security boundary, just a "don't stumble
// onto it by accident" gate for sharing a work-in-progress preview.
export const SIGNAL_PREVIEW_TOKEN = "8nWK9TO8ICo55C0TC9AGKB5_";

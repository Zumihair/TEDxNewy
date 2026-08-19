/**
 * Site-wide feature flags. Flip and push to main to change behaviour in prod.
 */

// Signal (the 2026 flagship, /signal) isn't ready for public visitors yet:
// no confirmed speakers, placeholder weekend info, some sponsor logos still
// text wordmarks. Every entry point (nav CTA, nav "Upcoming" item, the
// homepage teaser card, the /signature "Coming up" row) is gated off this
// flag, and /signal plus /events/signal-2026 redirect to /signature
// instead of rendering. Flip to true and push to main when Signal is ready
// to go live.
export const SIGNAL_LIVE = false;

// Lets /signal render for a direct link even while SIGNAL_LIVE is off, via
// /signal?preview=<this value>. Not linked from anywhere on the site and the
// page is noindex while gated, so this is obscurity, not real access
// control — don't treat it as a security boundary, just a "don't stumble
// onto it by accident" gate for sharing a work-in-progress preview.
export const SIGNAL_PREVIEW_TOKEN = "8nWK9TO8ICo55C0TC9AGKB5_";

/**
 * Site-wide feature flags. Flip and push to main to change behaviour in prod.
 */

// Signal (the 2026 flagship, /signal) isn't ready for public visitors yet:
// no confirmed speakers, placeholder weekend info, some sponsor logos still
// text wordmarks. Every entry point (nav CTA, nav "Upcoming" item, the
// homepage teaser card, the /signature "Coming up" row) is gated off this
// flag, and /signal plus /events/flagship-2026 redirect to /signature
// instead of rendering. Flip to true and push to main when Signal is ready
// to go live.
export const SIGNAL_LIVE = false;

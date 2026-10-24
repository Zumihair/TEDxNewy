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

// Signal has sold out. TRUE from 2026-09-13.
//
// On (and only meaningful while SIGNAL_LIVE is also true), every "Get
// tickets" surface across the site swaps to a "Join the waitlist" one
// instead: the /signal ticket tiers all show the Sold out ribbon regardless
// of the live Humanitix count, the hero/venue/final CTAs and the sticky
// button point at the waitlist form (#waitlist on /signal) rather than
// Humanitix checkout, the site banner, the season pop-up and the nav CTA
// switch their copy, and the page's own meta description and JSON-LD
// `offers.availability` stop claiming stock. Waitlist signups land in the
// existing `subscribers` table with `source = "signal-waitlist"` (see
// lib/tickets.ts), so nothing new had to be provisioned in Supabase.
//
// Set it back to false if more tickets become available (a release, a
// cancellation) and push to main; nothing else needs touching. Set
// SIGNAL_LIVE to false instead, once sales for the event are done with
// entirely (post-event), same as always.
export const SIGNAL_SOLD_OUT = true;

// Lets /signal render for a direct link even while SIGNAL_LIVE is off, via
// /signal?preview=<this value>. Not linked from anywhere on the site and the
// page is noindex while gated, so this is obscurity, not real access
// control — don't treat it as a security boundary, just a "don't stumble
// onto it by accident" gate for sharing a work-in-progress preview.
export const SIGNAL_PREVIEW_TOKEN = "8nWK9TO8ICo55C0TC9AGKB5_";

// Signal has happened (24 October 2026). TRUE from 2026-10-25.
//
// On: /signal becomes the recap page (artwork hero, speakers, partners,
// photos and video coming soon), the site-wide "tickets" bar is gone, the
// homepage returns to the "Ideas change everything." text hero, and the
// Signal event is treated as past everywhere it is listed, whatever its
// cms_events status says (see rowToEvent in lib/cms-content.ts). The
// matching SQL (supabase/migrations/20261025_signal_past.sql) makes the admin
// agree. SIGNAL_LIVE and SIGNAL_SOLD_OUT stay as they were so /signal keeps
// resolving.
export const SIGNAL_PAST = true;

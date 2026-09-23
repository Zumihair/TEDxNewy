import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-card";
import { OG_PAGES } from "@/lib/og-content";

/**
 * Without this file, `/signal/links` inherits `/signal`'s card, because Next
 * resolves `opengraph-image` from the nearest ancestor SEGMENT. A link to the
 * event-day guide then previewed as a performance photo from a previous year
 * captioned "Signature · Signal.".
 *
 * `noindex` on the page does not affect this: robots directives govern search
 * indexing, not the link unfurlers in iMessage, WhatsApp, Slack and the
 * socials, which read these tags regardless. The page staying out of search
 * and having a proper share card are unrelated, so leave the robots rules
 * alone.
 */
const PAGE = OG_PAGES["/signal/links"];

export const alt = PAGE.alt;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OG() {
  return renderOgCard(PAGE);
}

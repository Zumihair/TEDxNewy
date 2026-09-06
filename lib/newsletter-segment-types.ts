/**
 * Pure types/labels for newsletter segments, split out of
 * lib/segment-audiences.ts (which carries `import "server-only"` plus
 * Supabase/Humanitix calls) so the editor's client-side picker can import
 * just the label map and the guard without pulling server-only code into
 * the browser bundle. Same trap as the campaigns TABS value documented in
 * CLAUDE.md: a client component importing a server-only module fails the
 * build, not just at runtime.
 */
export type NewsletterSegment =
  | "subscribers"
  | "ticket-purchasers"
  | "subscribers-not-ticket-purchasers";

export const NEWSLETTER_SEGMENT_LABELS: Record<NewsletterSegment, string> = {
  subscribers: "All subscribers",
  "ticket-purchasers": "Ticket purchasers",
  "subscribers-not-ticket-purchasers": "Subscribers, not ticket holders",
};

export function asNewsletterSegment(v: unknown): NewsletterSegment {
  return v === "ticket-purchasers" || v === "subscribers-not-ticket-purchasers"
    ? v
    : "subscribers";
}

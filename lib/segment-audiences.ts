import "server-only";
import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  asNewsletterSegment,
  NEWSLETTER_SEGMENT_LABELS,
  type NewsletterSegment,
} from "@/lib/newsletter-segment-types";

export {
  asNewsletterSegment,
  NEWSLETTER_SEGMENT_LABELS,
  type NewsletterSegment,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(values: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  for (const v of values) {
    if (!v) continue;
    const e = String(v).trim().toLowerCase();
    if (e && EMAIL_RE.test(e)) seen.add(e);
  }
  return [...seen];
}

/**
 * Everyone who has bought a Signal ticket, read live from Humanitix (same
 * `/signal/i` event lookup `lib/ticket-summary.ts` uses for stock counts).
 * Shared by Quick Compose's "Ticket purchasers" audience
 * (app/admin/emails/audiences.ts) and the newsletter's segment targeting
 * (lib/newsletter-send.ts, app/admin/newsletter/actions.ts), so both agree
 * on exactly who counts.
 *
 * Cached 5 minutes: this drives chip/segment counts and campaign
 * construction, neither of which needs a live-to-the-second number, and it
 * keeps opening Quick Compose or building a newsletter segment from firing
 * a Humanitix call on every request.
 */
async function fetchTicketPurchaserEmails(): Promise<string[]> {
  const { humanitixConfigured, listHumanitixEvents, listHumanitixAttendees } =
    await import("@/lib/humanitix");
  if (!humanitixConfigured()) return [];
  const events = await listHumanitixEvents();
  if (!events.ok) return [];
  const signal = events.data.find((e) => /signal/i.test(e.name));
  if (!signal) return [];
  const attendees = await listHumanitixAttendees(signal.id);
  if (!attendees.ok) return [];
  return clean(attendees.data.map((a) => a.email));
}

export const getTicketPurchaserEmailsCached = unstable_cache(
  fetchTicketPurchaserEmails,
  ["ticket-purchaser-emails"],
  { revalidate: 300 },
);

/**
 * Resolve a segment to the exact emails it targets. `null` means "subscribers"
 * (send to the whole Mailchimp audience, no segment needed); otherwise the
 * returned list becomes a Mailchimp static segment. Unlike Quick Compose's
 * own "Subscribers" audience (which reads every row, unfiltered — a Resend
 * send there bypasses Mailchimp's unsubscribe bookkeeping entirely), this
 * excludes anyone unsubscribed, because a real marketing campaign must never
 * target them.
 */
export async function resolveNewsletterSegmentEmails(
  segment: NewsletterSegment,
  supabase: SupabaseClient,
): Promise<string[] | null> {
  if (segment === "subscribers") return null;
  if (segment === "ticket-purchasers") return getTicketPurchaserEmailsCached();
  const { data } = await supabase
    .from("subscribers")
    .select("email")
    .is("unsubscribed_at", null);
  const subs = clean((data ?? []).map((r) => r.email as string | null));
  const purchasers = new Set(await getTicketPurchaserEmailsCached());
  return subs.filter((e) => !purchasers.has(e));
}

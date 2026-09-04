import "server-only";
import { unstable_cache } from "next/cache";
import {
  humanitixConfigured,
  listHumanitixEvents,
  getHumanitixEventStats,
} from "@/lib/humanitix";

/**
 * Compact Humanitix summary for the admin dashboard's pulse band. Cached for
 * five minutes so the most-visited admin page never waits on (or hammers)
 * the Humanitix API; /admin/tickets stays the live, uncached view.
 */

export type TicketSummary = {
  eventName: string;
  sold: number;
  capacity: number | null;
  pct: number | null;
  revenue: number;
  last7: number;
  angel: number;
};

const getSummaryCached = unstable_cache(
  async (): Promise<TicketSummary | null> => {
    const events = await listHumanitixEvents();
    if (!events.ok) return null;
    const now = Date.now();
    const upcoming = events.data
      .filter((e) => e.startDate && Date.parse(e.startDate) >= now)
      .sort(
        (a, b) => Date.parse(a.startDate ?? "") - Date.parse(b.startDate ?? ""),
      );
    // Prefer whichever upcoming listing is actually Signal, so the pulse
    // tile can never mix in another event's revenue even if a second
    // upcoming listing (a future salon, say) appears in Humanitix before
    // Signal's own sales window closes. Falls back to soonest upcoming.
    const next = upcoming.find((e) => /signal/i.test(e.name)) ?? upcoming[0];
    if (!next) return null;
    const stats = await getHumanitixEventStats(next);
    if (!stats.ok) return null;
    const { sold, revenue, last7, angel } = stats.data;
    return {
      eventName: next.name,
      sold,
      capacity: next.capacity,
      pct:
        next.capacity && next.capacity > 0
          ? Math.min(100, Math.round((sold / next.capacity) * 100))
          : null,
      revenue,
      last7,
      angel,
    };
  },
  ["admin-ticket-summary"],
  { revalidate: 300 },
);

export async function getTicketSummary(): Promise<TicketSummary | null> {
  if (!humanitixConfigured()) return null;
  try {
    return await getSummaryCached();
  } catch {
    return null;
  }
}

/**
 * How many Standard tickets are still available for Signal, or null when it
 * can't be known (Humanitix not configured, the call failed, no Standard type
 * found, or Humanitix reports no fixed cap for it). Mirrors the sold-vs-stock
 * read on /admin/tickets: remaining = total stock (ticketType.quantity) minus
 * sold (stats.byType), summed across any Standard rounds. Used by the /signal
 * ticket chip to flip "Selling fast" to a live "Only X left" once it's low.
 *
 * Cached for 60s so the public page (itself ISR-revalidated at 60s) refreshes
 * the number on its own, with no cron and without hammering the API.
 */
const isStandardType = (name: string) =>
  /standard/i.test(name) && !/donations?\b/i.test(name);

const getStandardRemainingCached = unstable_cache(
  async (): Promise<number | null> => {
    const events = await listHumanitixEvents();
    if (!events.ok) return null;
    const signal = events.data.find((e) => /signal/i.test(e.name));
    if (!signal) return null;

    let quantity = 0;
    let haveQuantity = false;
    for (const tt of signal.ticketTypes) {
      if (!isStandardType(tt.name)) continue;
      // A Standard round with no fixed cap means we can't state a remaining
      // count honestly, so bail to the "Selling fast" fallback.
      if (tt.quantity === null) return null;
      quantity += tt.quantity;
      haveQuantity = true;
    }
    if (!haveQuantity) return null;

    const stats = await getHumanitixEventStats(signal);
    if (!stats.ok) return null;
    const sold = stats.data.byType
      .filter((t) => isStandardType(t.name))
      .reduce((a, t) => a + t.sold, 0);

    return Math.max(0, quantity - sold);
  },
  ["signal-standard-remaining"],
  { revalidate: 60 },
);

export async function getSignalStandardRemaining(): Promise<number | null> {
  if (!humanitixConfigured()) return null;
  try {
    return await getStandardRemainingCached();
  } catch {
    return null;
  }
}

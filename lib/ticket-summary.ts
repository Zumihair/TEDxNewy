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

import "server-only";
import { unstable_cache } from "next/cache";
import {
  humanitixConfigured,
  humanitixSlugFromUrl,
  listHumanitixEvents,
  getHumanitixEventStats,
} from "@/lib/humanitix";

/**
 * Public-site sell-through: the live urgency badge on event pages.
 *
 * Cached for 10 minutes so public traffic never hammers Humanitix, and every
 * failure returns null so a broken key or API blip can never take an event
 * page down.
 */

export type TicketPulse = {
  sold: number;
  capacity: number | null;
  /** 0-100 when capacity is known, otherwise null. */
  pct: number | null;
  soldOut: boolean;
  /** Angel-type tickets sold; each funds a second seat. */
  angel: number;
};

const getPulseCached = unstable_cache(
  async (slug: string): Promise<TicketPulse | null> => {
    const events = await listHumanitixEvents();
    if (!events.ok) return null;
    const event = events.data.find((e) => e.slug === slug);
    if (!event) return null;
    const stats = await getHumanitixEventStats(event);
    if (!stats.ok) return null;
    const { sold, angel } = stats.data;
    const capacity = event.capacity;
    const pct =
      capacity && capacity > 0
        ? Math.min(100, Math.round((sold / capacity) * 100))
        : null;
    return {
      sold,
      capacity,
      pct,
      soldOut: capacity !== null && capacity > 0 && sold >= capacity,
      angel,
    };
  },
  ["ticket-pulse"],
  { revalidate: 600 },
);

/** Live sell-through for a ticket URL, or null when it isn't knowable. */
export async function getTicketPulse(
  ticketUrl: string | null,
): Promise<TicketPulse | null> {
  if (!humanitixConfigured()) return null;
  const slug = humanitixSlugFromUrl(ticketUrl);
  if (!slug) return null;
  try {
    return await getPulseCached(slug);
  } catch {
    return null;
  }
}

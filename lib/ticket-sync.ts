import "server-only";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { listHumanitixEvents, humanitixConfigured } from "@/lib/humanitix";
import { importHumanitixAttendees } from "@/lib/event-feedback";

/** Loose title match, the same idiom the admin uses between a CMS event and a Humanitix listing. */
const namesMatch = (a: string, b: string) => {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return x.includes(y) || y.includes(x);
};

/**
 * Keeps each event's attendee list in step with its Humanitix ticket sales, so
 * feedback requests and the attendee views need no manual import. It rides the
 * 5-minute cron but only does real work once an hour (the first run after the
 * hour), and an import skips anyone already on the list, so it is safe to repeat.
 */
export async function syncTicketBuyers(): Promise<
  { skipped: string } | { synced: { event: string; imported: number }[] } | { error: string }
> {
  if (!humanitixConfigured()) return { skipped: "humanitix-not-configured" };
  if (new Date().getUTCMinutes() >= 5) return { skipped: "not-the-hourly-run" };

  const hx = await listHumanitixEvents();
  if (!hx.ok) return { error: hx.error };

  const sb = getAdminSupabase();
  const { data: events } = await sb.from("cms_events").select("id, title, status");
  const cms = (events ?? []) as { id: string; title: string; status: string }[];

  const synced: { event: string; imported: number }[] = [];
  for (const h of hx.data) {
    // Events marked Past are left alone; only announced and recent ones sync.
    const match = cms.find((c) => namesMatch(c.title, h.name));
    if (!match || match.status === "past") continue;
    const res = await importHumanitixAttendees(match.id, h.id);
    if (!res.error && res.imported > 0) synced.push({ event: match.title, imported: res.imported });
  }
  return { synced };
}

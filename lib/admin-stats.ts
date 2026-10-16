import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Weekly subscriber growth for the dashboards: active subscribers at the end of each week. */
export async function subscriberGrowth(supabase: SupabaseClient, weeks = 12) {
  const { data } = await supabase
    .from("subscribers")
    .select("created_at, unsubscribed_at")
    .range(0, 19999);
  const rows = (data ?? []) as { created_at: string; unsubscribed_at: string | null }[];
  const DAY = 86400_000;
  const now = Date.now();
  const labels: string[] = [];
  const values: number[] = [];
  const fmt = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", timeZone: "Australia/Sydney" });
  for (let w = weeks - 1; w >= 0; w--) {
    const end = now - w * 7 * DAY;
    labels.push(fmt.format(new Date(end)));
    values.push(
      rows.filter(
        (r) =>
          new Date(r.created_at).getTime() <= end &&
          (!r.unsubscribed_at || new Date(r.unsubscribed_at).getTime() > end),
      ).length,
    );
  }
  const total = rows.filter((r) => !r.unsubscribed_at).length;
  const last7 = rows.filter((r) => new Date(r.created_at).getTime() > now - 7 * DAY).length;
  return { total, last7, labels, values };
}

/** The next announced event (soonest start in the future), for the Home hero. */
export async function nextEvent(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("cms_events")
    .select("title, starts_at")
    .eq("status", "announced")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(1);
  const row = (data ?? [])[0] as { title: string; starts_at: string } | undefined;
  if (!row) return null;
  const days = Math.ceil((new Date(row.starts_at).getTime() - Date.now()) / 86400_000);
  return { title: row.title, startsAt: row.starts_at, days };
}

const LINES = [
  "Ideas worth spreading start with a good Monday.",
  "Small steps, a big stage.",
  "Somebody in Newcastle has an idea waiting for us.",
  "The room fills one conversation at a time.",
  "Good things happen to teams that answer their email.",
  "Weekend mode, with one eye on the inbox.",
  "A quiet Sunday is the best time to plan.",
];

/** A friendly line that changes with the day, so Home has some character. */
export function dailyLine(date = new Date()) {
  const idx = new Date(date.toLocaleString("en-US", { timeZone: "Australia/Sydney" })).getDay();
  return LINES[(idx + 6) % 7];
}

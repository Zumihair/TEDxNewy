/**
 * Subscriber activity numbers for the admin email overview.
 *
 * Reads directly from the `subscribers` table (source of truth: Mailchimp
 * two-way sync + the webhook keeps it in step). Uses the service-role
 * client because these counts include unsubscribed rows and cross-cut
 * time windows the anon key can't reach.
 *
 * Returns SEED zeros on any failure so the page never breaks; the caller
 * can present the tiles as "unavailable" via the `computedAt` flag.
 */

import { getAdminSupabase } from "./supabase-admin";

export type SubscriberStats = {
  totalActive: number;
  new7d: number;
  new30d: number;
  unsub7d: number;
  unsub30d: number;
  net30d: number;
  computedAt: string | null;
};

const ZERO: SubscriberStats = {
  totalActive: 0,
  new7d: 0,
  new30d: 0,
  unsub7d: 0,
  unsub30d: 0,
  net30d: 0,
  computedAt: null,
};

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

export async function getSubscriberStats(): Promise<SubscriberStats> {
  try {
    const s = getAdminSupabase();
    const head = { count: "exact" as const, head: true };
    const since7 = isoDaysAgo(7);
    const since30 = isoDaysAgo(30);

    const [
      totalActive,
      new7,
      new30,
      unsub7,
      unsub30,
    ] = await Promise.all([
      s.from("subscribers").select("*", head).is("unsubscribed_at", null),
      s.from("subscribers").select("*", head).gte("created_at", since7),
      s.from("subscribers").select("*", head).gte("created_at", since30),
      s.from("subscribers").select("*", head).gte("unsubscribed_at", since7),
      s.from("subscribers").select("*", head).gte("unsubscribed_at", since30),
    ]);

    const n7 = new7.count ?? 0;
    const n30 = new30.count ?? 0;
    const u7 = unsub7.count ?? 0;
    const u30 = unsub30.count ?? 0;

    return {
      totalActive: totalActive.count ?? 0,
      new7d: n7,
      new30d: n30,
      unsub7d: u7,
      unsub30d: u30,
      net30d: n30 - u30,
      computedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error("[subscriber-stats] failed", err);
    return ZERO;
  }
}

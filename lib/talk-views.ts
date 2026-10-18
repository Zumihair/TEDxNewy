/**
 * Total YouTube views across every published talk, for the stat bands on the
 * home page and /talks. Asks the YouTube Data API directly (one quota unit per
 * 50 talks) and keeps the answer for an hour, so the figure stays live without
 * spending quota on every page view. If the API is down or the key is not set,
 * it falls back to the counts the admin talks page last saved in
 * cms_talk_stats. Returns null only when neither source has anything.
 */
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { getAdminSupabase } from "./supabase-admin";
import { fetchVideoStats, youtubeApiKey } from "./youtube";

/** Maggie's talk lives on TED.com, not our channel, so it is added on top by the home page. */
export const TED_COM_VIEWS = 1_600_000;

async function fetchTotal(): Promise<number | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (youtubeApiKey() && url && key) {
    try {
      const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
      const { data } = await client.from("cms_talks").select("youtube_id");
      const ids = (data ?? []).map((t) => t.youtube_id as string | null).filter((v): v is string => Boolean(v));
      if (ids.length > 0) {
        const stats = await fetchVideoStats(ids);
        let sum = 0;
        for (const s of stats.values()) sum += s.viewCount ?? 0;
        if (sum > 0) return sum;
      }
    } catch (err) {
      console.error("[talk-views] live YouTube read failed", err);
    }
  }

  try {
    const { data } = await getAdminSupabase().from("cms_talk_stats").select("view_count");
    const sum = (data ?? []).reduce((n, r) => n + ((r.view_count as number | null) ?? 0), 0);
    return sum > 0 ? sum : null;
  } catch {
    return null;
  }
}

export const getTotalTalkViews = unstable_cache(fetchTotal, ["total-talk-views"], { revalidate: 3600 });

/** 1_234_567 -> "1.2". Used with an "M" suffix; below a million it falls back to thousands. */
export function millions(n: number): { value: string; suffix: string } {
  if (n >= 1_000_000) return { value: (n / 1_000_000).toFixed(1), suffix: "Million" };
  return { value: String(Math.round(n / 1000)), suffix: "Thousand" };
}

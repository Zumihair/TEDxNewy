/**
 * Public-site CMS readers. These query Supabase via the anon-key client
 * (RLS lets anyone SELECT from cms_* tables) and fall back to the static
 * lib/data.ts seed if anything goes wrong, so the site never breaks if
 * Supabase is unreachable or env vars are missing.
 */
import { createClient } from "@supabase/supabase-js";
import { talks as fallbackTalks, type Talk } from "./data";

function publicSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Read the live talk archive. Returns the static fallback on any error,
 * so /watch always renders something even if Supabase is down.
 */
export async function getTalks(): Promise<Talk[]> {
  const client = publicSupabase();
  if (!client) return fallbackTalks;
  const { data, error } = await client
    .from("cms_talks")
    .select("*")
    .order("year", { ascending: false })
    .order("display_order", { ascending: true });
  if (error || !data) {
    if (error) console.error("[cms-content] getTalks", error);
    return fallbackTalks;
  }
  return data.map(
    (row): Talk => ({
      id: row.id,
      speaker: row.speaker,
      speakerSlug: row.speaker_slug ?? undefined,
      title: row.title,
      year: row.year,
      event: row.event,
      youtubeId: row.youtube_id,
      blurb: row.blurb ?? undefined,
    }),
  );
}

import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };
const WALL_LIMIT = 60;

/**
 * The live photo wall feed. Public, no session: it returns approved, on-wall
 * photos only, with image URLs only (no names, no session ids, no scores). The projector view polls this every few seconds.
 * The full recent list comes back each time (not a delta) so a photo an admin
 * hides disappears on the next poll without any extra signalling.
 */
export async function GET() {
  let db;
  try {
    db = getAdminSupabase();
  } catch {
    return NextResponse.json({ photos: [] }, { headers: NO_STORE });
  }
  const { data, error } = await db
    .from("side_quest_photos")
    .select("id, thumb_url, url, uploaded_at")
    .eq("approved", true)
    .eq("on_wall", true)
    .order("uploaded_at", { ascending: false })
    .limit(WALL_LIMIT);
  if (error) {
    return NextResponse.json({ photos: [] }, { headers: NO_STORE });
  }
  const photos = (data ?? []).map((r) => ({
    id: r.id as string,
    thumbUrl: r.thumb_url as string,
    url: r.url as string,
    uploadedAt: r.uploaded_at as string,
  }));
  return NextResponse.json({ photos }, { headers: NO_STORE });
}

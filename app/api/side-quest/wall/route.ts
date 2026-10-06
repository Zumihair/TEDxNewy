import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };
const WALL_LIMIT = 80;

/**
 * The live photo wall feed. Public, no session: it returns approved, on-wall
 * photos only, with a first name and quest title and nothing else (no
 * session ids, no scores). The projector view polls this every few seconds.
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
    .select(
      "id, thumb_url, url, uploaded_at, challenge_id, side_quest_sessions(first_name), side_quest_challenges(title)",
    )
    .eq("approved", true)
    .eq("on_wall", true)
    .order("uploaded_at", { ascending: false })
    .limit(WALL_LIMIT);
  if (error) {
    return NextResponse.json(
      { photos: [] },
      { status: 200, headers: NO_STORE },
    );
  }
  type Row = {
    id: string;
    thumb_url: string;
    url: string;
    uploaded_at: string;
    side_quest_sessions: { first_name: string } | { first_name: string }[] | null;
    side_quest_challenges: { title: string } | { title: string }[] | null;
  };
  const one = <T,>(v: T | T[] | null): T | null =>
    Array.isArray(v) ? (v[0] ?? null) : v;
  const photos = ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    thumbUrl: r.thumb_url,
    url: r.url,
    uploadedAt: r.uploaded_at,
    firstName: one(r.side_quest_sessions)?.first_name ?? "",
    quest: one(r.side_quest_challenges)?.title ?? "",
  }));
  return NextResponse.json({ photos }, { headers: NO_STORE });
}

import { NextResponse, type NextRequest } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { getSession } from "@/lib/side-quest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

/** Record the one-time "Got it" photo use acknowledgement for a session. */
export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json(
      { error: "no_session" },
      { status: 401, headers: NO_STORE },
    );
  }
  if (!session.photo_notice_at) {
    await getAdminSupabase()
      .from("side_quest_sessions")
      .update({ photo_notice_at: new Date().toISOString() })
      .eq("id", session.id);
  }
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}

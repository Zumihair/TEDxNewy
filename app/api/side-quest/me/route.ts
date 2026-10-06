import { NextResponse, type NextRequest } from "next/server";
import { buildMe, getSession, isNotSetUp } from "@/lib/side-quest";
import { getAdminSupabase } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

/** Session summary plus the challenge list with completed flags. */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      // Distinguish "no session" from "migration not applied" for the UI.
      const probe = await getAdminSupabase()
        .from("side_quest_challenges")
        .select("id", { head: true, count: "exact" });
      if (isNotSetUp(probe.error)) {
        return NextResponse.json(
          { error: "not_ready" },
          { status: 503, headers: NO_STORE },
        );
      }
      return NextResponse.json(
        { error: "no_session" },
        { status: 401, headers: NO_STORE },
      );
    }
    return NextResponse.json(await buildMe(session), { headers: NO_STORE });
  } catch (e) {
    console.error("[side-quest/me]", e);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500, headers: NO_STORE },
    );
  }
}

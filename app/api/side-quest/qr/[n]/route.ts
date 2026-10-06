import { NextResponse, type NextRequest } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { getChallengeByQr, getSession } from "@/lib/side-quest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * The puzzle prompt for a scanned QR code. Returns the prompt and whether
 * this session already solved it. NEVER returns the answer.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ n: string }> },
) {
  const { n } = await params;
  const num = Number(n);
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json(
      { error: "no_session" },
      { status: 401, headers: NO_STORE },
    );
  }
  const challenge = Number.isInteger(num) ? await getChallengeByQr(num) : null;
  if (!challenge || !challenge.puzzle_prompt) {
    return NextResponse.json(
      { error: "This code is not active." },
      { status: 404, headers: NO_STORE },
    );
  }
  const { data: done } = await getAdminSupabase()
    .from("side_quest_completions")
    .select("id")
    .eq("session_id", session.id)
    .eq("challenge_id", challenge.id)
    .maybeSingle();
  return NextResponse.json(
    {
      title: challenge.title,
      prompt: challenge.puzzle_prompt,
      points: challenge.points,
      alreadyDone: !!done,
    },
    { headers: NO_STORE },
  );
}

import { NextResponse, type NextRequest } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import {
  answerMatches,
  awardCompletion,
  buildMe,
  clientIp,
  getChallengeByQr,
  getSession,
  rateLimited,
} from "@/lib/side-quest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

/** Wrong guesses allowed per session per challenge per minute. */
const MAX_WRONG_PER_MINUTE = 8;
/** Wrong guesses allowed per session across all codes per 10 minutes. */
const MAX_WRONG_PER_10_MIN = 40;

/**
 * Check a QR puzzle answer. The check is server side only, and every
 * attempt is recorded. The durable limit below reads the attempts table, so
 * the auto-check in the browser cannot be used to brute force an answer even
 * across serverless instances.
 */
export async function POST(
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
  if (rateLimited(`qr-ip:${clientIp(req)}`, 240, 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many tries. Wait a moment." },
      { status: 429, headers: NO_STORE },
    );
  }

  const challenge = Number.isInteger(num) ? await getChallengeByQr(num) : null;
  if (!challenge) {
    return NextResponse.json(
      { error: "This code is not active." },
      { status: 404, headers: NO_STORE },
    );
  }

  let answer = "";
  try {
    const body = (await req.json()) as { answer?: unknown };
    answer = typeof body.answer === "string" ? body.answer.slice(0, 80) : "";
  } catch {
    // validated below
  }
  if (!answer.trim()) {
    return NextResponse.json(
      { error: "Type an answer." },
      { status: 400, headers: NO_STORE },
    );
  }

  const db = getAdminSupabase();

  // Already solved: succeed again without scoring or logging an attempt.
  const { data: done } = await db
    .from("side_quest_completions")
    .select("id")
    .eq("session_id", session.id)
    .eq("challenge_id", challenge.id)
    .maybeSingle();
  if (done) {
    return NextResponse.json(
      { correct: true, awarded: false, me: await buildMe(session) },
      { headers: NO_STORE },
    );
  }

  // Durable brute force guard, from the attempts table.
  const minuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
  const tenAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const [{ count: recent }, { count: recentAll }] = await Promise.all([
    db
      .from("side_quest_qr_attempts")
      .select("id", { count: "exact", head: true })
      .eq("session_id", session.id)
      .eq("challenge_id", challenge.id)
      .eq("correct", false)
      .gte("at", minuteAgo),
    db
      .from("side_quest_qr_attempts")
      .select("id", { count: "exact", head: true })
      .eq("session_id", session.id)
      .eq("correct", false)
      .gte("at", tenAgo),
  ]);
  if (
    (recent ?? 0) >= MAX_WRONG_PER_MINUTE ||
    (recentAll ?? 0) >= MAX_WRONG_PER_10_MIN
  ) {
    return NextResponse.json(
      { error: "Too many tries. Take a breath and try again soon." },
      { status: 429, headers: NO_STORE },
    );
  }

  const correct = answerMatches(answer, challenge.puzzle_answer);
  await db.from("side_quest_qr_attempts").insert({
    session_id: session.id,
    challenge_id: challenge.id,
    correct,
  });

  if (!correct) {
    return NextResponse.json({ correct: false }, { headers: NO_STORE });
  }

  const { awarded, session: fresh } = await awardCompletion(
    session,
    challenge,
  );
  return NextResponse.json(
    {
      correct: true,
      awarded,
      points: challenge.points,
      crossedPrizeLine: awarded && fresh.prize_eligible && !session.prize_eligible,
      me: await buildMe(fresh),
    },
    { headers: NO_STORE },
  );
}

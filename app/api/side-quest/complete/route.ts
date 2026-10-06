import { NextResponse, type NextRequest } from "next/server";
import {
  awardCompletion,
  buildMe,
  getChallenge,
  getSession,
  rateLimited,
} from "@/lib/side-quest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * Mark a SOCIAL challenge done (trust based). Photo and QR challenges can
 * only be completed by their own routes, which verify something. Idempotent:
 * a second call returns the same state without a second award. The body
 * carries only a challenge id, so there is nothing to tamper with: the
 * points always come from the challenge row.
 */
export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json(
      { error: "no_session" },
      { status: 401, headers: NO_STORE },
    );
  }
  if (rateLimited(`complete:${session.id}`, 30, 60 * 1000)) {
    return NextResponse.json(
      { error: "Slow down a little." },
      { status: 429, headers: NO_STORE },
    );
  }

  let id = "";
  try {
    const body = (await req.json()) as { challengeId?: unknown };
    id = typeof body.challengeId === "string" ? body.challengeId : "";
  } catch {
    // validated below
  }
  const challenge = id ? await getChallenge(id) : null;
  if (!challenge || !challenge.active) {
    return NextResponse.json(
      { error: "That quest is not available." },
      { status: 404, headers: NO_STORE },
    );
  }
  if (challenge.type !== "social") {
    return NextResponse.json(
      { error: "That quest is completed another way." },
      { status: 400, headers: NO_STORE },
    );
  }

  const { awarded, session: fresh } = await awardCompletion(
    session,
    challenge,
  );
  const me = await buildMe(fresh);
  return NextResponse.json(
    {
      awarded,
      crossedPrizeLine: awarded && fresh.prize_eligible && !session.prize_eligible,
      me,
    },
    { headers: NO_STORE },
  );
}

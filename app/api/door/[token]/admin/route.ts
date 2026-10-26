import { NextResponse } from "next/server";
import {
  adminPasswordOk,
  doorTokenOk,
  getDoorRoster,
  getDoorState,
  setNoSupporter,
} from "@/lib/door";

export const dynamic = "force-dynamic";

/**
 * Door admin. With just a password it checks the login; with a ticketId it
 * also takes the supporter tag off that ticket (`removed: true`) or puts it back.
 */
export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (!doorTokenOk(token)) return new NextResponse(null, { status: 404 });
  const body = (await req.json().catch(() => null)) as {
    password?: unknown;
    ticketId?: unknown;
    removed?: unknown;
  } | null;
  if (typeof body?.password !== "string" || !adminPasswordOk(body.password)) {
    return NextResponse.json({ error: "That password isn't right." }, { status: 401 });
  }
  if (typeof body.ticketId !== "string") return NextResponse.json({ ok: true });

  const roster = await getDoorRoster();
  if (!roster.ok) return NextResponse.json({ error: roster.error }, { status: 502 });
  try {
    await setNoSupporter(roster.data, body.ticketId, body.removed === true);
    const state = await getDoorState(roster.data.eventId);
    return NextResponse.json(state, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not save." },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { doorTokenOk, getDoorRoster, getDoorState, setDoorCheckins } from "@/lib/door";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (!doorTokenOk(token)) return new NextResponse(null, { status: 404 });
  const body = (await req.json().catch(() => null)) as {
    action?: string;
    ticketIds?: unknown;
    by?: unknown;
  } | null;
  const action = body?.action === "undo" ? "undo" : body?.action === "in" ? "in" : null;
  const ids = Array.isArray(body?.ticketIds)
    ? (body.ticketIds as unknown[]).filter((x): x is string => typeof x === "string").slice(0, 50)
    : [];
  if (!action || ids.length === 0) {
    return NextResponse.json({ error: "Nothing to do." }, { status: 400 });
  }
  const roster = await getDoorRoster();
  if (!roster.ok) return NextResponse.json({ error: roster.error }, { status: 502 });
  try {
    await setDoorCheckins(roster.data, action, ids, typeof body?.by === "string" ? body.by : "");
    const state = await getDoorState(roster.data.eventId);
    return NextResponse.json(state, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not save." },
      { status: 500 },
    );
  }
}

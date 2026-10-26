import { NextResponse } from "next/server";
import { doorTokenOk, getDoorRoster, getDoorState } from "@/lib/door";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (!doorTokenOk(token)) return new NextResponse(null, { status: 404 });
  const roster = await getDoorRoster();
  if (!roster.ok) return NextResponse.json({ error: roster.error }, { status: 502 });
  try {
    const state = await getDoorState(roster.data.eventId);
    return NextResponse.json(state, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not read check-ins." },
      { status: 500 },
    );
  }
}

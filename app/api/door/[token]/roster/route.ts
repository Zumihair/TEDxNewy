import { NextResponse } from "next/server";
import { doorTokenOk, getDoorRoster } from "@/lib/door";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (!doorTokenOk(token)) return new NextResponse(null, { status: 404 });
  const force = new URL(req.url).searchParams.get("fresh") === "1";
  const res = await getDoorRoster(force);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 502 });
  return NextResponse.json(res.data, { headers: { "Cache-Control": "no-store" } });
}

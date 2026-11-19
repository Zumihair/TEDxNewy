import { NextResponse, type NextRequest } from "next/server";
import { openPoll, processHuddles, huddleConfigured } from "@/lib/huddle";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Manual trigger for the huddle bot, protected by CRON_SECRET like the other
 * cron routes. The real schedule rides on /api/cron/newsletter (every 5
 * minutes), so this is only for testing and nudging.
 *
 *   ?action=test-open   open a clearly labelled TEST poll now (invites only the organiser)
 *   ?action=open        open next month's real poll now
 *   ?action=sweep       run the sweep once
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!huddleConfigured()) return NextResponse.json({ error: "huddle bot not configured" }, { status: 503 });
  const action = req.nextUrl.searchParams.get("action") ?? "sweep";
  if (action === "test-open") return NextResponse.json(await openPoll({ isTest: true }));
  if (action === "open") return NextResponse.json(await openPoll());
  return NextResponse.json(await processHuddles());
}

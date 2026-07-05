import { NextResponse, type NextRequest } from "next/server";
import { sendNewsletter } from "@/lib/newsletter-send";
import { getAdminSupabase } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Scheduled sender. Vercel Cron hits this every few minutes (see vercel.json)
 * with `Authorization: Bearer $CRON_SECRET`. It finds due scheduled campaigns
 * and sends them. The route is trigger-agnostic: any caller presenting the
 * secret works, so an external pinger can drive it too.
 *
 * Phase 4 adds subscriber-flow drip processing alongside the newsletter run.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const nowIso = new Date().toISOString();
  const supabase = getAdminSupabase();

  const { data: due, error } = await supabase
    .from("newsletters")
    .select("id")
    .eq("status", "scheduled")
    .lte("scheduled_at", nowIso);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const newsletters = [];
  for (const n of due ?? []) {
    const outcome = await sendNewsletter(n.id as string);
    newsletters.push({ id: n.id, ...outcome });
  }

  return NextResponse.json({ ran: nowIso, newsletters });
}

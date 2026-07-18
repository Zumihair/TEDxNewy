import { NextResponse, type NextRequest } from "next/server";
import { recoverStaleSending, sendNewsletter } from "@/lib/newsletter-send";
import { processFlowDrips } from "@/lib/subscriber-flow-send";
import { processFeedbackReminders } from "@/lib/event-feedback";
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

  // Recover any campaigns stuck in "sending" from a crashed/timed-out run
  // before selecting due ones, so a recovered row can be picked up this pass.
  let recovered = 0;
  try {
    recovered = await recoverStaleSending();
  } catch (err) {
    console.error("[cron] stale sending recovery threw", err);
  }

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

  // Subscriber welcome flow: send any delayed steps that are now due.
  let flows;
  try {
    flows = await processFlowDrips();
  } catch (err) {
    flows = { error: String(err).slice(0, 500) };
  }

  // Event feedback: one reminder to attendees who haven't responded after 3
  // days. Claim-first inside processFeedbackReminders, so runs can't overlap.
  let feedbackReminders: number | { error: string } = 0;
  try {
    feedbackReminders = await processFeedbackReminders();
  } catch (err) {
    feedbackReminders = { error: String(err).slice(0, 500) };
  }

  return NextResponse.json({
    ran: nowIso,
    recovered,
    newsletters,
    flows,
    feedbackReminders,
  });
}

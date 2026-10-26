import { type NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/cms-auth";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { feedbackExtrasForSlug, feedbackReminderLabel } from "@/lib/event-feedback";
import {
  feedbackReminderEmail,
  feedbackRequestEmail,
  SITE,
} from "@/lib/email-templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The feedback email as a bare HTML page, for the "Preview email" links on an
 * event's Feedback tab. Sends nothing. `?kind=request` (default) is the first
 * email, `?kind=reminder` is the nudge sent 3 days later. The name is a sample
 * and the button points at the form's preview mode, which only works locally.
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ eventId: string }> },
) {
  await requireAdmin({ readOnly: true });
  const { eventId } = await ctx.params;
  const { data } = await getAdminSupabase()
    .from("cms_events")
    .select("slug, title")
    .eq("id", eventId)
    .single();
  if (!data) return new NextResponse("Not found", { status: 404 });

  const kind = req.nextUrl.searchParams.get("kind");
  const args = {
    fullName: "Alex Sample",
    eventTitle: data.title as string,
    url: `${SITE}/feedback/${data.slug}?t=preview`,
  };
  const label = feedbackReminderLabel(data.slug as string);
  const email =
    kind === "reminder"
      ? feedbackReminderEmail({ ...args, eventLabel: label })
      : feedbackRequestEmail({ ...args, extras: feedbackExtrasForSlug(data.slug as string) });

  return new NextResponse(email.html ?? email.text, {
    headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex" },
  });
}

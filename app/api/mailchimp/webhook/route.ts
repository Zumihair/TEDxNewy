import { NextResponse, type NextRequest } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";

export const runtime = "nodejs";

/**
 * Mailchimp audience webhook. Keeps the local subscribers table in sync so
 * the welcome flow and admin views agree with Mailchimp:
 *  - unsubscribe / cleaned -> set unsubscribed_at locally
 *  - subscribe             -> upsert locally (and clear unsubscribed_at)
 *
 * Configure in Mailchimp: Audience > Settings > Webhooks, URL
 *   https://tedxnewy.com.au/api/mailchimp/webhook?secret=<MAILCHIMP_WEBHOOK_SECRET>
 * with the subscribe/unsubscribe/cleaned events ticked. Mailchimp validates
 * the URL with a GET, so GET returns 200. Events arrive as form-encoded POSTs.
 */
export async function GET() {
  return new NextResponse("ok", { status: 200 });
}

export async function POST(req: NextRequest) {
  const secret = process.env.MAILCHIMP_WEBHOOK_SECRET;
  if (!secret || req.nextUrl.searchParams.get("secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const form = await req.formData();
    const type = String(form.get("type") ?? "");
    const email = String(form.get("data[email]") ?? "")
      .trim()
      .toLowerCase();
    if (!email || !email.includes("@")) {
      return new NextResponse("ok", { status: 200 });
    }

    const supabase = getAdminSupabase();

    if (type === "unsubscribe" || type === "cleaned") {
      await supabase
        .from("subscribers")
        .update({ unsubscribed_at: new Date().toISOString() })
        .ilike("email", email)
        .is("unsubscribed_at", null);
    } else if (type === "subscribe") {
      // Upsert: a returning address gets its unsubscribe cleared, a new one
      // is inserted with a mailchimp source tag.
      const { data: existing } = await supabase
        .from("subscribers")
        .select("id")
        .ilike("email", email)
        .limit(1)
        .maybeSingle();
      if (existing) {
        await supabase
          .from("subscribers")
          .update({ unsubscribed_at: null })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("subscribers")
          .insert({ email, source: "mailchimp" });
      }
    }
  } catch (err) {
    // Always 200 so Mailchimp does not disable the webhook over a blip.
    console.error("[mailchimp webhook] failed", err);
  }

  return new NextResponse("ok", { status: 200 });
}

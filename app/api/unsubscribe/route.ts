import { NextResponse, type NextRequest } from "next/server";
import { unsubscribeMember } from "@/lib/mailchimp";
import { getAdminSupabase } from "@/lib/supabase-admin";

export const runtime = "nodejs";

/**
 * RFC 8058 one-click unsubscribe endpoint, targeted by the
 * List-Unsubscribe-Post header. Mail providers POST here directly, so it must
 * not require any confirmation UI. Accepts the token in the query string or
 * form body. Always returns 200 so a provider never retries.
 */
export async function POST(req: NextRequest) {
  try {
    let token = req.nextUrl.searchParams.get("token") ?? "";
    if (!token) {
      const body = await req.formData().catch(() => null);
      token = body ? String(body.get("token") ?? "") : "";
    }
    if (token) {
      const supabase = getAdminSupabase();
      const { data: sub } = await supabase
        .from("subscribers")
        .select("email")
        .eq("unsubscribe_token", token)
        .maybeSingle();
      await supabase
        .from("subscribers")
        .update({ unsubscribed_at: new Date().toISOString() })
        .eq("unsubscribe_token", token)
        .is("unsubscribed_at", null);
      if (sub?.email) {
        await unsubscribeMember(String(sub.email)).catch((err) =>
          console.error("[unsubscribe] mailchimp sync failed", err),
        );
      }
    }
  } catch (err) {
    console.error("[unsubscribe] one-click failed", err);
  }
  return new NextResponse(null, { status: 200 });
}

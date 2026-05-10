import { type NextRequest, NextResponse } from "next/server";
import { getSupabase, clientMeta } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const data = Object.fromEntries(
    new URLSearchParams(await req.text()),
  ) as Record<string, string>;

  const nominatorName = String(data.nominatorName ?? "").trim();
  const nominatorEmail = String(data.nominatorEmail ?? "").trim().toLowerCase();
  const relationship = String(data.relationship ?? "").trim() || null;
  const nomineeName = String(data.nomineeName ?? "").trim();
  const nomineeTitle = String(data.nomineeTitle ?? "").trim();
  const idea = String(data.idea ?? "").trim();
  const link = String(data.link ?? "").trim() || null;

  if (!nominatorName || !nominatorEmail || !nomineeName || !nomineeTitle || !idea) {
    return NextResponse.redirect(
      new URL("/nominate?status=error", req.url),
      303,
    );
  }

  const supabase = getSupabase();
  const { ua, ip } = clientMeta(req);
  const { error } = await supabase.from("nominations").insert({
    nominator_name: nominatorName,
    nominator_email: nominatorEmail,
    relationship,
    nominee_name: nomineeName,
    nominee_title: nomineeTitle,
    idea,
    link,
    user_agent: ua,
    ip,
  });

  if (error) {
    console.error("[nominate] supabase error", error);
    return NextResponse.redirect(
      new URL("/nominate?status=error", req.url),
      303,
    );
  }

  return NextResponse.redirect(new URL("/thanks?source=nominate", req.url), 303);
}

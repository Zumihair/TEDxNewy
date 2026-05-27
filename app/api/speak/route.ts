import { type NextRequest, NextResponse } from "next/server";
import { getSupabase, clientMeta } from "@/lib/supabase";
import { sendFormNotification } from "@/lib/email-notify";

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
      new URL("/speak?status=error", req.url),
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
      new URL("/speak?status=error", req.url),
      303,
    );
  }

  await sendFormNotification("nominate", {
    subject: `New speaker nomination — ${nomineeName}`,
    text: [
      `Nominee:    ${nomineeName} (${nomineeTitle})`,
      `Nominator:  ${nominatorName} <${nominatorEmail}>`,
      relationship ? `Relationship: ${relationship}` : null,
      link ? `Link: ${link}` : null,
      ``,
      `Idea:`,
      idea,
    ]
      .filter(Boolean)
      .join("\n"),
  });

  return NextResponse.redirect(new URL("/thanks?source=nominate", req.url), 303);
}

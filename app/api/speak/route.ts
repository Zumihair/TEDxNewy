import { type NextRequest, NextResponse } from "next/server";
import { getSupabase, clientMeta } from "@/lib/supabase";
import { checkSubmission } from "@/lib/anti-spam";
import {
  sendConfirmationEmail,
  sendFormNotification,
} from "@/lib/email-notify";
import { confirmNominate, notifyNominate } from "@/lib/email-templates";

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
  const nomineeLocation = String(data.nomineeLocation ?? "").trim() || null;
  const idea = String(data.idea ?? "").trim();
  const link = String(data.link ?? "").trim() || null;

  if (!nominatorName || !nominatorEmail || !nomineeName || !nomineeTitle || !idea) {
    return NextResponse.redirect(
      new URL("/speak?status=error", req.url),
      303,
    );
  }

  // Bot filter. The public form (SubmitLockForm) injects the honeypot +
  // timing fields, so all four layers apply; each tolerates its own absence.
  // The optional `link` field is a legitimate URL, so it is not scanned.
  const { spam, reason } = checkSubmission(req, data, {
    textFields: ["idea"],
  });
  if (spam) {
    console.warn("[nominate] dropped spam submission", {
      reason,
      email: nominatorEmail,
    });
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
    nominee_location: nomineeLocation,
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

  await sendFormNotification(
    "nominate",
    notifyNominate({
      nomineeName,
      nomineeTitle,
      nomineeLocation,
      nominatorName,
      nominatorEmail,
      relationship,
      link,
      idea,
    }),
  );
  await sendConfirmationEmail(
    nominatorEmail,
    confirmNominate({ nominatorName, nomineeName, nomineeTitle, idea }),
  );

  return NextResponse.redirect(new URL("/thanks?source=nominate", req.url), 303);
}

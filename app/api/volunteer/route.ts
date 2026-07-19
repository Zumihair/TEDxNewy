import { type NextRequest, NextResponse } from "next/server";
import { getSupabase, clientMeta } from "@/lib/supabase";
import { checkSubmission } from "@/lib/anti-spam";
import {
  sendConfirmationEmail,
  sendFormNotification,
} from "@/lib/email-notify";
import { confirmApply, notifyApply } from "@/lib/email-templates";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const data = Object.fromEntries(
    new URLSearchParams(await req.text()),
  ) as Record<string, string>;

  const firstName = String(data.firstName ?? "").trim();
  const lastName = String(data.lastName ?? "").trim();
  const email = String(data.email ?? "").trim().toLowerCase();
  const phone = String(data.phone ?? "").trim() || null;
  const location = String(data.location ?? "").trim() || null;
  const availability = String(data.availability ?? "").trim();
  const note = String(data.note ?? "").trim() || null;

  if (!firstName || !lastName || !email || !availability) {
    return NextResponse.redirect(
      new URL("/thanks?status=error&source=apply", req.url),
      303,
    );
  }

  // Bot filter: on a hit, skip the insert + emails and send the visitor to a
  // clear error page. Genuine people caught by mistake get a "try again / email
  // us" prompt (and their address is logged below) rather than silently
  // vanishing; bots just see an error.
  const { spam, reason } = checkSubmission(req, data, {
    textFields: ["firstName", "lastName"],
  });
  if (spam) {
    console.warn("[apply] dropped spam submission", { reason, email });
    return NextResponse.redirect(
      new URL("/thanks?status=error&source=apply", req.url),
      303,
    );
  }

  const supabase = getSupabase();
  const { ua, ip } = clientMeta(req);
  const { error } = await supabase.from("applications").insert({
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    location,
    availability,
    note,
    user_agent: ua,
    ip,
  });

  if (error) {
    console.error("[apply] supabase error", error);
    return NextResponse.redirect(
      new URL("/thanks?status=error&source=apply", req.url),
      303,
    );
  }

  await sendFormNotification(
    "apply",
    notifyApply({ firstName, lastName, email, phone, location, availability, note }),
  );
  await sendConfirmationEmail(
    email,
    confirmApply({ firstName, lastName, availability }),
  );

  return NextResponse.redirect(new URL("/thanks?source=apply", req.url), 303);
}

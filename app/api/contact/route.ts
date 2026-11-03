import { type NextRequest, NextResponse } from "next/server";
import { getSupabase, clientMeta } from "@/lib/supabase";
import { checkSubmission } from "@/lib/anti-spam";
import {
  sendConfirmationEmail,
  sendFormNotification,
} from "@/lib/email-notify";
import { confirmContact, notifyContact } from "@/lib/email-templates";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const data = Object.fromEntries(
    new URLSearchParams(await req.text()),
  ) as Record<string, string>;

  const firstName = String(data.firstName ?? "").trim();
  const lastName = String(data.lastName ?? "").trim() || null;
  const email = String(data.email ?? "").trim().toLowerCase();
  const phone = String(data.phone ?? "").trim() || null;
  const message = String(data.message ?? "").trim();

  if (!firstName || !email || !message) {
    return NextResponse.redirect(
      new URL("/contact?status=error", req.url),
      303,
    );
  }

  // Bot filter. The public form (SubmitLockForm) injects the honeypot +
  // timing fields, so all four layers apply; each tolerates its own absence.
  const { spam, reason } = checkSubmission(req, data, {
    textFields: ["message"],
    requireTimer: true,
  });
  if (spam) {
    console.warn("[contact] dropped spam submission", { reason, email });
    // Pretend success so a bot gets no signal to adapt to.
    return NextResponse.redirect(new URL("/thanks?source=contact", req.url), 303);
  }

  const supabase = getSupabase();

  // Site-wide flood brake: bots rotate IPs, so cap total volume instead.
  const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("contact_messages")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since);
  if ((count ?? 0) >= 8) {
    console.warn("[contact] flood brake tripped", { count, email });
    return NextResponse.redirect(new URL("/thanks?source=contact", req.url), 303);
  }

  const { ua, ip } = clientMeta(req);
  const { error } = await supabase.from("contact_messages").insert({
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    message,
    user_agent: ua,
    ip,
  });

  if (error) {
    console.error("[contact] supabase error", error);
    return NextResponse.redirect(
      new URL("/contact?status=error", req.url),
      303,
    );
  }

  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  await sendFormNotification(
    "contact",
    notifyContact({ fullName, email, phone, message }),
  );
  await sendConfirmationEmail(
    email,
    confirmContact({ fullName, email, phone, message }),
  );

  return NextResponse.redirect(new URL("/thanks?source=contact", req.url), 303);
}

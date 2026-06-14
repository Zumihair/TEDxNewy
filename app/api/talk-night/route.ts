import { type NextRequest, NextResponse } from "next/server";
import { getSupabase, clientMeta } from "@/lib/supabase";
import {
  sendConfirmationEmail,
  sendFormNotification,
} from "@/lib/email-notify";
import { confirmTalkNight, notifyTalkNight } from "@/lib/email-templates";

export const runtime = "nodejs";

const ERROR_REDIRECT = "/60-second-talk-night?status=error#register";
const SUCCESS_REDIRECT = "/thanks?source=talk-night";

const ATTENDANCE_TYPES = new Set(["speak", "attend", "both"]);

export async function POST(req: NextRequest) {
  const data = Object.fromEntries(
    new URLSearchParams(await req.text()),
  ) as Record<string, string>;

  const fullName = String(data.fullName ?? "").trim();
  const email = String(data.email ?? "").trim().toLowerCase();
  const phone = String(data.phone ?? "").trim() || null;
  // The form's select submits the visible label ("Speak" / "Attend" /
  // "Both"); lowercasing maps it onto the stored enum.
  const attendanceType = String(data.attendanceType ?? "")
    .trim()
    .toLowerCase();
  const idea = String(data.idea ?? "").trim() || null;
  const comments = String(data.comments ?? "").trim() || null;
  const marketingConsent =
    data.marketingConsent === "on" || data.marketingConsent === "true";

  const valid =
    fullName &&
    email &&
    email.includes("@") &&
    ATTENDANCE_TYPES.has(attendanceType);

  if (!valid) {
    return NextResponse.redirect(new URL(ERROR_REDIRECT, req.url), 303);
  }

  const supabase = getSupabase();
  const { ua, ip } = clientMeta(req);
  const { error } = await supabase.from("talk_night_registrations").insert({
    full_name: fullName,
    email,
    phone,
    attendance_type: attendanceType,
    idea,
    comments,
    marketing_consent: marketingConsent,
    user_agent: ua,
    ip,
  });

  if (error) {
    console.error("[talk-night] supabase insert error", error);
    return NextResponse.redirect(new URL(ERROR_REDIRECT, req.url), 303);
  }

  // 1. Notify admins. The helper swallows its own errors, so the redirect
  //    still happens if email is misconfigured.
  await sendFormNotification(
    "talk-night",
    notifyTalkNight({
      fullName,
      email,
      phone,
      attendanceType,
      idea,
      comments,
    }),
  );

  // 2. Confirmation back to the person who registered.
  await sendConfirmationEmail(
    email,
    confirmTalkNight({ fullName, attendanceType }),
  );

  return NextResponse.redirect(new URL(SUCCESS_REDIRECT, req.url), 303);
}

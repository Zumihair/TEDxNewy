import { type NextRequest, NextResponse } from "next/server";
import { getSupabase, clientMeta } from "@/lib/supabase";
import { checkSubmission } from "@/lib/anti-spam";
import {
  sendConfirmationEmail,
  sendFormNotification,
} from "@/lib/email-notify";
import { confirmTalkNight, notifyTalkNight } from "@/lib/email-templates";

export const runtime = "nodejs";

const ERROR_REDIRECT = "/60-second-talk-night?status=error#register";
const SUCCESS_REDIRECT = "/thanks?source=talk-night";

const ATTENDANCE_TYPES = new Set(["speak", "listen"]);

export async function POST(req: NextRequest) {
  const data = Object.fromEntries(
    new URLSearchParams(await req.text()),
  ) as Record<string, string>;

  const fullName = String(data.fullName ?? "").trim();
  const email = String(data.email ?? "").trim().toLowerCase();
  const phone = String(data.phone ?? "").trim() || null;
  const attendanceType = String(data.attendanceType ?? "").trim().toLowerCase();
  const idea = String(data.idea ?? "").trim() || null;
  const reason = String(data.reason ?? "").trim() || null;
  const marketingConsent =
    data.marketingConsent === "on" || data.marketingConsent === "true";

  // Optional +1 guest. Only treated as present if a name came through.
  const guestName = String(data.guestName ?? "").trim() || null;
  const guestEmail = String(data.guestEmail ?? "").trim().toLowerCase() || null;
  const guestAttendanceTypeRaw = String(data.guestAttendanceType ?? "")
    .trim()
    .toLowerCase();
  const guestIdea = String(data.guestIdea ?? "").trim() || null;
  const guestReason = String(data.guestReason ?? "").trim() || null;
  const hasGuest = Boolean(guestName);
  const guestAttendanceType =
    hasGuest && ATTENDANCE_TYPES.has(guestAttendanceTypeRaw)
      ? guestAttendanceTypeRaw
      : null;

  const valid =
    fullName &&
    email &&
    email.includes("@") &&
    ATTENDANCE_TYPES.has(attendanceType) &&
    // The follow-up answer for the chosen path is required.
    (attendanceType === "speak" ? !!idea : !!reason) &&
    // If a guest is named, their attendance choice + follow-up are required.
    (!hasGuest ||
      (guestAttendanceType &&
        (guestAttendanceType === "speak" ? !!guestIdea : !!guestReason)));

  if (!valid) {
    return NextResponse.redirect(new URL(ERROR_REDIRECT, req.url), 303);
  }

  // Bot filter. This form uses SubmitLockForm, so honeypot + timing are
  // present, but every check tolerates its own absence, so the call stays
  // safe even if a field is missing: it rejects only on a real signal
  // (filled honeypot, foreign origin, instant submit, or a link in the free
  // text). Link-trap scans the idea/reason/guest narrative fields.
  const { spam, reason: spamReason } = checkSubmission(req, data, {
    textFields: ["idea", "reason", "guestIdea", "guestReason"],
  });
  if (spam) {
    console.warn("[talk-night] dropped spam submission", {
      reason: spamReason,
      email,
    });
    return NextResponse.redirect(new URL(ERROR_REDIRECT, req.url), 303);
  }

  const supabase = getSupabase();
  const { ua, ip } = clientMeta(req);
  const { error } = await supabase.from("talk_night_registrations").insert({
    full_name: fullName,
    email,
    phone,
    attendance_type: attendanceType,
    idea: attendanceType === "speak" ? idea : null,
    reason: attendanceType === "listen" ? reason : null,
    guest_name: guestName,
    guest_email: guestEmail,
    guest_attendance_type: guestAttendanceType,
    guest_idea: guestAttendanceType === "speak" ? guestIdea : null,
    guest_reason: guestAttendanceType === "listen" ? guestReason : null,
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
      reason,
      guestName,
      guestEmail,
      guestAttendanceType,
      guestIdea,
      guestReason,
    }),
  );

  // 2. Confirmation back to the person who registered.
  await sendConfirmationEmail(
    email,
    confirmTalkNight({ fullName, attendanceType, guestName }),
  );

  return NextResponse.redirect(new URL(SUCCESS_REDIRECT, req.url), 303);
}

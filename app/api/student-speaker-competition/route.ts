import { type NextRequest, NextResponse } from "next/server";
import { getSupabase, clientMeta } from "@/lib/supabase";
import { checkSubmission } from "@/lib/anti-spam";
import {
  sendConfirmationEmail,
  sendFormNotification,
} from "@/lib/email-notify";
import {
  confirmStudentSpeaker,
  notifyStudentSpeaker,
} from "@/lib/email-templates";

export const runtime = "nodejs";

const ERROR_REDIRECT =
  "/student-speaker-competition?status=error#submit";
const SUCCESS_REDIRECT = "/thanks?source=student-speaker";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isLikelyUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const data = Object.fromEntries(
    new URLSearchParams(await req.text()),
  ) as Record<string, string>;

  const fullName = String(data.fullName ?? "").trim();
  const email = String(data.email ?? "").trim().toLowerCase();
  const phone = String(data.phone ?? "").trim();
  const school = String(data.school ?? "").trim();
  const postCode = String(data.postCode ?? "").trim();
  const city = String(data.city ?? "").trim();
  const talkTitle = String(data.talkTitle ?? "").trim();
  const videoUrl = String(data.videoUrl ?? "").trim();

  const valid =
    fullName &&
    email &&
    EMAIL_RE.test(email) &&
    phone &&
    school &&
    postCode &&
    city &&
    talkTitle &&
    videoUrl &&
    isLikelyUrl(videoUrl);

  if (!valid) {
    return NextResponse.redirect(new URL(ERROR_REDIRECT, req.url), 303);
  }

  // Bot filter. This form uses SubmitLockForm, so honeypot + timing are
  // present, but every check tolerates its own absence, so the call rejects
  // only on a real signal. Link-trap scans the talk title; the videoUrl field
  // is a legitimate URL, so it is deliberately not scanned.
  const { spam, reason: spamReason } = checkSubmission(req, data, {
    textFields: ["talkTitle"],
  });
  if (spam) {
    console.warn("[student-speaker-competition] dropped spam submission", {
      reason: spamReason,
      email,
    });
    return NextResponse.redirect(new URL(ERROR_REDIRECT, req.url), 303);
  }

  const supabase = getSupabase();
  const { ua, ip } = clientMeta(req);
  const { error } = await supabase
    .from("student_speaker_submissions")
    .insert({
      full_name: fullName,
      email,
      phone,
      school,
      post_code: postCode,
      city,
      talk_title: talkTitle,
      video_url: videoUrl,
      user_agent: ua,
      ip,
    });

  if (error) {
    console.error("[student-speaker-competition] supabase insert error", error);
    return NextResponse.redirect(new URL(ERROR_REDIRECT, req.url), 303);
  }

  // 1. Notify admins.
  await sendFormNotification(
    "student-speaker",
    notifyStudentSpeaker({
      fullName,
      email,
      phone,
      school,
      postCode,
      city,
      talkTitle,
      videoUrl,
    }),
  );

  // 2. Confirmation email to the student.
  await sendConfirmationEmail(
    email,
    confirmStudentSpeaker({ fullName, talkTitle, school }),
  );

  return NextResponse.redirect(new URL(SUCCESS_REDIRECT, req.url), 303);
}

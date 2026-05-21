import { type NextRequest, NextResponse } from "next/server";
import { getSupabase, clientMeta } from "@/lib/supabase";
import {
  sendConfirmationEmail,
  sendFormNotification,
} from "@/lib/email-notify";

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
  await sendFormNotification("student-speaker", {
    subject: `New Student Speaker entry — ${fullName} (${school})`,
    text: [
      `New 2026 Student Speaker Competition entry`,
      ``,
      `Name:        ${fullName}`,
      `Email:       ${email}`,
      `Phone:       ${phone}`,
      `School:      ${school}`,
      `Postcode:    ${postCode}`,
      `City:        ${city}`,
      `Talk title:  ${talkTitle}`,
      `Video link:  ${videoUrl}`,
      ``,
      `View all entries: https://tedxnewy.vercel.app/admin/student-speaker-competition`,
    ].join("\n"),
  });

  // 2. Confirmation email to the student.
  await sendConfirmationEmail(email, {
    subject: "Your Student Speaker entry — TEDxNewy",
    text: buildStudentConfirmationText({ fullName, talkTitle, school }),
    html: buildStudentConfirmationHtml({ fullName, talkTitle, school }),
  });

  return NextResponse.redirect(new URL(SUCCESS_REDIRECT, req.url), 303);
}

type ConfirmationData = {
  fullName: string;
  talkTitle: string;
  school: string;
};

function buildStudentConfirmationText(d: ConfirmationData): string {
  return [
    `Hi ${firstName(d.fullName)},`,
    ``,
    `Thanks for entering the 2026 TEDxNewy Student Speaker Competition. Your talk "${d.talkTitle}" is in — we'll be in touch as judging progresses.`,
    ``,
    `What you submitted:`,
    `  · Name:        ${d.fullName}`,
    `  · School:      ${d.school}`,
    `  · Talk title:  ${d.talkTitle}`,
    ``,
    `What happens next:`,
    `  · Entries close 15 August 2026.`,
    `  · Our team reviews every submission. Finalists hear back by email.`,
    `  · Finalists may be invited to deliver their talk at TEDxNewy 2026 in front of a live audience.`,
    ``,
    `If you need to update your entry or have questions, reply to this email or write to activations@tedxnewy.com.au.`,
    ``,
    `Good luck — we can't wait to hear your idea.`,
    `— The TEDxNewy team`,
  ].join("\n");
}

function buildStudentConfirmationHtml(d: ConfirmationData): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4efe6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#141210">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px">
    <div style="background:#e02214;color:#ffffff;border-radius:24px;padding:24px 28px;text-align:left">
      <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;font-weight:600;letter-spacing:0.24em;text-transform:uppercase;color:rgba(255,255,255,0.85)">
        2026 Student Speaker Competition
      </div>
      <div style="margin-top:10px;font-size:24px;line-height:1.15;font-weight:500">
        Entry received — thanks ${esc(firstName(d.fullName))}.
      </div>
    </div>

    <div style="background:#ffffff;border-radius:16px;padding:24px 28px;margin-top:18px;line-height:1.6;font-size:15px;color:#2a2521">
      <p style="margin:0">
        Thanks for entering the 2026 TEDxNewy Student Speaker Competition. Your talk &ldquo;<strong>${esc(d.talkTitle)}</strong>&rdquo; is in — we&rsquo;ll be in touch as judging progresses.
      </p>

      <h2 style="margin:22px 0 8px;font-size:11px;font-family:ui-monospace,Menlo,monospace;font-weight:600;letter-spacing:0.24em;text-transform:uppercase;color:#e02214">
        What you submitted
      </h2>
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;color:#141210">
        <tr><td style="padding:3px 18px 3px 0;color:#6b6459;width:140px">Name</td><td>${esc(d.fullName)}</td></tr>
        <tr><td style="padding:3px 18px 3px 0;color:#6b6459">School</td><td>${esc(d.school)}</td></tr>
        <tr><td style="padding:3px 18px 3px 0;color:#6b6459">Talk title</td><td>${esc(d.talkTitle)}</td></tr>
      </table>

      <h2 style="margin:24px 0 8px;font-size:11px;font-family:ui-monospace,Menlo,monospace;font-weight:600;letter-spacing:0.24em;text-transform:uppercase;color:#e02214">
        What happens next
      </h2>
      <ul style="margin:0;padding-left:20px">
        <li>Entries close <strong>15 August 2026</strong>.</li>
        <li>Our team reviews every submission. Finalists hear back by email.</li>
        <li>Finalists may be invited to deliver their talk at TEDxNewy 2026 in front of a live audience.</li>
      </ul>
    </div>

    <div style="margin-top:18px;padding:0 8px;font-size:13px;line-height:1.55;color:#6b6459;text-align:center">
      Questions or need to update your entry? Reply to this email or write to <a href="mailto:activations@tedxnewy.com.au" style="color:#e02214;text-decoration:none">activations@tedxnewy.com.au</a>.
      <div style="margin-top:14px;font-size:12px;color:#8a8278">— The TEDxNewy team · Got an idea worth sharing? This is your stage.</div>
    </div>
  </div>
</body></html>`;
}

function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] ?? "there";
}

import { type NextRequest, NextResponse } from "next/server";
import { getSupabase, clientMeta } from "@/lib/supabase";
import {
  sendConfirmationEmail,
  sendFormNotification,
} from "@/lib/email-notify";

export const runtime = "nodejs";

const ERROR_REDIRECT = "/youth-futures-lab?status=error#register";
const SUCCESS_REDIRECT = "/thanks?source=youth-futures";

export async function POST(req: NextRequest) {
  const data = Object.fromEntries(
    new URLSearchParams(await req.text()),
  ) as Record<string, string>;

  const schoolName = String(data.schoolName ?? "").trim();
  const suburb = String(data.suburb ?? "").trim();
  const contactName = String(data.contactName ?? "").trim();
  const contactRole = String(data.contactRole ?? "").trim();
  const email = String(data.email ?? "").trim().toLowerCase();
  const phone = String(data.phone ?? "").trim();
  const studentCountRaw = String(data.studentCount ?? "").trim();
  const yearLevels = String(data.yearLevels ?? "").trim();
  const comments = String(data.comments ?? "").trim() || null;
  const marketingConsent = data.marketingConsent === "on" || data.marketingConsent === "true";
  const schoolAuthorised =
    data.schoolAuthorised === "on" || data.schoolAuthorised === "true";

  const studentCount = Number.parseInt(studentCountRaw, 10);

  const valid =
    schoolName &&
    suburb &&
    contactName &&
    contactRole &&
    email &&
    phone &&
    Number.isFinite(studentCount) &&
    studentCount >= 1 &&
    studentCount <= 30 &&
    yearLevels &&
    schoolAuthorised;

  if (!valid) {
    return NextResponse.redirect(new URL(ERROR_REDIRECT, req.url), 303);
  }

  const supabase = getSupabase();
  const { ua, ip } = clientMeta(req);
  const { error } = await supabase.from("youth_futures_registrations").insert({
    school_name: schoolName,
    suburb,
    contact_name: contactName,
    contact_role: contactRole,
    email,
    phone,
    student_count: studentCount,
    year_levels: yearLevels,
    comments,
    marketing_consent: marketingConsent,
    school_authorised: schoolAuthorised,
    user_agent: ua,
    ip,
  });

  if (error) {
    console.error("[youth-futures] supabase insert error", error);
    return NextResponse.redirect(new URL(ERROR_REDIRECT, req.url), 303);
  }

  // 1. Notify admins. We await but the helper swallows its own errors,
  //    so the redirect still happens if email is misconfigured.
  await sendFormNotification("youth-futures", {
    subject: `New Youth Futures Lab EOI — ${schoolName}`,
    text: [
      `New Youth Futures Lab expression of interest`,
      ``,
      `School:        ${schoolName}`,
      `Suburb:        ${suburb}`,
      `Contact:       ${contactName} (${contactRole})`,
      `Email:         ${email}`,
      `Phone:         ${phone}`,
      `Students:      ${studentCount}`,
      `Year levels:   ${yearLevels}`,
      `Marketing OK:  ${marketingConsent ? "yes" : "no"}`,
      ``,
      comments ? `Comments:\n${comments}` : `Comments:      (none)`,
      ``,
      `View all registrations: https://tedxnewy.vercel.app/admin/youth-futures`,
    ].join("\n"),
  });

  // 2. Send a confirmation email back to the school's contact.
  await sendConfirmationEmail(email, {
    subject: "Your Youth Futures Lab EOI — TEDxNewy",
    text: buildSchoolConfirmationText({
      contactName,
      schoolName,
      studentCount,
      yearLevels,
    }),
    html: buildSchoolConfirmationHtml({
      contactName,
      schoolName,
      studentCount,
      yearLevels,
    }),
  });

  return NextResponse.redirect(new URL(SUCCESS_REDIRECT, req.url), 303);
}

type ConfirmationData = {
  contactName: string;
  schoolName: string;
  studentCount: number;
  yearLevels: string;
};

function buildSchoolConfirmationText(d: ConfirmationData): string {
  return [
    `Hi ${firstName(d.contactName)},`,
    ``,
    `Thanks for registering ${d.schoolName} for the 2026 Youth Futures Lab. We've received your expression of interest and one of our team will confirm acceptance within 1 business day.`,
    ``,
    `Here's what you submitted:`,
    `  · School:        ${d.schoolName}`,
    `  · Students:      ${d.studentCount}`,
    `  · Year levels:   ${d.yearLevels}`,
    ``,
    `Event details (a reminder):`,
    `  · Wednesday, 5 August 2026, 9:30 am – 2:30 pm`,
    `  · University of Newcastle — NUspace City Campus, Room X-101`,
    `  · Free for selected schools`,
    `  · Note: morning tea and lunch are not provided — students bring their own food or use the university cafe.`,
    ``,
    `Spaces are limited and to ensure a diversity of ideas, preference is given to a diverse spread of school applicants. We'll be in touch shortly.`,
    ``,
    `If you have any questions in the meantime, reply to this email or write to activations@tedxnewy.com.au.`,
    ``,
    `Empowering young voices to lead what's next.`,
    `— The TEDxNewy team`,
  ].join("\n");
}

function buildSchoolConfirmationHtml(d: ConfirmationData): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4efe6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#141210">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px">
    <div style="background:#e02214;color:#ffffff;border-radius:24px;padding:24px 28px;text-align:left">
      <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;font-weight:600;letter-spacing:0.24em;text-transform:uppercase;color:rgba(255,255,255,0.85)">
        2026 Youth Futures Lab
      </div>
      <div style="margin-top:10px;font-size:24px;line-height:1.15;font-weight:500">
        EOI received — thanks ${esc(firstName(d.contactName))}.
      </div>
    </div>

    <div style="background:#ffffff;border-radius:16px;padding:24px 28px;margin-top:18px;line-height:1.6;font-size:15px;color:#2a2521">
      <p style="margin:0">
        Thanks for registering <strong>${esc(d.schoolName)}</strong> for the 2026 Youth Futures Lab. We've received your expression of interest and one of our team will confirm acceptance within <strong>1 business day</strong>.
      </p>

      <h2 style="margin:22px 0 8px;font-size:11px;font-family:ui-monospace,Menlo,monospace;font-weight:600;letter-spacing:0.24em;text-transform:uppercase;color:#e02214">
        What you submitted
      </h2>
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;color:#141210">
        <tr><td style="padding:3px 18px 3px 0;color:#6b6459;width:140px">School</td><td>${esc(d.schoolName)}</td></tr>
        <tr><td style="padding:3px 18px 3px 0;color:#6b6459">Students</td><td>${d.studentCount}</td></tr>
        <tr><td style="padding:3px 18px 3px 0;color:#6b6459">Year levels</td><td>${esc(d.yearLevels)}</td></tr>
      </table>

      <h2 style="margin:24px 0 8px;font-size:11px;font-family:ui-monospace,Menlo,monospace;font-weight:600;letter-spacing:0.24em;text-transform:uppercase;color:#e02214">
        Event details
      </h2>
      <ul style="margin:0;padding-left:20px">
        <li><strong>Wednesday, 5 August 2026</strong>, 9:30 am – 2:30 pm</li>
        <li>University of Newcastle — NUspace City Campus, Room X-101</li>
        <li>Free for selected schools</li>
        <li style="margin-top:6px;color:#6b6459">Note: morning tea and lunch are not provided. Students are encouraged to bring their own food or use the university cafe on campus.</li>
      </ul>

      <p style="margin:22px 0 0;font-size:13.5px;color:#6b6459">
        Spaces are limited and to ensure a diversity of ideas, preference is given to a diverse spread of school applicants. We'll be in touch shortly.
      </p>
    </div>

    <div style="margin-top:18px;padding:0 8px;font-size:13px;line-height:1.55;color:#6b6459;text-align:center">
      Questions? Reply to this email or write to <a href="mailto:activations@tedxnewy.com.au" style="color:#e02214;text-decoration:none">activations@tedxnewy.com.au</a>.
      <div style="margin-top:14px;font-size:12px;color:#8a8278">— The TEDxNewy team · Empowering young voices to lead what's next.</div>
    </div>
  </div>
</body></html>`;
}

function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] ?? "there";
}

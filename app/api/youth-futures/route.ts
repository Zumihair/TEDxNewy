import { type NextRequest, NextResponse } from "next/server";
import { getSupabase, clientMeta } from "@/lib/supabase";
import {
  sendConfirmationEmail,
  sendFormNotification,
} from "@/lib/email-notify";
import {
  confirmYouthFutures,
  notifyYouthFutures,
} from "@/lib/email-templates";

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
  await sendFormNotification(
    "youth-futures",
    notifyYouthFutures({
      schoolName,
      suburb,
      contactName,
      contactRole,
      email,
      phone,
      studentCount,
      yearLevels,
      marketingConsent,
      comments,
    }),
  );

  // 2. Send a confirmation email back to the school's contact.
  await sendConfirmationEmail(
    email,
    confirmYouthFutures({ contactName, schoolName, studentCount, yearLevels }),
  );

  return NextResponse.redirect(new URL(SUCCESS_REDIRECT, req.url), 303);
}

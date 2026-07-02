"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/cms-auth";
import { getResendFrom, sendBulkEmail } from "@/lib/email-notify";
import { composeEmail } from "@/lib/email-templates";
import { getServerSupabase } from "@/lib/supabase-server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Compose + send a one-off email from the admin, wrapped in the standard
 * branded shell. Recipients can be comma- or space-separated. Email only
 * actually leaves the building if RESEND_API_KEY is set (otherwise we flag
 * that case back to the UI).
 *
 * Every send is recorded in `email_sends` (one row per recipient) so the
 * result is visible in the admin history — who it went to and whether Resend
 * accepted it — without needing the Resend dashboard.
 */
export async function sendComposedEmail(formData: FormData) {
  await requireAdmin();

  const toRaw = String(formData.get("to") ?? "").trim();
  const ccRaw = String(formData.get("cc") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const heading = String(formData.get("heading") ?? "").trim();
  const eyebrow = String(formData.get("eyebrow") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  const parse = (raw: string) =>
    raw
      .split(/[\s,;]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

  const recipients = parse(toRaw);
  const cc = parse(ccRaw);

  const toValid =
    recipients.length > 0 && recipients.every((e) => EMAIL_RE.test(e));
  // Cc is optional, but if present every address must be valid.
  const ccValid = cc.every((e) => EMAIL_RE.test(e));

  if (!toValid || !ccValid || !subject || !body) {
    redirect("/admin/emails?error=invalid#compose");
  }

  if (!process.env.RESEND_API_KEY) {
    redirect("/admin/emails?error=no-key#compose");
  }

  const content = composeEmail({ subject, heading, eyebrow, body });

  // Each recipient gets their own email (so they never see one another),
  // sent in one batched request to stay under Resend's rate limit.
  const results = await sendBulkEmail(recipients, content, cc);

  // Record the send in the admin-visible history. Best-effort: a logging
  // failure must not throw away the fact that mail went out.
  const batchId = randomUUID();
  const from = getResendFrom();
  const ccJoined = cc.length ? cc.join(", ") : null;
  try {
    const supabase = await getServerSupabase();
    await supabase.from("email_sends").insert(
      results.map((r) => ({
        batch_id: batchId,
        from_email: from,
        to_email: r.to,
        cc: ccJoined,
        subject,
        body,
        status: r.ok ? "sent" : "failed",
        error: r.error ?? null,
        resend_id: r.id ?? null,
      })),
    );
  } catch (err) {
    console.error("[emails] failed to record send history", err);
  }

  const sent = results.filter((r) => r.ok).length;
  const failed = results.length - sent;
  redirect(
    `/admin/emails?sent=${sent}${failed ? `&failed=${failed}` : ""}#compose`,
  );
}

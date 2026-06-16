"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/cms-auth";
import { sendConfirmationEmail } from "@/lib/email-notify";
import { composeEmail } from "@/lib/email-templates";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Compose + send a one-off email from the admin, wrapped in the standard
 * branded shell. Recipients can be comma- or space-separated. Email only
 * actually leaves the building if RESEND_API_KEY is set (otherwise the
 * notify helper just logs), so we flag that case back to the UI.
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

  // Each recipient gets their own email (so they don't see each other). The
  // Cc is attached to just the first send, so the sender receives a single
  // copy rather than one per recipient.
  for (let i = 0; i < recipients.length; i++) {
    await sendConfirmationEmail(
      recipients[i],
      content,
      i === 0 ? cc : undefined,
    );
  }

  redirect(`/admin/emails?sent=${recipients.length}#compose`);
}

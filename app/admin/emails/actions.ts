"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/cms-auth";
import { getResendFrom, sendBulkEmail } from "@/lib/email-notify";
import { validateBlocks } from "@/lib/newsletter-blocks";
import { renderNewsletter } from "@/lib/newsletter-render";
import { getServerSupabase } from "@/lib/supabase-server";
import { getAudienceEmails } from "./audiences";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Fetch one saved audience's email list on demand. The Compose page loads only
 * counts up front; this runs when a chip is clicked so the whole recipient list
 * of every table is never read just to open the page.
 */
export async function fetchAudienceEmails(id: string): Promise<string[]> {
  await requireAdmin();
  return getAudienceEmails(id);
}

/**
 * Render the compose message for the preview pop-up: the same block builder the
 * newsletter uses, wrapped in the branded shell. No unsubscribe footer, since
 * these are one-off ad-hoc sends with no unsubscribe token, and no preheader.
 */
export async function previewCompose(data: {
  subject: string;
  blocks: unknown;
}): Promise<string> {
  await requireAdmin();
  const { html } = await renderNewsletter(
    { subject: data.subject, preheader: "", blocks: data.blocks },
    { sendDate: new Date() },
  );
  return html;
}

/**
 * Compose + send a one-off email from the admin, built with the same block
 * builder as the newsletter and wrapped in the standard branded shell.
 * Recipients can be comma- or space-separated. Email only actually leaves the
 * building if RESEND_API_KEY is set (otherwise we flag that case back to the
 * UI).
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

  // Blocks arrive as a JSON string in a hidden input. validateBlocks is the
  // server-side trust boundary: it drops anything malformed rather than
  // throwing, so a tampered payload can never crash the render or send.
  let parsedBlocks: unknown = [];
  try {
    parsedBlocks = JSON.parse(String(formData.get("blocks") ?? "[]"));
  } catch {
    parsedBlocks = [];
  }
  const blocks = validateBlocks(parsedBlocks);

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

  if (!toValid || !ccValid || !subject || blocks.length === 0) {
    redirect("/admin/emails?error=invalid#compose");
  }

  if (!process.env.RESEND_API_KEY) {
    redirect("/admin/emails?error=no-key#compose");
  }

  // Render once (same body to everyone) via the shared newsletter renderer,
  // with no unsubscribe footer.
  const { html, text: bodyText } = await renderNewsletter(
    { subject, preheader: "", blocks },
    { sendDate: new Date() },
  );

  // Each recipient gets their own email (so they never see one another),
  // sent in one batched request to stay under Resend's rate limit.
  const results = await sendBulkEmail(
    recipients,
    { subject, text: bodyText, html },
    cc,
  );

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
        body: bodyText,
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

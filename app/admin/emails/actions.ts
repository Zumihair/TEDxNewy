"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/cms-auth";
import { getResendFrom, sendBulkEmail, sendBccEmail } from "@/lib/email-notify";
import {
  validateBlocks,
  type PreviewScheme,
} from "@/lib/newsletter-blocks";
import { renderNewsletter } from "@/lib/newsletter-render";
import { getServerSupabase } from "@/lib/supabase-server";
import { getAudienceEmails } from "./audiences";
import type { SavedTemplate } from "./templates";

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
export async function previewCompose(
  data: {
    subject: string;
    blocks: unknown;
  },
  /** Pins the preview to one colour scheme. Preview only: the send below
   *  leaves it off so each reader's own device decides. */
  scheme?: PreviewScheme,
): Promise<string> {
  await requireAdmin();
  const { html } = await renderNewsletter(
    { subject: data.subject, preheader: "", blocks: data.blocks },
    { sendDate: new Date(), previewScheme: scheme },
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
  const { email: sentBy } = await requireAdmin();

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
  // BCC mode: one email to the whole group, recipients hidden, sender copied
  // once. No per-recipient personalisation (Quick Compose has none anyway).
  const bccMode = String(formData.get("bccMode") ?? "") === "on";

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

  // BCC mode sends a single email with everyone hidden in Bcc (sender cc'd
  // once); otherwise each recipient gets their own email so they never see one
  // another. Both stay under Resend's rate limit and report per recipient.
  const results = bccMode
    ? await sendBccEmail(recipients, { subject, text: bodyText, html }, cc)
    : await sendBulkEmail(recipients, { subject, text: bodyText, html }, cc);

  // Record the send in the admin-visible history. Best-effort: a logging
  // failure must not throw away the fact that mail went out.
  const batchId = randomUUID();
  const from = getResendFrom();
  const ccJoined = cc.length ? cc.join(", ") : null;
  try {
    const supabase = await getServerSupabase();
    const baseRows = results.map((r) => ({
      batch_id: batchId,
      from_email: from,
      to_email: r.to,
      cc: ccJoined,
      subject,
      body: bodyText,
      status: r.ok ? "sent" : "failed",
      error: r.error ?? null,
      resend_id: r.id ?? null,
    }));
    const { error: insErr } = await supabase
      .from("email_sends")
      .insert(baseRows.map((row) => ({ ...row, sent_by: sentBy })));
    // If the sent_by column isn't there yet (attribution migration pending),
    // the insert is rejected as a unit. Retry without it so the send is still
    // recorded; attribution simply stays blank until the column exists.
    if (insErr) {
      await supabase.from("email_sends").insert(baseRows);
    }
  } catch (err) {
    console.error("[emails] failed to record send history", err);
  }

  const sent = results.filter((r) => r.ok).length;
  const failed = results.length - sent;
  redirect(
    `/admin/emails?sent=${sent}${failed ? `&failed=${failed}` : ""}#compose`,
  );
}

/**
 * Save the current Compose message (subject + blocks) as a reusable template.
 * Called directly from the client with the live editor state, so it returns a
 * result the UI can fold into its dropdown rather than redirecting.
 */
export async function saveComposeTemplate(input: {
  label: string;
  subject: string;
  blocks: unknown;
}): Promise<{ ok: boolean; error?: string; template?: SavedTemplate }> {
  const { email: createdBy } = await requireAdmin();

  const label = String(input.label ?? "").trim();
  const subject = String(input.subject ?? "").trim();
  const blocks = validateBlocks(input.blocks);

  if (!label) return { ok: false, error: "Give the template a name." };
  if (blocks.length === 0) {
    return { ok: false, error: "Add a message before saving a template." };
  }

  try {
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from("compose_templates")
      .insert({ label, subject, blocks, created_by: createdBy })
      .select("id")
      .single();
    if (error || !data) {
      console.error("[emails] save template failed", error);
      return { ok: false, error: "Couldn't save the template." };
    }
    revalidatePath("/admin/emails");
    return { ok: true, template: { id: data.id as string, label, subject, blocks } };
  } catch (err) {
    console.error("[emails] save template threw", err);
    return { ok: false, error: "Couldn't save the template." };
  }
}

/** Delete a saved template by id. Returns success so the UI can update. */
export async function deleteComposeTemplate(
  id: string,
): Promise<{ ok: boolean }> {
  await requireAdmin();
  if (!id) return { ok: false };
  try {
    const supabase = await getServerSupabase();
    const { error } = await supabase
      .from("compose_templates")
      .delete()
      .eq("id", id);
    if (error) {
      console.error("[emails] delete template failed", error);
      return { ok: false };
    }
    revalidatePath("/admin/emails");
    return { ok: true };
  } catch (err) {
    console.error("[emails] delete template threw", err);
    return { ok: false };
  }
}

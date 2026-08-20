"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { sendBulkEmail, getResendFrom } from "@/lib/email-notify";
import { renderNewsletter } from "@/lib/newsletter-render";
import type { NewsletterBlock } from "@/lib/newsletter-blocks";
import { MEDIA_STATUSES } from "@/lib/media";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PATH = "/admin/media";

function back(params: string): never {
  revalidatePath(PATH);
  redirect(`${PATH}?${params}`);
}

export async function addMediaContact(formData: FormData): Promise<void> {
  await requireFullAdmin();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const outlet = String(formData.get("outlet") ?? "").trim();
  if (!fullName || !outlet) back("error=missing");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const supabase = await getServerSupabase();
  const { error } = await supabase.from("cms_media_contacts").insert({
    full_name: fullName,
    outlet,
    title: String(formData.get("title") ?? "").trim() || null,
    email: email && EMAIL_RE.test(email) ? email : null,
    source: "manual",
  });
  back(error ? "error=failed" : "saved=1");
}

export async function updateMediaContact(formData: FormData): Promise<void> {
  await requireFullAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const status = String(formData.get("status") ?? "");
  if (MEDIA_STATUSES.some((s) => s.id === status)) patch.status = status;
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (email && EMAIL_RE.test(email)) patch.email = email;
  const supabase = await getServerSupabase();
  await supabase.from("cms_media_contacts").update(patch).eq("id", id);
  revalidatePath(PATH);
}

export async function removeMediaContact(formData: FormData): Promise<void> {
  await requireFullAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await getServerSupabase();
  await supabase.from("cms_media_contacts").delete().eq("id", id);
  back("saved=1");
}

/**
 * Send the release to one contact ("contactId") or to every prospect with an
 * email ("all=1"). Subject and body come from the composer form, so an edit
 * to the pitch applies to whichever button was clicked.
 */
export async function sendMediaRelease(formData: FormData): Promise<void> {
  const { email: admin } = await requireFullAdmin();
  const subject = String(formData.get("subject") ?? "").trim();
  const bodyRaw = String(formData.get("body") ?? "").trim();
  const contactId = String(formData.get("contactId") ?? "");
  const toAll = String(formData.get("all") ?? "") === "1";
  if (!subject || !bodyRaw) back("error=email-invalid");
  if (!process.env.RESEND_API_KEY) back("error=no-key");

  const supabase = await getServerSupabase();
  let query = supabase.from("cms_media_contacts").select("*");
  query = toAll ? query.eq("status", "prospect") : query.eq("id", contactId);
  const { data } = await query;
  const targets = ((data ?? []) as { id: string; email: string | null; full_name: string }[])
    .filter((c) => c.email && EMAIL_RE.test(c.email));
  if (targets.length === 0) back("error=no-recipients");

  // Plain paragraphs -> one rich-text block, same treatment as partner email.
  const esc = (p: string) =>
    p.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
  const paragraphs = bodyRaw
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p)}</p>`)
    .join("");
  const blocks: NewsletterBlock[] = [
    { id: randomUUID(), type: "text", html: paragraphs },
  ];
  const { html, text } = await renderNewsletter(
    { subject, preheader: "", blocks },
    { sendDate: new Date() },
  );

  const results = await sendBulkEmail(
    targets.map((t) => t.email as string),
    { subject, text, html },
    [],
  );

  // History rows, same shape as Quick email / partners.
  const batchId = randomUUID();
  try {
    const rows = results.map((r) => ({
      batch_id: batchId,
      from_email: getResendFrom(),
      to_email: r.to,
      cc: null,
      subject,
      body: text,
      status: r.ok ? "sent" : "failed",
      error: r.error ?? null,
      resend_id: r.id ?? null,
    }));
    const { error: insErr } = await supabase
      .from("email_sends")
      .insert(rows.map((row) => ({ ...row, sent_by: admin })));
    if (insErr) await supabase.from("email_sends").insert(rows);
  } catch (err) {
    console.error("[media] record send", err);
  }

  const sentEmails = new Set(results.filter((r) => r.ok).map((r) => r.to));
  const sentIds = targets.filter((t) => sentEmails.has(t.email as string)).map((t) => t.id);
  if (sentIds.length > 0) {
    await supabase
      .from("cms_media_contacts")
      .update({
        status: "pitched",
        last_contacted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .in("id", sentIds)
      .eq("status", "prospect");
  }

  back(`sent=${sentIds.length}`);
}

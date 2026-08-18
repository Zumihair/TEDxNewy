"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { getResendFrom, sendBulkEmail } from "@/lib/email-notify";
import type { NewsletterBlock } from "@/lib/newsletter-blocks";
import { renderNewsletter } from "@/lib/newsletter-render";
import { getPartner, logPartnerEvent, STATUSES } from "@/lib/partners";
import { TIER_LABELS } from "@/lib/prospectus-render";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TIERS = ["presenting", "platinum", "gold", "community"] as const;

function tierFrom(v: unknown): string | null {
  return (TIERS as readonly string[]).includes(String(v)) ? String(v) : null;
}

function statusFrom(v: unknown): string {
  const raw = String(v ?? "");
  return STATUSES.some((x) => x.id === raw) ? raw : "prospect";
}

export async function addPartner(formData: FormData): Promise<void> {
  const { email: admin } = await requireFullAdmin();
  const org_name = String(formData.get("org_name") ?? "").trim();
  if (!org_name) redirect("/admin/partners?error=missing");

  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("cms_partners")
    .insert({
      org_name,
      contact_name: String(formData.get("contact_name") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim().toLowerCase() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      website: String(formData.get("website") ?? "").trim() || null,
      category: String(formData.get("category") ?? "").trim() || null,
      target_tier: tierFrom(formData.get("target_tier")),
      created_by: admin,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[partners] add", error);
    redirect("/admin/partners?error=failed");
  }
  revalidatePath("/admin/partners");
  redirect(`/admin/partners/${data.id}`);
}

export async function updatePartner(formData: FormData): Promise<void> {
  await requireFullAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const org_name = String(formData.get("org_name") ?? "").trim();
  if (!org_name) redirect(`/admin/partners/${id}?error=missing`);

  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from("cms_partners")
    .update({
      org_name,
      contact_name: String(formData.get("contact_name") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim().toLowerCase() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      website: String(formData.get("website") ?? "").trim() || null,
      category: String(formData.get("category") ?? "").trim() || null,
      target_tier: tierFrom(formData.get("target_tier")),
      notes: String(formData.get("notes") ?? "").trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    console.error("[partners] update", error);
    redirect(`/admin/partners/${id}?error=failed`);
  }
  revalidatePath(`/admin/partners/${id}`);
  revalidatePath("/admin/partners");
  redirect(`/admin/partners/${id}?saved=1`);
}

export async function setPartnerStatus(formData: FormData): Promise<void> {
  const { email: admin } = await requireFullAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const status = statusFrom(formData.get("status"));

  const before = await getPartner(id);
  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from("cms_partners")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (!error && before && before.status !== status) {
    const label = (st: string) => STATUSES.find((x) => x.id === st)?.label ?? st;
    await logPartnerEvent(
      id,
      "status",
      `Status: ${label(before.status)} → ${label(status)}`,
      null,
      admin,
    );
  }
  revalidatePath(`/admin/partners/${id}`);
  revalidatePath("/admin/partners");
  redirect(`/admin/partners/${id}`);
}

export async function addPartnerNote(formData: FormData): Promise<void> {
  const { email: admin } = await requireFullAdmin();
  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!id || !note) return;
  await logPartnerEvent(id, "note", note, null, admin);
  revalidatePath(`/admin/partners/${id}`);
  redirect(`/admin/partners/${id}`);
}

export async function removePartner(formData: FormData): Promise<void> {
  await requireFullAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await getServerSupabase();
  await supabase.from("cms_partners").delete().eq("id", id);
  revalidatePath("/admin/partners");
  redirect("/admin/partners?removed=1");
}

/**
 * Send the outreach email to this partner's contact via Resend, through the
 * shared newsletter renderer so it carries the house styling. Records the
 * send in email_sends (like Quick email), stamps last_contacted_at, logs a
 * timeline event, and nudges a prospect to "contacted".
 */
export async function sendPartnerEmail(formData: FormData): Promise<void> {
  const { email: admin } = await requireFullAdmin();
  const id = String(formData.get("id") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const bodyRaw = String(formData.get("body") ?? "").trim();
  if (!id) return;

  const partner = await getPartner(id);
  if (!partner) redirect("/admin/partners?error=missing");
  const to = String(formData.get("to") ?? partner.email ?? "").trim().toLowerCase();

  if (!to || !EMAIL_RE.test(to) || !subject || !bodyRaw) {
    redirect(`/admin/partners/${id}?error=email-invalid`);
  }
  if (!process.env.RESEND_API_KEY) {
    redirect(`/admin/partners/${id}?error=no-key`);
  }

  // Plain paragraphs -> one rich-text block. Blank line = new paragraph.
  const paragraphs = bodyRaw
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p>${p
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\n/g, "<br>")}</p>`,
    )
    .join("");
  const blocks: NewsletterBlock[] = [
    { id: randomUUID(), type: "text", html: paragraphs },
  ];

  // Attach the prospectus as a button when one has been generated.
  const withProspectus = String(formData.get("attach_prospectus") ?? "") === "on";
  if (withProspectus && partner.prospectusUrl) {
    blocks.push({
      id: randomUUID(),
      type: "button",
      label: "Read the partnership prospectus (PDF)",
      href: partner.prospectusUrl,
      align: "left",
      theme: "red",
      variant: "solid",
    });
  }

  const { html, text } = await renderNewsletter(
    { subject, preheader: "", blocks },
    { sendDate: new Date() },
  );

  const results = await sendBulkEmail([to], { subject, text, html }, []);
  const ok = results.every((r) => r.ok);

  // History row, same shape as Quick email.
  const batchId = randomUUID();
  try {
    const supabase = await getServerSupabase();
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
    console.error("[partners] record send", err);
  }

  if (ok) {
    const supabase = await getServerSupabase();
    const patch: Record<string, unknown> = {
      last_contacted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (partner.status === "prospect") patch.status = "contacted";
    await supabase.from("cms_partners").update(patch).eq("id", id);
    await logPartnerEvent(
      id,
      "email",
      `Emailed ${to}: “${subject}”`,
      withProspectus && partner.prospectusUrl ? "Prospectus attached." : null,
      admin,
    );
  }

  revalidatePath(`/admin/partners/${id}`);
  revalidatePath("/admin/partners");
  redirect(`/admin/partners/${id}?${ok ? "sent=1" : "error=send-failed"}`);
}

/** Default outreach email, personalised from the partner row. */
export async function defaultOutreach(partnerId: string): Promise<{
  subject: string;
  body: string;
}> {
  await requireFullAdmin();
  const p = await getPartner(partnerId);
  const first = p?.contactName?.split(" ")[0];
  const tierLine = p?.targetTier
    ? `Based on what ${p.orgName} does, the ${TIER_LABELS[p.targetTier]} package is where we think the fit is strongest, but every package can be tailored.`
    : `Packages run from $1,000 community partnerships (cash or in kind) to an exclusive $10,000 presenting partnership, and every one can be tailored.`;
  return {
    subject: `Partnering with TEDxNewy for Signal, 24 October`,
    body: `Hi ${first ?? "there"},

I'm reaching out from TEDxNewy, Newcastle's independently licensed TED event. We're ten weeks from Signal, our signature event for 2026: a full afternoon of talks and performances at the Conservatorium of Music on Saturday 24 October.

This year we've staged three sold-out events: a citizen salon on the future of Newcastle, a 60-second talk night, and a Youth Futures Lab that brought 75 high schoolers from seven Hunter schools together for a day. Our published talks have passed 79,000 views on YouTube, and every event ends with a public impact report, so partners can see exactly what their support built.

${tierLine}

I've attached our partnership prospectus with the numbers and packages. Would you be open to a coffee or a short call in the next week or two?

Warm regards,
The TEDxNewy team
hello@tedxnewy.com.au · tedxnewy.com.au/partner`,
  };
}

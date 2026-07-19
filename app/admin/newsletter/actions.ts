"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { getResendFrom, sendBulkEmailPersonalized } from "@/lib/email-notify";
import { SITE } from "@/lib/email-templates";
import { renderNewsletter } from "@/lib/newsletter-render";
import { sendNewsletter } from "@/lib/newsletter-send";
import { validateBlocks } from "@/lib/newsletter-blocks";

/**
 * Server actions for the newsletter builder. Every export calls requireAdmin()
 * first so nothing here runs for a non-admin, even though RLS also guards the
 * tables. The editor is a client component, so most of these take plain JS args
 * rather than FormData; the two used as <form action> (create, duplicate) take
 * FormData.
 */

type ActionResult = { ok: true } | { ok: false; error: string };

/** A saved template row, returned so the editor can update its Load list. */
export type SavedTemplate = {
  id: string;
  name: string;
  subject: string | null;
  preheader: string | null;
  blocks: unknown;
};

/** The settings + blocks the editor sends back for a save. */
export type SaveData = {
  title: string;
  subject: string;
  preheader: string;
  from_address: string;
  blocks: unknown;
  scheduled_at?: string | null;
};

/** The subset needed to render a preview or a test send. */
export type RenderData = {
  subject: string;
  preheader: string;
  blocks: unknown;
  scheduled_at?: string | null;
};

// -- create -----------------------------------------------------------------

export async function createNewsletter(): Promise<void> {
  await requireAdmin();
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("newsletters")
    .insert({
      title: "Untitled newsletter",
      subject: "",
      preheader: "",
      from_address: getResendFrom(),
      audience: "subscribers",
      blocks: [],
      status: "draft",
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "Could not create the newsletter.");
  }
  revalidatePath("/admin/newsletter");
  revalidatePath("/admin/newsletter/campaigns");
  redirect(`/admin/newsletter/${data.id}`);
}

// -- save -------------------------------------------------------------------

export async function saveNewsletter(
  id: string,
  data: SaveData,
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await getServerSupabase();
  const blocks = validateBlocks(data.blocks);
  const patch: Record<string, unknown> = {
    title: data.title.trim() || "Untitled newsletter",
    subject: data.subject,
    preheader: data.preheader,
    from_address: data.from_address,
    blocks,
    updated_at: new Date().toISOString(),
  };
  if (data.scheduled_at !== undefined) patch.scheduled_at = data.scheduled_at;
  const { error } = await supabase
    .from("newsletters")
    .update(patch)
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/newsletter");
  revalidatePath("/admin/newsletter/campaigns");
  revalidatePath(`/admin/newsletter/${id}`);
  return { ok: true };
}

// -- delete -----------------------------------------------------------------

export async function deleteNewsletter(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await getServerSupabase();
  const { data: row } = await supabase
    .from("newsletters")
    .select("status")
    .eq("id", id)
    .single();
  // Only drafts can be deleted, so a scheduled or sent campaign can't vanish.
  if (row && row.status === "draft") {
    await supabase.from("newsletters").delete().eq("id", id);
  }
  revalidatePath("/admin/newsletter");
  revalidatePath("/admin/newsletter/campaigns");
  redirect("/admin/newsletter/campaigns");
}

/** Form-action delete used by the list page (one draft per row). */
export async function deleteNewsletterForm(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const tab = String(formData.get("tab") ?? "drafts");
  if (id) {
    const supabase = await getServerSupabase();
    const { data: row } = await supabase
      .from("newsletters")
      .select("status")
      .eq("id", id)
      .single();
    if (row && row.status === "draft") {
      await supabase.from("newsletters").delete().eq("id", id);
    }
  }
  revalidatePath("/admin/newsletter");
  revalidatePath("/admin/newsletter/campaigns");
  redirect(`/admin/newsletter/campaigns?tab=${tab}`);
}

// -- duplicate --------------------------------------------------------------

export async function duplicateNewsletter(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/newsletter/campaigns");
  const supabase = await getServerSupabase();
  const { data: src, error } = await supabase
    .from("newsletters")
    .select("title, subject, preheader, from_address, audience, blocks")
    .eq("id", id)
    .single();
  if (error || !src) redirect("/admin/newsletter/campaigns");
  const { data: created, error: insErr } = await supabase
    .from("newsletters")
    .insert({
      title: `Copy of ${src.title ?? "Untitled newsletter"}`,
      subject: src.subject ?? "",
      preheader: src.preheader ?? "",
      from_address: src.from_address ?? getResendFrom(),
      audience: src.audience ?? "subscribers",
      blocks: src.blocks ?? [],
      status: "draft",
    })
    .select("id")
    .single();
  if (insErr || !created) {
    throw new Error(insErr?.message ?? "Could not duplicate the newsletter.");
  }
  revalidatePath("/admin/newsletter");
  revalidatePath("/admin/newsletter/campaigns");
  redirect(`/admin/newsletter/${created.id}`);
}

// -- templates --------------------------------------------------------------

export async function saveTemplate(
  name: string,
  data: { subject: string; preheader: string; blocks: unknown },
): Promise<
  { ok: true; template: SavedTemplate } | { ok: false; error: string }
> {
  await requireAdmin();
  const clean = name.trim();
  if (!clean) return { ok: false, error: "Give the template a name." };
  const supabase = await getServerSupabase();
  const { data: created, error } = await supabase
    .from("newsletter_templates")
    .insert({
      name: clean,
      subject: data.subject,
      preheader: data.preheader,
      blocks: validateBlocks(data.blocks),
    })
    .select("id, name, subject, preheader, blocks")
    .single();
  if (error || !created) {
    return { ok: false, error: error?.message ?? "Could not save the template." };
  }
  revalidatePath("/admin/newsletter");
  revalidatePath("/admin/newsletter/campaigns");
  return { ok: true, template: created as SavedTemplate };
}

export async function deleteTemplate(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from("newsletter_templates")
    .delete()
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/newsletter");
  revalidatePath("/admin/newsletter/campaigns");
  return { ok: true };
}

// -- preview ----------------------------------------------------------------

export async function previewNewsletter(data: RenderData): Promise<string> {
  await requireAdmin();
  const { html } = await renderNewsletter(
    {
      subject: data.subject,
      preheader: data.preheader,
      blocks: data.blocks,
    },
    {
      unsubscribeUrl: `${SITE}/unsubscribe?token=preview`,
      sendDate: data.scheduled_at ? new Date(data.scheduled_at) : new Date(),
    },
  );
  return html;
}

// -- test send --------------------------------------------------------------

export async function sendTestNewsletter(data: {
  subject: string;
  preheader: string;
  blocks: unknown;
  from_address: string;
}): Promise<ActionResult> {
  const { email } = await requireAdmin();
  const { html, text } = await renderNewsletter(
    {
      subject: data.subject,
      preheader: data.preheader,
      blocks: data.blocks,
    },
    {
      unsubscribeUrl: `${SITE}/unsubscribe?token=preview`,
      sendDate: new Date(),
    },
  );
  const [result] = await sendBulkEmailPersonalized([
    {
      to: email,
      from: data.from_address || getResendFrom(),
      subject: `[Test] ${data.subject || "(no subject)"}`,
      html,
      text,
    },
  ]);
  if (!result || !result.ok) {
    return { ok: false, error: result?.error ?? "The test send failed." };
  }
  return { ok: true };
}

// -- schedule ---------------------------------------------------------------

export async function scheduleNewsletter(
  id: string,
  isoUtc: string,
): Promise<ActionResult> {
  await requireAdmin();
  const when = new Date(isoUtc);
  if (Number.isNaN(when.getTime())) {
    return { ok: false, error: "That is not a valid date and time." };
  }
  if (when.getTime() <= Date.now()) {
    return { ok: false, error: "Pick a time in the future." };
  }
  const supabase = await getServerSupabase();
  const { data: row } = await supabase
    .from("newsletters")
    .select("subject, blocks")
    .eq("id", id)
    .single();
  if (!row) return { ok: false, error: "Newsletter not found." };
  if (!row.subject || !String(row.subject).trim()) {
    return { ok: false, error: "Add a subject before scheduling." };
  }
  if (validateBlocks(row.blocks).length === 0) {
    return { ok: false, error: "Add at least one block before scheduling." };
  }
  const { error } = await supabase
    .from("newsletters")
    .update({
      status: "scheduled",
      scheduled_at: when.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/newsletter");
  revalidatePath("/admin/newsletter/campaigns");
  revalidatePath(`/admin/newsletter/${id}`);
  return { ok: true };
}

export async function unscheduleNewsletter(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from("newsletters")
    .update({
      status: "draft",
      scheduled_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "scheduled");
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/newsletter");
  revalidatePath("/admin/newsletter/campaigns");
  revalidatePath(`/admin/newsletter/${id}`);
  return { ok: true };
}

// -- send now ---------------------------------------------------------------

export async function sendNewsletterNow(id: string): Promise<ActionResult> {
  await requireAdmin();
  const outcome = await sendNewsletter(id);
  if ("error" in outcome) {
    return { ok: false, error: outcome.error };
  }
  revalidatePath("/admin/newsletter");
  revalidatePath("/admin/newsletter/campaigns");
  redirect("/admin/newsletter/campaigns?tab=sent");
}

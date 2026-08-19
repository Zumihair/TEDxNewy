"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { getResendFrom, sendBulkEmailPersonalized } from "@/lib/email-notify";
import { SITE } from "@/lib/email-templates";
import { renderNewsletter } from "@/lib/newsletter-render";
import {
  validateBlocks,
  type NewsletterBlock,
  type PreviewScheme,
} from "@/lib/newsletter-blocks";

const LIST_PATH = "/admin/subscriber-flow";

/**
 * The patch that records a step being switched on.
 *
 * `enabled_at` is the cutoff the sender compares against: a subscriber
 * only receives a step if they entered the flow at or after it. Stamped
 * on a false -> true transition only, so re-saving an already-on step
 * (editing its copy, say) does not silently move the line and lock out
 * everyone who joined since. Switching a step off leaves the old value
 * alone; the next switch-on overwrites it, which is what makes turning a
 * step off and on again restart it for new joiners only.
 */
async function enabledPatch(
  supabase: Awaited<ReturnType<typeof getServerSupabase>>,
  id: string,
  enabled: boolean,
): Promise<Record<string, unknown>> {
  if (!enabled) return { enabled: false };
  const { data: current } = await supabase
    .from("subscriber_flow_steps")
    .select("enabled")
    .eq("id", id)
    .maybeSingle();
  if (current?.enabled) return { enabled: true };
  return { enabled: true, enabled_at: new Date().toISOString() };
}

export type StepData = {
  name: string;
  subject: string;
  preheader: string;
  from_address: string;
  delay_days: number;
  enabled: boolean;
  blocks: unknown;
};

/** Persist the editor state for one step. */
export async function saveStep(id: string, data: StepData): Promise<void> {
  await requireAdmin();
  const supabase = await getServerSupabase();
  const blocks = validateBlocks(data.blocks);
  const delay = Number.isFinite(data.delay_days)
    ? Math.max(0, Math.round(data.delay_days))
    : 0;

  const { error } = await supabase
    .from("subscriber_flow_steps")
    .update({
      name: data.name.trim() || "Untitled step",
      subject: data.subject,
      preheader: data.preheader,
      from_address: data.from_address || getResendFrom(),
      delay_days: delay,
      ...(await enabledPatch(supabase, id, Boolean(data.enabled))),
      blocks,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/${id}`);
}

/** Flip a step's enabled flag. Called from a server <form>. */
export async function toggleStep(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const enabled = String(formData.get("enabled") ?? "") === "true";
  if (!id) return;
  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from("subscriber_flow_steps")
    .update({
      ...(await enabledPatch(supabase, id, enabled)),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(LIST_PATH);
}

/** Swap a step's position with its neighbour in the given direction. */
export async function reorderStep(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const dir = String(formData.get("dir") ?? "");
  if (!id || (dir !== "up" && dir !== "down")) return;

  const supabase = await getServerSupabase();
  const { data: steps, error } = await supabase
    .from("subscriber_flow_steps")
    .select("id, position")
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);

  const list = steps ?? [];
  const i = list.findIndex((s) => s.id === id);
  if (i < 0) return;
  const j = dir === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= list.length) return;

  const a = list[i];
  const b = list[j];
  // Swap positions. Two updates: no unique constraint on position, so no need
  // for a temporary value.
  await supabase
    .from("subscriber_flow_steps")
    .update({ position: b.position })
    .eq("id", a.id);
  await supabase
    .from("subscriber_flow_steps")
    .update({ position: a.position })
    .eq("id", b.id);

  revalidatePath(LIST_PATH);
}

/** Add a new disabled step at the end and open its editor. */
export async function addStep(): Promise<void> {
  await requireAdmin();
  const supabase = await getServerSupabase();
  const { data: last } = await supabase
    .from("subscriber_flow_steps")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPosition = (last?.position ?? 0) + 1;

  const { data: created, error } = await supabase
    .from("subscriber_flow_steps")
    .insert({
      position: nextPosition,
      name: "New step",
      enabled: false,
      delay_days: nextPosition === 1 ? 0 : 7,
      subject: "",
      preheader: "",
      blocks: [],
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath(LIST_PATH);
  redirect(`${LIST_PATH}/${created.id}`);
}

/** Delete a step and return to the list. */
export async function deleteStep(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from("subscriber_flow_steps")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(LIST_PATH);
  redirect(LIST_PATH);
}

/** Render the current editor state to HTML for the live preview. */
export async function previewStep(
  data: {
    subject: string;
    preheader: string;
    blocks: unknown;
  },
  /** Pins the preview to one colour scheme. Preview only: a real drip send
   *  leaves this off so each reader's own device decides. */
  scheme?: PreviewScheme,
): Promise<string> {
  await requireAdmin();
  const { html } = await renderNewsletter(
    {
      subject: data.subject,
      preheader: data.preheader,
      blocks: validateBlocks(data.blocks) as NewsletterBlock[],
    },
    {
      unsubscribeUrl: `${SITE}/unsubscribe?token=preview`,
      sendDate: new Date(),
      previewScheme: scheme,
    },
  );
  return html;
}

/** Send a test copy of the current editor state to the signed-in admin. */
export async function sendTestStep(data: {
  subject: string;
  preheader: string;
  blocks: unknown;
  from_address: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { email } = await requireAdmin();
  const url = `${SITE}/unsubscribe?token=preview`;
  const subject = `[Test] ${data.subject || "Subscriber flow step"}`;
  try {
    const { html, text } = await renderNewsletter(
      {
        subject,
        preheader: data.preheader,
        blocks: validateBlocks(data.blocks) as NewsletterBlock[],
      },
      { unsubscribeUrl: url, sendDate: new Date() },
    );
    const [result] = await sendBulkEmailPersonalized([
      {
        to: email,
        from: data.from_address || getResendFrom(),
        subject,
        html,
        text,
        headers: {
          "List-Unsubscribe": `<${url}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      },
    ]);
    if (!result || !result.ok) {
      return { ok: false, error: result?.error || "Send failed." };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err).slice(0, 300) };
  }
}

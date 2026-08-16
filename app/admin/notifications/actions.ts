"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { SOURCE_VALUES } from "./sources";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Toggle a single recipient × form cell in the matrix. Enabling inserts (or
 * reactivates) the row; disabling deletes it. Called by the client matrix on
 * every checkbox change, so it returns quietly rather than redirecting.
 */
export async function setRecipientForm(formData: FormData): Promise<void> {
  await requireFullAdmin();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const label = String(formData.get("label") ?? "").trim() || null;
  const formSource = String(formData.get("formSource") ?? "").trim();
  const enabled = formData.get("enabled") === "1";

  if (!EMAIL_RE.test(email) || !SOURCE_VALUES.includes(formSource)) return;

  const supabase = await getServerSupabase();

  if (enabled) {
    const { data: existing } = await supabase
      .from("notification_recipients")
      .select("id")
      .eq("email", email)
      .eq("form_source", formSource)
      .limit(1);
    if (existing && existing.length > 0) {
      await supabase
        .from("notification_recipients")
        .update({ active: true, label })
        .eq("id", existing[0].id);
    } else {
      await supabase
        .from("notification_recipients")
        .insert({ form_source: formSource, email, label, active: true });
    }
  } else {
    await supabase
      .from("notification_recipients")
      .delete()
      .eq("email", email)
      .eq("form_source", formSource);
  }

  revalidatePath("/admin/notifications");
}

/**
 * Add a recipient and subscribe them to the chosen forms in one go. The add
 * form posts one `forms` entry per ticked checkbox.
 */
export async function addRecipient(formData: FormData): Promise<void> {
  await requireFullAdmin();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const label = String(formData.get("label") ?? "").trim() || null;
  const forms = formData
    .getAll("forms")
    .map((f) => String(f))
    .filter((f) => SOURCE_VALUES.includes(f));

  if (!email || !EMAIL_RE.test(email)) {
    redirect("/admin/notifications?error=bad-email");
  }
  if (forms.length === 0) {
    redirect("/admin/notifications?error=no-forms");
  }

  const supabase = await getServerSupabase();

  // Only insert forms the recipient isn't already on.
  const { data: existing } = await supabase
    .from("notification_recipients")
    .select("form_source")
    .eq("email", email);
  const already = new Set((existing ?? []).map((r) => r.form_source as string));
  const toInsert = forms
    .filter((f) => !already.has(f))
    .map((f) => ({ form_source: f, email, label, active: true }));

  if (toInsert.length > 0) {
    const { error } = await supabase
      .from("notification_recipients")
      .insert(toInsert);
    if (error) {
      console.error("[admin/notifications] add error", error);
      redirect("/admin/notifications?error=failed");
    }
  }

  revalidatePath("/admin/notifications");
  redirect("/admin/notifications?added=1");
}

/** Remove a recipient entirely — deletes every form row for their email. */
export async function removeRecipient(formData: FormData): Promise<void> {
  await requireFullAdmin();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) return;

  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from("notification_recipients")
    .delete()
    .eq("email", email);
  if (error) {
    console.error("[admin/notifications] remove error", error);
    redirect("/admin/notifications?error=failed");
  }
  revalidatePath("/admin/notifications");
  redirect("/admin/notifications?removed=1");
}

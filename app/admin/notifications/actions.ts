"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function addRecipient(formData: FormData): Promise<void> {
  await requireAdmin();
  const formSource = String(formData.get("formSource") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const label = String(formData.get("label") ?? "").trim() || null;

  if (!formSource) {
    redirect("/admin/notifications?error=bad-source");
  }
  if (!email || !EMAIL_RE.test(email)) {
    redirect("/admin/notifications?error=bad-email");
  }

  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from("notification_recipients")
    .insert({ form_source: formSource, email, label, active: true });

  if (error) {
    if (error.code === "23505") {
      redirect("/admin/notifications?error=exists");
    }
    console.error("[admin/notifications] add error", error);
    redirect("/admin/notifications?error=failed");
  }
  revalidatePath("/admin/notifications");
  redirect("/admin/notifications?added=1");
}

export async function toggleRecipient(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const supabase = await getServerSupabase();
  const { data: row, error: readErr } = await supabase
    .from("notification_recipients")
    .select("active")
    .eq("id", id)
    .single();
  if (readErr || !row) {
    redirect("/admin/notifications?error=failed");
  }

  const { error } = await supabase
    .from("notification_recipients")
    .update({ active: !row.active })
    .eq("id", id);
  if (error) {
    console.error("[admin/notifications] toggle error", error);
    redirect("/admin/notifications?error=failed");
  }
  revalidatePath("/admin/notifications");
  redirect("/admin/notifications?toggled=1");
}

export async function deleteRecipient(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from("notification_recipients")
    .delete()
    .eq("id", id);
  if (error) {
    console.error("[admin/notifications] delete error", error);
    redirect("/admin/notifications?error=failed");
  }
  revalidatePath("/admin/notifications");
  redirect("/admin/notifications?removed=1");
}

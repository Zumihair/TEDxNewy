"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function addAdmin(formData: FormData): Promise<void> {
  await requireAdmin();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim() || null;

  if (!email || !EMAIL_RE.test(email)) {
    redirect("/admin/team?error=bad-email");
  }

  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from("cms_admins")
    .insert({ email, name });

  if (error) {
    if (error.code === "23505") {
      redirect("/admin/team?error=exists");
    }
    console.error("[admin/team] add error", error);
    redirect("/admin/team?error=failed");
  }
  revalidatePath("/admin/team");
  redirect("/admin/team?added=1");
}

export async function removeAdmin(formData: FormData): Promise<void> {
  const { email: callerEmail } = await requireAdmin();
  const target = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!target) return;
  if (target === callerEmail) {
    // Don't let admins lock themselves out
    redirect("/admin/team?error=self");
  }
  const supabase = await getServerSupabase();
  await supabase.from("cms_admins").delete().ilike("email", target);
  revalidatePath("/admin/team");
  redirect("/admin/team?removed=1");
}

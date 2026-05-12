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
    redirect("/admin/admins?error=bad-email");
  }

  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from("cms_admins")
    .insert({ email, name });

  if (error) {
    if (error.code === "23505") {
      redirect("/admin/admins?error=exists");
    }
    console.error("[admin/team] add error", error);
    redirect("/admin/admins?error=failed");
  }
  revalidatePath("/admin/admins");
  redirect("/admin/admins?added=1");
}

export async function removeAdmin(formData: FormData): Promise<void> {
  const { email: callerEmail } = await requireAdmin();
  const target = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!target) return;
  if (target === callerEmail) {
    // Don't let admins lock themselves out
    redirect("/admin/admins?error=self");
  }
  const supabase = await getServerSupabase();
  await supabase.from("cms_admins").delete().ilike("email", target);
  revalidatePath("/admin/admins");
  redirect("/admin/admins?removed=1");
}

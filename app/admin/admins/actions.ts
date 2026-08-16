"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LEVELS = ["full", "community"] as const;
type Level = (typeof LEVELS)[number];

function levelFrom(formData: FormData): Level {
  const raw = String(formData.get("access") ?? "").trim();
  return (LEVELS as readonly string[]).includes(raw)
    ? (raw as Level)
    : "community";
}

export async function addAdmin(formData: FormData): Promise<void> {
  await requireFullAdmin();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim() || null;
  const access_level = levelFrom(formData);

  if (!email || !EMAIL_RE.test(email)) {
    redirect("/admin/admins?error=bad-email");
  }

  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from("cms_admins")
    .insert({ email, name, access_level });

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
  const { email: callerEmail } = await requireFullAdmin();
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

/**
 * Move someone between full and community access.
 *
 * The self guard is what stops the CMS being orphaned: only a full admin can
 * reach this action at all, and they can't demote themselves, so there is
 * always at least one full admin left afterwards.
 */
export async function setAdminAccess(formData: FormData): Promise<void> {
  const { email: callerEmail } = await requireFullAdmin();
  const target = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!target) return;
  const access_level = levelFrom(formData);

  if (target === callerEmail) {
    redirect("/admin/admins?error=self-level");
  }

  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from("cms_admins")
    .update({ access_level })
    .ilike("email", target);

  if (error) {
    console.error("[admin/team] set access error", error);
    redirect("/admin/admins?error=failed");
  }
  revalidatePath("/admin/admins");
  redirect("/admin/admins?level=1");
}

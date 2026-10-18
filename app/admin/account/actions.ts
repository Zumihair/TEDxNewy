"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { cleanSocials } from "@/lib/social-catalogue";

/**
 * Everyone signed in can change their own password and, when their sign-in is linked to a team member,
 * that member's own photo, bio, contact details and socials (never their role). Nothing here touches anyone else, and it is allowed for view-only
 * accesses (the guard lets /admin/account through).
 */

const BACK = "/admin/account";
const note = (key: "saved" | "error", message: string) => `${BACK}?${key}=${encodeURIComponent(message)}`;

export async function changePassword(formData: FormData): Promise<void> {
  await requireAdmin({ readOnly: true });
  const password = String(formData.get("password") ?? "");
  const again = String(formData.get("again") ?? "");
  if (password.length < 8) redirect(note("error", "A password needs at least 8 characters."));
  if (password !== again) redirect(note("error", "The two passwords do not match."));
  const supabase = await getServerSupabase();
  const { error } = await supabase.rpc("change_own_password", { p_password: password });
  if (error) redirect(note("error", error.message.replace(/^.*?:\s*/, "").slice(0, 160)));
  redirect(note("saved", "Password changed. Use the new one next time you sign in."));
}

export async function saveMyProfile(formData: FormData): Promise<void> {
  const admin = await requireAdmin({ readOnly: true });
  if (!admin.teamSlug) redirect(note("error", "Your sign-in is not linked to a team member yet."));
  const clean = (k: string) => String(formData.get(k) ?? "").trim() || null;
  let socials = cleanSocials([]);
  try {
    socials = cleanSocials(JSON.parse(String(formData.get("socials") ?? "[]")));
  } catch {
    // keep the empty list
  }
  // The role is deliberately not here: only an admin changes it, from the Team page.
  const { error } = await getAdminSupabase()
    .from("cms_team_members")
    .update({
      bio: clean("bio"),
      image_url: clean("image_url"),
      email: clean("email"),
      phone: clean("phone"),
      socials,
      linkedin_url: socials.find((s) => s.key === "linkedin")?.url ?? null,
      instagram_url: socials.find((s) => s.key === "instagram")?.url ?? null,
    })
    .eq("slug", admin.teamSlug);
  if (error) redirect(note("error", error.message));
  revalidatePath("/team");
  revalidatePath("/admin/team");
  redirect(note("saved", "Profile saved."));
}

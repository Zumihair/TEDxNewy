"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";

/**
 * Create, change and remove the passwords that sign people in. Each access is one account in Supabase
 * Auth, managed through SECURITY DEFINER functions (migration 20261019_access_permissions.sql) that only
 * an admin can call, so no service key lives in the app.
 */

const BACK = "/admin/admins";

/** A Postgres exception message, trimmed to something safe to show. */
function reason(message: string | undefined): string {
  return (message ?? "Something went wrong.").replace(/^.*?:\s*/, "").slice(0, 160);
}

export async function createAccess(formData: FormData): Promise<void> {
  await requireFullAdmin();
  const label = String(formData.get("label") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const admin = !!formData.get("is_admin");
  const canEdit = admin || !!formData.get("can_edit");
  const team = String(formData.get("team_slug") ?? "").trim();
  if (!label) redirect(`${BACK}?error=${encodeURIComponent("Give the access a name.")}`);
  if (password.length < 8) redirect(`${BACK}?error=${encodeURIComponent("A password needs at least 8 characters.")}`);

  const supabase = await getServerSupabase();
  const { error } = await supabase.rpc("create_admin_access", {
    p_label: label,
    p_password: password,
    p_can_edit: canEdit,
    p_admin: admin,
    p_team_slug: team || null,
    p_username: team ? label.split(/\s+/)[0] : null,
  });
  if (error) redirect(`${BACK}?error=${encodeURIComponent(reason(error.message))}`);
  revalidatePath(BACK);
  redirect(`${BACK}?saved=created`);
}

export async function updateAccess(formData: FormData): Promise<void> {
  await requireFullAdmin();
  const email = String(formData.get("email") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const admin = !!formData.get("is_admin");
  const canEdit = admin || !!formData.get("can_edit");
  if (!email || !label) redirect(`${BACK}?error=${encodeURIComponent("Give the access a name.")}`);

  const supabase = await getServerSupabase();
  const { error } = await supabase.rpc("update_admin_access", {
    p_email: email,
    p_label: label,
    p_can_edit: canEdit,
    p_admin: admin,
    p_password: password || null,
  });
  if (error) redirect(`${BACK}?error=${encodeURIComponent(reason(error.message))}`);
  revalidatePath(BACK);
  redirect(`${BACK}?saved=updated`);
}

/** The two inline switches on the Access list. Returns an error message, or null when it worked. */
export async function setAccessFlags(email: string, label: string, canEdit: boolean, admin: boolean): Promise<string | null> {
  await requireFullAdmin();
  const supabase = await getServerSupabase();
  const { error } = await supabase.rpc("update_admin_access", {
    p_email: email,
    p_label: label,
    p_can_edit: canEdit || admin,
    p_admin: admin,
    p_password: null,
  });
  if (error) return reason(error.message);
  revalidatePath(BACK);
  return null;
}

export async function deleteAccess(formData: FormData): Promise<void> {
  await requireFullAdmin();
  const email = String(formData.get("email") ?? "");
  const supabase = await getServerSupabase();
  const { error } = await supabase.rpc("delete_admin_access", { p_email: email });
  if (error) redirect(`${BACK}?error=${encodeURIComponent(reason(error.message))}`);
  revalidatePath(BACK);
  redirect(`${BACK}?saved=deleted`);
}

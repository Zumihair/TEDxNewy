"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { ALL_WORKSPACES } from "../access";

/**
 * Create, change and remove the passwords that sign people in. Each access is
 * one account in Supabase Auth, managed through three SECURITY DEFINER
 * functions (migration 20261017_admin_access_workspaces.sql) that only a full
 * admin can call, so no service key lives in the app.
 */

const BACK = "/admin/admins";

function workspacesFrom(formData: FormData): string[] {
  return formData
    .getAll("workspaces")
    .map(String)
    .filter((w) => ALL_WORKSPACES.includes(w));
}

/** A Postgres exception message, trimmed to something safe to show. */
function reason(message: string | undefined): string {
  return (message ?? "Something went wrong.").replace(/^.*?:\s*/, "").slice(0, 160);
}

export async function createAccess(formData: FormData): Promise<void> {
  await requireFullAdmin();
  const label = String(formData.get("label") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const workspaces = workspacesFrom(formData);
  if (!label) redirect(`${BACK}?error=${encodeURIComponent("Give the access a name.")}`);
  if (password.length < 8) redirect(`${BACK}?error=${encodeURIComponent("A password needs at least 8 characters.")}`);
  if (workspaces.length === 0) redirect(`${BACK}?error=${encodeURIComponent("Pick at least one workspace.")}`);

  const supabase = await getServerSupabase();
  const { error } = await supabase.rpc("create_admin_access", {
    p_label: label,
    p_password: password,
    p_workspaces: workspaces,
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
  const workspaces = workspacesFrom(formData);
  if (!email || !label) redirect(`${BACK}?error=${encodeURIComponent("Give the access a name.")}`);
  if (workspaces.length === 0) redirect(`${BACK}?error=${encodeURIComponent("Pick at least one workspace.")}`);

  const supabase = await getServerSupabase();
  const { error } = await supabase.rpc("update_admin_access", {
    p_email: email,
    p_label: label,
    p_workspaces: workspaces,
    p_password: password || null,
  });
  if (error) redirect(`${BACK}?error=${encodeURIComponent(reason(error.message))}`);
  revalidatePath(BACK);
  redirect(`${BACK}?saved=updated`);
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

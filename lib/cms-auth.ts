/**
 * Helpers for admin authentication + authorisation.
 *
 * - `requireAdmin()` returns the authenticated admin user, or redirects
 *   to /admin/login if they're not signed in or not in cms_admins.
 * - `isAdmin(email)` is a pure lookup against cms_admins.
 */
import { redirect } from "next/navigation";
import { getServerSupabase } from "./supabase-server";

export async function requireAdmin() {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    redirect("/admin/login");
  }
  const email = data.user.email?.toLowerCase();
  if (!email) {
    redirect("/admin/login?error=no-email");
  }
  const { data: rows } = await supabase
    .from("cms_admins")
    .select("email")
    .ilike("email", email)
    .limit(1);
  if (!rows || rows.length === 0) {
    // Signed in but not on the allowlist — sign them back out + bounce
    await supabase.auth.signOut();
    redirect("/admin/login?error=not-admin");
  }
  return { user: data.user, email };
}

export async function getCurrentAdmin() {
  const supabase = await getServerSupabase();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

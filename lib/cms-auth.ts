/**
 * Helpers for admin authentication + authorisation.
 *
 * - `requireAdmin()` returns the authenticated admin user (either access
 *   level), or redirects to /admin/login if they're not signed in or not in
 *   cms_admins.
 * - `requireFullAdmin()` is the same guard (view-only vs edit vs admin is decided in `enforce`).
 * - `getSessionUser()` returns the current user (or null), cached per request.
 * - `getAdminAccess()` returns the level without redirecting, for the layout.
 *
 * The Supabase calls are wrapped in React `cache`, so several admin components
 * rendering in one request share a single Auth round trip and a single
 * allowlist lookup instead of each repeating them.
 */
import { cache } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { AccessInfo } from "@/app/admin/access";
import { workspaceForPath } from "@/app/admin/nav-config";
import { getServerSupabase } from "./supabase-server";

/**
 * The authenticated user for this request, or null if there is none. Cached
 * so the layout and page share one `getUser()` round trip.
 */
export const getSessionUser = cache(async () => {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
});

/**
 * This email's cms_admins row, or null if they're not on the allowlist.
 * `select("*")` on purpose: if a migration hasn't been applied yet, naming a
 * missing column would fail the whole query and lock everyone out.
 */
const adminRecordFor = cache(
  async (email: string): Promise<Record<string, unknown> | null> => {
    const supabase = await getServerSupabase();
    const { data: rows } = await supabase
      .from("cms_admins")
      .select("*")
      .ilike("email", email)
      .limit(1);
    return rows?.[0] ?? null;
  },
);

/**
 * Two switches per sign-in: `is_admin` (Settings too) and `can_edit` (writes). Rows from before the
 * migration have neither column: a "full" row is an admin, and everyone else keeps editing as they could.
 */
function accessOf(row: Record<string, unknown> | null): AccessInfo {
  const legacyFull = row?.access_level !== "community";
  const admin = typeof row?.is_admin === "boolean" ? (row.is_admin as boolean) : legacyFull;
  const canEdit = admin || (typeof row?.can_edit === "boolean" ? (row.can_edit as boolean) : true);
  return { admin, canEdit };
}

function firstNameOf(row: Record<string, unknown> | null): string | null {
  const label = typeof row?.label === "string" ? (row.label as string).trim() : "";
  if (!label || /access/i.test(label)) return null;
  return label.split(/s+/)[0] ?? null;
}

/** Paths a view-only sign-in may still post to (their own password and profile). */
const ALWAYS_OK = ["/admin/account", "/admin/login", "/admin/auth"];

/**
 * Settings pages need an admin; anything that WRITES (a server action, or a non-GET request
 * to an API route) needs edit access. Middleware stamps x-pathname and x-method.
 */
async function enforce(info: AccessInfo, readOnly: boolean) {
  const h = await headers();
  const path = h.get("x-pathname") ?? "";
  if (path.startsWith("/admin") && !info.admin && workspaceForPath(path)?.key === "settings") {
    redirect("/admin?denied=1");
  }
  if (readOnly || info.canEdit) return;
  if (ALWAYS_OK.some((p) => path.startsWith(p))) return;
  const method = (h.get("x-method") ?? "GET").toUpperCase();
  const writing = !!h.get("next-action") || (method !== "GET" && method !== "HEAD");
  if (writing) redirect("/admin?denied=view");
}

/**
 * The signed-in admin, or a redirect to /admin/login. Refuses Settings paths to non-admins and any
 * write from a view-only sign-in. Pass `{ readOnly: true }` for a server action that only reads
 * (a preview, a search, a quiet refresh).
 */
export async function requireAdmin(opts: { readOnly?: boolean } = {}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/admin/login");
  }
  const email = user.email?.toLowerCase();
  if (!email) {
    redirect("/admin/login?error=no-email");
  }
  const row = await adminRecordFor(email);
  if (!row) {
    // Signed in but not on the allowlist — sign them back out + bounce
    const supabase = await getServerSupabase();
    await supabase.auth.signOut();
    redirect("/admin/login?error=not-admin");
  }
  const info = accessOf(row);
  await enforce(info, !!opts.readOnly);
  return {
    user,
    email,
    ...info,
    label: typeof row.label === "string" ? (row.label as string) : null,
    firstName: firstNameOf(row),
    teamSlug: typeof row.team_slug === "string" ? (row.team_slug as string) : null,
  };
}

/** Kept so existing call sites compile: every page and action now uses the same two-switch rule. */
export async function requireFullAdmin(opts: { readOnly?: boolean } = {}) {
  return requireAdmin(opts);
}

/**
 * The signed-in admin's access level, or null if they aren't one. Does not
 * redirect: the layout renders for /admin/login too.
 */
export async function getAdminAccess(): Promise<(AccessInfo & { label: string | null; firstName: string | null }) | null> {
  const user = await getSessionUser();
  const email = user?.email?.toLowerCase();
  if (!email) return null;
  const row = await adminRecordFor(email);
  if (!row) return null;
  return { ...accessOf(row), label: typeof row.label === "string" ? (row.label as string) : null, firstName: firstNameOf(row) };
}

export async function getCurrentAdmin() {
  return getSessionUser();
}

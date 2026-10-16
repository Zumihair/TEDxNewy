/**
 * Helpers for admin authentication + authorisation.
 *
 * - `requireAdmin()` returns the authenticated admin user (either access
 *   level), or redirects to /admin/login if they're not signed in or not in
 *   cms_admins.
 * - `requireFullAdmin()` additionally bounces community-access admins.
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
import {
  ALL_WORKSPACES,
  DEFAULT_WORKSPACES,
  type AdminAccess,
  type AccessInfo,
} from "@/app/admin/access";
import { workspaceForPath } from "@/app/admin/nav-config";
import { getServerSupabase } from "./supabase-server";

export type { AdminAccess };

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
 * Cached per request per email so a page that calls requireAdmin() more than
 * once only hits the table once.
 *
 * `select("*")` rather than naming access_level on purpose: if the migration
 * hasn't been applied yet, naming a missing column fails the whole query and
 * locks everyone out. Reading it off the row instead degrades to "full".
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

function levelOf(row: Record<string, unknown> | null): AdminAccess {
  return row?.access_level === "community" ? "community" : "full";
}

/** The workspaces a row can see: its own list, else the default for its level. */
function workspacesOf(row: Record<string, unknown> | null): string[] {
  const own = row?.workspaces;
  if (Array.isArray(own)) return own.filter((w): w is string => typeof w === "string");
  return DEFAULT_WORKSPACES[levelOf(row)];
}

/** A sign-in is "full" only when it can see every workspace. */
function accessOf(row: Record<string, unknown> | null): AccessInfo {
  const workspaces = workspacesOf(row);
  const full = ALL_WORKSPACES.every((w) => workspaces.includes(w)) && levelOf(row) === "full";
  return { level: full ? "full" : "community", workspaces };
}

/**
 * A partial sign-in may only open the pages of the workspaces it was given.
 * The workspace comes from the request path (middleware stamps x-pathname, and
 * a server action posts to its own page). Admin pages must match a granted
 * workspace; an API route is allowed unless `strict` (requireFullAdmin), so the
 * helper endpoints a workspace's pages call keep working.
 */
async function enforceWorkspace(workspaces: string[], strict: boolean) {
  const path = (await headers()).get("x-pathname");
  if (!path) {
    if (strict) redirect("/admin?denied=1");
    return;
  }
  if (path === "/admin" || path.startsWith("/admin/login") || path.startsWith("/admin/auth")) return;
  if (!path.startsWith("/admin")) {
    if (strict) redirect("/admin?denied=1");
    return;
  }
  const ws = workspaceForPath(path);
  if (!ws || !workspaces.includes(ws.key)) redirect("/admin?denied=1");
}

export async function requireAdmin() {
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
  if (info.level !== "full") await enforceWorkspace(info.workspaces, false);
  return {
    user,
    email,
    access: info.level,
    workspaces: info.workspaces,
    label: typeof row.label === "string" ? (row.label as string) : null,
  };
}

/**
 * Guard for every admin page and action outside the Community group. A
 * community-access admin gets bounced to the dashboard with a message rather
 * than a blank page.
 */
export async function requireFullAdmin() {
  const admin = await requireAdmin();
  if (admin.access === "full") return admin;
  // requireAdmin already enforced the workspace for admin pages; strict also
  // rejects API routes, which only a full access may use through this guard.
  await enforceWorkspace(admin.workspaces, true);
  return admin;
}

/**
 * The signed-in admin's access level, or null if they aren't one. Does not
 * redirect: the layout renders for /admin/login too.
 */
export async function getAdminAccess(): Promise<(AccessInfo & { label: string | null }) | null> {
  const user = await getSessionUser();
  const email = user?.email?.toLowerCase();
  if (!email) return null;
  const row = await adminRecordFor(email);
  if (!row) return null;
  return { ...accessOf(row), label: typeof row.label === "string" ? (row.label as string) : null };
}

export async function getCurrentAdmin() {
  return getSessionUser();
}

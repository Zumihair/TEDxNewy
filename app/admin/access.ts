/**
 * What a sign-in can do.
 *
 * Everyone signed in can SEE every page except Settings. Two switches decide the rest:
 * - `canEdit`: add, edit, delete, send, move. Off means view only.
 * - `admin`: also opens Settings (access, team, notifications). Admins can always edit.
 *
 * Data and pure functions only (no server imports), so the server layout and the client
 * rail can both use it. Enforcement lives in `requireAdmin()` (lib/cms-auth.ts): a server
 * action or write request from a view-only sign-in is refused, and a Settings path needs
 * `admin`. This module decides what gets *rendered*, so the two must agree.
 */
import { NAV_GROUPS, workspaceForPath, type NavGroup } from "./nav-config";

export type AccessInfo = { admin: boolean; canEdit: boolean };

/** Whether a sign-in may open this path. */
export function canAccessPath(path: string, access: AccessInfo): boolean {
  if (access.admin) return true;
  return workspaceForPath(path)?.key !== "settings";
}

/** NAV_GROUPS with Settings left out for anyone who is not an admin. */
export function visibleGroupsFor(access: AccessInfo): NavGroup[] {
  return NAV_GROUPS.filter((g) => g.key !== "settings" || access.admin).map((g) => ({ ...g, items: g.items }));
}

/**
 * What each admin access level can reach.
 *
 * Data only, no server imports, so the server layout and the client sidebar
 * can both use it. The enforcement lives in `requireFullAdmin()`
 * (lib/cms-auth.ts) on every non-community page and action; this module only
 * decides what gets *rendered*, so the two must stay in agreement.
 *
 * Adding a new admin section? It's full-access by default. Only add it here
 * if a community admin should see it, and guard its page + actions with
 * `requireFullAdmin()` otherwise.
 */
import type { AdminAccess } from "@/lib/cms-auth";
import { NAV_GROUPS, type NavGroup } from "./nav-config";

/** Route prefixes a community-access admin may open. */
export const COMMUNITY_PREFIXES = [
  "/admin/emails",
  "/admin/calendar",
  "/admin/socials",
  "/admin/newsletter",
  "/admin/subscribers",
  "/admin/subscriber-flow",
];

export function canAccessPath(path: string, access: AdminAccess): boolean {
  if (access === "full") return true;
  if (path === "/admin") return true; // the dashboard, filtered down
  return COMMUNITY_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`),
  );
}

/** NAV_GROUPS with anything this level can't reach filtered out. */
export function visibleGroupsFor(access: AdminAccess): NavGroup[] {
  if (access === "full") return NAV_GROUPS;
  return NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => canAccessPath(i.href, access)),
  })).filter((g) => g.items.length > 0);
}

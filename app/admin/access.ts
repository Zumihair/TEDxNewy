/**
 * What each sign-in can reach, by workspace.
 *
 * Data and pure functions only (no server imports), so the server layout and
 * the client rail can both use it. A sign-in carries a list of workspace keys;
 * Home is always visible. Enforcement lives in `requireFullAdmin()`
 * (lib/cms-auth.ts), which reads the workspace for the request path; this
 * module decides what gets *rendered*, so the two must agree.
 *
 * Adding a new admin page? Put it in a workspace in nav-config.ts. A page that
 * belongs to no workspace is reachable by a full access only.
 */
import { NAV_GROUPS, workspaceForPath, type NavGroup } from "./nav-config";

export type AdminAccess = "full" | "community";

/** Every workspace key a sign-in can be granted (Home is always included). */
export const WORKSPACE_OPTIONS = [
  { key: "events", label: "Events" },
  { key: "comms", label: "Comms" },
  { key: "partners", label: "Partners" },
  { key: "inbox", label: "Inbox" },
  { key: "library", label: "Library" },
  { key: "settings", label: "Settings and access" },
] as const;

export const ALL_WORKSPACES: string[] = WORKSPACE_OPTIONS.map((w) => w.key);

/** What a sign-in with no explicit list can see, by its stored level. */
export const DEFAULT_WORKSPACES: Record<AdminAccess, string[]> = {
  full: ALL_WORKSPACES,
  community: ["comms", "library"],
};

export type AccessInfo = { level: AdminAccess; workspaces: string[] };

/** Whether a sign-in may open this path. */
export function canAccessPath(path: string, access: AccessInfo): boolean {
  if (path === "/admin") return true; // Home, filtered down
  if (access.level === "full") return true;
  const ws = workspaceForPath(path);
  return !!ws && access.workspaces.includes(ws.key);
}

/** NAV_GROUPS with anything this sign-in can't reach filtered out. */
export function visibleGroupsFor(access: AccessInfo): NavGroup[] {
  return NAV_GROUPS.filter((g) => g.key === "home" || access.level === "full" || access.workspaces.includes(g.key)).map(
    (g) => ({ ...g, items: g.items }),
  );
}

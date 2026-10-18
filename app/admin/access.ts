/**
 * What a sign-in can do.
 *
 * Everyone signed in can SEE every page except Settings. Each sign-in then has read or write for every
 * module (Events, Comms, Partners, Inbox, Resources), plus one `admin` switch that opens Settings
 * (access, team, notifications) and can write everywhere.
 *
 * Data and pure functions only (no server imports), so the server layout and the client shell can both
 * use it. Enforcement lives in `requireAdmin()` (lib/cms-auth.ts): a server action or write request
 * to a module the sign-in can only read is refused, and a Settings path needs `admin`. This module
 * decides what gets *rendered*, so the two must agree.
 */
import { NAV_GROUPS, workspaceForPath, type NavGroup } from "./nav-config";

/** The modules that carry read or write. Keys match the workspace keys in nav-config. */
export const MODULES = [
  { key: "events", label: "Events" },
  { key: "comms", label: "Comms" },
  { key: "partners", label: "Partners" },
  { key: "inbox", label: "Inbox" },
  { key: "library", label: "Resources" },
] as const;

export type ModuleKey = (typeof MODULES)[number]["key"];
/** true = can write in that module. */
export type ModuleAccess = Record<string, boolean>;

/** `canEdit` is "can write somewhere", used for things that belong to no single module. */
export type AccessInfo = { admin: boolean; canEdit: boolean; modules: ModuleAccess };

/** Whether a sign-in may write on this path. */
export function canWriteAt(path: string, access: AccessInfo): boolean {
  if (access.admin) return true;
  const key = workspaceForPath(path)?.key;
  if (key && MODULES.some((m) => m.key === key)) return !!access.modules[key];
  return access.canEdit;
}

/** Whether a sign-in may open this path. */
export function canAccessPath(path: string, access: AccessInfo): boolean {
  if (access.admin) return true;
  return workspaceForPath(path)?.key !== "settings";
}

/** NAV_GROUPS with Settings left out for anyone who is not an admin. */
export function visibleGroupsFor(access: Pick<AccessInfo, "admin">): NavGroup[] {
  return NAV_GROUPS.filter((g) => g.key !== "settings" || access.admin).map((g) => ({ ...g, items: g.items }));
}

/** A sign-in's modules as read from a stored value, falling back to one switch for older rows. */
export function modulesFrom(stored: unknown, fallbackWrite: boolean): ModuleAccess {
  const out: ModuleAccess = {};
  const obj = stored && typeof stored === "object" && !Array.isArray(stored) ? (stored as Record<string, unknown>) : null;
  for (const m of MODULES) out[m.key] = obj ? obj[m.key] === true : fallbackWrite;
  return out;
}

/** The per-module read or write choices posted by `ModulePermissions` (fields `mod_<key>`). */
export function modulesFromForm(form: FormData, admin: boolean): ModuleAccess {
  const out: ModuleAccess = {};
  for (const m of MODULES) out[m.key] = admin || !!form.get(`mod_${m.key}`);
  return out;
}

/** True when any module can be written. */
export function anyWrite(modules: ModuleAccess): boolean {
  return Object.values(modules).some(Boolean);
}

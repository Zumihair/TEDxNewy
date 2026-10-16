/**
 * Password sign-in for the admin. There is one shared Supabase account per
 * access level; the password someone types decides which level they get.
 * Roles are still enforced by cms_admins.access_level, exactly as before, so
 * every page and action guard is unchanged.
 *
 * The accounts and their passwords live in Supabase (Auth > Users), so
 * rotating a password is a dashboard change, not a deploy.
 */
import type { AdminAccess } from "./cms-auth";

export const ADMIN_ACCOUNTS: { email: string; access: AdminAccess; label: string }[] = [
  { email: "full@admin.tedxnewy.com.au", access: "full", label: "Full access" },
  { email: "community@admin.tedxnewy.com.au", access: "community", label: "Community access" },
];

export const accountLabel = (email?: string | null) =>
  ADMIN_ACCOUNTS.find((a) => a.email === email?.toLowerCase())?.label ?? email ?? "";

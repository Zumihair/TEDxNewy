import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase-server";
import { getAdminAccess, getSessionUser } from "@/lib/cms-auth";
import AdminShell from "./AdminShell";
import { visibleGroupsFor } from "./access";

export const metadata = {
  title: "Admin · TEDxNewy",
  robots: { index: false, follow: false },
};

async function signOut() {
  "use server";
  const supabase = await getServerSupabase();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getSessionUser();

  // /admin/login + /admin/auth/callback render full-bleed
  if (!user) return <>{children}</>;

  // Community admins only get the Community group in the sidebar. Both calls
  // are React-cached, so this shares the layout's auth round trip.
  const access = await getAdminAccess();
  const groups = visibleGroupsFor(access ?? "full");

  return (
    <AdminShell
      user={{ email: user.email }}
      groups={groups}
      signOutAction={signOut}
    >
      {children}
    </AdminShell>
  );
}

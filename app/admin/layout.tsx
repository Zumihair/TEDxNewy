import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase-server";
import AdminShell from "./AdminShell";

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
  const supabase = await getServerSupabase();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  // /admin/login + /admin/auth/callback render full-bleed
  if (!user) return <>{children}</>;

  return (
    <AdminShell user={{ email: user.email }} signOutAction={signOut}>
      {children}
    </AdminShell>
  );
}

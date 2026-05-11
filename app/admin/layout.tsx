import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { getServerSupabase } from "@/lib/supabase-server";
import AdminNav from "./AdminNav";

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
  // Pull the signed-in user so the chrome can show their email.
  // Middleware already redirected non-admins to /admin/login if not signed in.
  const supabase = await getServerSupabase();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  // Login + auth-callback pages render their own full-bleed UI;
  // don't wrap them in the admin chrome.
  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#f4efe6] text-[#141210]">
      <header className="border-b border-[rgba(20,18,16,0.08)] bg-white">
          <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-6 px-5 py-4 md:px-8">
            <div className="flex items-center gap-8">
              <Link
                href="/admin"
                className="font-mono text-[11px] font-semibold uppercase text-[#141210] transition-colors hover:text-[#e02214]"
                style={{ letterSpacing: "0.22em" }}
              >
                TEDxNewy Admin
              </Link>
              <AdminNav />
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="hidden text-[12.5px] font-medium text-[#6b6459] transition-colors hover:text-[#141210] sm:inline"
              >
                View site
              </Link>
              <span className="hidden text-[12.5px] text-[#6b6459] sm:inline">
                {user.email}
              </span>
              <form action={signOut}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-3.5 py-1.5 text-[12.5px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
                >
                  <LogOut className="h-3.5 w-3.5" strokeWidth={2.25} />
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </header>
      <div className="mx-auto max-w-[1240px] px-5 py-10 md:px-8 md:py-14">
        {children}
      </div>
    </div>
  );
}

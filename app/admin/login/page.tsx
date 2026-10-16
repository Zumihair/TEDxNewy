import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase-server";
import { ADMIN_ACCOUNTS } from "@/lib/admin-accounts";
import { Field } from "@/components/ds";

export const metadata = {
  title: "Admin · Sign in · TEDxNewy",
  robots: { index: false, follow: false },
};

const ERROR_COPY: Record<string, string> = {
  "not-admin": "That account isn't set up for admin access. Ask an existing admin.",
  wrong: "That password isn't right. Try again.",
  empty: "Enter the admin password.",
  default: "Something went wrong. Try again, or ping an existing admin.",
};

async function signIn(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");
  const safeNext = next.startsWith("/admin") ? next : "/admin";
  if (!password) redirect("/admin/login?error=empty");

  const supabase = await getServerSupabase();
  for (const account of ADMIN_ACCOUNTS) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: account.email,
      password,
    });
    if (!error && data.session) redirect(safeNext);
  }
  redirect(`/admin/login?error=wrong&next=${encodeURIComponent(safeNext)}`);
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const message = error ? (ERROR_COPY[error] ?? ERROR_COPY.default) : null;

  return (
    <main className="voice-product flex min-h-[100vh] items-center justify-center bg-white px-5 py-20">
      <div className="w-full max-w-[400px]">
        <Link href="/" className="text-[14px] font-medium text-[var(--stone)] hover:text-[var(--ink)]">
          ← TEDxNewy
        </Link>
        <h1 className="mt-8 text-[32px] font-semibold leading-[1.1] tracking-[-0.02em]">Admin sign in</h1>
        <p className="mt-3 text-[15px] leading-[1.6] text-[var(--stone)]">
          Enter the admin password. The password you use decides what you can see.
        </p>

        <form action={signIn} className="mt-8 space-y-4">
          <input type="hidden" name="next" value={next ?? "/admin"} />
          <Field
            label="Password"
            type="password"
            name="password"
            required
            autoFocus
            autoComplete="current-password"
            error={message ?? undefined}
          />
          <button type="submit" className="tx-btn tx-btn--accent tx-btn--lg tx-btn--block">
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}

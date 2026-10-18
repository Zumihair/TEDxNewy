import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase-server";
import { Field } from "@/components/ds";

export const metadata = {
  title: "Admin · Sign in · TEDxNewy",
  robots: { index: false, follow: false },
};

/** The two accounts from the first migration; used until the access migration is applied. */
const FALLBACK_LOGINS = ["full@admin.tedxnewy.com.au", "community@admin.tedxnewy.com.au"];

const ERROR_COPY: Record<string, string> = {
  "not-admin": "That account isn't set up for admin access. Ask an existing admin.",
  wrong: "That password isn't right. Try again.",
  empty: "Enter your password.",
  default: "Something went wrong. Try again, or ping an existing admin.",
};

async function signIn(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");
  const safeNext = next.startsWith("/admin") ? next : "/admin";
  if (!password) redirect("/admin/login?error=empty");

  const supabase = await getServerSupabase();
  const typedName = String(formData.get("name") ?? "").trim();
  if (typedName) {
    // A personal sign-in: the name picks the account (jake, or jake-hoppe), the password proves it.
    const slug = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const candidates = [...new Set([slug(typedName), slug(typedName.split(/\s+/)[0])])].filter(Boolean);
    let lastErr = "";
    for (const c of candidates) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: `${c}@admin.tedxnewy.com.au`, password });
      if (!error && data.session) redirect(safeNext);
      if (error && !/invalid login credentials/i.test(error.message)) lastErr = error.message;
    }
    if (lastErr) console.error("[admin/login] unexpected sign-in error:", lastErr);
    redirect(`/admin/login?error=${lastErr ? "default" : "wrong"}&next=${encodeURIComponent(safeNext)}`);
  }
  // Shared accesses: every access is its own account, and the password someone types picks which
  // one they get. The list comes from the database so new accesses work with no deploy.
  const { data: rows } = await supabase.rpc("admin_access_logins");
  const emails = [
    ...new Set([
      ...((rows ?? []) as { email: string }[]).map((r) => r.email),
      ...FALLBACK_LOGINS,
    ]),
  ].slice(0, 12);
  let lastError = "";
  for (const email of emails) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.session) redirect(safeNext);
    if (error && !/invalid login credentials/i.test(error.message)) lastError = error.message;
  }
  if (lastError) console.error("[admin/login] unexpected sign-in error:", lastError);
  if (lastError) redirect(`/admin/login?error=default&next=${encodeURIComponent(safeNext)}`);
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
          Enter your name and password. If you were given a shared password instead, leave the name blank.
        </p>

        <form action={signIn} className="mt-8 space-y-4">
          <input type="hidden" name="next" value={next ?? "/admin"} />
          <Field label="Name" type="text" name="name" autoFocus autoComplete="username" placeholder="Your first name" />
          <Field
            label="Password"
            type="password"
            name="password"
            required
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

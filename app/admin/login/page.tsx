import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getServerSupabase } from "@/lib/supabase-server";

export const metadata = {
  title: "Admin · Sign in · TEDxNewy",
  robots: { index: false, follow: false },
};

const ERROR_COPY: Record<string, string> = {
  "not-admin":
    "That email isn't on the admin list. Ask an existing admin to add you.",
  "no-email": "Your sign-in link didn't include an email. Try again.",
  "exchange-failed":
    "We couldn't exchange your sign-in link. It may have expired — request a new one.",
  default: "Something went wrong. Try again, or ping an existing admin.",
};

async function sendMagicLink(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const next = String(formData.get("next") ?? "/admin");
  if (!email) redirect("/admin/login?error=no-email");

  const supabase = await getServerSupabase();

  // Derive the absolute origin from request headers so the redirect works
  // in local dev, Vercel previews, and production alike.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/admin/auth/callback?next=${encodeURIComponent(next)}`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    console.error("[admin/login] OTP error", error);
    redirect("/admin/login?error=default");
  }

  redirect(`/admin/login?sent=${encodeURIComponent(email)}`);
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    sent?: string;
    next?: string;
  }>;
}) {
  const { error, sent, next } = await searchParams;
  const message = error ? (ERROR_COPY[error] ?? ERROR_COPY.default) : null;

  return (
    <main className="relative flex min-h-[100vh] items-center justify-center overflow-hidden bg-[#2a0604] px-5 py-20 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 30%, rgba(224,34,20,0.30), transparent 70%)",
        }}
      />
      <div className="relative z-10 w-full max-w-[440px]">
        <Link
          href="/"
          className="font-mono text-[10.5px] font-semibold uppercase text-white/55 transition-colors hover:text-white"
          style={{ letterSpacing: "0.24em" }}
        >
          ← TEDxNewy
        </Link>
        <h1
          className="mt-8 font-sans tracking-[-0.025em] text-white balance"
          style={{
            fontSize: "clamp(2rem, 4vw, 2.75rem)",
            lineHeight: 1.04,
            fontWeight: 500,
            fontVariationSettings: '"opsz" 144',
          }}
        >
          Admin sign in.
        </h1>
        <p className="mt-4 max-w-[40ch] text-[15px] leading-[1.6] text-white/75">
          Enter your TEDxNewy email. We&rsquo;ll send you a one-time sign-in
          link — no password to remember.
        </p>

        {sent ? (
          <div className="mt-10 rounded-[var(--radius-md)] border border-white/15 bg-white/[0.04] p-6">
            <div
              className="font-mono text-[10.5px] font-semibold uppercase text-[#ff9b8f]"
              style={{ letterSpacing: "0.24em" }}
            >
              Check your inbox
            </div>
            <p className="mt-3 text-[15px] leading-[1.55] text-white/85">
              We&rsquo;ve sent a sign-in link to{" "}
              <strong className="text-white">{sent}</strong>. Open it on this
              device to land in the admin.
            </p>
            <Link
              href="/admin/login"
              className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-white/80 hover:text-white"
            >
              Use a different email
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} />
            </Link>
          </div>
        ) : (
          <form action={sendMagicLink} className="mt-10 space-y-4">
            <input type="hidden" name="next" value={next ?? "/admin"} />
            <label className="block">
              <span
                className="font-mono text-[10.5px] font-semibold uppercase text-white/55"
                style={{ letterSpacing: "0.24em" }}
              >
                Email
              </span>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="you@tedxnewy.com.au"
                className="mt-2 block w-full rounded-[var(--radius-md)] border border-white/15 bg-white/[0.06] px-4 py-3.5 text-[15.5px] text-white placeholder:text-white/35 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-[#e02214]/30"
              />
            </label>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#e02214] px-7 py-3.5 font-sans text-[14.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404]"
            >
              Send sign-in link
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </form>
        )}

        {message && (
          <div
            className="mt-6 rounded-[var(--radius-md)] border border-[#e02214]/30 bg-[#e02214]/10 px-4 py-3 text-[13.5px] text-white/90"
            role="alert"
          >
            {message}
          </div>
        )}

        <p className="mt-10 max-w-[44ch] text-[12.5px] leading-[1.6] text-white/45">
          Only allowlisted emails can sign in. Need access? Ask an existing
          admin to add you to <code className="text-white/65">cms_admins</code>.
        </p>
      </div>
    </main>
  );
}

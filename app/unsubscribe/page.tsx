import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import SectionKicker from "@/components/SectionKicker";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { confirmUnsubscribe } from "./actions";

export const metadata = {
  title: "Unsubscribe · TEDxNewy",
  robots: { index: false, follow: false },
};

type View = "confirm" | "done" | "already" | "invalid" | "error";

async function resolveView(
  token: string,
  state: string | undefined,
): Promise<View> {
  if (state === "done") return "done";
  if (state === "error") return "error";
  if (!token) return "invalid";
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("subscribers")
      .select("unsubscribed_at")
      .eq("unsubscribe_token", token)
      .maybeSingle();
    if (error || !data) return "invalid";
    return data.unsubscribed_at ? "already" : "confirm";
  } catch (err) {
    console.error("[unsubscribe] lookup failed", err);
    return "error";
  }
}

const COPY: Record<View, { title: string; body: string }> = {
  confirm: {
    title: "Unsubscribe?",
    body: "Confirm below and we will stop sending you the TEDxNewy newsletter. You can always resubscribe later.",
  },
  done: {
    title: "You're unsubscribed.",
    body: "You won't receive the TEDxNewy newsletter anymore. Changed your mind? You can resubscribe any time.",
  },
  already: {
    title: "Already unsubscribed.",
    body: "This address is already off the newsletter list. There is nothing more to do.",
  },
  invalid: {
    title: "Link not recognised.",
    body: "This unsubscribe link is invalid or has expired. If you keep getting emails, contact us and we will sort it out.",
  },
  error: {
    title: "Something went wrong.",
    body: "We couldn't process that just now. Please try again in a moment.",
  },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; state?: string }>;
}) {
  const { token = "", state } = await searchParams;
  const view = await resolveView(token, state);
  const c = COPY[view];

  return (
    <section className="relative overflow-hidden bg-[var(--color-cream)] pt-40 pb-32">
      <div className="relative mx-auto max-w-[720px] px-5 md:px-6">
        <SectionKicker label="Newsletter" />
        <h1
          className="mt-6 font-sans font-bold leading-[0.98] tracking-[-0.02em]"
          style={{ fontSize: "clamp(2.25rem, 6vw, 3.75rem)" }}
        >
          {c.title.split(".")[0]}
          {c.title.includes(".") && (
            <span style={{ color: "#e62b1e", fontStyle: "italic" }}>.</span>
          )}
        </h1>
        <p className="mt-7 max-w-xl text-[17px] leading-[1.65] text-[#3d342e] md:text-[18.5px]">
          {c.body}
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          {view === "confirm" && (
            <form action={confirmUnsubscribe}>
              <input type="hidden" name="token" value={token} />
              <button type="submit" className="btn-primary">
                Unsubscribe me
              </button>
            </form>
          )}
          {(view === "done" || view === "already" || view === "invalid") && (
            <Link href="/subscribe" className="btn-secondary">
              Resubscribe
              <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
          )}
          <Link href="/" className="btn-secondary">
            Back to home
            <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </section>
  );
}

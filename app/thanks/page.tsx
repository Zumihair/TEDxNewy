import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import SectionKicker from "@/components/SectionKicker";
import RedCircle from "@/components/RedCircle";

export const metadata = { title: "Thanks · TEDxNewy" };

const copy: Record<string, { title: string; body: string }> = {
  subscribe: {
    title: "You're on the list.",
    body: "We'll email you the moment the next event is announced. No spam, no sponsor blasts. Just a heads-up when there's something worth your time.",
  },
  contact: {
    title: "Message received.",
    body: "We're 100% volunteer-run, so it may take us up to a week to respond. Thanks for getting in touch.",
  },
  tickets: {
    title: "You're on the list.",
    body: "We'll email you the moment booking opens for the next event. That's a promise — no spam, no sponsor blasts, just the heads-up.",
  },
  nominate: {
    title: "Nomination received.",
    body: "Our curation committee reads every word. You'll hear back within six weeks — yes or no — we promise never to leave a nomination on read.",
  },
  apply: {
    title: "Application in.",
    body: "We review applications monthly. Someone from the relevant crew will be in touch within four weeks to chat about next steps.",
  },
  partner: {
    title: "Enquiry received.",
    body: "Thanks for considering TEDxNewy. We'll be back within a week with the 2026 partner pack and a time to chat.",
  },
};

export default async function ThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string }>;
}) {
  const { source } = await searchParams;
  const c = copy[source ?? ""] ?? {
    title: "Got it.",
    body: "Thanks for getting in touch with TEDxNewy.",
  };

  return (
    <section className="relative overflow-hidden bg-[var(--color-cream)] pt-40 pb-32">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full animate-float-slow"
        style={{
          background:
            "radial-gradient(circle, rgba(230,43,30,0.14), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 bottom-[-120px] h-[420px] w-[420px] rounded-full animate-float"
        style={{
          background:
            "radial-gradient(circle, rgba(216,150,69,0.18), transparent 70%)",
        }}
      />

      <div className="relative mx-auto grid max-w-[1240px] items-center gap-14 px-5 md:grid-cols-[1.2fr_1fr] md:px-6">
        <div>
          <SectionKicker label="Thank you" />
          <h1
            className="hero-entrance hero-delay-1 mt-6 font-sans font-bold leading-[0.95] tracking-[-0.02em]"
            style={{ fontSize: "clamp(2.75rem, 7vw, 5rem)" }}
          >
            {c.title.split(".")[0]}
            {c.title.includes(".") && (
              <span style={{ color: "#e62b1e", fontStyle: "italic" }}>.</span>
            )}
          </h1>
          <p className="hero-entrance hero-delay-2 mt-7 max-w-xl text-[17px] leading-[1.65] text-[#3d342e] md:text-[18.5px]">
            {c.body}
          </p>
          <div className="hero-entrance hero-delay-3 mt-10 flex flex-wrap gap-3">
            <Link href="/" className="btn-primary">
              Back to home
              <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
            <Link href="/watch" className="btn-secondary">
              Watch while you wait
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <RedCircle size={360} />
          <div className="absolute font-mono text-[11px] font-bold uppercase text-white" style={{ letterSpacing: "0.22em" }}>
            · TEDxNewy ·
          </div>
        </div>
      </div>
    </section>
  );
}

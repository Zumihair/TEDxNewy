import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Calendar, Mic, Sparkles } from "lucide-react";
import { ORG } from "@/lib/data";

export const metadata = {
  title: "Get the next idea first · TEDxNewy",
  description:
    "Subscribe to TEDxNewy. Be first to know when each new talk drops, when tickets go live, and when new events are announced.",
  openGraph: {
    title: "Get the next idea first — TEDxNewy",
    description:
      "Be first to know when each new TEDxNewy talk goes live and when new events are announced.",
  },
};

export default function SubscribePage() {
  return (
    <main
      className="relative min-h-[100vh] overflow-hidden text-white"
      style={{ background: "#2a0604" }}
    >
      {/* Spotlight glow — static, performant, no JS */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "50%",
          top: "30%",
          width: "min(120vw, 1500px)",
          height: "min(120vw, 1500px)",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle at 50% 50%, #ff3626 0%, #e11905 12%, #b91404 30%, rgba(138,13,5,0.65) 52%, rgba(42,6,4,0) 75%)",
          opacity: 0.85,
        }}
      />
      <div className="grain pointer-events-none absolute inset-0 opacity-50" />

      <div className="relative z-10 mx-auto flex min-h-[100vh] max-w-[680px] flex-col px-5 pb-16 pt-10 md:px-6 md:pb-20 md:pt-16">
        {/* Top mark */}
        <Link
          href="/"
          aria-label="TEDxNewy home"
          className="inline-flex w-fit items-center self-start opacity-95 transition-opacity hover:opacity-100"
        >
          <Image
            src="/brand/tedxnewy-white.png"
            alt="TEDxNewy"
            width={680}
            height={170}
            priority
            className="h-7 w-auto md:h-8"
          />
        </Link>

        <div className="flex flex-1 flex-col justify-center py-12 md:py-16">
          <div
            className="font-mono text-[10.5px] font-semibold uppercase text-[#ff9b8f]"
            style={{ letterSpacing: "0.28em" }}
          >
            Subscribe
          </div>

          <h1
            className="mt-5 font-sans tracking-[-0.03em] text-white balance"
            style={{
              fontSize: "clamp(2.5rem, 8vw, 4.5rem)",
              lineHeight: 0.98,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            Get the next idea first.
          </h1>

          <p className="mt-7 max-w-[44ch] text-[16.5px] leading-[1.6] text-white/85 md:text-[17.5px]">
            TEDxNewy publishes Newcastle&rsquo;s sharpest ideas through 2026.
            Subscribe and we&rsquo;ll email you the moment each talk lands and
            each new event is announced. No spam, no sponsor blasts.
          </p>

          {/* Bullet list — quick value prop */}
          <ul className="mt-9 space-y-4">
            <Promise
              icon={<Mic className="h-4 w-4" strokeWidth={2.25} />}
              text="New talks the moment they hit YouTube"
            />
            <Promise
              icon={<Calendar className="h-4 w-4" strokeWidth={2.25} />}
              text="First access when new events are announced"
            />
            <Promise
              icon={<Sparkles className="h-4 w-4" strokeWidth={2.25} />}
              text="Occasional behind-the-scenes from the crew"
            />
          </ul>

          {/* The form */}
          <form
            action="/api/subscribe"
            method="post"
            className="mt-10 flex flex-col gap-3"
          >
            <label htmlFor="subscribe-email" className="sr-only">
              Email
            </label>
            <input
              id="subscribe-email"
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full rounded-full border border-white/15 bg-white/[0.06] px-6 py-4 text-[16px] text-white placeholder:text-white/40 focus:border-white/35 focus:outline-none focus:ring-2 focus:ring-[#e02214]/40 md:text-[16.5px]"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 font-sans text-[15px] font-semibold text-[#2a0604] transition-all hover:-translate-y-0.5 hover:bg-[#ffe9e6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#2a0604]"
            >
              Sign me up
              <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <p className="mt-2 text-center text-[12px] text-white/55">
              One-tap unsubscribe in every email.
            </p>
          </form>
        </div>

        {/* Foot */}
        <footer className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-[12.5px] text-white/55 sm:flex-row sm:items-center">
          <Link
            href="/"
            className="font-mono uppercase transition-colors hover:text-white"
            style={{ letterSpacing: "0.22em" }}
          >
            ← Back to tedxnewy.com.au
          </Link>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href={`https://instagram.com/${ORG.handles.instagram.replace(/^@/, "")}`}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-white"
            >
              Instagram
            </a>
            <a
              href={`mailto:${ORG.email}`}
              className="transition-colors hover:text-white"
            >
              {ORG.email}
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}

function Promise({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <li className="flex items-center gap-3 text-[15px] text-white/85">
      <span
        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] text-white"
        aria-hidden
      >
        {icon}
      </span>
      <span>{text}</span>
    </li>
  );
}

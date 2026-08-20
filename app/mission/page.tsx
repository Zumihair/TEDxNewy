import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { CSSProperties } from "react";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import { ORG } from "@/lib/data";

export const metadata = {
  alternates: { canonical: "/mission" },
  title: "Mission · TEDxNewy",
  description:
    "TEDxNewy is an independently licensed TED event in Newcastle, Australia, formerly TEDxCooksHill, on Awabakal and Worimi Country.",
};

const events = [
  { year: "2024", theme: "Beyond Boundaries", venue: "The Playhouse", org: "TEDxCooksHill" },
  { year: "2025", theme: "Reframe", venue: "Conservatorium of Music", org: "TEDxCooksHill" },
  { year: "2026", theme: "Newcastle 2050: What If? · Salon", venue: "Q Building, Honeysuckle", org: "TEDxNewy" },
];

const pillars = [
  {
    label: "Connect",
    body: "A community of curious Novocastrians, engaging with ideas and each other.",
  },
  {
    label: "Inspire",
    body: "Speakers who challenge, influence and evoke the conversations that matter.",
  },
  {
    label: "Discover",
    body: "Deeper understanding of our city, our region and the world, through curiosity and wonder.",
  },
  {
    label: "Volunteer-driven",
    body: "100% volunteer-run, not-for-profit. Every dollar goes back into the stage and the speakers.",
  },
  {
    label: "Local",
    body: "We celebrate the brilliance and quiet invention of Newcastle, on Awabakal and Worimi Country.",
  },
  {
    label: "Impact",
    body: "Ideas can shift attitudes, transform lives, and ultimately change everything.",
  },
];

export default function AboutPage() {
  return (
    <>
      <BreadcrumbJsonLd name="About" path="/mission" />

      {/* HERO — the homepage's dark-room-and-spotlight language, sized for a
          subpage rather than a full-screen landing. Static glow (no cursor
          tracking) so the page stays a server component. Nav.tsx lists
          /mission as a dark-hero route so the top bar renders white content
          while transparent over this. */}
      <section
        className="relative overflow-hidden"
        style={{ background: "#2a0604" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-1/2"
          style={
            {
              width: "min(110vw, 1500px)",
              height: "min(70vh, 110vw, 1500px)",
              background:
                "radial-gradient(circle closest-side at 50% 50%, rgba(255,54,38,0.85) 0%, rgba(225,25,5,0.75) 18%, #b91404 38%, rgba(138,13,5,0.55) 62%, rgba(42,6,4,0) 100%)",
            } as CSSProperties
          }
        />
        <div className="grain pointer-events-none absolute inset-0 opacity-50" />

        <div className="relative z-10 mx-auto w-full max-w-[1240px] px-6 pb-24 pt-40 text-center md:px-10 md:pb-32 md:pt-48">
          <div
            className="hero-entrance hero-delay-1 text-[10.5px] font-semibold uppercase text-[#ff9b8f]"
            style={{ letterSpacing: "0.28em" }}
          >
            About TEDxNewy
          </div>
          <h1
            className="hero-entrance hero-delay-2 mx-auto mt-7 max-w-[16ch] font-sans font-normal tracking-[-0.035em] text-white balance"
            style={{
              fontSize: "clamp(2.75rem, 7vw, 6rem)",
              lineHeight: 0.98,
              fontWeight: 400,
            }}
          >
            Bringing the spirit of TED to Newcastle.
          </h1>
          <p
            className="hero-entrance hero-delay-3 mx-auto mt-9 max-w-[52ch] font-sans font-normal text-white/90"
            style={{ fontSize: "clamp(1.05rem, 1.5vw, 1.25rem)", lineHeight: 1.55 }}
          >
            TEDxNewy is an independently licensed TED event in Newcastle,
            Australia, on Awabakal and Worimi Country. We rebranded from
            TEDxCooksHill in 2026.
          </p>
          <p
            className="hero-entrance hero-delay-4 mx-auto mt-4 max-w-[52ch] font-sans font-normal text-white/70"
            style={{ fontSize: "clamp(0.95rem, 1.3vw, 1.1rem)", lineHeight: 1.6 }}
          >
            We seek to discover and share powerful ideas that spark
            imagination, embrace possibility, and create meaningful change
            in&nbsp;Newcastle.
          </p>
        </div>
      </section>

      {/* SIX PILLARS — dark maroon with the soft glow motif ============== */}
      <section className="relative overflow-hidden bg-[#3d0a05] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: "min(96vw, 1120px)",
            height: "min(64vw, 640px)",
            background:
              "radial-gradient(ellipse at center, rgba(255,54,38,0.32) 0%, rgba(224,34,20,0.18) 24%, rgba(138,13,5,0.1) 50%, rgba(42,6,4,0) 74%)",
          }}
        />
        <div className="grain pointer-events-none absolute inset-0 opacity-25" />

        <div className="relative mx-auto max-w-[1240px] px-5 py-24 md:px-10 md:py-32">
          <div
            className="text-[10.5px] font-semibold uppercase text-[#ff9b8f]"
            style={{ letterSpacing: "0.28em" }}
          >
            What we stand for
          </div>
          <h2
            className="mt-6 max-w-[20ch] font-sans tracking-[-0.025em] text-white balance"
            style={{
              fontSize: "clamp(2.25rem, 4.5vw, 3.5rem)",
              lineHeight: 1.02,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            Six things we promise.
          </h2>
          <ul className="mt-14 grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2 md:mt-16 md:grid-cols-3">
            {pillars.map((p, i) => (
              <li key={p.label}>
                <div
                  className="font-mono text-[10.5px] font-semibold uppercase text-[#ff9b8f]"
                  style={{ letterSpacing: "0.22em" }}
                >
                  {String(i + 1).padStart(2, "0")} · {p.label}
                </div>
                <p className="mt-3.5 text-[15.5px] leading-[1.6] text-white/80">
                  {p.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* WHAT IS TEDx — cream relief section ============================ */}
      <section className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
        <div
          className="text-[10.5px] font-semibold uppercase text-[#b91404]"
          style={{ letterSpacing: "0.24em" }}
        >
          About the TEDx programme
        </div>
        <h2
          className="mt-5 max-w-[24ch] font-sans tracking-[-0.025em] text-[#141210] balance"
          style={{
            fontSize: "clamp(1.85rem, 3.6vw, 2.75rem)",
            lineHeight: 1.05,
            fontWeight: 500,
            fontVariationSettings: '"opsz" 144',
          }}
        >
          What is a TEDx event?
        </h2>
        <p className="mt-6 text-[16.5px] leading-[1.7] text-[#2a2521] md:text-[17.5px]">
          In the spirit of <strong>ideas worth spreading</strong>, TEDx is a
          programme of local, self-organised events that bring people together
          to share a TED-like experience. At a TEDx event, TED Talks video
          and live speakers combine to spark deep discussion and connection.
          These local, self-organised events are branded TEDx, where{" "}
          <em>x = independently organised TED event</em>. The TED Conference
          provides general guidance for the TEDx programme, but individual
          TEDx events, like ours, are self-organised.
        </p>
        <a
          href="https://www.ted.com/about/programs-initiatives/tedx-program"
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex items-center gap-1.5 text-[14.5px] font-medium text-[#b91404]"
        >
          Learn more about TEDx
          <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
        </a>
      </section>

      {/* EVENTS ========================================================= */}
      <section className="bg-[#f9f5ec]">
        <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
          <div
            className="text-[10.5px] font-semibold uppercase text-[#b91404]"
            style={{ letterSpacing: "0.24em" }}
          >
            The events
          </div>
          <h2
            className="mt-5 max-w-[24ch] font-sans tracking-[-0.025em] text-[#141210] balance"
            style={{
              fontSize: "clamp(1.85rem, 3.6vw, 2.75rem)",
              lineHeight: 1.05,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            What we&rsquo;ve staged so far.
          </h2>

          <ul className="mt-12 divide-y divide-[rgba(20,18,16,0.10)]">
            {events.map((e) => (
              <li
                key={`${e.year}-${e.theme}`}
                className="grid grid-cols-1 gap-3 py-7 md:grid-cols-[120px_1fr] md:items-baseline md:gap-10 md:py-9"
              >
                <div
                  className="font-sans tracking-[-0.02em] text-[#141210]"
                  style={{
                    fontSize: "clamp(1.85rem, 3vw, 2.25rem)",
                    lineHeight: 1,
                    fontWeight: 500,
                    fontVariationSettings: '"opsz" 144',
                  }}
                >
                  {e.year}
                </div>
                <div>
                  <div className="font-sans text-[18px] font-medium tracking-[-0.01em] text-[#141210]">
                    {e.theme}
                  </div>
                  <div
                    className="mt-1.5 font-mono text-[10.5px] font-semibold uppercase text-[#6b6459]"
                    style={{ letterSpacing: "0.22em" }}
                  >
                    {e.org} · {e.venue}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* GET INVOLVED =================================================== */}
      <section className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
        <h2
          className="max-w-[24ch] font-sans tracking-[-0.025em] text-[#141210] balance"
          style={{
            fontSize: "clamp(1.75rem, 3.4vw, 2.5rem)",
            lineHeight: 1.05,
            fontWeight: 500,
            fontVariationSettings: '"opsz" 144',
          }}
        >
          Want to nominate a speaker or join the crew?
        </h2>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/speak"
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(20,18,16,0.18)] px-6 py-3 font-sans text-[14px] font-medium text-[#141210] transition-colors hover:border-[#141210] hover:bg-[#141210] hover:text-white"
          >
            Nominate a speaker
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </Link>
          <Link
            href="/volunteer"
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(20,18,16,0.18)] px-6 py-3 font-sans text-[14px] font-medium text-[#141210] transition-colors hover:border-[#141210] hover:bg-[#141210] hover:text-white"
          >
            Join the crew
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </Link>
          <Link
            href="/sponsors"
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(20,18,16,0.18)] px-6 py-3 font-sans text-[14px] font-medium text-[#141210] transition-colors hover:border-[#141210] hover:bg-[#141210] hover:text-white"
          >
            Partner with us
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </section>

      {/* COUNTRY — deep red close, the acknowledgement given real weight = */}
      <section className="bg-[#2a0604] text-white">
        <div className="mx-auto max-w-[760px] px-5 py-24 md:px-6 md:py-32">
          <div
            className="text-[10.5px] font-semibold uppercase text-[#ff9b8f]"
            style={{ letterSpacing: "0.28em" }}
          >
            Country
          </div>
          <p
            className="mt-6 font-sans tracking-[-0.02em] text-white balance"
            style={{
              fontSize: "clamp(1.6rem, 2.8vw, 2.25rem)",
              lineHeight: 1.25,
              fontWeight: 400,
            }}
          >
            {ORG.acknowledgment}
          </p>
        </div>
      </section>
    </>
  );
}

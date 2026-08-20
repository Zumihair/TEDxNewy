import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { CSSProperties } from "react";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import PhotoFill from "@/components/PhotoFill";
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

/** Quick links along the bottom of the hero, echoing the homepage ticker. */
const TICKER_LINKS = [
  { href: "/speak", label: "Nominate a speaker" },
  { href: "/volunteer", label: "Join the crew" },
  { href: "/sponsors", label: "Partner with us" },
];

export default function AboutPage() {
  return (
    <>
      <BreadcrumbJsonLd name="About" path="/mission" />

      {/* HERO — dark room + spotlight, same visual language as the homepage.
          The spotlight here is static (no cursor tracking) so the page stays a
          server component. Nav.tsx lists /mission as a dark-hero route so the
          top bar renders white content while transparent over this. */}
      <section
        className="relative flex min-h-[88vh] items-center justify-center overflow-hidden"
        style={{ background: "#2a0604" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={
            {
              width: "min(115vw, 1700px)",
              height: "min(75vh, 115vw, 1700px)",
              background:
                "radial-gradient(circle closest-side at 50% 50%, #ff3626 0%, #e11905 18%, #b91404 38%, rgba(138,13,5,0.6) 62%, rgba(42,6,4,0) 100%)",
            } as CSSProperties
          }
        />
        <div className="grain pointer-events-none absolute inset-0 opacity-50" />

        <div className="relative z-10 w-full max-w-[1240px] px-6 pb-32 pt-40 text-center md:px-10">
          <div
            className="hero-entrance hero-delay-1 text-[10.5px] font-semibold uppercase text-[#ff9b8f]"
            style={{ letterSpacing: "0.28em" }}
          >
            About TEDxNewy
          </div>
          <h1
            className="hero-entrance hero-delay-2 mx-auto mt-7 max-w-[16ch] font-sans font-normal tracking-[-0.035em] text-white balance"
            style={{
              fontSize: "clamp(3rem, 8.5vw, 7.5rem)",
              lineHeight: 0.98,
              fontWeight: 400,
            }}
          >
            Bringing the spirit of TED to Newcastle.
          </h1>
          <p
            className="hero-entrance hero-delay-3 mx-auto mt-10 max-w-[52ch] font-sans font-normal text-white/90"
            style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.3rem)", lineHeight: 1.55 }}
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

        {/* Bottom ticker — ways in, mirroring the homepage hero's quick links */}
        <div className="hero-entrance hero-delay-5 absolute inset-x-0 bottom-0 border-t border-white/15 bg-black/15 backdrop-blur-sm">
          <div className="mx-auto grid max-w-[1440px] grid-cols-1 divide-y divide-white/10 md:grid-cols-3 md:divide-y-0 md:divide-x">
            {TICKER_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="group flex items-center justify-between gap-3 px-6 py-4 text-[11.5px] font-medium uppercase tracking-[0.14em] text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white md:justify-center md:px-8 md:py-5"
              >
                <span>{l.label}</span>
                <ArrowUpRight
                  className="h-3.5 w-3.5 shrink-0 text-white/50 transition-colors group-hover:text-[#ff9b8f]"
                  strokeWidth={2.5}
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SIX PILLARS — dark maroon with the spotlight glow motif ========= */}
      <section className="relative overflow-hidden bg-[#3d0a05] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: "min(96vw, 1120px)",
            height: "min(64vw, 640px)",
            background:
              "radial-gradient(ellipse at center, rgba(255,54,38,0.4) 0%, rgba(224,34,20,0.22) 24%, rgba(138,13,5,0.12) 50%, rgba(42,6,4,0) 74%)",
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
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
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

      {/* STATS — red accent band, same treatment as the homepage ======== */}
      <section className="bg-[#e02214] text-white">
        <div className="mx-auto max-w-[1240px] px-5 py-20 md:px-10 md:py-24">
          <div className="grid grid-cols-2 gap-y-12 sm:grid-cols-4 md:gap-x-10">
            <Stat value="5" label="Events" sub="Since 2024" />
            <Stat value="2026" label={<>Rebranded to<br />TEDxNewy</>} sub="From TEDxCooksHill" />
            <Stat value="100" suffix="%" label="Volunteer-run" sub="Not-for-profit" />
            <Stat value="2M" suffix="+" label="Cumulative talk views" sub="Online" />
          </div>
        </div>
      </section>

      {/* WHAT IS TEDx — dark two-column, mirrors the homepage section ==== */}
      <section className="bg-[#3d0a05] text-white">
        <div className="mx-auto max-w-[1240px] px-5 py-20 md:px-10 md:py-24">
          <div className="grid gap-10 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-4">
              <div
                className="text-[10.5px] font-semibold uppercase text-[#ff9b8f]"
                style={{ letterSpacing: "0.28em" }}
              >
                About the TEDx programme
              </div>
              <h2
                className="mt-6 max-w-[16ch] font-sans tracking-[-0.025em] text-white balance"
                style={{
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                  lineHeight: 1.05,
                  fontWeight: 500,
                  fontVariationSettings: '"opsz" 144',
                }}
              >
                What is a TEDx event?
              </h2>
            </div>
            <div className="md:col-span-8">
              <p className="text-[16.5px] leading-[1.7] text-white/85 md:text-[17.5px]">
                In the spirit of <strong>ideas worth spreading</strong>, TEDx
                is a programme of local, self-organised events that bring
                people together to share a TED-like experience. At a TEDx
                event, TED Talks video and live speakers combine to spark deep
                discussion and connection. These local, self-organised events
                are branded TEDx, where{" "}
                <em>x = independently organised TED event</em>.
              </p>
              <p className="mt-5 text-[16.5px] leading-[1.7] text-white/85 md:text-[17.5px]">
                The TED Conference provides general guidance for the TEDx
                programme, but individual TEDx events, like ours, are
                self-organised.
              </p>
              <a
                href="https://www.ted.com/about/programs-initiatives/tedx-program"
                target="_blank"
                rel="noreferrer"
                className="mt-7 inline-flex items-center gap-2 text-[14.5px] font-medium text-white"
              >
                <span>Learn more about TEDx</span>
                <span
                  aria-hidden
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e02214]"
                  style={{ boxShadow: "0 8px 22px rgba(224, 34, 20, 0.35)" }}
                >
                  <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* EVENTS — cream relief section, the timeline keeps its shape ===== */}
      <section className="bg-[var(--color-cream)]">
        <div className="mx-auto max-w-[1240px] px-5 py-24 md:px-10 md:py-32">
          <div
            className="text-[10.5px] font-semibold uppercase text-[#b91404]"
            style={{ letterSpacing: "0.24em" }}
          >
            The events
          </div>
          <h2
            className="mt-6 max-w-[20ch] font-sans tracking-[-0.025em] text-[#141210] balance"
            style={{
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              lineHeight: 1.02,
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
                className="grid grid-cols-1 gap-3 py-7 md:grid-cols-[140px_1fr] md:items-baseline md:gap-10 md:py-9"
              >
                <div
                  className="font-sans tracking-[-0.02em] text-[#141210]"
                  style={{
                    fontSize: "clamp(1.85rem, 3vw, 2.5rem)",
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

      {/* GET INVOLVED — photo cards on dark, mirrors homepage Participate */}
      <section className="relative overflow-hidden bg-[#3d0a05] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: "min(120vw, 1600px)",
            height: "min(80vw, 800px)",
            background:
              "radial-gradient(ellipse at center, rgba(255,54,38,0.4) 0%, rgba(138,13,5,0.12) 40%, rgba(42,6,4,0) 70%)",
          }}
        />
        <div className="relative mx-auto max-w-[1240px] px-5 py-24 md:px-10 md:py-32">
          <h2
            className="font-sans tracking-[-0.025em] text-white"
            style={{
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              lineHeight: 1.02,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            Be part of it.
          </h2>
          <p className="mt-6 text-[16.5px] leading-[1.65] text-white/80">
            TEDxNewy is built by Novocastrians, for Novocastrians. Pick a way
            in. We&rsquo;d love to hear from you.
          </p>

          <ul className="-mx-5 mt-14 flex snap-x snap-mandatory scroll-pl-5 gap-5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] md:mx-0 md:scroll-pl-0 md:mt-16 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden">
            <li className="snap-start shrink-0 basis-[82%] sm:basis-[55%] md:basis-auto">
              <InvolvedCard
                href="/volunteer"
                title="Volunteer with us"
                body="Six crews, year-round roles. No experience needed, just reliability and curiosity."
                image="/images/stage-dialogue.jpg"
                gradient="linear-gradient(135deg, #1f4a5c 0%, #0c2430 60%, #050f15 100%)"
              />
            </li>
            <li className="snap-start shrink-0 basis-[82%] sm:basis-[55%] md:basis-auto">
              <InvolvedCard
                href="/partner"
                title="Partner with us"
                body="Back the speakers, the stage and the next generation of Novocastrian storytellers."
                image="/images/stage-benjie.jpg"
                gradient="linear-gradient(135deg, #2a0604 0%, #8c0d05 50%, #b91404 100%)"
              />
            </li>
            <li className="snap-start shrink-0 basis-[82%] sm:basis-[55%] md:basis-auto">
              <InvolvedCard
                href="/speak"
                title="Nominate a speaker"
                body="Know someone with an idea worth spreading? Tell us before we hear it elsewhere."
                image="/images/stage-welcome.jpg"
                gradient="linear-gradient(135deg, #2a3a88 0%, #1f1f4a 50%, #050818 100%)"
              />
            </li>
          </ul>
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

function Stat({
  value,
  suffix,
  label,
  sub,
}: {
  value: string;
  suffix?: string;
  label: React.ReactNode;
  sub?: string;
}) {
  return (
    <div>
      <div
        className="font-sans leading-[0.9] tracking-[-0.04em] text-white"
        style={{
          fontSize: "clamp(2.6rem, 6.5vw, 5rem)",
          fontWeight: 500,
          fontVariationSettings: '"opsz" 144',
        }}
      >
        <span className="tabular">{value}</span>
        {suffix && <span className="text-[#3d0a05]">{suffix}</span>}
      </div>
      <div className="mt-5 font-sans text-[14.5px] font-medium leading-[1.3] text-white">
        {label}
      </div>
      {sub && (
        <div
          className="mt-1.5 font-mono text-[10.5px] font-semibold uppercase text-white/75"
          style={{ letterSpacing: "0.2em" }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function InvolvedCard({
  href,
  title,
  body,
  image,
  gradient,
}: {
  href: string;
  title: string;
  body: string;
  image?: string;
  gradient?: string;
}) {
  return (
    <Link
      href={href}
      className="group relative block aspect-[4/5] overflow-hidden rounded-[var(--radius-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e02214]/40"
      style={{ background: gradient }}
    >
      {image && (
        <PhotoFill
          src={image}
          alt=""
          sizes="(max-width: 768px) 100vw, 33vw"
          opacity={0.65}
        />
      )}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.65) 100%)",
        }}
      />
      <div className="relative flex h-full flex-col justify-between p-7">
        <h3
          className="max-w-[14ch] font-sans tracking-[-0.02em] text-white balance"
          style={{
            fontSize: "clamp(1.65rem, 2.4vw, 2rem)",
            lineHeight: 1.05,
            fontWeight: 500,
            fontVariationSettings: '"opsz" 96',
          }}
        >
          {title}
        </h3>
        <div className="space-y-5">
          <p className="text-[14.5px] leading-[1.5] text-white/85">{body}</p>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13.5px] font-medium text-white">
              Learn more
            </span>
            <span
              aria-hidden
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e02214] text-white transition-transform duration-300 group-hover:translate-x-1 group-hover:bg-[#b91404]"
              style={{ boxShadow: "0 8px 22px rgba(224, 34, 20, 0.35)" }}
            >
              <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

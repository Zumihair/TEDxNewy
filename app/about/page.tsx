import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PageHero from "@/components/PageHero";
import { ORG } from "@/lib/data";

export const metadata = {
  title: "About · TEDxNewy",
  description:
    "TEDxNewy is an independently licensed TED event in Newcastle, Australia — formerly TEDxCooksHill, on Awabakal and Worimi Country.",
};

const events = [
  { year: "2024", theme: "Beyond Boundaries", venue: "The Playhouse", org: "TEDxCooksHill" },
  { year: "2025", theme: "Reframe", venue: "Conservatorium of Music", org: "TEDxCooksHill" },
  { year: "2026", theme: "Newcastle 2050: What If? — Salon", venue: "Q Building, Honeysuckle", org: "TEDxNewy" },
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
    body: "Deeper understanding of our city, our region and the world &mdash; through curiosity and wonder.",
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
      <PageHero
        kicker="About TEDxNewy"
        titleTop="Bringing the spirit of TED to Newcastle."
        intro={
          <>
            TEDxNewy is an independently licensed TED event in Newcastle,
            Australia &mdash; on Awabakal and Worimi Country. We rebranded
            from TEDxCooksHill in 2026.
          </>
        }
      />

      {/* Mission */}
      <section className="mx-auto max-w-[1100px] px-5 pb-20 md:px-6 md:pb-24">
        <div className="max-w-[68ch]">
          <p
            className="font-sans tracking-[-0.02em] text-[#141210]"
            style={{
              fontSize: "clamp(1.5rem, 2.6vw, 2.1rem)",
              lineHeight: 1.2,
              fontWeight: 400,
            }}
          >
            We seek to discover and share powerful ideas that spark
            imagination, embrace possibility, and create meaningful change
            in&nbsp;Newcastle.
          </p>
        </div>
      </section>

      {/* Six Pillars */}
      <section className="bg-[#f9f5ec]">
        <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
          <div
            className="text-[10.5px] font-semibold uppercase text-[#e02214]"
            style={{ letterSpacing: "0.24em" }}
          >
            What we stand for
          </div>
          <h2
            className="mt-5 max-w-[20ch] font-sans tracking-[-0.025em] text-[#141210] balance"
            style={{
              fontSize: "clamp(1.85rem, 3.6vw, 2.75rem)",
              lineHeight: 1.05,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            Six things we promise.
          </h2>
          <ul className="mt-12 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 md:grid-cols-3">
            {pillars.map((p, i) => (
              <li key={p.label}>
                <div
                  className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
                  style={{ letterSpacing: "0.22em" }}
                >
                  {String(i + 1).padStart(2, "0")} · {p.label}
                </div>
                <p
                  className="mt-3 text-[15.5px] leading-[1.6] text-[#2a2521]"
                  dangerouslySetInnerHTML={{ __html: p.body }}
                />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* What is TEDx */}
      <section className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
        <div
          className="text-[10.5px] font-semibold uppercase text-[#e02214]"
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
        <p className="mt-6 max-w-[68ch] text-[16.5px] leading-[1.7] text-[#2a2521] md:text-[17.5px]">
          In the spirit of <strong>ideas worth spreading</strong>, TEDx is a
          programme of local, self-organised events that bring people together
          to share a TED-like experience. At a TEDx event, TED Talks video
          and live speakers combine to spark deep discussion and connection.
          These local, self-organised events are branded TEDx, where{" "}
          <em>x = independently organised TED event</em>. The TED Conference
          provides general guidance for the TEDx programme, but individual
          TEDx events &mdash; like ours &mdash; are self-organised.
        </p>
        <a
          href="https://www.ted.com/about/programs-initiatives/tedx-program"
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex items-center gap-1.5 text-[14.5px] font-medium text-[#e02214]"
        >
          Learn more about TEDx
          <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
        </a>
      </section>

      {/* Country acknowledgement */}
      <section className="bg-[#f9f5ec]">
        <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
          <div
            className="text-[10.5px] font-semibold uppercase text-[#e02214]"
            style={{ letterSpacing: "0.24em" }}
          >
            Country
          </div>
          <p className="mt-6 max-w-[68ch] text-[16px] leading-[1.7] text-[#2a2521]">
            {ORG.acknowledgment}
          </p>
        </div>
      </section>

      {/* Events list */}
      <section className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
        <div
          className="text-[10.5px] font-semibold uppercase text-[#e02214]"
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
      </section>

      {/* Get involved CTAs */}
      <section className="bg-[#f9f5ec]">
        <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
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
              href="/nominate"
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(20,18,16,0.18)] px-6 py-3 font-sans text-[14px] font-medium text-[#141210] transition-colors hover:border-[#141210] hover:bg-[#141210] hover:text-white"
            >
              Nominate a speaker
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </Link>
            <Link
              href="/apply"
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
        </div>
      </section>
    </>
  );
}

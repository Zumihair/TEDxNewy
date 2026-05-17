import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import CursorSpotlightHero from "@/components/CursorSpotlightHero";
import PastEventCard from "@/components/PastEventCard";
import CircleArrowLink from "@/components/CircleArrowLink";

export const metadata: Metadata = {
  title: "TEDxNewy — Ideas worth spreading, from Newcastle",
  description:
    "An independently licensed TED event in Newcastle, Australia — on Awabakal and Worimi Country. Three more events in the 2026 season to be announced soon.",
  alternates: { canonical: "https://tedxnewy.com.au/" },
};

export default function HomePage() {
  return (
    <>
      <CursorSpotlightHero />

      {/* YOUTH FUTURES LAB — schools EOI promo ====================== */}
      <section className="bg-[#3d0a05]">
        <div className="mx-auto max-w-[1240px] px-5 py-20 md:px-10 md:py-24">
          <div className="overflow-hidden rounded-[40px] bg-[#e02214] text-white md:rounded-[60px]">
            <div className="grid gap-8 p-8 md:grid-cols-[1.4fr_1fr] md:gap-12 md:p-14">
              <div>
                <div
                  className="font-mono text-[10.5px] font-semibold uppercase text-white/75"
                  style={{ letterSpacing: "0.24em" }}
                >
                  For schools · 5 August 2026
                </div>
                <h2
                  className="mt-5 font-sans tracking-[-0.025em] text-white balance"
                  style={{
                    fontSize: "clamp(2rem, 4.4vw, 3.25rem)",
                    lineHeight: 1.02,
                    fontWeight: 500,
                    fontVariationSettings: '"opsz" 144',
                  }}
                >
                  Youth Futures Lab — a one-day hackathon for student leaders.
                </h2>
                <p className="mt-6 max-w-[55ch] text-[16.5px] leading-[1.55] text-white/90 md:text-[17px]">
                  TEDx&nbsp;Newy × University of Newcastle. Students work in
                  teams on a real Newcastle challenge, with TED-style
                  storytelling coaching from our 2024 speakers. Free for
                  selected schools.
                </p>
              </div>
              <div className="flex flex-col items-start justify-center gap-5 md:items-end md:text-right">
                <div>
                  <div
                    className="font-mono text-[10px] font-semibold uppercase text-white/75"
                    style={{ letterSpacing: "0.24em" }}
                  >
                    EOIs close
                  </div>
                  <div
                    className="mt-2 font-sans text-white"
                    style={{
                      fontSize: "clamp(1.5rem, 2.8vw, 2rem)",
                      lineHeight: 1.05,
                      fontWeight: 500,
                      fontVariationSettings: '"opsz" 96',
                    }}
                  >
                    15 June 2026
                  </div>
                </div>
                <Link
                  href="/youth-futures-lab"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[14px] font-medium text-[#2a0604] transition-all hover:-translate-y-0.5 hover:bg-[#f4efe6]"
                >
                  Schools Application
                  <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MOST RECENT EVENT — Newcastle 2050 spotlight ================= */}
      <section className="bg-[#3d0a05] text-white">
        <div className="mx-auto max-w-[1240px] px-5 py-24 md:px-10 md:py-32">
          <div
            className="text-[10.5px] font-semibold uppercase text-[#ff9b8f]"
            style={{ letterSpacing: "0.28em" }}
          >
            Most recent event
          </div>
          <h2
            className="mt-6 max-w-[22ch] font-sans tracking-[-0.025em] text-white balance"
            style={{
              fontSize: "clamp(2.25rem, 4.4vw, 3.5rem)",
              lineHeight: 1.04,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            Newcastle 2050: What If?
          </h2>

          <div className="mt-12 grid gap-10 md:mt-16 md:grid-cols-2 md:items-center md:gap-14">
            <Link
              href="/tickets"
              className="group relative block aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e02214]/40"
              style={{
                background:
                  "linear-gradient(135deg, #2a3a88 0%, #121a48 50%, #050818 100%)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/salon-whatif.jpg"
                alt="Newcastle 2050: What If? — TEDxNewy Salon, 30 April 2026"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
            </Link>

            <div>
              <div className="text-[13px] text-white/70">
                30 April 2026 · TEDxNewy Salon · Q Building, Honeysuckle
              </div>
              <p className="mt-5 text-[16.5px] leading-[1.65] text-white/85 md:text-[17.5px]">
                The first event of the 2026 season brought Novocastrians
                together at the Q Building to ask one question:{" "}
                &ldquo;What can Newcastle look like in 2050?&rdquo;. Across
                this packed-out evening, we worked across social dimensions
                of transport, health, and night economy, turning a room of
                strangers into a room of collaborators.
              </p>
              <div className="mt-8">
                <CircleArrowLink href="/tickets" size="md">
                  Read about the night
                </CircleArrowLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT'S NEXT — dark maroon, big editorial moment ============== */}
      <section className="bg-[#3d0a05] text-white">
        <div className="mx-auto max-w-[1240px] px-5 py-24 md:px-10 md:py-32">
          <div
            className="text-[10.5px] font-semibold uppercase text-[#ff9b8f]"
            style={{ letterSpacing: "0.28em" }}
          >
            What&rsquo;s next
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
            More events to be announced soon.
          </h2>
          <p className="mt-7 max-w-[60ch] text-[16.5px] leading-[1.65] text-white/80">
            The 2026 season opened with our{" "}
            <Link
              href="/tickets"
              className="font-medium text-white underline underline-offset-4 hover:text-[#ff9b8f]"
            >
              Newcastle 2050 Salon on 30 April
            </Link>
            . Three more events drop across the year — subscribe and
            we&rsquo;ll let you know as soon as the next one is announced.
          </p>
          <div className="mt-10">
            <CircleArrowLink href="/#identity" size="md">
              Subscribe to be first
            </CircleArrowLink>
          </div>
        </div>
      </section>

      {/* PAST EVENTS — dark maroon WITH spotlight glow ================ */}
      <section className="relative overflow-hidden bg-[#3d0a05] text-white">
        {/* Radial spotlight motif behind the cards */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: "min(110vw, 1500px)",
            height: "min(110vw, 1100px)",
            background:
              "radial-gradient(ellipse at center, rgba(255,54,38,0.55) 0%, rgba(224,34,20,0.32) 22%, rgba(138,13,5,0.18) 48%, rgba(42,6,4,0) 72%)",
          }}
        />
        <div className="grain pointer-events-none absolute inset-0 opacity-25" />

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
            Past Events
          </h2>

          <ul className="mt-14 grid grid-cols-1 gap-x-7 gap-y-12 md:grid-cols-3 md:mt-16">
            <li>
              <PastEventCard
                href="/tickets"
                image="/images/salon-whatif.jpg"
                imageAlt="Newcastle 2050: What If? — TEDxNewy Salon, 30 April 2026"
                imageGradient="linear-gradient(135deg, #2a3a88 0%, #121a48 50%, #050818 100%)"
                date="30 April 2026"
                title="Newcastle 2050: What If?"
                subtitle="TEDxNewy Salon · Q Building"
              />
            </li>
            <li>
              <PastEventCard
                href="/speakers"
                image="/images/past-2025.jpg"
                imageAlt="Reframe — TEDxCooksHill 2025 at the Conservatorium of Music"
                imageGradient="linear-gradient(135deg, #1f4a5c 0%, #0c2430 60%, #050f15 100%)"
                date="October 2025"
                title="Reframe"
                subtitle="TEDxCooksHill · Conservatorium of Music"
              />
            </li>
            <li>
              <PastEventCard
                href="/watch?year=2024"
                image="/images/past-2024.jpg"
                imageAlt="Beyond Boundaries — TEDxCooksHill 2024 at The Playhouse"
                imageGradient="linear-gradient(135deg, #2a3a88 0%, #1f1f4a 50%, #050818 100%)"
                date="October 2024"
                title="Beyond Boundaries"
                subtitle="TEDxCooksHill · The Playhouse"
              />
            </li>
          </ul>
        </div>
      </section>

      {/* STATS — honest, real numbers ================================ */}
      <section className="bg-[#3d0a05] text-white">
        <div className="mx-auto max-w-[1240px] px-5 py-20 md:px-10 md:py-24">
          <div className="grid grid-cols-2 gap-y-12 sm:grid-cols-4 md:gap-x-10">
            <Stat value="3" label="Flagship events" sub="Since 2024" />
            <Stat value="10" suffix="+" label="Speakers on stage" sub="Reframe, 2025" />
            <Stat value="100" suffix="%" label="Volunteer-run" sub="Not-for-profit" />
            <Stat value="2M" suffix="+" label="Cumulative talk views" sub="On YouTube" />
          </div>
        </div>
      </section>

      {/* WHAT IS TEDx? ============================================== */}
      <section className="bg-[#3d0a05] text-white">
        <div className="mx-auto max-w-[1240px] px-5 py-20 md:px-10 md:py-24">
          <div className="grid gap-10 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-4">
              <div
                className="text-[10.5px] font-semibold uppercase text-[#ff9b8f]"
                style={{ letterSpacing: "0.28em" }}
              >
                About TEDx
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
                event, TED Talks video and live speakers combine to spark
                deep discussion and connection. These local, self-organised
                events are branded TEDx, where{" "}
                <em>x = independently organised TED event</em>.
              </p>
              <p className="mt-5 text-[16.5px] leading-[1.7] text-white/85 md:text-[17.5px]">
                The TED Conference provides general guidance for the TEDx
                programme, but individual TEDx events &mdash; like ours
                &mdash; are self-organised.
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

      {/* PARTICIPATE — 3 cards on home page ========================== */}
      <section className="relative overflow-hidden bg-[#3d0a05] text-white">
        {/* Soft red glow behind */}
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
            Participate
          </h2>
          <p className="mt-6 max-w-[60ch] text-[16.5px] leading-[1.65] text-white/80">
            TEDxNewy is built by Novocastrians, for Novocastrians. Pick a way
            in &mdash; we&rsquo;d love to hear from you.
          </p>

          <ul className="mt-14 grid grid-cols-1 gap-6 md:mt-16 md:grid-cols-3">
            <li>
              <ParticipateHomeCard
                href="/apply"
                title="Volunteer with us"
                body="Six crews, year-round roles. No experience needed — just reliability and curiosity."
                image="/images/stage-dialogue.jpg"
                gradient="linear-gradient(135deg, #1f4a5c 0%, #0c2430 60%, #050f15 100%)"
              />
            </li>
            <li>
              <ParticipateHomeCard
                href="/sponsors"
                title="Partner with us"
                body="Back the speakers, the stage and the next generation of Novocastrian storytellers."
                image="/images/stage-benjie.jpg"
                gradient="linear-gradient(135deg, #2a0604 0%, #8c0d05 50%, #b91404 100%)"
              />
            </li>
            <li>
              <ParticipateHomeCard
                href="/nominate"
                title="Nominate a speaker"
                body="Know someone with an idea worth spreading? Tell us before we hear it elsewhere."
                image="/images/stage-welcome.jpg"
                gradient="linear-gradient(135deg, #2a3a88 0%, #1f1f4a 50%, #050818 100%)"
              />
            </li>
          </ul>
        </div>
      </section>

      {/* IDENTITY / SUBSCRIBE — deep red close ======================== */}
      <section
        id="identity"
        className="relative bg-[#2a0604] text-white"
      >
        <div className="mx-auto max-w-[760px] px-5 py-24 md:px-6 md:py-32">
          <div
            className="text-[10.5px] font-semibold uppercase text-[#ff9b8f]"
            style={{ letterSpacing: "0.28em" }}
          >
            TEDxNewy
          </div>
          <p
            className="mt-6 font-sans tracking-[-0.02em] text-white balance"
            style={{
              fontSize: "clamp(1.6rem, 2.8vw, 2.25rem)",
              lineHeight: 1.2,
              fontWeight: 400,
            }}
          >
            An independently licensed TED event in Newcastle, Australia &mdash;
            on Awabakal and Worimi Country. Formerly TEDxCooksHill.
            Volunteer-run.
          </p>
          <p className="mt-5 text-[16.5px] leading-[1.65] text-white/80">
            Across the year we put the people doing Newcastle&rsquo;s next
            thinking in front of rooms of two hundred to five hundred
            Novocastrians, with the world watching afterwards on YouTube.
          </p>

          <form
            action="/api/subscribe"
            method="post"
            className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              name="email"
              required
              placeholder="your@email.com"
              className="h-12 w-full flex-1 rounded-full border border-white/25 bg-white/5 px-5 text-[14.5px] text-white placeholder:text-white/45 backdrop-blur-sm focus:border-white focus:outline-none focus:ring-2 focus:ring-[#e02214]/40"
            />
            <button
              type="submit"
              className="h-12 shrink-0 whitespace-nowrap rounded-full bg-[#e02214] px-7 text-[14px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#2a0604]"
            >
              Subscribe
            </button>
          </form>
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
  label: string;
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
        {suffix && <span className="text-[#ff9b8f]">{suffix}</span>}
      </div>
      <div className="mt-5 font-sans text-[14.5px] font-medium leading-[1.3] text-white">
        {label}
      </div>
      {sub && (
        <div
          className="mt-1.5 font-mono text-[10.5px] font-semibold uppercase text-white/55"
          style={{ letterSpacing: "0.2em" }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function ParticipateHomeCard({
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
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-65 transition-transform duration-700 group-hover:scale-[1.04]"
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
          <p className="max-w-[28ch] text-[14.5px] leading-[1.5] text-white/85">
            {body}
          </p>
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

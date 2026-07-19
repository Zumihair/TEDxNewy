import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import CursorSpotlightHero from "@/components/CursorSpotlightHero";
import PastEventCard from "@/components/PastEventCard";
import PhotoFill from "@/components/PhotoFill";
import CircleArrowLink from "@/components/CircleArrowLink";
import SubmitLockForm from "@/components/SubmitLockForm";
import { getEvents, getTalks, type CmsEvent } from "@/lib/cms-content";

export const metadata: Metadata = {
  title: "TEDxNewy · Ideas worth spreading, from Newcastle",
  description:
    "An independently licensed TED event in Newcastle, Australia, on Awabakal and Worimi Country. See what's on across the 2026 season.",
  alternates: { canonical: "/" },
};

// Render per request (not statically prerendered). Two reasons: admin edits to
// the home content land live without redeploys, and the shared header Nav can
// read usePathname() at request time. During static prerendering usePathname()
// resolves to null, so the "is this the dark home hero?" check (pathname ===
// "/") baked false and the header rendered its ink logo/burger over the dark
// hero. Rendering dynamically makes that check reliable.
export const dynamic = "force-dynamic";

const CARD_GRADIENT: Record<CmsEvent["kind"], string> = {
  flagship: "linear-gradient(135deg, #2a3a88 0%, #1f1f4a 50%, #050818 100%)",
  salon: "linear-gradient(135deg, #2a3a88 0%, #121a48 50%, #050818 100%)",
  special: "linear-gradient(135deg, #1f4a5c 0%, #0c2430 60%, #050f15 100%)",
};

function eventHref(e: CmsEvent) {
  return e.linkUrl ?? `/events/${e.slug}`;
}

export default async function HomePage() {
  const [pastEvents, talks] = await Promise.all([
    getEvents({ status: "past" }),
    getTalks(),
  ]);
  // Our signature events are the annual flagship conferences (October), newest
  // first. The most-recent-event feature below is the 60-Second Talk Night.
  const signatureEvents = pastEvents.filter((e) => e.kind === "flagship");
  const publishedTalks = talks.length;

  return (
    <>
      <CursorSpotlightHero />

      {/* MOST RECENT EVENT — 60-Second Talk Night recap ============= */}
      <section className="bg-[#3d0a05] text-white">
        <div className="mx-auto grid max-w-[1240px] gap-12 px-5 py-24 md:grid-cols-[1.2fr_1fr] md:items-center md:gap-16 md:px-10 md:py-32">
          <div>
            <div
              className="text-[10.5px] font-semibold uppercase text-[#ff9b8f]"
              style={{ letterSpacing: "0.28em" }}
            >
              Most recent event · 16 July 2026
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
              60-Second Talk Night: one idea, one minute.
            </h2>
            <p className="mt-7 max-w-[60ch] text-[16.5px] leading-[1.65] text-white/80">
              Our second Salon of 2026 brought Novocastrians to The Base in
              Newcastle West to share and hear ideas, each in just 60 seconds.
              Watch the recap and see what the night captured.
            </p>
            <div className="mt-10">
              <CircleArrowLink href="/60-second-talk-night" size="md">
                Watch the recap
              </CircleArrowLink>
            </div>
          </div>
          <div className="md:justify-self-end">
            <Link
              href="/60-second-talk-night"
              className="group block overflow-hidden rounded-[var(--radius-lg)] border border-white/10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/video/talk-night-banner-poster.jpg"
                alt="TEDxNewy 60-Second Talk Night at The Base, Newcastle West, on 16 July 2026."
                className="block aspect-video w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* OUR SIGNATURE EVENTS — dark maroon WITH spotlight glow ====== */}
      <section className="relative overflow-hidden bg-[#3d0a05] text-white">
        {/* Radial spotlight motif behind the cards. Kept smaller than the
            section so the glow fades out before the top/bottom edges rather
            than being clipped into a hard band. */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: "min(96vw, 1120px)",
            height: "min(64vw, 640px)",
            background:
              "radial-gradient(ellipse at center, rgba(255,54,38,0.5) 0%, rgba(224,34,20,0.28) 24%, rgba(138,13,5,0.14) 50%, rgba(42,6,4,0) 74%)",
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
            Our Signature Events
          </h2>
          <p className="mt-6 max-w-[60ch] text-[16.5px] leading-[1.65] text-white/80">
            Every October we bring our biggest stage of the year to Newcastle.
            Our next flagship returns in 2026.
          </p>

          <ul className="mt-14 grid grid-cols-1 gap-x-7 gap-y-12 md:grid-cols-3 md:mt-16">
            {/* 2026 placeholder — the upcoming flagship, teased to build
                curiosity rather than a flat "coming soon" label. */}
            <li>
              <Link href="/subscribe" className="group block">
                <div
                  className="relative flex aspect-[4/3] w-full flex-col items-center justify-center overflow-hidden rounded-[var(--radius-lg)] text-center"
                  style={{ background: CARD_GRADIENT.flagship }}
                >
                  {/* Warm spotlight glow, brightens on hover. */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 transition-opacity duration-500 group-hover:opacity-100 opacity-70"
                    style={{
                      background:
                        "radial-gradient(ellipse at 50% 32%, rgba(224,34,20,0.45) 0%, rgba(224,34,20,0.12) 40%, rgba(5,8,24,0) 70%)",
                    }}
                  />
                  <div className="relative px-6">
                    <div
                      className="font-mono text-[10px] font-semibold uppercase text-[#ff9b8f]"
                      style={{ letterSpacing: "0.3em" }}
                    >
                      The next chapter
                    </div>
                    <div
                      className="mt-3 font-sans leading-[0.9] tracking-[-0.03em] text-white"
                      style={{
                        fontSize: "clamp(3.75rem, 8vw, 5.5rem)",
                        fontWeight: 500,
                        fontVariationSettings: '"opsz" 144',
                      }}
                    >
                      <span className="tabular">2026</span>
                    </div>
                    <div
                      className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/[0.06] px-4 py-2 font-mono text-[10.5px] font-semibold uppercase text-white/85 transition-colors group-hover:border-white/40"
                      style={{ letterSpacing: "0.16em" }}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-[#ff9b8f]" strokeWidth={2} />
                      Save the date
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="text-[13px] text-white/70">
                    Saturday 24 October 2026
                  </div>
                  <h3
                    className="mt-2 font-sans tracking-[-0.02em] text-white balance"
                    style={{
                      fontSize: "clamp(1.5rem, 2.4vw, 1.85rem)",
                      lineHeight: 1.1,
                      fontWeight: 500,
                      fontVariationSettings: '"opsz" 96',
                    }}
                  >
                    Flagship TEDxNewy 2026
                  </h3>
                  <div className="mt-1.5 text-[13px] text-white/60">
                    A full day on our biggest stage yet. Be first to know.
                  </div>
                </div>
              </Link>
            </li>
            {signatureEvents.map((e) => (
              <li key={e.id}>
                <PastEventCard
                  href={eventHref(e)}
                  image={e.heroImageUrl ?? undefined}
                  imageAlt={e.title}
                  imageGradient={CARD_GRADIENT[e.kind]}
                  date={e.dateLabel ?? e.shortDate ?? ""}
                  title={e.title}
                  subtitle={e.venue ?? undefined}
                />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* STATS — honest, real numbers · accent band ================== */}
      <section className="bg-[#e02214] text-white">
        <div className="mx-auto max-w-[1240px] px-5 py-20 md:px-10 md:py-24">
          <div className="grid grid-cols-2 gap-y-12 sm:grid-cols-4 md:gap-x-10">
            <Stat value="5" label="Events" sub="Since 2024" />
            <Stat value={String(publishedTalks)} label={<>Published<br />talks</>} />
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
          <p className="mt-6 text-[16.5px] leading-[1.65] text-white/80">
            TEDxNewy is built by Novocastrians, for Novocastrians. Pick a way
            in. We&rsquo;d love to hear from you.
          </p>

          <ul className="-mx-5 mt-14 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] md:mx-0 md:mt-16 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden">
            <li className="snap-start shrink-0 basis-[82%] sm:basis-[55%] md:basis-auto">
              <ParticipateHomeCard
                href="/volunteer"
                title="Volunteer with us"
                body="Six crews, year-round roles. No experience needed, just reliability and curiosity."
                image="/images/stage-dialogue.jpg"
                gradient="linear-gradient(135deg, #1f4a5c 0%, #0c2430 60%, #050f15 100%)"
              />
            </li>
            <li className="snap-start shrink-0 basis-[82%] sm:basis-[55%] md:basis-auto">
              <ParticipateHomeCard
                href="/partner"
                title="Partner with us"
                body="Back the speakers, the stage and the next generation of Novocastrian storytellers."
                image="/images/stage-benjie.jpg"
                gradient="linear-gradient(135deg, #2a0604 0%, #8c0d05 50%, #b91404 100%)"
              />
            </li>
            <li className="snap-start shrink-0 basis-[82%] sm:basis-[55%] md:basis-auto">
              <ParticipateHomeCard
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
            An independently licensed TED event in Newcastle, Australia, on
            Awabakal and Worimi Country. Join our community below:
          </p>
          <p className="mt-5 text-[16.5px] leading-[1.65] text-white/80">
            Across the year we put events together in the aim of sharing ideas
            and thinking. We want you to be part of that.
          </p>

          <SubmitLockForm
            action="/api/subscribe"
            method="post"
            className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
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
              className="w-full flex-1 rounded-2xl border border-[rgba(97,74,68,0.13)] bg-white px-5 py-4 text-[16px] font-medium text-[#1a1513] placeholder:text-[#8a7e74]/60 focus:outline-none focus:ring-[3px] focus:ring-[#e02214]/30 sm:text-[15px]"
            />
            <button
              type="submit"
              className="inline-flex shrink-0 items-center justify-center gap-2 self-start whitespace-nowrap rounded-full bg-[#e02214] px-7 py-3.5 font-sans text-[14.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#2a0604] sm:self-auto"
            >
              Subscribe
            </button>
          </SubmitLockForm>
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
  label: ReactNode;
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

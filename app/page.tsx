import Link from "next/link";
import type { Metadata } from "next";
import HomeHero from "@/components/HomeHero";
import PhotoFill from "@/components/PhotoFill";
import PhotoPending from "@/components/PhotoPending";
import SubmitLockForm from "@/components/SubmitLockForm";
import StatBand from "@/components/StatBand";
import ParticipateCard from "@/components/ParticipateCard";
import PartnerTiers from "@/components/PartnerTiers";
import { Button } from "@/components/ds";
import { motifFor } from "@/lib/programme-motif";
import {
  eventHref,
  getEvents,
  getPhotosForEvent,
  getTalks,
  type CmsEvent,
} from "@/lib/cms-content";
import { SIGNAL_LIVE, SIGNAL_PAST, SIGNAL_SOLD_OUT } from "@/lib/feature-flags";

/**
 * The homepage <title>, i.e. the blue headline Google shows for a search on
 * "TEDxNewy". Derived from the Signal flags rather than edited by hand, so
 * each stage of a ticket campaign (coming soon, on sale, sold out, past) is
 * still a one-line flag flip in lib/feature-flags.ts. Google re-crawls on its
 * own schedule, so expect a new headline to take days to appear in results.
 */
const HOME_TITLE = SIGNAL_PAST
  ? "TEDxNewy · Ideas change everything. Newcastle's independent TEDx"
  : SIGNAL_SOLD_OUT
  ? "TEDxNewy · Signal has sold out! Join the waitlist"
  : SIGNAL_LIVE
    ? "TEDxNewy · Tickets on sale NOW! Newcastle Conservatorium of Music"
    : "TEDxNewy · Tickets coming soon to Newcastle!";

export const metadata: Metadata = {
  title: HOME_TITLE,
  description:
    "An independently licensed TED event in Newcastle, Australia, on Awabakal and Worimi Country. Relive our 2026 season and be first to hear about 2027.",
  alternates: { canonical: "/" },
};

// Render per request (not statically prerendered). Two reasons: admin edits to
// the home content land live without redeploys, and the shared header Nav can
// read usePathname() at request time. During static prerendering usePathname()
// resolves to null, so the "is this the dark home hero?" check (pathname ===
// "/") baked false and the header rendered its ink logo/burger over the dark
// hero. Rendering dynamically makes that check reliable.
export const dynamic = "force-dynamic";

/** The season this page looks back on. Bump it when the next one wraps. */
const SEASON_YEAR = 2026;

/**
 * Hand-kept, honest totals for the stat band (2026-10-27). Live numbers are
 * computed below where we have them; these two are not in any one table:
 *
 * - 3M+ talk views: Magdalena Hoeller's talk alone has about 1.6M plays on
 *   TED.com and 1.2M+ on TED's YouTube channel, plus our own channel. The
 *   live YouTube sum in lib/talk-views.ts only sees our channel, so it
 *   understates this; don't swap it back in.
 * - 500+ in the room: Newcastle 2050 (122, its recap page), Talk Night (54
 *   registrations), Youth Futures Lab (about 75 students) and Signal (287
 *   valid tickets, before comps, speakers and crew) come to about 538.
 */
const TALK_VIEWS = { value: "3M", suffix: "+" };
const PEOPLE_IN_THE_ROOM = { value: "500", suffix: "+" };

/** The badge on each season card. A slug wins over the event's kind. */
function seasonBadge(e: CmsEvent): string {
  if (e.slug.startsWith("signal") && SIGNAL_SOLD_OUT) return "Sold out";
  if (e.slug === "youth-futures-lab" || e.slug === "student-speaker-competition") return "Youth";
  if (e.slug === "60-second-talk-night") return "Salon";
  return e.kind === "flagship" ? "Flagship" : e.kind === "salon" ? "Salon" : "Special";
}

const WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
/** House style: one to nine in words, 10 and up as figures. */
const countWord = (n: number) => WORDS[n] ?? String(n);

/** Literal class names so Tailwind sees them: one row of cards from lg. */
const LG_COLS: Record<number, string> = { 3: "lg:grid-cols-3", 4: "lg:grid-cols-4", 5: "lg:grid-cols-5", 6: "lg:grid-cols-6" };

/** Matches the talk featured below in the CMS, whatever its id became. */
const FEATURED_TALK = /harder in a second language/i;

const H2 = {
  fontSize: "clamp(2.5rem, 5vw, 4rem)",
  lineHeight: 1.02,
  letterSpacing: "-0.03em",
  fontWeight: 500,
  fontVariationSettings: '"opsz" 144',
} as const;

export default async function HomePage() {
  const [pastEvents, talks] = await Promise.all([getEvents({ status: "past" }), getTalks()]);

  // The season row: every past event from this year, oldest first so it reads
  // as the year went. Driven by cms_events, so a status flip in the admin is
  // all it takes to add or drop one.
  const season = pastEvents
    .filter((e) => e.startsAt && new Date(e.startsAt).getUTCFullYear() === SEASON_YEAR)
    .sort((a, b) => Date.parse(a.startsAt!) - Date.parse(b.startsAt!));

  // Gallery mosaic: the lead photo from each published gallery, newest event
  // first. Signal's gallery isn't up yet; it joins on its own once it is.
  const galleries = (
    await Promise.all(
      pastEvents.map(async (e) => ({ event: e, photos: await getPhotosForEvent(e.id) })),
    )
  )
    .filter((g) => g.photos.length > 0)
    .slice(0, 4);

  const featured = talks.find((t) => FEATURED_TALK.test(t.title));
  const featuredHref = featured ? `/talks?talk=${featured.speakerSlug ?? featured.id}` : "/talks";
  const featuredThumb = featured ? `https://i.ytimg.com/vi/${featured.youtubeId}/hqdefault.jpg` : null;

  return (
    <>
      <HomeHero />

      <StatBand
        items={[
          { ...TALK_VIEWS, label: "Views of our talks", sub: "Across TED, YouTube and more" },
          { value: String(season.length), label: `Events in ${SEASON_YEAR}`, sub: "Salons to a sold-out flagship" },
          { ...PEOPLE_IN_THE_ROOM, label: "People in the room", sub: `Across our ${SEASON_YEAR} events` },
          { value: "100", suffix: "%", label: "Volunteer-run", sub: "Every dollar back into our events" },
        ]}
      />

      {/* THE SEASON ===================================================== */}
      <section id="season" className="scroll-mt-24 bg-white">
        <div className="mx-auto max-w-[1240px] px-5 py-24 md:px-10 md:py-28">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-sans text-[#000000] balance" style={H2}>
                That was {SEASON_YEAR}.
              </h2>
              <p className="mt-5 max-w-[40rem] text-[17px] leading-[1.6] text-[#2a2521]">
                {countWord(season.length)} events, one season. Relive each one through its recap and photos.
              </p>
            </div>
            <Button href="/events" variant="primary" icon="arrow-right" className="tx-btn--auto">
              All events
            </Button>
          </div>

          {/* Swipe row on a phone, two across from md, one row from lg. */}
          <ul className={`carousel-scrollbar -mx-5 mt-12 flex snap-x snap-mandatory scroll-pl-5 gap-4 overflow-x-auto px-5 pb-4 md:mx-0 md:scroll-pl-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0 ${LG_COLS[season.length] ?? "lg:grid-cols-4"}`}>
            {season.map((e) => (
              <li key={e.id} className="w-[72vw] shrink-0 snap-start sm:w-[44vw] md:w-auto">
                <Link
                  href={eventHref(e)}
                  className="group relative block aspect-[3/4] overflow-hidden rounded-[var(--radius-lg)] bg-[#2a0604] text-white transition-transform duration-150 hover:-translate-y-0.5"
                >
                  {e.heroImageUrl ? (
                    <PhotoFill
                      src={e.heroImageUrl}
                      alt={e.title}
                      sizes="(min-width: 1024px) 25vw, (min-width: 768px) 45vw, 72vw"
                    />
                  ) : (
                    <PhotoPending title={e.title} motif={motifFor(e)} />
                  )}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{ background: "var(--grad-scrim)" }}
                  />
                  <span
                    className={`absolute left-4 top-4 rounded-full px-2.5 py-1.5 font-ui text-[11px] font-semibold uppercase tracking-[0.06em] ${
                      seasonBadge(e) === "Sold out" ? "bg-[#e62b1e] text-white" : "bg-white text-black"
                    }`}
                  >
                    {seasonBadge(e)}
                  </span>
                  <div className="absolute inset-x-4 bottom-4">
                    <div className="font-ui text-[13px] text-white/80">{e.shortDate ?? e.dateLabel}</div>
                    <h3 className="mt-1.5 font-sans text-[22px] font-medium leading-[1.05] tracking-[-0.02em]">
                      {e.title}
                    </h3>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FEATURED TALK ================================================== */}
      <section className="bg-[#000000] text-white">
        <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 py-24 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-14 md:px-10 md:py-28">
          <div>
            <h2 className="font-sans text-white balance" style={H2}>
              The talk the world keeps watching.
            </h2>
            <p className="mt-6 text-[17px] leading-[1.6] text-white/80">
              Magdalena Hoeller&rsquo;s talk, &ldquo;Why love is harder in a second language&rdquo;,
              was first given on our stage. It has since been played more than 1.5 million times
              on TED.com and featured on the TED Talks Daily podcast. The talks from Signal are
              being edited now and will be published soon.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href={featuredHref} variant="accent" size="lg">
                Watch the talk
              </Button>
              <Button href="/talks" variant="secondary" size="lg" onDark>
                Browse our talks
              </Button>
            </div>
          </div>
          <Link
            href={featuredHref}
            className="group relative block aspect-[16/10] overflow-hidden rounded-[var(--radius-lg)]"
            style={{ background: "var(--grad-brand)" }}
          >
            {featuredThumb && (
              <PhotoFill src={featuredThumb} alt="Magdalena Hoeller giving her talk, Why love is harder in a second language" sizes="(min-width: 768px) 45vw, 100vw" />
            )}
            <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "var(--grad-scrim)" }} />
            <span
              aria-hidden
              className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#e62b1e] transition-transform duration-150 group-hover:scale-105"
              style={{ boxShadow: "var(--shadow-red)" }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="#ffffff" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <span className="absolute bottom-5 right-5 rounded-full bg-white px-2.5 py-1.5 font-ui text-[11px] font-semibold uppercase tracking-[0.06em] text-black">
              1.5M+ plays on TED.com
            </span>
          </Link>
        </div>
      </section>

      {/* 2027 SIGN-UP =================================================== */}
      <section id="join" className="relative scroll-mt-24 overflow-hidden bg-[#2a0604] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 80% 40%, rgba(230,43,30,0.45) 0%, rgba(42,6,4,0) 60%)" }}
        />
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-5 py-24 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-14 md:px-10 md:py-28">
          <div>
            <h2
              className="font-sans text-white balance"
              style={{ ...H2, fontSize: "clamp(2.75rem, 6vw, 5rem)", lineHeight: 0.95 }}
            >
              2027 is taking shape.
            </h2>
            <p className="mt-6 max-w-[34rem] text-[17px] leading-[1.6] text-white/80">
              More salons, more for young people, and our biggest day yet. Signal sold out, so
              join the list to be the first to know when tickets go on sale.
            </p>
            <SubmitLockForm
              action="/api/subscribe"
              method="post"
              className="mt-8 flex max-w-[34rem] flex-col gap-3 sm:flex-row"
            >
              <input type="hidden" name="source" value="home-2027" />
              <label htmlFor="home-email" className="sr-only">
                Email address
              </label>
              <input
                id="home-email"
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full flex-1 rounded-2xl border border-white/20 bg-white px-5 py-4 text-[16px] font-medium text-[#1a1513] placeholder:text-[#8a7e74]/70 focus:outline-none focus:ring-[3px] focus:ring-[#e62b1e]/40"
              />
              <button type="submit" className="tx-btn tx-btn--accent tx-btn--lg">
                Join the list
              </button>
            </SubmitLockForm>
            <p className="mt-4 font-ui text-[13px] text-white/60">
              We only email when there&rsquo;s news. Unsubscribe anytime.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-lg)]">
              <PhotoFill
                src="/images/home/signal-group.webp"
                alt="Signal speakers on stage holding up red Xs."
                sizes="(min-width: 768px) 22vw, 50vw"
                objectPosition="55% 40%"
                hoverZoom={false}
              />
            </div>
            <div className="grid h-full grid-rows-2 gap-3">
              <div className="relative overflow-hidden rounded-[var(--radius-lg)]">
                <PhotoFill src="/images/home/signal-laugh.webp" alt="The Signal audience laughing." sizes="(min-width: 768px) 22vw, 50vw" hoverZoom={false} />
              </div>
              <div className="relative overflow-hidden rounded-[var(--radius-lg)]">
                <PhotoFill src="/images/home/youth-futures-team.webp" alt="Youth Futures Lab students with the TEDx X." sizes="(min-width: 768px) 22vw, 50vw" hoverZoom={false} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY ======================================================== */}
      {galleries.length > 0 && (
        <section className="bg-white">
          <div className="mx-auto max-w-[1240px] px-5 py-24 md:px-10 md:py-28">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="font-sans text-[#000000] balance" style={H2}>
                  The rooms we filled.
                </h2>
                <p className="mt-5 max-w-[40rem] text-[17px] leading-[1.6] text-[#2a2521]">
                  Photography and video by{" "}
                  <a
                    href="https://www.newydigital.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#b91404] underline-offset-4 hover:underline"
                  >
                    Newy Digital
                  </a>
                  . See if you can spot yourself.
                </p>
              </div>
              <Button href={`/events/${galleries[0].event.slug}/gallery`} variant="secondary" className="tx-btn--auto">
                See the galleries
              </Button>
            </div>
            <div className="mt-12 grid auto-rows-[160px] grid-cols-2 gap-3 md:auto-rows-[220px] md:grid-cols-4">
              {galleries.map(({ event, photos }, i) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}/gallery`}
                  className={`group relative overflow-hidden rounded-[var(--radius-lg)] bg-[#f4efe6] ${
                    i === 0 ? "col-span-2 row-span-2" : i === galleries.length - 1 && galleries.length === 4 ? "md:col-span-2" : ""
                  }`}
                >
                  <PhotoFill
                    src={photos[0].url}
                    alt={`From the ${event.title} gallery`}
                    sizes={i === 0 ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 50vw"}
                  />
                  <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "var(--grad-scrim)" }} />
                  <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1.5 font-ui text-[12px] font-semibold text-white">
                    {event.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PARTICIPATE ==================================================== */}
      <section className="bg-[#f4efe6]">
        <div className="mx-auto max-w-[1240px] px-5 py-24 md:px-10 md:py-28">
          <h2 className="font-sans text-[#000000] balance" style={H2}>
            Make 2027 with us.
          </h2>
          <p className="mt-5 max-w-[40rem] text-[17px] leading-[1.6] text-[#2a2521]">
            TEDxNewy is built by Novocastrians, for Novocastrians. Pick a way in.
          </p>
          <ul className="-mx-5 mt-12 flex snap-x snap-mandatory scroll-pl-5 gap-5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] md:mx-0 md:scroll-pl-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden">
            <li className="shrink-0 basis-[82%] snap-start sm:basis-[55%] md:basis-auto">
              <ParticipateCard
                href="/volunteer"
                title="Volunteer"
                body="Join the crew in red. No experience needed, just curiosity and a bit of reliability."
                image="/images/home/signal-crew.webp"
                gradient="var(--grad-night)"
                cta="Join the crew"
              />
            </li>
            <li className="shrink-0 basis-[82%] snap-start sm:basis-[55%] md:basis-auto">
              <ParticipateCard
                href="/partner"
                title="Partner with us"
                body="Back the speakers, the stage and the next generation of Newcastle storytellers."
                image="/images/home/signal-sketch.webp"
                gradient="var(--grad-brand)"
                cta="Partner with us"
              />
            </li>
            <li className="shrink-0 basis-[82%] snap-start sm:basis-[55%] md:basis-auto">
              <ParticipateCard
                href="/speak"
                title="Nominate a speaker"
                body="Know someone with an idea worth spreading? We'd love to hear about them."
                image="/images/home/signal-stage.webp"
                gradient="var(--grad-brand)"
                cta="Nominate"
              />
            </li>
          </ul>
        </div>
      </section>

      {/* PARTNERS ======================================================= */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1240px] px-5 py-20 md:px-10 md:py-24">
          <h2
            className="text-center font-sans text-[28px] font-medium leading-tight tracking-[-0.02em] text-[#000000] md:text-[32px]"
          >
            Thank you to our {SEASON_YEAR} partners.
          </h2>
          <div className="mt-10">
            <PartnerTiers variant="light" scale={1.5} supportingInRow />
          </div>
        </div>
      </section>

      {/* WHAT IS TEDx? ================================================== */}
      <section className="border-t border-black/10 bg-white">
        <div className="mx-auto grid max-w-[1240px] gap-8 px-5 py-20 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:gap-16 md:px-10">
          <h2
            className="font-sans text-[#000000] balance"
            style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)", lineHeight: 1.05, letterSpacing: "-0.025em", fontWeight: 500 }}
          >
            What is a TEDx event?
          </h2>
          <div>
            <p className="text-[17px] leading-[1.7] text-[#2a2521]">
              In the spirit of <strong>ideas worth spreading</strong>, TEDx is a programme of local,
              self-organised events that bring people together to share a TED-like experience.
              TEDxNewy is organised in Newcastle by a team of local volunteers, under licence from
              TED.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button href="/mission" variant="primary" icon="arrow-right" className="tx-btn--auto">
                More about TEDxNewy
              </Button>
              <Button
                href="https://www.ted.com/about/programs-initiatives/tedx-program"
                variant="secondary"
                icon="arrow-up-right"
                className="tx-btn--auto"
                target="_blank"
                rel="noreferrer"
              >
                About the TEDx programme
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

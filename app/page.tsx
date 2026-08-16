import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import CursorSpotlightHero from "@/components/CursorSpotlightHero";
import PastEventCard from "@/components/PastEventCard";
import PhotoFill from "@/components/PhotoFill";
import CircleArrowLink from "@/components/CircleArrowLink";
import SubmitLockForm from "@/components/SubmitLockForm";
import {
  eventHref,
  getEvents,
  getPhotosForEvent,
  getTalks,
  type CmsEvent,
} from "@/lib/cms-content";

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

export default async function HomePage() {
  const [pastEvents, talks] = await Promise.all([
    getEvents({ status: "past" }),
    getTalks(),
  ]);
  // The one most recent past event gets the feature treatment up top; the rest
  // fill the grid below. Both are derived from the CMS (pastEvents is already
  // newest-first), so marking an event Past in /admin/events is the only step
  // needed to move it into the feature. This used to be hardcoded to the
  // 60-Second Talk Night, which meant Youth Futures Lab (more recent, and a
  // "special", so it was also filtered out of the grid) appeared nowhere.
  const [featured, ...olderEvents] = pastEvents;
  const featuredGallery = featured
    ? await getPhotosForEvent(featured.id)
    : [];
  // One supporting line, never both: `tagline` is the punchy one-liner when an
  // event has one, otherwise fall back to the first paragraph of `blurb` (some
  // blurbs are a multi-paragraph story on their own event page, far too much
  // for a homepage teaser). Matches how /events picks its description.
  // An event with no hero image and no catalogued photos yet (Youth Futures
  // Lab today) would otherwise render a big empty panel, so the feature drops
  // to a single column instead. It fills back in on its own the moment a hero
  // image is set in /admin/events or a gallery is published.
  const featuredImage = featured
    ? (featured.heroImageUrl ?? featuredGallery[0]?.url ?? null)
    : null;
  const featuredLead =
    featured?.tagline?.trim() ||
    (featured?.blurb ?? "").split("\n\n")[0].trim();
  const publishedTalks = talks.length;

  // Galleries — any past event that's had photos catalogued against it.
  const galleries = (
    await Promise.all(
      pastEvents.map(async (e) => ({
        event: e,
        photos: await getPhotosForEvent(e.id),
      })),
    )
  ).filter((g) => g.photos.length > 0);

  return (
    <>
      <CursorSpotlightHero />

      {/* JUST WRAPPED — the single most recent past event, from the CMS ==== */}
      {featured && (
        <section className="bg-[#3d0a05] text-white">
          <div
            className={
              "mx-auto grid max-w-[1240px] gap-10 px-5 py-24 md:items-center md:gap-16 md:px-10 md:py-32 " +
              (featuredImage ? "md:grid-cols-[1.05fr_1fr]" : "md:grid-cols-1")
            }
          >
            <div>
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className="relative flex h-2 w-2 shrink-0"
                >
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#ff3626] opacity-70 motion-safe:animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ff6e62]" />
                </span>
                <span
                  className="text-[10.5px] font-semibold uppercase text-[#ff9b8f]"
                  style={{ letterSpacing: "0.28em" }}
                >
                  Just wrapped
                  {featured.dateLabel ? ` · ${featured.dateLabel}` : ""}
                </span>
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
                {featured.title}
              </h2>
              {featuredLead && (
                <p className="mt-7 max-w-[60ch] text-[16.5px] leading-[1.65] text-white/80">
                  {featuredLead}
                </p>
              )}
              {featured.venue && (
                <div className="mt-5 text-[13.5px] text-white/55">
                  {featured.venue}
                </div>
              )}
              <div className="mt-10">
                <CircleArrowLink href={eventHref(featured)} size="md">
                  {featured.linkLabel ?? "See how it went"}
                </CircleArrowLink>
              </div>
            </div>

            {featuredImage && (
            <div className="md:justify-self-end">
              <Link
                href={eventHref(featured)}
                className="group block overflow-hidden rounded-[var(--radius-lg)] border border-white/10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)]"
              >
                <div className="relative aspect-video w-full bg-[#2a0604]">
                  <PhotoFill
                    src={featuredImage}
                    alt={featured.title}
                    sizes="(min-width: 768px) 46vw, 92vw"
                    hoverZoom
                  />
                </div>
              </Link>

              {/* A few real frames from the night, so the feature shows the
                  event rather than just describing it. Only when photos have
                  actually been catalogued. */}
              {featuredGallery.length >= 3 && (
                <Link
                  href={`/events/${featured.slug}/gallery`}
                  className="group mt-3 block"
                >
                  <div className="grid grid-cols-3 gap-3">
                    {featuredGallery.slice(0, 3).map((p) => (
                      <div
                        key={p.id}
                        className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-sm)] bg-[#2a0604]"
                      >
                        <PhotoFill
                          src={p.thumbUrl}
                          alt=""
                          sizes="(min-width: 768px) 15vw, 30vw"
                        />
                      </div>
                    ))}
                  </div>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-white/70 transition-colors group-hover:text-white">
                    See all {featuredGallery.length} photos
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} />
                  </span>
                </Link>
              )}
            </div>
            )}
          </div>
        </section>
      )}

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
            className="max-w-[20ch] font-sans tracking-[-0.025em] text-white balance"
            style={{
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              lineHeight: 1.02,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            And that&rsquo;s just the latest.
          </h2>
          <p className="mt-6 max-w-[62ch] text-[16.5px] leading-[1.65] text-white/80">
            Our flagship main stage each October, Salon nights across the year,
            and the one-off experiments in between. Here&rsquo;s what
            we&rsquo;ve built together so far.
          </p>

          {/* Swipeable on phones, a 3-up grid from md. Three tall cards
              stacked vertically made this section a very long scroll on
              mobile; the negative margin lets a card bleed to the screen edge
              so the next one peeks in and reads as swipeable. */}
          <ul className="carousel-scrollbar -mx-5 mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 md:mx-0 md:mt-16 md:grid md:grid-cols-3 md:gap-x-7 md:gap-y-12 md:overflow-visible md:px-0 md:pb-0">
            {olderEvents.slice(0, 3).map((e) => (
              <li
                key={e.id}
                className="w-[78vw] shrink-0 snap-start sm:w-[46vw] md:w-auto"
              >
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

          <div className="mt-14 flex flex-col items-start gap-4 sm:flex-row sm:items-center md:mt-16">
            <Link
              href="/salons"
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-sans text-[14.5px] font-medium text-[#2a0604] transition-all hover:-translate-y-0.5 hover:bg-white/90"
            >
              View Salons
              <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
            </Link>
            <Link
              href="/signature"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-7 py-3.5 font-sans text-[14.5px] font-medium text-white transition-all hover:border-white/50 hover:bg-white/[0.06]"
            >
              View Signature events
              <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
            </Link>
          </div>
        </div>
      </section>

      {/* PHOTO GALLERIES — one card per event with photos, two-up preview === */}
      {galleries.length > 0 && (
        <section className="bg-[var(--color-cream)]">
          <div className="mx-auto max-w-[1240px] px-5 py-24 md:px-10 md:py-32">
            <h2
              className="max-w-[20ch] font-sans tracking-[-0.025em] text-[#141210] balance"
              style={{
                fontSize: "clamp(2.5rem, 5vw, 4rem)",
                lineHeight: 1.02,
                fontWeight: 500,
                fontVariationSettings: '"opsz" 144',
              }}
            >
              Check out our gallery.
            </h2>
            <p className="mt-6 text-[16.5px] leading-[1.65] text-[#2a2521]">
              We&rsquo;re grateful to work with{" "}
              <a
                href="https://www.newydigital.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#b91404] underline-offset-4 hover:underline"
              >
                Newy Digital
              </a>
              , who capture our event videography and photography. You can
              find some recent event imagery below:
            </p>

            {/* Same treatment as the events row above: swipe on phones, grid
                from sm. These cards are wide and photo-led, so stacking every
                gallery vertically pushed the rest of the page a long way
                down. */}
            <div className="carousel-scrollbar -mx-5 mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 sm:mx-0 sm:mt-14 sm:grid sm:grid-cols-2 sm:gap-8 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
              {galleries.map(({ event, photos }) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}/gallery`}
                  className="group block w-[78vw] shrink-0 snap-start sm:w-auto"
                >
                  <div className="grid aspect-[4/3] grid-cols-2 gap-1.5 overflow-hidden rounded-[var(--radius-md)]">
                    <div className="relative overflow-hidden bg-[#e9e2d5]">
                      <PhotoFill
                        src={photos[0].thumbUrl}
                        alt=""
                        sizes="(min-width: 1024px) 20vw, (min-width: 640px) 30vw, 45vw"
                      />
                    </div>
                    <div className="relative overflow-hidden bg-[#e9e2d5]">
                      <PhotoFill
                        src={(photos[1] ?? photos[0]).thumbUrl}
                        alt=""
                        sizes="(min-width: 1024px) 20vw, (min-width: 640px) 30vw, 45vw"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-3">
                    <div>
                      <div className="font-sans text-[17px] font-medium leading-tight tracking-[-0.01em] text-[#141210] group-hover:text-[#b91404]">
                        {event.title}
                      </div>
                      <div className="mt-1 text-[13.5px] text-[#6b6459]">
                        {event.dateLabel ?? event.shortDate}
                      </div>
                    </div>
                    <span
                      aria-hidden
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e02214] text-white transition-transform duration-300 group-hover:translate-x-1 group-hover:bg-[#b91404]"
                      style={{ boxShadow: "0 8px 26px rgba(224, 34, 20, 0.35)" }}
                    >
                      <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

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
          <p className="text-[14.5px] leading-[1.5] text-white/85">
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

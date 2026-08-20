import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowUpRight, Images } from "lucide-react";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import PhotoFill from "@/components/PhotoFill";
import SpeakerCard from "@/components/SpeakerCard";
import SpeakerCarousel from "@/components/SpeakerCarousel";
import SpeakerLineup from "@/components/SpeakerLineup";
import RecentEvents from "@/components/RecentEvents";
import TicketLink from "@/components/TicketLink";
import {
  getEventBySlug,
  getPhotosForEvent,
  getSpeakersWithTalksForEvent,
  getTalksForEvent,
  type CmsEvent,
} from "@/lib/cms-content";
import { SIGNAL_LIVE } from "@/lib/feature-flags";
import { getTicketPulse } from "@/lib/ticket-pulse";

// Re-fetch from Supabase every 60s so admin edits land live without redeploys.
export const revalidate = 60;

const KIND_LABEL: Record<CmsEvent["kind"], string> = {
  flagship: "Main stage",
  salon: "Salon",
  special: "Special event",
};

const KIND_GRADIENT: Record<CmsEvent["kind"], string> = {
  flagship: "linear-gradient(135deg, #2a0604 0%, #8c0d05 50%, #b91404 100%)",
  salon: "linear-gradient(135deg, #2a3a88 0%, #121a48 50%, #050818 100%)",
  special: "linear-gradient(135deg, #1f4a5c 0%, #0c2430 60%, #050f15 100%)",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event · TEDxNewy" };
  const description =
    event.tagline ??
    event.blurb ??
    `A TEDxNewy event${event.venue ? ` at ${event.venue}` : ""}.`;
  return {
    title: `${event.title} · TEDxNewy`,
    description: description.slice(0, 300),
    alternates: { canonical: `/events/${event.slug}` },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  // If this event points somewhere else (a bespoke page or a ticket site),
  // send visitors straight there instead of showing the generated page.
  // Signal isn't public yet: land on /signature instead of the bespoke page.
  if (event.linkUrl === "/signal" && !SIGNAL_LIVE) {
    redirect("/signature");
  }
  if (event.linkUrl && event.linkUrl !== `/events/${event.slug}`) {
    redirect(event.linkUrl);
  }

  const [speakers, talks, photos, pulse] = await Promise.all([
    // With talks attached: a speaker's bio and talk video open in a modal on
    // this page (see components/SpeakerLineup.tsx), not on a separate index.
    getSpeakersWithTalksForEvent(event.id),
    getTalksForEvent(event.id),
    getPhotosForEvent(event.id),
    getTicketPulse(event.ticketUrl),
  ]);

  const kicker = [KIND_LABEL[event.kind], event.shortDate]
    .filter(Boolean)
    .join(" · ");
  const meta = [event.dateLabel, event.venue].filter(Boolean).join(" · ");
  // Flagship (Signature) events get the bigger photo-hero, full-width story
  // and swipeable speaker gallery treatment shared with /signal. Salon and
  // special events keep the original, simpler layout below.
  const isFlagship = event.kind === "flagship";

  // Event structured data. Same shape /signal uses, generalised so every
  // event page (past or upcoming) is legible to search/AI crawlers, not
  // just the flagship ticket page. A past event still gets EventScheduled
  // (schema.org has no "already happened" status) — Google's Event rich
  // result only surfaces future/ongoing dates, but the markup itself still
  // tells any crawler what happened, where, and who spoke.
  const eventJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    url: `https://tedxnewy.com.au/events/${event.slug}`,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    description: event.tagline ?? event.blurb ?? `A TEDxNewy event.`,
    organizer: {
      "@type": "Organization",
      name: "TEDxNewy",
      url: "https://tedxnewy.com.au",
    },
  };
  if (event.startsAt) eventJsonLd.startDate = event.startsAt;
  if (event.venue) {
    eventJsonLd.location = {
      "@type": "Place",
      name: event.venue,
      address: event.venue,
    };
  }
  if (event.heroImageUrl) {
    eventJsonLd.image = event.heroImageUrl.startsWith("http")
      ? event.heroImageUrl
      : `https://tedxnewy.com.au${event.heroImageUrl}`;
  }
  if (event.ticketUrl) {
    eventJsonLd.offers = {
      "@type": "Offer",
      url: event.ticketUrl,
      availability: "https://schema.org/InStock",
    };
  }
  if (speakers.length > 0) {
    eventJsonLd.performer = speakers.map((s) => ({
      "@type": "Person",
      name: s.name,
    }));
  }

  return (
    <>
      <BreadcrumbJsonLd name={event.title} path={`/events/${event.slug}`} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />

      {isFlagship ? (
        <>
          {/* Hero — full-bleed photo, title/meta overlaid at the bottom.
              Nav.tsx's heroIsDark hardcodes these flagship event slugs so
              the header renders light-on-dark over this hero, same as it
              does for pathname === "/signal". */}
          <section
            className="relative overflow-hidden"
            style={{ background: KIND_GRADIENT.flagship }}
          >
            {event.heroImageUrl && (
              <PhotoFill
                src={event.heroImageUrl}
                alt={event.title}
                sizes="100vw"
                priority
                hoverZoom={false}
              />
            )}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(20,6,4,0.35) 0%, rgba(20,6,4,0.15) 30%, rgba(10,4,3,0.55) 75%, rgba(8,3,2,0.85) 100%)",
              }}
            />
            <div className="grain pointer-events-none absolute inset-0 opacity-25" />

            <div className="relative mx-auto max-w-[1100px] px-5 pb-16 pt-40 md:px-6 md:pb-20 md:pt-48">
              <div
                className="font-mono text-[10.5px] font-semibold uppercase text-[#ff9b8f]"
                style={{ letterSpacing: "0.24em" }}
              >
                {kicker || "Signature event"}
              </div>
              <h1
                className="mt-6 font-sans tracking-[-0.025em] text-white balance"
                style={{
                  fontSize: "clamp(2.75rem, 7vw, 5.5rem)",
                  lineHeight: 0.98,
                  fontWeight: 500,
                  fontVariationSettings: '"opsz" 144',
                }}
              >
                {event.title}
              </h1>
              {event.tagline && (
                <p className="mt-6 text-[18px] leading-[1.5] text-white/85 md:text-[20px]">
                  {event.tagline}
                </p>
              )}
              {meta && (
                <div className="mt-6 text-[15px] font-medium text-white/70">
                  {meta}
                </div>
              )}
              {(speakers.length > 0 || talks.length > 0) && (
                <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/15 pt-6">
                  {speakers.length > 0 && (
                    <div className="flex items-baseline gap-2">
                      <span
                        className="font-sans text-[22px] font-medium tracking-[-0.02em] text-white"
                        style={{ fontVariationSettings: '"opsz" 144' }}
                      >
                        {speakers.length}
                      </span>
                      <span className="text-[12.5px] font-medium uppercase tracking-[0.08em] text-white/60">
                        Speaker{speakers.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  )}
                  {talks.length > 0 && (
                    <div className="flex items-baseline gap-2">
                      <span
                        className="font-sans text-[22px] font-medium tracking-[-0.02em] text-white"
                        style={{ fontVariationSettings: '"opsz" 144' }}
                      >
                        {talks.length}
                      </span>
                      <span className="text-[12.5px] font-medium uppercase tracking-[0.08em] text-white/60">
                        Talk{talks.length === 1 ? "" : "s"} online
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Blurb — the story, one paragraph per blank line in the source
              text, spanning the section's full width. */}
          {event.blurb && (
            <section className="mx-auto max-w-[1100px] px-5 py-16 md:px-6 md:py-20">
              <div
                className="mb-5 text-[10.5px] font-semibold uppercase text-[#b91404]"
                style={{ letterSpacing: "0.24em" }}
              >
                The story
              </div>
              <div className="space-y-4">
                {event.blurb.split("\n\n").map((para, i) => (
                  <p
                    key={i}
                    className="text-[16.5px] leading-[1.7] text-[#2a2521] md:text-[17.5px]"
                  >
                    {para}
                  </p>
                ))}
              </div>
            </section>
          )}

          {/* Speaker lineup — swipeable on every breakpoint, not a grid;
              arrow controls + a visible scrollbar kick in from md up. */}
          {speakers.length > 0 && (
            <section className="bg-[#f9f5ec]">
              <div className="mx-auto max-w-[1100px] py-20 md:py-24">
                <SpeakerLineup speakers={speakers}>
                  <SpeakerCarousel speakers={speakers} />
                </SpeakerLineup>
              </div>
            </section>
          )}
        </>
      ) : (
        <>
          {/* Hero */}
          <section className="bg-[var(--color-cream)] pt-40 pb-12 md:pt-48 md:pb-16">
            <div className="mx-auto max-w-[1100px] px-5 md:px-6">
              <div
                className="font-mono text-[10.5px] font-semibold uppercase text-[#b91404]"
                style={{ letterSpacing: "0.24em" }}
              >
                {kicker || "Event"}
              </div>
              <h1
                className="mt-6 font-sans tracking-[-0.025em] text-[#141210] balance"
                style={{
                  fontSize: "clamp(2.5rem, 6vw, 5rem)",
                  lineHeight: 0.98,
                  fontWeight: 500,
                  fontVariationSettings: '"opsz" 144',
                }}
              >
                {event.title}
              </h1>
              {event.tagline && (
                <p className="mt-6 text-[18px] leading-[1.5] text-[#2a2521] md:text-[20px]">
                  {event.tagline}
                </p>
              )}
              {meta && (
                <div className="mt-6 text-[15px] font-medium text-[#6b6459]">
                  {meta}
                </div>
              )}
              {(speakers.length > 0 || talks.length > 0) && (
                <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[rgba(20,18,16,0.10)] pt-6">
                  {speakers.length > 0 && (
                    <div className="flex items-baseline gap-2">
                      <span
                        className="font-sans text-[22px] font-medium tracking-[-0.02em] text-[#141210]"
                        style={{ fontVariationSettings: '"opsz" 144' }}
                      >
                        {speakers.length}
                      </span>
                      <span className="text-[12.5px] font-medium uppercase tracking-[0.08em] text-[#6b6459]">
                        Speaker{speakers.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  )}
                  {talks.length > 0 && (
                    <div className="flex items-baseline gap-2">
                      <span
                        className="font-sans text-[22px] font-medium tracking-[-0.02em] text-[#141210]"
                        style={{ fontVariationSettings: '"opsz" 144' }}
                      >
                        {talks.length}
                      </span>
                      <span className="text-[12.5px] font-medium uppercase tracking-[0.08em] text-[#6b6459]">
                        Talk{talks.length === 1 ? "" : "s"} online
                      </span>
                    </div>
                  )}
                </div>
              )}
              {event.ticketUrl && (
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <TicketLink
                    href={event.ticketUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary"
                  >
                    {event.linkLabel ?? "Get tickets"}
                  </TicketLink>
                  {/* Live sell-through from Humanitix; renders nothing until
                      the event is at least 60% sold, so early weeks stay calm. */}
                  {pulse?.soldOut ? (
                    <span
                      className="rounded-full border border-[rgba(224,34,20,0.35)] bg-[rgba(224,34,20,0.08)] px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#b91404]"
                    >
                      Sold out
                    </span>
                  ) : pulse?.pct != null && pulse.pct >= 60 ? (
                    <span
                      className="rounded-full border border-[rgba(224,34,20,0.35)] bg-[rgba(224,34,20,0.08)] px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#b91404]"
                    >
                      {pulse.pct >= 90 ? "Almost sold out" : `${pulse.pct}% sold`}
                    </span>
                  ) : null}
                  {pulse && pulse.angel > 0 && (
                    <span className="basis-full text-[13px] text-[#6b6459]">
                      {pulse.angel} Angel seat{pulse.angel === 1 ? "" : "s"} funded
                      so far, each paying for a second seat for someone who needs
                      it.
                    </span>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Hero image */}
          {event.heroImageUrl && (
            <section className="mx-auto max-w-[1180px] px-5 pb-16 md:px-6 md:pb-20">
              <div
                className="relative aspect-[16/9] w-full overflow-hidden rounded-[var(--radius-md)]"
                style={{ background: KIND_GRADIENT[event.kind] }}
              >
                <PhotoFill
                  src={event.heroImageUrl}
                  alt={event.title}
                  sizes="(max-width: 1180px) 100vw, 1180px"
                  priority
                />
              </div>
            </section>
          )}

          {/* Blurb — the story, one paragraph per blank line in the source text */}
          {event.blurb && (
            <section className="mx-auto max-w-[1100px] px-5 pb-16 md:px-6 md:pb-20">
              <div
                className="mb-5 text-[10.5px] font-semibold uppercase text-[#b91404]"
                style={{ letterSpacing: "0.24em" }}
              >
                The story
              </div>
              <div className="space-y-4">
                {event.blurb.split("\n\n").map((para, i) => (
                  <p
                    key={i}
                    className="text-[16.5px] leading-[1.7] text-[#2a2521] md:text-[17.5px]"
                  >
                    {para}
                  </p>
                ))}
              </div>
            </section>
          )}

          {/* Speaker lineup */}
          {speakers.length > 0 && (
            <section className="bg-[#f9f5ec]">
              <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
                <div
                  className="text-[10.5px] font-semibold uppercase text-[#b91404]"
                  style={{ letterSpacing: "0.24em" }}
                >
                  The lineup
                </div>
                <h2
                  className="mt-4 font-sans tracking-[-0.025em] text-[#141210] balance"
                  style={{
                    fontSize: "clamp(1.65rem, 3vw, 2.25rem)",
                    lineHeight: 1.1,
                    fontWeight: 500,
                    fontVariationSettings: '"opsz" 144',
                  }}
                >
                  Speakers
                </h2>
                <SpeakerLineup speakers={speakers}>
                  <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
                    {speakers.map((s) => (
                      <SpeakerCard key={s.slug} speaker={s} />
                    ))}
                  </div>
                </SpeakerLineup>
              </div>
            </section>
          )}
        </>
      )}

      {/* Talks */}
      {talks.length > 0 && (
        <section className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
          <div
            className="text-[10.5px] font-semibold uppercase text-[#b91404]"
            style={{ letterSpacing: "0.24em" }}
          >
            Watch
          </div>
          <h2
            className="mt-4 font-sans tracking-[-0.025em] text-[#141210] balance"
            style={{
              fontSize: "clamp(1.65rem, 3vw, 2.25rem)",
              lineHeight: 1.1,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            Talks from the night
          </h2>
          <ul className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {talks.map((t) => (
              <li key={t.id}>
                <a
                  href={`https://www.youtube.com/watch?v=${t.youtubeId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group block focus-visible:outline-none"
                >
                  <div className="relative aspect-video w-full overflow-hidden rounded-[var(--radius-md)] bg-[#1a1714]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://i.ytimg.com/vi/${t.youtubeId}/hqdefault.jpg`}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="mt-4">
                    <div className="font-sans text-[16px] font-medium leading-tight tracking-[-0.01em] text-[#141210] group-hover:text-[#b91404]">
                      {t.title}
                    </div>
                    <div className="mt-1 text-[13.5px] text-[#6b6459]">
                      {t.speaker}
                    </div>
                  </div>
                </a>
              </li>
            ))}
          </ul>
          <Link
            href="/talks"
            className="mt-10 inline-flex items-center gap-1.5 text-[14.5px] font-medium text-[#b91404]"
          >
            See the full talk archive
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </section>
      )}

      {/* Photo gallery teaser */}
      {photos.length > 0 && (
        <section className="bg-[#f9f5ec]">
          <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
            <div
              className="text-[10.5px] font-semibold uppercase text-[#b91404]"
              style={{ letterSpacing: "0.24em" }}
            >
              Relive it
            </div>
            <h2
              className="mt-4 font-sans tracking-[-0.025em] text-[#141210] balance"
              style={{
                fontSize: "clamp(1.65rem, 3vw, 2.25rem)",
                lineHeight: 1.1,
                fontWeight: 500,
                fontVariationSettings: '"opsz" 144',
              }}
            >
              Photos from the night
            </h2>
            <div className="mt-10 grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-6">
              {photos.slice(0, 6).map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-square overflow-hidden rounded-[var(--radius-md)] bg-[#1a1714]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.thumbUrl}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
            <Link
              href={`/events/${event.slug}/gallery`}
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-[#e02214] px-6 py-3.5 font-sans text-[14.5px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404]"
            >
              <Images className="h-4 w-4" strokeWidth={2.25} />
              See the full gallery
              <span className="text-white/75">
                ({photos.length} photo{photos.length === 1 ? "" : "s"})
              </span>
            </Link>
          </div>
        </section>
      )}

      {/* Live "recent events" band, shared with every other event page. */}
      <RecentEvents excludeSlug={event.slug} />
    </>
  );
}

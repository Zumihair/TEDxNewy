import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowUpRight, Images } from "lucide-react";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import PhotoFill from "@/components/PhotoFill";
import SpeakerCard from "@/components/SpeakerCard";
import {
  getEventBySlug,
  getPhotosForEvent,
  getSpeakersForEvent,
  getTalksForEvent,
  type CmsEvent,
} from "@/lib/cms-content";
import { SIGNAL_LIVE } from "@/lib/feature-flags";

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

  const [speakers, talks, photos] = await Promise.all([
    getSpeakersForEvent(event.id),
    getTalksForEvent(event.id),
    getPhotosForEvent(event.id),
  ]);

  const kicker = [KIND_LABEL[event.kind], event.shortDate]
    .filter(Boolean)
    .join(" · ");
  const meta = [event.dateLabel, event.venue].filter(Boolean).join(" · ");

  return (
    <>
      <BreadcrumbJsonLd name={event.title} path={`/events/${event.slug}`} />

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
            <p className="mt-6 max-w-[42ch] text-[18px] leading-[1.5] text-[#2a2521] md:text-[20px]">
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
              <a
                href={event.ticketUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
              >
                {event.linkLabel ?? "Get tickets"}
              </a>
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
          <div className="max-w-[68ch] space-y-4">
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
            <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
              {speakers.map((s) => (
                <SpeakerCard key={s.slug} speaker={s} />
              ))}
            </div>
          </div>
        </section>
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

      {/* Explore more events */}
      <section className="bg-[#141210] text-white">
        <div className="mx-auto flex max-w-[1100px] flex-col items-start gap-8 px-5 py-20 md:flex-row md:items-center md:justify-between md:px-6 md:py-24">
          <div>
            <div
              className="font-mono text-[10.5px] font-semibold uppercase text-[#ff6e62]"
              style={{ letterSpacing: "0.24em" }}
            >
              Keep exploring
            </div>
            <h2
              className="mt-4 max-w-[24ch] font-sans tracking-[-0.025em] balance"
              style={{
                fontSize: "clamp(1.65rem, 3.2vw, 2.4rem)",
                lineHeight: 1.05,
                fontWeight: 500,
                fontVariationSettings: '"opsz" 144',
              }}
            >
              See more of our events.
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href="/signature"
              className="inline-flex items-center gap-1.5 text-[14.5px] font-medium text-white"
            >
              Signature events
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </Link>
            <Link
              href="/events"
              className="inline-flex items-center gap-1.5 text-[14.5px] font-medium text-white"
            >
              All events
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

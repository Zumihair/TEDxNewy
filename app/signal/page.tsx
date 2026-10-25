import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import SubmitLockForm from "@/components/SubmitLockForm";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import PhotoFill from "@/components/PhotoFill";
import ProgrammeMotif from "@/components/ProgrammeMotif";
import PartnerTiers from "@/components/PartnerTiers";
import SpeakerCarousel from "@/components/SpeakerCarousel";
import SpeakerLineup from "@/components/SpeakerLineup";
import RecentEvents from "@/components/RecentEvents";
import {
  getEvents,
  getSpeakersWithTalksForEvent,
  type SpeakerWithTalk,
} from "@/lib/cms-content";
import { motifFor } from "@/lib/programme-motif";
import {
  SIGNAL_ACTIVATING_LEADERS,
  SIGNAL_ACTIVATING_PARTNERS,
  SIGNAL_COMMUNITY_PARTNERS,
  SIGNAL_SPEAKERS_REMOVED,
  SIGNAL_STUDENT_SPEAKERS,
} from "@/lib/signal-content";

/**
 * Signal, after the day (24 October 2026). This page used to be the ticket
 * sale page: tiers, waitlist, FAQ, sold-out banner. All of that is gone, and
 * it is in git history if a future flagship wants the shape back. What is
 * here now follows the past flagship pages (Reframe, Beyond Boundaries, see
 * app/events/[slug]): artwork hero, the story, the speakers, then thank-yous.
 * A "Watch talks from the afternoon" section goes after the speakers once the
 * talks are online.
 */

export const metadata = {
  alternates: { canonical: "/signal" },
  title: "Signal · TEDxNewy 2026",
  description:
    "Signal was TEDxNewy's flagship 2026 event, held on Saturday 24 October at the Conservatorium of Music. Meet the speakers and the partners who made it happen.",
};

// Re-fetch from Supabase every 60s so admin edits (speakers) land live.
export const revalidate = 60;

function ActivatingPills({ items }: { items: { name: string; url?: string }[] }) {
  const pill =
    "inline-flex items-center rounded-full border border-[rgba(0,0,0,0.15)] px-4 py-2 text-[14px] font-medium text-[#000000] transition-colors";
  return (
    <ul className="mx-auto mt-10 flex max-w-[900px] flex-wrap justify-center gap-3">
      {items.map((a) => (
        <li key={a.name}>
          {a.url ? (
            <a
              href={a.url}
              target="_blank"
              rel="noreferrer"
              className={`${pill} hover:border-[#b91404] hover:bg-[#b91404] hover:text-white`}
            >
              {a.name}
            </a>
          ) : (
            <span className={pill}>{a.name}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

const H2_STYLE = {
  fontSize: "clamp(1.65rem, 3vw, 2.25rem)",
  lineHeight: 1.1,
  fontWeight: 500,
  fontVariationSettings: '"opsz" 144',
} as const;

export default async function SignalPage() {
  const flagshipEvents = await getEvents({ kind: "flagship" });
  const signalEvent = flagshipEvents.find((e) => e.slug === "signal-2026");
  const cmsSpeakers = signalEvent
    ? await getSpeakersWithTalksForEvent(signalEvent.id)
    : [];

  // Peter Richardson is out; two students are in. See lib/signal-content.ts.
  const students: SpeakerWithTalk[] = SIGNAL_STUDENT_SPEAKERS.map((s) => ({
    ...s,
    talk: "",
    accent: "red",
    year: 2026,
  }));
  const speakers: SpeakerWithTalk[] = [
    ...cmsSpeakers.filter((s) => !SIGNAL_SPEAKERS_REMOVED.has(s.slug)),
    ...students,
  ];
  const activating = [...SIGNAL_ACTIVATING_LEADERS, ...SIGNAL_ACTIVATING_PARTNERS];
  const motif = motifFor({ slug: "signal-2026", title: "Signal", kind: "flagship" });

  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: "Signal · TEDxNewy 2026",
    startDate: "2026-10-24T13:30:00+11:00",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: "Conservatorium of Music",
      address: "Corner Laman Street and Auckland Street, Newcastle NSW 2300",
    },
    image: "https://tedxnewy.com.au/images/signal-authenticity-artwork.webp",
    description:
      "TEDxNewy's flagship 2026 event: talks, performances and a room full of curious people.",
    performer: speakers.map((s) => ({ "@type": "Person", name: s.name })),
    organizer: {
      "@type": "Organization",
      name: "TEDxNewy",
      url: "https://tedxnewy.com.au",
    },
  };

  return (
    <>
      <BreadcrumbJsonLd name="Signal" path="/signal" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />

      {/* HERO: same shape as the other flagship pages, with the Authenticity
          artwork by Jenni Jean. */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #2a0604 0%, #8c0d05 50%, #b91404 100%)",
        }}
      >
        {motif && <ProgrammeMotif motif={motif} />}
        <PhotoFill
          src="/images/signal-authenticity-artwork.webp"
          alt="Authenticity, the Signal 2026 artwork by Jenni Jean: rows of red fingerprints on a dark red canvas, with one gold print among them."
          sizes="100vw"
          priority
          hoverZoom={false}
        />
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
          <div className="font-ui text-[12px] font-semibold text-[#ff9b8f]">
            Main stage · 24 October
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
            Signal
          </h1>
          <p className="mt-6 text-[18px] leading-[1.5] text-white/85 md:text-[20px]">
            Thank you for being part of it.
          </p>
          <div className="mt-6 text-[15px] font-medium text-white/70">
            Saturday 24 October 2026 · Conservatorium of Music
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/15 pt-6">
            <div className="flex items-baseline gap-2">
              <span
                className="font-sans text-[22px] font-medium tracking-[-0.02em] text-white"
                style={{ fontVariationSettings: '"opsz" 144' }}
              >
                {speakers.length}
              </span>
              <span className="text-[12.5px] font-medium text-white/60">Speakers</span>
            </div>
          </div>
          <p className="mt-6 text-[12.5px] text-white/55">
            Artwork: Authenticity, by Jenni Jean.
          </p>
        </div>
      </section>

      {/* THE STORY */}
      <section className="mx-auto max-w-[1100px] px-5 py-16 md:px-6 md:py-20">
        <div className="mb-3 text-[20px] font-medium tracking-[-0.01em] text-[#000000]">
          The story
        </div>
        <div className="space-y-4">
          <p className="text-[16.5px] leading-[1.7] text-[#2a2521] md:text-[17.5px]">
            Signal was a room full of curious people at the Conservatorium of
            Music, with talks, performances and a lot of conversation in
            between. People from different industries, backgrounds and
            generations came together for one afternoon of ideas.
          </p>
          <p className="text-[16.5px] leading-[1.7] text-[#2a2521] md:text-[17.5px]">
            Two sessions of talks, a fireside chat with our TEDxNewy Artist
            for 2026, student speakers and drinks in the foyer to finish.
            Thank you to everyone who came, to our speakers, and to the
            partners and volunteers who made it happen.
          </p>
        </div>
      </section>

      {/* THE SPEAKERS */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1100px] py-20 md:py-24">
          <SpeakerLineup speakers={speakers}>
            <SpeakerCarousel speakers={speakers} hideLabel />
          </SpeakerLineup>
        </div>
      </section>

      {/* PHOTOS AND VIDEO: held for the edit. Red so it stands out. */}
      <section className="relative overflow-hidden bg-[#e62b1e] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 80% 30%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 60%)",
          }}
        />
        <div className="relative mx-auto max-w-[1100px] px-5 py-16 md:px-6 md:py-20">
          <h2
            className="max-w-[24ch] font-sans tracking-[-0.025em] balance"
            style={H2_STYLE}
          >
            Photos and video from the day are coming soon.
          </h2>
          <p className="mt-4 max-w-[56ch] text-[16px] leading-[1.65] text-white/90">
            Our media partner Newy Digital captured Signal, and their photos
            and video will be live here very soon.
          </p>
        </div>
      </section>

      {/* THANKS */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
          <h2
            className="text-center font-sans tracking-[-0.025em] text-[#000000] balance"
            style={H2_STYLE}
          >
            Thanks to those who made it possible.
          </h2>
          <div className="mt-12">
            <PartnerTiers variant="light" scale={1.5} supportingInRow />
          </div>

          <div className="mt-20 border-t border-[rgba(0,0,0,0.10)] pt-16 text-center">
            <h2
              className="font-sans tracking-[-0.025em] text-[#000000] balance"
              style={H2_STYLE}
            >
              Activating partners
            </h2>
            <p className="mt-4 text-[16px] leading-[1.65] text-[#2a2521]">
              The businesses and organisations who brought the foyer and the
              day to life.
            </p>
            <ActivatingPills items={activating} />
          </div>

          <div className="mt-20 border-t border-[rgba(0,0,0,0.10)] pt-16 text-center">
            <h2
              className="font-sans tracking-[-0.025em] text-[#000000] balance"
              style={H2_STYLE}
            >
              Community partners
            </h2>
            <p className="mt-4 text-[16px] leading-[1.65] text-[#2a2521]">
              The restaurants, bars, cafes and hotels that backed our event
              week with offers and unique TEDx themed specials.
            </p>
            <ul className="mx-auto mt-10 flex max-w-[900px] flex-wrap justify-center gap-x-7 gap-y-3 text-[16px] font-medium text-[#2a2521]">
              {SIGNAL_COMMUNITY_PARTNERS.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </div>

          <div className="mt-14 text-center">
          <Link
            href="/sponsors"
            className="inline-flex items-center gap-1.5 text-[15px] font-medium text-[#b91404]"
          >
            See all our partners
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </Link>
          </div>
        </div>
      </section>

      <RecentEvents excludeSlug={signalEvent?.slug} />

      {/* STAY IN THE LOOP: red, so it reads apart from the footer below it. */}
      <section
        id="stay"
        className="relative overflow-hidden bg-[#e62b1e] text-white"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 80% 30%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 60%)",
          }}
        />
        <div className="relative mx-auto max-w-[560px] px-5 py-20 text-center md:px-6 md:py-24">
          <h2
            className="font-sans tracking-[-0.025em] balance"
            style={{
              fontSize: "clamp(1.75rem, 3.4vw, 2.5rem)",
              lineHeight: 1.05,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            Be first to hear what&rsquo;s next.
          </h2>
          <p className="mx-auto mt-4 max-w-[46ch] text-[15.5px] leading-[1.65] text-white/85">
            Leave your email and we&rsquo;ll send the photos and video from
            Signal, then the next event.
          </p>
          <SubmitLockForm
            action="/api/subscribe"
            method="post"
            className="mx-auto mt-8 flex max-w-[380px] flex-col gap-3"
          >
            <input type="hidden" name="source" value="signal-recap" />
            <label htmlFor="signal-recap-email" className="sr-only">
              Email address
            </label>
            <input
              id="signal-recap-email"
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-white/25 bg-white/10 px-6 py-3.5 text-[15px] text-white placeholder:text-white/60 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/40"
            />
            <button type="submit" className="btn-primary">
              Keep me posted
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </button>
            <p className="text-center text-[12px] text-white/75">
              By entering your email, you agree to receive marketing emails
              from TEDxNewy. You can unsubscribe at any time.
            </p>
          </SubmitLockForm>
        </div>
      </section>
    </>
  );
}

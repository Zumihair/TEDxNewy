import Link from "next/link";
import { ArrowUpRight, Camera, Clapperboard } from "lucide-react";
import SubmitLockForm from "@/components/SubmitLockForm";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import PhotoFill from "@/components/PhotoFill";
import NodeNetwork from "@/components/NodeNetwork";
import PartnerTiers from "@/components/PartnerTiers";
import SpeakerLineup from "@/components/SpeakerLineup";
import RecentEvents from "@/components/RecentEvents";
import SignalSpeakerCard from "./SignalSpeakerCard";
import SignalSpeakerPuzzle from "./SignalSpeakerPuzzle";
import {
  getEvents,
  getSpeakersWithTalksForEvent,
  type SpeakerWithTalk,
} from "@/lib/cms-content";
import {
  SIGNAL_ACTIVATING_PARTNERS,
  SIGNAL_AGENDA as AGENDA,
  SIGNAL_COMMUNITY_PARTNERS,
  SIGNAL_SPEAKERS_REMOVED,
  SIGNAL_STUDENT_SPEAKERS,
} from "@/lib/signal-content";

/**
 * Signal, after the day (24 October 2026). This page used to be the ticket
 * sale page: tiers, waitlist, FAQ, sold-out banner. All of that is gone, and
 * it is in git history if a future flagship wants the shape back. What is
 * here now follows the past flagship pages (artwork hero, the story, the
 * lineup, thank-yous) plus the partners, and holds a place for the photos
 * and video that are still being edited.
 */

export const metadata = {
  alternates: { canonical: "/signal" },
  title: "Signal · TEDxNewy 2026",
  description:
    "Signal was TEDxNewy's flagship 2026 event, held on Saturday 24 October at the Conservatorium of Music. Meet the speakers and the partners who made it happen.",
};

// Re-fetch from Supabase every 60s so admin edits (speakers) land live.
export const revalidate = 60;

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

      <div className="relative bg-[#0d0503] text-white">
        <NodeNetwork
          variant="light"
          className="pointer-events-none fixed inset-0 z-0 opacity-[0.12] md:opacity-[0.18]"
        />

        <div className="relative z-10">
          {/* HERO: the Authenticity artwork by Jenni Jean, full bleed. */}
          <section className="relative flex min-h-[88vh] w-full items-end overflow-hidden bg-[#2a0604]">
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
                  "linear-gradient(180deg, rgba(13,5,3,0.5) 0%, rgba(13,5,3,0.15) 40%, rgba(13,5,3,0.9) 100%)",
              }}
            />
            <div className="grain grain-dark pointer-events-none absolute inset-0 opacity-30" />
            <div className="relative mx-auto w-full max-w-[1100px] px-5 pb-16 pt-40 md:px-6 md:pb-20 md:pt-48">
              <div
                className="font-sans tracking-[-0.03em] text-white"
                style={{
                  fontSize: "clamp(3.25rem, 11vw, 8.5rem)",
                  fontWeight: 500,
                  lineHeight: 0.94,
                  fontVariationSettings: '"opsz" 144',
                }}
              >
                SIGNAL
              </div>
              <p className="mt-6 max-w-[40ch] text-[17px] leading-[1.55] text-white/85 md:text-[19px]">
                Thank you for being part of it.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-5">
                <a href="#stay" className="btn-red">
                  Stay in the loop
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                </a>
                <span className="text-[14.5px] font-medium text-white/70">
                  Saturday 24 October 2026 · Conservatorium of Music
                </span>
              </div>
              <p className="mt-8 text-[12.5px] text-white/55">
                Artwork: Authenticity, by Jenni Jean.
              </p>
            </div>
          </section>

          {/* THE DAY */}
          <section className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-28">
            <div className="grid gap-12 md:grid-cols-12 md:gap-16">
              <div className="md:col-span-5">
                <h2
                  className="font-sans tracking-[-0.025em] text-white balance"
                  style={H2_STYLE}
                >
                  The day.
                </h2>
              </div>
              <div className="md:col-span-7">
                <p className="text-[16.5px] leading-[1.7] text-white/85 md:text-[17.5px]">
                  Signal was a room full of curious people at the
                  Conservatorium of Music, with talks, performances and a lot
                  of conversation in between. People from different
                  industries, backgrounds and generations came together for
                  one afternoon of ideas.
                </p>
                <p className="mt-4 text-[16.5px] leading-[1.7] text-white/85 md:text-[17.5px]">
                  Two sessions of talks, a secret showcase and drinks in the
                  foyer to finish. Thank you to everyone who came, to our
                  speakers and performers, and to the partners and volunteers
                  who made it happen.
                </p>
                <dl className="mt-10 divide-y divide-white/10 border-y border-white/10">
                  {AGENDA.map((a) => (
                    <div
                      key={a.title}
                      className="grid gap-1 py-4 sm:grid-cols-[11rem_1fr] sm:gap-6"
                    >
                      <dt className="text-[13.5px] font-medium text-white/55">
                        {a.time}
                      </dt>
                      <dd className="text-[15px] font-medium text-white">
                        {a.title}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </section>

          {/* SPEAKERS */}
          <section
            id="speakers"
            className="border-y border-white/10 bg-white/[0.02]"
          >
            <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-28">
              <SpeakerLineup speakers={speakers}>
                <div className="grid gap-10 md:grid-cols-12 md:gap-14">
                  <div className="md:col-span-4">
                    <h2
                      className="max-w-[16ch] font-sans tracking-[-0.025em] text-white balance"
                      style={H2_STYLE}
                    >
                      Our speakers.
                    </h2>
                    <p className="mt-4 text-[15px] leading-[1.6] text-white/70">
                      The voices on the Signal stage, including two students
                      from Newcastle schools. Tap a speaker to read more.
                    </p>
                  </div>
                  <div className="md:col-span-8">
                    <SignalSpeakerPuzzle speakers={speakers} />
                    <div className="hidden gap-x-6 gap-y-10 sm:grid sm:grid-cols-4">
                      {speakers.map((s) => (
                        <SignalSpeakerCard key={s.slug} speaker={s} />
                      ))}
                    </div>
                  </div>
                </div>
              </SpeakerLineup>
            </div>
          </section>

          {/* PHOTOS AND VIDEO: held for the edit. */}
          <section className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-28">
            <h2
              className="max-w-[20ch] font-sans tracking-[-0.025em] text-white balance"
              style={H2_STYLE}
            >
              Photos and video from the day.
            </h2>
            <p className="mt-4 max-w-[52ch] text-[15.5px] leading-[1.65] text-white/70">
              We&rsquo;re editing them now. They&rsquo;ll land here and in
              our newsletter as soon as they&rsquo;re ready.
            </p>
            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {[
                { icon: Camera, label: "Photo gallery", note: "Coming soon" },
                { icon: Clapperboard, label: "Event film and talks", note: "Coming soon" },
              ].map(({ icon: Icon, label, note }) => (
                <div
                  key={label}
                  className="flex aspect-video flex-col items-center justify-center gap-3 rounded-[var(--radius-md)] border border-dashed border-white/20 bg-white/[0.03] text-center"
                >
                  <Icon className="h-8 w-8 text-white/35" strokeWidth={1.5} />
                  <div className="font-sans text-[16px] font-medium text-white">
                    {label}
                  </div>
                  <div className="text-[13px] text-white/55">{note}</div>
                </div>
              ))}
            </div>
          </section>

          {/* PARTNERS */}
          <section className="border-y border-white/10 bg-white/[0.02]">
            <div className="mx-auto max-w-[1100px] px-5 py-20 text-center md:px-6 md:py-24">
              <h2
                className="mx-auto max-w-[24ch] font-sans tracking-[-0.025em] text-white balance"
                style={H2_STYLE}
              >
                The partners who made Signal possible.
              </h2>
              <div className="mt-12">
                <PartnerTiers variant="dark" scale={1.5} />
              </div>

              <div className="mx-auto mt-20 max-w-[760px] border-t border-white/10 pt-14">
                <h3
                  className="font-sans text-[22px] font-medium tracking-[-0.015em] text-white"
                  style={{ fontVariationSettings: '"opsz" 144' }}
                >
                  Activating partners
                </h3>
                <p className="mx-auto mt-3 max-w-[52ch] text-[15px] leading-[1.65] text-white/70">
                  The businesses and organisations who brought the foyer and
                  the day to life.
                </p>
                <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[15px] text-white/85">
                  {SIGNAL_ACTIVATING_PARTNERS.map((a) => (
                    <li key={a.name}>
                      {a.url ? (
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className="underline decoration-white/30 underline-offset-4 transition-colors hover:text-white hover:decoration-white"
                        >
                          {a.name}
                        </a>
                      ) : (
                        a.name
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mx-auto mt-16 max-w-[760px]">
                <h3
                  className="font-sans text-[22px] font-medium tracking-[-0.015em] text-white"
                  style={{ fontVariationSettings: '"opsz" 144' }}
                >
                  Community partners
                </h3>
                <p className="mx-auto mt-3 max-w-[52ch] text-[15px] leading-[1.65] text-white/70">
                  The restaurants, bars, cafes, hotels and galleries that
                  backed event week with offers and a warm welcome. Please
                  support them.
                </p>
                <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[15px] text-white/85">
                  {SIGNAL_COMMUNITY_PARTNERS.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              </div>

              <Link
                href="/sponsors"
                className="mt-14 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-white/70 hover:text-white"
              >
                See all our partners
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
              </Link>
            </div>
          </section>

          <RecentEvents excludeSlug={signalEvent?.slug} variant="inline" />
        </div>
      </div>

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

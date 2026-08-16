import Link from "next/link";
import Script from "next/script";
import { redirect } from "next/navigation";
import { Clock, MapPin, ArrowUpRight, Compass } from "lucide-react";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import PhotoFill from "@/components/PhotoFill";
import NodeNetwork from "@/components/NodeNetwork";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import SignalPromoBanner from "@/components/SignalPromoBanner";
import StickyTicketButton from "@/components/StickyTicketButton";
import FaqAccordion from "@/components/FaqAccordion";
import {
  getEvents,
  getSpeakersForEvent,
  getSponsors,
  type CmsEvent,
} from "@/lib/cms-content";
import { SIGNAL_LIVE, SIGNAL_PREVIEW_TOKEN } from "@/lib/feature-flags";

// Sponsors kept off the Signal teaser but still shown in full on /sponsors.
const SIGNAL_SPONSOR_EXCLUDE = new Set(["Elqo", "Newy Digital", "Frekl"]);

// Widget doc: paste the script tag in <head>, and use this URL in any link
// element to open the Humanitix pop-up instead of navigating away.
const TICKET_URL = "https://events.humanitix.com/tedxnewy-signature-event";
const TICKET_POPUP_URL = `${TICKET_URL}/tickets?widget=popup`;

export const metadata = {
  alternates: { canonical: "/signal" },
  title: "Signal · TEDxNewy 2026",
  description:
    "Signal is TEDxNewy's flagship 2026 event, Saturday 24 October at the Conservatorium of Music. Talks, performances and a room full of curious people. Tickets on sale now.",
  // Gated behind SIGNAL_LIVE (see below): even the preview-token path stays
  // out of search results while it's not officially announced.
  robots: SIGNAL_LIVE ? undefined : { index: false, follow: false },
};

// Re-fetch from Supabase every 60s so admin edits (past editions, sponsors,
// speakers) land live without redeploys.
export const revalidate = 60;

const AGENDA: { time: string; title: string; body: string }[] = [
  {
    time: "1:30pm to 2:00pm",
    title: "Arrival & registration",
    body: "Doors open. Check in, grab your name badge and find your seat before we begin.",
  },
  {
    time: "2:00pm to 3:30pm",
    title: "Session 1",
    body: "Event commencement, followed by talks and performances.",
  },
  {
    time: "4:00pm to 5:30pm",
    title: "Session 2",
    body: "Following a brief intermission, we recommence with a secret showcase, followed by the second round of talks.",
  },
  {
    time: "5:30pm to 6:30pm",
    title: "Drinks hour",
    body: "Join us for drinks in the foyer afterwards to unpack the afternoon, enjoy a drink, share with others and relish in the TEDx community.",
  },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "What can I expect from a TEDxNewy event?",
    a: "Expect a series of short, thought-provoking talks, plenty of opportunities to meet interesting people, and an atmosphere designed to spark conversation. Many attendees say the discussions between sessions become just as memorable as the talks themselves.",
  },
  {
    q: "Is this just a series of talks?",
    a: "Not at all. TED stands for technology, entertainment and design, and a talk is not the only way to share ideas within those domains. At the heart of the experience, TEDxNewy is also about bringing together curious, engaged people. Whether you're attending alone or with friends, you'll find plenty of opportunities to connect with others.",
  },
  {
    q: "Who attends TEDxNewy?",
    a: "Our audience is incredibly diverse. You'll meet founders, students, educators, creatives, researchers, healthcare professionals, community leaders and lifelong learners. What connects everyone is curiosity and a desire to learn.",
  },
  {
    q: "What's included in my ticket?",
    a: "Your ticket includes access to all sessions, activation spaces and the after party. You'll also receive a goody bag on the day.",
  },
  {
    q: "Will the talks be recorded?",
    a: "Talks are professionally recorded with the intention of being published on the TEDx YouTube channel after the event. Not every talk is guaranteed to be released.",
  },
  {
    q: "How long are the talks?",
    a: "TEDx talks are under 18 minutes, with many considerably shorter, creating an engaging and fast paced experience.",
  },
  {
    q: "What should I wear?",
    a: "Smart casual is a great choice. Come comfortable enough to enjoy the evening while feeling like you're attending something special.",
  },
  {
    q: "Is food provided?",
    a: "Not this year. Our afterparty will include canapes. The timing is designed so that you could enjoy a lunch out in Newcastle before arriving, then go out and enjoy dinner afterwards.",
  },
  {
    q: "Is networking a big focus?",
    a: "We don't think of it as networking. TEDxNewy brings together people who are genuinely curious, and the best connections happen naturally through shared ideas and conversations.",
  },
  {
    q: "Will I fit in?",
    a: "If you're curious, open minded and enjoy learning, you'll fit right in. You don't need to be an expert in anything, just willing to engage with new ideas.",
  },
];

// Real attendee quotes from past events.
const TESTIMONIALS: { quote: string; name: string }[] = [
  {
    quote:
      "If you like to explore and share new ideas or hear different perspectives, I recommend coming along and joining in.",
    name: "Grace M",
  },
  {
    quote: "Newy has a lot to say.",
    name: "Tracy H",
  },
  {
    quote:
      "What a brilliant showcase of the creativity and diversity of our Newcastle community!",
    name: "Annelise D",
  },
  {
    quote:
      "It’s a vibe! An opportunity to listen, learn and mingle, I’ll be back.",
    name: "Christine F",
  },
  {
    quote:
      "Very relaxed, interesting, engaging and informal opportunity to meet new people and hear inspired ideas.",
    name: "Jo T",
  },
];

// Thumbnail per past edition, keyed by slug (only the two prior flagships
// have dedicated photography catalogued yet).
const EDITION_PHOTO: Record<string, string> = {
  "beyond-boundaries-2024": "/images/past-2024.jpg",
  "reframe-2025": "/images/past-2025.jpg",
};

function eventHref(e: CmsEvent) {
  return e.linkUrl ?? `/events/${e.slug}`;
}

export default async function SignalPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const { preview } = await searchParams;
  if (!SIGNAL_LIVE && preview !== SIGNAL_PREVIEW_TOKEN) {
    redirect("/signature");
  }

  const [flagshipEvents, sponsors] = await Promise.all([
    // Already newest-first (see sortEvents in cms-content.ts), so this leads
    // with Signal itself, then Reframe, then Beyond Boundaries.
    getEvents({ kind: "flagship" }),
    getSponsors(),
  ]);

  const signalEvent = flagshipEvents.find((e) => e.slug === "signal-2026");
  const signalSpeakers = signalEvent
    ? await getSpeakersForEvent(signalEvent.id)
    : [];
  const signalSponsors = sponsors.filter(
    (s) => !SIGNAL_SPONSOR_EXCLUDE.has(s.name),
  );

  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: "Signal · TEDxNewy 2026",
    startDate: "2026-10-24T14:00:00+11:00",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: "Conservatorium of Music",
      address: "Corner Laman Street and Auckland Street, Newcastle NSW 2300",
    },
    description:
      "TEDxNewy's flagship 2026 event: talks, performances and a room full of curious people.",
    offers: {
      "@type": "Offer",
      url: TICKET_URL,
      availability: "https://schema.org/InStock",
    },
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
      {/* Humanitix pop-up widget: loads the widget script, links using
          TICKET_POPUP_URL below then open in an overlay instead of a new tab. */}
      <Script
        src="https://events.humanitix.com/scripts/widgets/popup.js"
        type="module"
        strategy="afterInteractive"
      />

      <SignalPromoBanner href={TICKET_POPUP_URL} />
      <StickyTicketButton href={TICKET_POPUP_URL} />

      <div className="relative bg-[#0d0503] text-white">
        <NodeNetwork
          variant="light"
          className="pointer-events-none fixed inset-0 z-0 opacity-[0.12] md:opacity-[0.18]"
        />

        <div className="relative z-10">
          {/* HERO — full-bleed photo, everything overlaid, nothing above it */}
          <section className="relative flex min-h-[92vh] w-full items-end overflow-hidden">
            <PhotoFill
              src="/images/stage-welcome.jpg"
              alt="The TEDxNewy stage, Reframe 2025."
              sizes="100vw"
              priority
              hoverZoom={false}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(13,5,3,0.55) 0%, rgba(13,5,3,0.35) 35%, rgba(13,5,3,0.92) 100%)",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 30% 30%, rgba(255,155,143,0.25) 0%, rgba(224,34,20,0.08) 40%, rgba(5,8,24,0) 70%)",
              }}
            />
            <div className="grain grain-dark pointer-events-none absolute inset-0 opacity-30" />

            <div className="relative mx-auto w-full max-w-[1100px] px-5 pb-16 pt-[calc(var(--banner-offset,0px)+10rem)] md:px-6 md:pb-20 md:pt-[calc(var(--banner-offset,0px)+12rem)]">
              <div
                className="font-mono text-[10.5px] font-semibold uppercase text-[#ff9b8f]"
                style={{ letterSpacing: "0.28em" }}
              >
                Flagship TEDxNewy 2026
              </div>
              <div
                className="mt-4 font-sans tracking-[-0.03em] text-white"
                style={{
                  fontSize: "clamp(3.25rem, 11vw, 8.5rem)",
                  fontWeight: 500,
                  lineHeight: 0.94,
                  fontVariationSettings: '"opsz" 144',
                }}
              >
                SIGNAL
              </div>
              <p className="mt-6 text-[16.5px] leading-[1.6] text-white/80 md:text-[18px]">
                TEDxNewy is more than a stage. It&rsquo;s a room full of
                curious people who believe that one conversation, one idea,
                or one unexpected connection can change the direction of a
                life.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-5">
                <a
                  href={TICKET_POPUP_URL}
                  className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-7 py-3.5 font-sans text-[14.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                >
                  Get tickets
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                </a>
                <span className="text-[14.5px] font-medium text-white/70">
                  Saturday 24 October 2026 · Conservatorium of Music
                </span>
              </div>
            </div>
          </section>

          {/* ABOUT — text / photo, left-right */}
          <section className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-28">
            <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
              <div>
                <div
                  className="font-mono text-[10.5px] font-semibold uppercase text-[#ff9b8f]"
                  style={{ letterSpacing: "0.24em" }}
                >
                  More than a stage
                </div>
                <p className="mt-6 text-[16.5px] leading-[1.7] text-white/85 md:text-[17.5px]">
                  Every event brings together people from different
                  industries, backgrounds and generations with one thing in
                  common: a genuine curiosity about the world and the people
                  in it. The talks are designed to spark new ways of
                  thinking, but what happens between them is just as
                  important, the conversations over coffee, the introductions
                  to strangers, the debates that continue long after the
                  event ends.
                </p>
                <p className="mt-4 text-[16.5px] leading-[1.7] text-white/85 md:text-[17.5px]">
                  You&rsquo;ll leave with fresh ideas, but also with new
                  perspectives, meaningful connections and a renewed sense of
                  possibility. Whether you&rsquo;re a founder, student,
                  creative, teacher or simply someone who loves learning,
                  you&rsquo;ll find yourself surrounded by people who are
                  excited to ask better questions and build something bigger
                  than themselves.
                </p>
                <p className="mt-6 font-sans text-[17px] font-medium leading-[1.6] text-white">
                  This is our fourth event of 2026. Come for the talks. Stay
                  for the conversations. Return for the community.
                </p>
              </div>
              <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-lg)] bg-[#1a0604]">
                <PhotoFill
                  src="/images/nav-signature.webp"
                  alt="A packed audience at a TEDxNewy signature event."
                  sizes="(min-width: 768px) 45vw, 100vw"
                />
                <div className="grain grain-dark pointer-events-none absolute inset-0 opacity-20" />
              </div>
            </div>
          </section>

          {/* PAST EDITIONS — a real, data-driven timeline, Signal first */}
          <section className="border-y border-white/10 bg-white/[0.02]">
            <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
              <div
                className="font-mono text-[10.5px] font-semibold uppercase text-[#ff9b8f]"
                style={{ letterSpacing: "0.24em" }}
              >
                The flagship story
              </div>
              <h2
                className="mt-4 max-w-[26ch] font-sans tracking-[-0.025em] text-white balance"
                style={{
                  fontSize: "clamp(1.85rem, 3.6vw, 2.75rem)",
                  lineHeight: 1.05,
                  fontWeight: 500,
                  fontVariationSettings: '"opsz" 144',
                }}
              >
                The 3rd TEDx stage in Newy
              </h2>

              {/* Horizontal swipe on mobile (native scroll-snap, no stacked
                  cards); back to a static 3-up grid from sm upward. */}
              <div className="carousel-scrollbar mt-14 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:gap-8 sm:overflow-visible sm:pb-0 sm:snap-none">
                {flagshipEvents.map((e) => {
                  const isSignal = e.slug === "signal-2026";
                  const photo = EDITION_PHOTO[e.slug];
                  const cardClass = "w-[78%] shrink-0 snap-center sm:w-auto";
                  const content = (
                    <>
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-md)] bg-[#1a0604]">
                        {photo ? (
                          <PhotoFill
                            src={photo}
                            alt={e.title}
                            sizes="(min-width: 640px) 33vw, 100vw"
                          />
                        ) : (
                          <div
                            className="flex h-full w-full items-center justify-center"
                            style={{
                              background:
                                "linear-gradient(135deg, #2a0604 0%, #8c0d05 50%, #b91404 100%)",
                            }}
                          >
                            <span className="font-sans text-[15px] font-semibold uppercase tracking-[0.1em] text-white/90">
                              You are here
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="mt-4">
                        <div className="text-[12px] font-medium uppercase tracking-[0.1em] text-white/50">
                          {e.shortDate ?? e.dateLabel}
                        </div>
                        <div className="mt-1 font-sans text-[18px] font-medium tracking-[-0.01em] text-white">
                          {e.title}
                        </div>
                        <div className="mt-1 text-[13px] text-white/55">
                          {e.venue}
                        </div>
                      </div>
                    </>
                  );
                  return isSignal ? (
                    <div key={e.id} className={cardClass}>
                      {content}
                    </div>
                  ) : (
                    <Link
                      key={e.id}
                      href={eventHref(e)}
                      className={`group block ${cardClass}`}
                    >
                      {content}
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>

          {/* SPEAKER TEASER — Signal's own lineup, revealed one at a time.
              Hidden entirely until at least one speaker is announced. */}
          {signalSpeakers.length > 0 && (
            <section className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-28">
              <div className="grid gap-10 md:grid-cols-12 md:gap-14">
                <div className="md:col-span-4">
                  <div
                    className="font-mono text-[10.5px] font-semibold uppercase text-[#ff9b8f]"
                    style={{ letterSpacing: "0.24em" }}
                  >
                    The lineup
                  </div>
                  <h2
                    className="mt-4 max-w-[16ch] font-sans tracking-[-0.025em] text-white balance"
                    style={{
                      fontSize: "clamp(1.65rem, 3vw, 2.25rem)",
                      lineHeight: 1.1,
                      fontWeight: 500,
                      fontVariationSettings: '"opsz" 144',
                    }}
                  >
                    Who takes our stage.
                  </h2>
                  <p className="mt-4 text-[15px] leading-[1.6] text-white/70">
                    Our full lineup for Signal is locked in and ready to go.
                    We&rsquo;re revealing speakers one at a time in the
                    lead-up to October, so keep checking back.
                  </p>
                </div>
                <div className="md:col-span-8">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
                    {signalSpeakers.map((s) => (
                      <Link
                        key={s.slug}
                        href={`/speakers/${s.slug}`}
                        className="group block"
                      >
                        <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-md)] bg-[#1a0604]">
                          {s.image && (
                            <PhotoFill
                              src={s.image}
                              alt={s.name}
                              sizes="(min-width: 640px) 22vw, 45vw"
                            />
                          )}
                        </div>
                        <div className="mt-3 font-sans text-[14.5px] font-medium leading-tight tracking-[-0.005em] text-white group-hover:text-[#ff9b8f]">
                          {s.name}
                        </div>
                      </Link>
                    ))}
                    {/* Always-present teaser slot for the not-yet-announced rest of the lineup. */}
                    <div>
                      <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-dashed border-white/20 bg-white/[0.02]">
                        <span className="font-sans text-[42px] font-medium text-white/25">
                          ?
                        </span>
                      </div>
                      <div className="mt-3 font-sans text-[14.5px] font-medium leading-tight text-white/50">
                        Revealed soon
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* AGENDA */}
          <section className="border-y border-white/10 bg-white/[0.02]">
            <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
              <div
                className="font-mono text-[10.5px] font-semibold uppercase text-[#ff9b8f]"
                style={{ letterSpacing: "0.24em" }}
              >
                The day
              </div>
              <h2
                className="mt-4 font-sans tracking-[-0.025em] text-white balance"
                style={{
                  fontSize: "clamp(1.75rem, 3.4vw, 2.5rem)",
                  lineHeight: 1.05,
                  fontWeight: 500,
                  fontVariationSettings: '"opsz" 144',
                }}
              >
                Agenda
              </h2>

              <div className="mt-10 divide-y divide-white/10">
                {AGENDA.map((item) => (
                  <div
                    key={item.title}
                    className="grid gap-2 py-7 md:grid-cols-[minmax(0,3fr)_minmax(0,9fr)] md:gap-10 md:py-8"
                  >
                    <div
                      className="font-mono text-[13px] font-semibold text-[#ff9b8f]"
                      style={{ letterSpacing: "0.04em" }}
                    >
                      {item.time}
                    </div>
                    <div>
                      <h3 className="font-sans text-[18px] font-medium tracking-[-0.01em] text-white">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-[15px] leading-[1.6] text-white/70">
                        {item.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* VENUE + WEEKEND — left-right, real address + honest placeholder */}
          <section className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-28">
            <div className="grid gap-12 md:grid-cols-2 md:gap-16">
              <div>
                <div
                  className="font-mono text-[10.5px] font-semibold uppercase text-[#ff9b8f]"
                  style={{ letterSpacing: "0.24em" }}
                >
                  The venue
                </div>
                <h3 className="mt-4 font-sans text-[22px] font-medium tracking-[-0.01em] text-white">
                  Conservatorium of Music
                </h3>
                <div className="mt-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#ff9b8f]" strokeWidth={2} />
                    <span className="text-[14.5px] leading-[1.5] text-white/80">
                      Corner Laman Street and Auckland Street, Newcastle NSW
                      2300
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#ff9b8f]" strokeWidth={2} />
                    <span className="text-[14.5px] leading-[1.5] text-white/80">
                      Doors 2pm, Saturday 24 October 2026
                    </span>
                  </div>
                </div>

                {/* Pinned map preview, dark-filtered to sit on the page. */}
                <div className="mt-6 aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-md)] border border-white/10">
                  <iframe
                    src="https://www.google.com/maps?q=Newcastle+Conservatorium+of+Music,+Newcastle+NSW&output=embed"
                    className="h-full w-full"
                    style={{
                      filter:
                        "invert(92%) hue-rotate(180deg) brightness(0.95) contrast(0.9)",
                      border: 0,
                    }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Map showing the Conservatorium of Music, Newcastle"
                  />
                </div>

                <a
                  href="https://www.google.com/maps/search/?api=1&query=Newcastle+Conservatorium+of+Music"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-white/85"
                >
                  Open in Google Maps
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
                </a>
              </div>

              <div className="rounded-[var(--radius-lg)] border border-white/10 bg-white/[0.03] p-8">
                <Compass className="h-6 w-6 text-[#ff9b8f]" strokeWidth={1.75} />
                <h3 className="mt-4 font-sans text-[19px] font-medium tracking-[-0.01em] text-white">
                  Make a weekend of it.
                </h3>
                <p className="mt-3 text-[14.5px] leading-[1.6] text-white/70">
                  We&rsquo;re working with venues and businesses across
                  Newcastle to build out an event weekend experience:
                  somewhere to eat, somewhere to stay, somewhere to keep the
                  conversation going after the doors close. Partner details
                  are coming soon, ahead of the event.
                </p>
              </div>
            </div>
          </section>

          {/* SPONSORS — real logos where we have them, wordmarks otherwise */}
          {signalSponsors.length > 0 && (
            <section className="border-y border-white/10 bg-white/[0.02]">
              <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24 text-center">
                <div
                  className="font-mono text-[10.5px] font-semibold uppercase text-[#ff9b8f]"
                  style={{ letterSpacing: "0.24em" }}
                >
                  Made possible by
                </div>
                <div className="mt-12 flex flex-wrap items-center justify-center gap-x-14 gap-y-10">
                  {signalSponsors.map((s) => (
                    <div key={s.name} className="flex flex-col items-center gap-2">
                      {s.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={s.logoUrl}
                          alt={s.name}
                          className="max-h-10 w-auto object-contain brightness-0 invert opacity-80"
                        />
                      ) : (
                        <div className="font-sans text-[19px] font-medium tracking-[-0.01em] text-white/80">
                          {s.name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <Link
                  href="/sponsors"
                  className="mt-12 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-white/70"
                >
                  See all our partners
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
                </Link>
              </div>
            </section>
          )}

          {/* TESTIMONIALS — real attendee quotes, spotlighted one at a time */}
          <section className="border-t border-white/10">
            <div className="mx-auto max-w-[1100px] px-5 py-20 text-center md:px-6 md:py-24">
              <h2
                className="mx-auto max-w-[24ch] font-sans tracking-[-0.025em] text-white balance"
                style={{
                  fontSize: "clamp(1.75rem, 3.4vw, 2.5rem)",
                  lineHeight: 1.05,
                  fontWeight: 500,
                  fontVariationSettings: '"opsz" 144',
                }}
              >
                Hear from past attendees:
              </h2>

              <div className="mt-14">
                <TestimonialCarousel testimonials={TESTIMONIALS} />
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
            <div
              className="font-mono text-[10.5px] font-semibold uppercase text-[#ff9b8f]"
              style={{ letterSpacing: "0.24em" }}
            >
              Good to know
            </div>
            <h2
              className="mt-4 font-sans tracking-[-0.025em] text-white balance"
              style={{
                fontSize: "clamp(1.75rem, 3.4vw, 2.5rem)",
                lineHeight: 1.05,
                fontWeight: 500,
                fontVariationSettings: '"opsz" 144',
              }}
            >
              FAQs
            </h2>

            <FaqAccordion faqs={FAQS} />
          </section>

          {/* SEE MORE OF OUR EVENTS */}
          <section className="border-t border-white/10">
            <div className="mx-auto flex max-w-[1100px] flex-col items-start gap-6 px-5 py-16 md:flex-row md:items-center md:justify-between md:px-6 md:py-20">
              <div>
                <h2 className="font-sans text-[20px] font-medium tracking-[-0.015em] text-white balance max-w-[26ch]">
                  See more of our events first.
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link
                  href="/signature"
                  className="inline-flex items-center gap-1.5 text-[14.5px] font-medium text-white/85"
                >
                  Signature events
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                </Link>
                <Link
                  href="/events"
                  className="inline-flex items-center gap-1.5 text-[14.5px] font-medium text-white/85"
                >
                  All events
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* FINAL CTA — red, so it stands out from the black footer below it */}
      <section className="relative overflow-hidden bg-[#e02214] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 80% 30%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 60%)",
          }}
        />
        <div className="relative mx-auto flex max-w-[1100px] flex-col items-start gap-8 px-5 py-20 md:flex-row md:items-center md:justify-between md:px-6 md:py-24">
          <div>
            <h2
              className="max-w-[22ch] font-sans tracking-[-0.025em] balance"
              style={{
                fontSize: "clamp(1.65rem, 3.2vw, 2.4rem)",
                lineHeight: 1.05,
                fontWeight: 500,
                fontVariationSettings: '"opsz" 144',
              }}
            >
              Don&rsquo;t miss out in 2026.
            </h2>
            <p className="mt-4 max-w-[52ch] text-[15.5px] leading-[1.65] text-white/85">
              Saturday 24 October 2026 at the Conservatorium of Music.
              Tickets are on sale now through Humanitix.
            </p>
          </div>
          <a
            href={TICKET_POPUP_URL}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#141210] px-7 py-3.5 font-sans text-[14.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e02214]"
          >
            Get tickets
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </a>
        </div>
      </section>
    </>
  );
}

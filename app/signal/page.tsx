import Link from "next/link";
import { Calendar, Clock, MapPin, ChevronDown, ArrowUpRight } from "lucide-react";
import PageHero from "@/components/PageHero";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import PhotoFill from "@/components/PhotoFill";

const TICKET_URL = "https://events.humanitix.com/tedxnewy-signature-event";

export const metadata = {
  alternates: { canonical: "/signal" },
  title: "Signal · TEDxNewy 2026",
  description:
    "Signal is TEDxNewy's flagship 2026 event, Saturday 24 October at the Conservatorium of Music. Talks, performances and a room full of curious people. Tickets on sale now.",
};

const DETAILS: {
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
}[] = [
  { Icon: Calendar, label: "Date", value: "Saturday 24 October 2026" },
  { Icon: Clock, label: "Time", value: "Doors 2pm" },
  { Icon: MapPin, label: "Venue", value: "Conservatorium of Music" },
];

const AGENDA: { time: string; title: string; body: string }[] = [
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

export default function SignalPage() {
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
      address: "Newcastle, NSW, Australia",
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

      <PageHero
        kicker="Flagship TEDxNewy 2026"
        titleTop="Signal"
        intro={
          <>
            TEDxNewy is more than a stage. It&rsquo;s a room full of curious
            people who believe that one conversation, one idea, or one
            unexpected connection can change the direction of a life.
          </>
        }
        meta={
          <div className="flex flex-wrap items-center gap-4">
            <a
              href={TICKET_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-7 py-3.5 font-sans text-[14.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e02214]/40"
            >
              Get tickets
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </a>
            <span className="text-[14.5px] font-medium text-[#6b6459]">
              Saturday 24 October 2026 · Conservatorium of Music
            </span>
          </div>
        }
      />

      {/* HERO BANNER — last year's stage, dressed for what's next */}
      <section className="mx-auto max-w-[1180px] px-5 pb-16 md:px-6 md:pb-20">
        <div className="relative aspect-[21/9] w-full overflow-hidden rounded-[var(--radius-lg)] bg-[#1a0604]">
          <PhotoFill
            src="/images/stage-welcome.jpg"
            alt="The TEDxNewy stage, Reframe 2025."
            sizes="(min-width: 1180px) 1180px, 100vw"
            priority
            hoverZoom={false}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(42,6,4,0.88) 0%, rgba(42,6,4,0.35) 45%, rgba(5,8,24,0.55) 100%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 30% 40%, rgba(255,155,143,0.3) 0%, rgba(224,34,20,0.1) 40%, rgba(5,8,24,0) 70%)",
            }}
          />
          <div className="grain grain-dark pointer-events-none absolute inset-0 opacity-40" />
          <div className="relative flex h-full flex-col justify-between p-6 md:p-12">
            <div
              className="font-sans tracking-[-0.03em] text-white"
              style={{
                fontSize: "clamp(2.75rem, 9vw, 6.5rem)",
                fontWeight: 500,
                lineHeight: 1,
                fontVariationSettings: '"opsz" 144',
              }}
            >
              SIGNAL
            </div>
            <div className="font-mono text-[10px] font-medium uppercase text-white/55" style={{ letterSpacing: "0.18em" }}>
              Photography from Reframe, 2025 · the stage Signal returns to
            </div>
          </div>
        </div>
      </section>

      {/* DETAILS + ABOUT */}
      <section className="mx-auto max-w-[1180px] px-5 pb-16 md:px-6 md:pb-20">
        <div className="grid gap-10 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-4">
            <div className="space-y-4">
              {DETAILS.map(({ Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f4efe6] text-[#b91404]">
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <div>
                    <div
                      className="font-mono text-[9.5px] font-semibold uppercase text-[#6b6459]"
                      style={{ letterSpacing: "0.2em" }}
                    >
                      {label}
                    </div>
                    <div className="mt-0.5 text-[15px] font-medium leading-[1.4] text-[#141210]">
                      {value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="md:col-span-8">
            <p className="text-[16.5px] leading-[1.7] text-[#2a2521] md:text-[17.5px]">
              Every event brings together people from different industries,
              backgrounds and generations with one thing in common: a genuine
              curiosity about the world and the people in it. The talks are
              designed to spark new ways of thinking, but what happens
              between them is just as important. The conversations over
              coffee, the introductions to strangers, the debates that
              continue long after the event ends, and the friendships and
              collaborations that grow from a shared experience.
            </p>
            <p className="mt-4 text-[16.5px] leading-[1.7] text-[#2a2521] md:text-[17.5px]">
              You&rsquo;ll leave with fresh ideas, but also with new
              perspectives, meaningful connections, and a renewed sense of
              possibility. TEDxNewy is a place where ambitious people gather
              not to network for the sake of networking, but to learn from
              one another, challenge their thinking, and become part of a
              community that values curiosity, generosity and action.
            </p>
            <p className="mt-4 text-[16.5px] leading-[1.7] text-[#2a2521] md:text-[17.5px]">
              Whether you&rsquo;re a founder, student, creative, teacher,
              professional, or simply someone who loves learning, you&rsquo;ll
              find yourself surrounded by people who are excited to ask
              better questions, share bold ideas and build something bigger
              than themselves.
            </p>
            <p className="mt-4 font-sans text-[16.5px] font-medium leading-[1.7] text-[#141210] md:text-[17.5px]">
              This is our fourth event of 2026. Whether this will be your
              first or your fourth, you are welcome. Come for the talks. Stay
              for the conversations. Return for the community.
            </p>
          </div>
        </div>
      </section>

      {/* FROM LAST YEAR'S STAGE — real Reframe 2025 photography, honestly captioned */}
      <section className="mx-auto max-w-[1180px] px-5 pb-16 md:px-6 md:pb-20">
        <div
          className="mb-8 text-[10.5px] font-semibold uppercase text-[#b91404]"
          style={{ letterSpacing: "0.24em" }}
        >
          Last time out
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { src: "/images/stage-dialogue.jpg", alt: "Conversation on stage at Reframe, 2025." },
            { src: "/images/stage-benjie.jpg", alt: "A speaker mid-talk at Reframe, 2025." },
            { src: "/images/past-2025.jpg", alt: "The room at Reframe, 2025." },
          ].map((photo) => (
            <div
              key={photo.src}
              className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-md)] bg-[#e9e2d5]"
            >
              <PhotoFill src={photo.src} alt={photo.alt} sizes="(min-width: 640px) 33vw, 100vw" />
            </div>
          ))}
        </div>
        <p className="mt-6 max-w-[62ch] text-[14.5px] leading-[1.6] text-[#6b6459]">
          A taste of Reframe, 2025. Signal picks up on the same stage at the
          Conservatorium of Music, with a new lineup and a new set of ideas.
        </p>
      </section>

      {/* AGENDA */}
      <section className="bg-[#f9f5ec]">
        <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
          <div
            className="text-[10.5px] font-semibold uppercase text-[#b91404]"
            style={{ letterSpacing: "0.24em" }}
          >
            The day
          </div>
          <h2
            className="mt-4 font-sans tracking-[-0.025em] text-[#141210] balance"
            style={{
              fontSize: "clamp(1.75rem, 3.4vw, 2.5rem)",
              lineHeight: 1.05,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            Agenda
          </h2>

          <div className="mt-10 divide-y divide-[rgba(20,18,16,0.10)]">
            {AGENDA.map((item) => (
              <div
                key={item.title}
                className="grid gap-2 py-7 md:grid-cols-[minmax(0,3fr)_minmax(0,9fr)] md:gap-10 md:py-8"
              >
                <div
                  className="font-mono text-[13px] font-semibold text-[#b91404]"
                  style={{ letterSpacing: "0.04em" }}
                >
                  {item.time}
                </div>
                <div>
                  <h3 className="font-sans text-[18px] font-medium tracking-[-0.01em] text-[#141210]">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 max-w-[62ch] text-[15px] leading-[1.6] text-[#2a2521]">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-[900px] px-5 py-20 md:px-6 md:py-24">
        <div
          className="text-[10.5px] font-semibold uppercase text-[#b91404]"
          style={{ letterSpacing: "0.24em" }}
        >
          Good to know
        </div>
        <h2
          className="mt-4 font-sans tracking-[-0.025em] text-[#141210] balance"
          style={{
            fontSize: "clamp(1.75rem, 3.4vw, 2.5rem)",
            lineHeight: 1.05,
            fontWeight: 500,
            fontVariationSettings: '"opsz" 144',
          }}
        >
          FAQs
        </h2>

        <div className="mt-10 divide-y divide-[rgba(20,18,16,0.10)]">
          {FAQS.map(({ q, a }) => (
            <details
              key={q}
              className="group py-5 [&::-webkit-details-marker]:hidden [&::marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-sans text-[16px] font-medium leading-[1.35] text-[#141210]">
                {q}
                <ChevronDown
                  className="h-4 w-4 shrink-0 text-[#6b6459] transition-transform duration-300 group-open:rotate-180"
                  strokeWidth={2}
                />
              </summary>
              <p className="mt-3 max-w-[68ch] text-[14.5px] leading-[1.65] text-[#2a2521]">
                {a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* SEE MORE OF OUR EVENTS */}
      <section className="bg-[#f9f5ec]">
        <div className="mx-auto flex max-w-[1100px] flex-col items-start gap-6 px-5 py-16 md:flex-row md:items-center md:justify-between md:px-6 md:py-20">
          <div>
            <div
              className="text-[10.5px] font-semibold uppercase text-[#b91404]"
              style={{ letterSpacing: "0.24em" }}
            >
              Not ready to commit?
            </div>
            <h2
              className="mt-4 max-w-[26ch] font-sans tracking-[-0.025em] text-[#141210] balance"
              style={{
                fontSize: "clamp(1.5rem, 2.8vw, 2rem)",
                lineHeight: 1.1,
                fontWeight: 500,
                fontVariationSettings: '"opsz" 144',
              }}
            >
              See more of our events first.
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href="/signature"
              className="inline-flex items-center gap-1.5 text-[14.5px] font-medium text-[#b91404]"
            >
              Signature events
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </Link>
            <Link
              href="/events"
              className="inline-flex items-center gap-1.5 text-[14.5px] font-medium text-[#b91404]"
            >
              All events
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-[#141210] text-white">
        <div className="mx-auto flex max-w-[1100px] flex-col items-start gap-8 px-5 py-20 md:flex-row md:items-center md:justify-between md:px-6 md:py-24">
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
              Come for the talks. Stay for the conversations.
            </h2>
            <p className="mt-4 max-w-[52ch] text-[15.5px] leading-[1.65] text-white/75">
              Saturday 24 October 2026 at the Conservatorium of Music.
              Tickets are on sale now through Humanitix.
            </p>
          </div>
          <a
            href={TICKET_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#e02214] px-7 py-3.5 font-sans text-[14.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141210]"
          >
            Get tickets
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </a>
        </div>
      </section>
    </>
  );
}

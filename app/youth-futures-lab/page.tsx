import Link from "next/link";
import {
  ArrowUpRight,
  Calendar,
  Clock,
  MapPin,
  Users,
  Route,
  Sofa,
  Wifi,
  ShieldCheck,
  PiggyBank,
  GraduationCap,
  HeartHandshake,
  UtensilsCrossed,
  Palette,
  Rocket,
  Sparkles,
  Wrench,
  Images,
} from "lucide-react";
import PageHero from "@/components/PageHero";
import PhotoFill from "@/components/PhotoFill";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import RecapVideo from "@/components/RecapVideo";
import Scribble from "@/components/Scribble";
import { getEventBySlug, getPhotosForEvent } from "@/lib/cms-content";

export const metadata = {
  alternates: { canonical: "/youth-futures-lab" },
  title: "Youth Futures Lab · TEDxNewy Salon recap",
  description:
    "TEDxNewy's Youth Futures Lab: high school teams spent a day as youth consultants to a fictional council, pitching ideas for a smarter, kinder Newcastle. Held Friday 7 August 2026 at NUspace, University of Newcastle. See how the day unfolded.",
  openGraph: {
    title: "Youth Futures Lab · TEDxNewy Salon recap",
    description:
      "High school teams as youth consultants for a day, pitching ideas for a smarter, kinder Newcastle. TEDxNewy x University of Newcastle, 7 August 2026 at NUspace.",
    type: "website",
  },
};

const CREAM = "#f9f5ec";

const RED = "#b91404";
const TEAL = "#17607a";
const GOLD = "#a5780f";
const ORANGE = "#c8541a";
const ACCENTS = [TEAL, ORANGE, GOLD, RED];

const DETAILS: {
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
}[] = [
  { Icon: Calendar, label: "Date", value: "Friday 7 August 2026" },
  { Icon: Clock, label: "Time", value: "9:30am to 2:30pm" },
  { Icon: MapPin, label: "Venue", value: "NUspace, University of Newcastle" },
  { Icon: Users, label: "Format", value: "High school teams · consultancy pitches" },
];

type FocusArea = {
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  question: string;
};

const FOCUS_AREAS: FocusArea[] = [
  {
    Icon: Route,
    title: "Getting around",
    question: "How can young people move around Newcastle more freely, safely, cheaply and independently?",
  },
  {
    Icon: Sofa,
    title: "Places to hang out",
    question: "Where can young people spend time without needing to buy something, or being moved on?",
  },
  {
    Icon: Wifi,
    title: "Digital life in the city",
    question: "How could technology make city life better without making it colder or more controlled?",
  },
  {
    Icon: ShieldCheck,
    title: "Feeling safe, not watched",
    question: "How can a city help young people feel safe without making them feel controlled?",
  },
  {
    Icon: PiggyBank,
    title: "The cost of being young",
    question: "What would Newcastle look like if being a teenager was less expensive?",
  },
  {
    Icon: GraduationCap,
    title: "Learning beyond school",
    question: "Where else can young people learn, study, make, experiment and get support?",
  },
  {
    Icon: HeartHandshake,
    title: "Mental health & quiet spaces",
    question: "Where can young people go when everything feels too much?",
  },
  {
    Icon: UtensilsCrossed,
    title: "Food & social life",
    question: "Where can young people eat, meet and spend time in ways that are affordable and welcoming?",
  },
  {
    Icon: Palette,
    title: "Creative expression",
    question: "How can Newcastle become a better place for young people to make and share art, music, performance, games, writing, film, fashion or design?",
  },
  {
    Icon: Rocket,
    title: "Future you: Newcastle at 25",
    question: "Would you want to stay in Newcastle as an adult? What would need to change?",
  },
];

const RUN_OF_SHOW: { time: string; title: string; body: string }[] = [
  {
    time: "9:30am",
    title: "Registration & warm-up",
    body: "Teams of five or six settle in and grab a pen. Ten warm-up prompts wait on the tables, from a favourite spot in Newy to what a rainy weekend actually looks like.",
  },
  {
    time: "10:00am",
    title: "Welcome",
    body: "The TEDx spirit, the hosts, an energiser, and the brief for the day: everything students build has to be smart, and it has to be kind.",
  },
  {
    time: "10:15am",
    title: "Workshop one",
    body: "Each team picks one of ten focus areas, digs into the real problem, floods the table with ideas, then narrows it down to the one they'll build.",
  },
  {
    time: "11:15am",
    title: "The pitch lesson",
    body: "Three lines, two minutes: right now, but what if, imagine if. Open strong, close strong.",
  },
  {
    time: "11:35am",
    title: "Build burst",
    body: "Posters, prototypes, whatever makes the idea real enough to explain to a room of strangers.",
  },
  {
    time: "~11:50am",
    title: "The remix cue",
    body: "\"Steal one idea, kindly.\" Five minutes to borrow something good from another table and make it their own.",
  },
  {
    time: "12:15pm",
    title: "Lunch & mini-expo",
    body: "Work stays out on the tables. The listening panel gets briefed: this is a listening panel, not a judging one.",
  },
  {
    time: "1:00pm",
    title: "Rehearsal & coaching",
    body: "Facilitators roam the room asking questions, not answers. Who is this for? What's the one-sentence version?",
  },
  {
    time: "1:30pm",
    title: "Pitches",
    body: "Two minutes each, the wheel decides the order. Every team stands up in front of the panel and makes their case.",
  },
  {
    time: "2:20pm",
    title: "Reflection",
    body: "Naming the themes that came out of the day, and recognising every team for the work they put in.",
  },
];

const PITCH_STEPS: { label: string; sub: string; body: string; color: string }[] = [
  {
    label: "Right now…",
    sub: "Describe the current problem",
    body: "Every pitch opens with what's actually happening in Newcastle today, not the idea. The room has to feel the problem before it hears the fix.",
    color: RED,
  },
  {
    label: "But what if…",
    sub: "Introduce the idea",
    body: "One clear idea, not five. The team's proposal for how that problem could be solved, spoken to humans instead of read off a slide.",
    color: TEAL,
  },
  {
    label: "Imagine if…",
    sub: "Explain the future it creates",
    body: "What changes, for who, and why it matters. Smarter because it improves how the city works. Kinder because it improves how people feel.",
    color: ORANGE,
  },
];

export default async function YouthFuturesLabPage() {
  const event = await getEventBySlug("youth-futures-lab");
  const photos = event ? await getPhotosForEvent(event.id) : [];

  return (
    <>
      <BreadcrumbJsonLd name="Youth Futures Lab" path="/youth-futures-lab" />
      <PageHero
        kicker="Past event · Friday 7 August 2026"
        titleTop="Youth Futures Lab."
        intro={
          <>
            For a day, forty-odd high schoolers stopped being students and
            became youth consultants to a fictional council. Their brief: make
            Newcastle smarter and kinder for the people who'll inherit it. Run
            with the University of Newcastle at NUspace City Campus, our
            second Salon of the 2026 season. This is how the day went.
          </>
        }
      />

      {/* HERO VIDEO — autoplay loop, muted, plays the moment the page loads */}
      <section className="mx-auto max-w-[1180px] px-5 pb-16 md:px-6 md:pb-20">
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[var(--radius-md)] bg-[#0a0908]">
          <video
            src="/video/youth-futures-banner.mp4"
            poster="/video/youth-futures-banner-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </section>

      {/* DETAILS + INTRO */}
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
            <h2
              className="font-sans tracking-[-0.025em] text-[#0a0908] balance"
              style={{
                fontSize: "clamp(1.85rem, 3.6vw, 2.75rem)",
                lineHeight: 1.05,
                fontWeight: 500,
                fontVariationSettings: '"opsz" 144',
              }}
            >
              Smart + Kind Newcastle.
            </h2>
            <p className="mt-5 text-[16.5px] leading-[1.7] text-[#2a2521] md:text-[17.5px]">
              No adults telling them how the city should work. Teams of five
              or six chose one part of city life they wanted to fix, argued
              their way to a single idea, and built a two-minute pitch to
              defend it in front of a live panel, exactly like a real
              consultancy would.
            </p>
            <p className="mt-4 text-[16.5px] leading-[1.7] text-[#2a2521] md:text-[17.5px]">
              Every idea had to clear the same two-part bar, over and over, all
              day.
            </p>
          </div>
        </div>
      </section>

      {/* THE BRIEF: SMART + KIND + REAL */}
      <section style={{ backgroundColor: CREAM }} className="relative overflow-hidden">
        <Scribble
          variant="lightbulb"
          color={GOLD}
          className="pointer-events-none absolute left-[6%] top-[10%] hidden h-16 w-16 opacity-70 sm:block md:h-20 md:w-20"
        />
        <Scribble
          variant="spark"
          color={RED}
          delayMs={150}
          className="pointer-events-none absolute right-[8%] top-[14%] h-10 w-10 opacity-70 md:h-14 md:w-14"
        />
        <div className="relative mx-auto max-w-[1180px] px-5 py-20 md:px-6 md:py-24">
          <h2
            className="max-w-[22ch] font-sans tracking-[-0.025em] text-[#141210] balance"
            style={{
              fontSize: "clamp(1.75rem, 3.4vw, 2.5rem)",
              lineHeight: 1.05,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            The brief, on every single worksheet.
          </h2>
          <p className="mt-5 max-w-[62ch] text-[16px] leading-[1.7] text-[#2a2521]">
            Before a team could pitch, their idea had to answer three
            questions. It's the same test any real proposal for the city
            should have to pass.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                Icon: Sparkles,
                label: "Make it smart",
                body: "How does it improve how the city works?",
                color: TEAL,
              },
              {
                Icon: HeartHandshake,
                label: "Make it kind",
                body: "How does it improve how people feel, belong, access, connect or participate?",
                color: RED,
              },
              {
                Icon: Wrench,
                label: "Make it real",
                body: "What will you actually create to explain your idea to a room of strangers?",
                color: GOLD,
              },
            ].map(({ Icon, label, body, color }) => (
              <div
                key={label}
                className="rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white p-7"
              >
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ background: `${color}1a`, color }}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-4 font-sans text-[17px] font-medium leading-[1.25] tracking-[-0.01em] text-[#141210]">
                  {label}
                </h3>
                <p className="mt-2.5 text-[14.5px] leading-[1.6] text-[#2a2521]">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEN FOCUS AREAS */}
      <section className="mx-auto max-w-[1180px] px-5 py-20 md:px-6 md:py-24">
        <h2
          className="max-w-[20ch] font-sans tracking-[-0.025em] text-[#141210] balance"
          style={{
            fontSize: "clamp(1.85rem, 3.6vw, 2.75rem)",
            lineHeight: 1.05,
            fontWeight: 500,
            fontVariationSettings: '"opsz" 144',
          }}
        >
          Ten focus areas. One city.
        </h2>
        <p className="mt-5 max-w-[62ch] text-[16px] leading-[1.7] text-[#2a2521]">
          Every table chose one lane and became the experts on it for the
          day. These are the ten questions on offer, straight off the
          workshop cards.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {FOCUS_AREAS.map(({ Icon, title, question }, i) => {
            const color = ACCENTS[i % ACCENTS.length];
            return (
              <div
                key={title}
                className="rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white p-6"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full"
                    style={{ background: `${color}1a`, color }}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <span
                    className="font-mono text-[10px] font-semibold"
                    style={{ color }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-4 font-sans text-[15px] font-medium leading-[1.3] tracking-[-0.01em] text-[#141210]">
                  {title}
                </h3>
                <p className="mt-2 text-[13px] italic leading-[1.5] text-[#6b6459]">
                  {question}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* HOUR BY HOUR */}
      <section style={{ backgroundColor: CREAM }} className="relative overflow-hidden">
        <Scribble
          variant="squiggle"
          color={TEAL}
          className="pointer-events-none absolute bottom-[8%] right-[6%] hidden h-10 w-32 opacity-60 sm:block"
        />
        <div className="relative mx-auto max-w-[900px] px-5 py-20 md:px-6 md:py-24">
          <h2
            className="max-w-[20ch] font-sans tracking-[-0.025em] text-[#141210] balance"
            style={{
              fontSize: "clamp(1.75rem, 3.4vw, 2.5rem)",
              lineHeight: 1.05,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            The day, hour by hour.
          </h2>
          <p className="mt-5 text-[16px] leading-[1.7] text-[#2a2521]">
            Five hours, start to finish, from registration to recognitions.
          </p>

          <div className="mt-12">
            {RUN_OF_SHOW.map((item, i) => (
              <div
                key={item.time}
                className="grid grid-cols-[72px_16px_1fr] gap-x-4 sm:grid-cols-[96px_16px_1fr]"
              >
                <div className="pt-0.5 text-right font-mono text-[12px] font-semibold text-[#b91404] sm:text-[13px]">
                  {item.time}
                </div>
                <div className="relative flex justify-center">
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#b91404]" />
                  {i < RUN_OF_SHOW.length - 1 && (
                    <span className="absolute top-4 h-full w-px bg-[rgba(20,18,16,0.14)]" />
                  )}
                </div>
                <div className={i < RUN_OF_SHOW.length - 1 ? "pb-9" : ""}>
                  <h3 className="font-sans text-[16px] font-medium leading-[1.3] tracking-[-0.01em] text-[#141210]">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-[14.5px] leading-[1.6] text-[#2a2521]">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* THE PITCH FORMULA */}
      <section className="mx-auto max-w-[1180px] px-5 py-20 md:px-6 md:py-24">
        <h2
          className="max-w-[22ch] font-sans tracking-[-0.025em] text-[#141210] balance"
          style={{
            fontSize: "clamp(1.75rem, 3.4vw, 2.5rem)",
            lineHeight: 1.05,
            fontWeight: 500,
            fontVariationSettings: '"opsz" 144',
          }}
        >
          Three lines. Two minutes.
        </h2>
        <p className="mt-5 max-w-[62ch] text-[16px] leading-[1.7] text-[#2a2521]">
          Every team's pitch to the panel had to fit the same simple shape,
          the one taught in the mini pitch lesson at 11:15.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PITCH_STEPS.map(({ label, sub, body, color }) => (
            <div
              key={label}
              className="rounded-[18px] border-t-4 bg-white p-7 shadow-[0_16px_40px_rgba(0,0,0,0.05)]"
              style={{ borderColor: color }}
            >
              <div
                className="font-sans text-[22px] font-medium tracking-[-0.02em]"
                style={{ color }}
              >
                {label}
              </div>
              <div
                className="mt-2 font-mono text-[10px] font-semibold uppercase text-[#6b6459]"
                style={{ letterSpacing: "0.16em" }}
              >
                {sub}
              </div>
              <p className="mt-4 text-[14.5px] leading-[1.65] text-[#2a2521]">
                {body}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-[14px] italic leading-[1.6] text-[#6b6459]">
          The panel wasn't there to judge. They were told, in writing, to
          treat it as a listening panel: one encouraging comment per pitch,
          no scoring language, and if an idea surprised them, say so out
          loud.
        </p>
      </section>

      {/* FULL RECAP VIDEO — click to play */}
      <section style={{ backgroundColor: CREAM }}>
        <div className="mx-auto max-w-[1180px] px-5 py-20 md:px-6 md:py-28">
          <div className="mb-8">
            <h2
              className="max-w-[24ch] font-sans tracking-[-0.025em] text-[#0a0908] balance"
              style={{
                fontSize: "clamp(1.65rem, 3vw, 2.25rem)",
                lineHeight: 1.1,
                fontWeight: 500,
                fontVariationSettings: '"opsz" 144',
              }}
            >
              The full day, start to finish.
            </h2>
          </div>
          <RecapVideo
            src="/video/youth-futures-recap.mp4"
            poster="/video/youth-futures-recap-poster.jpg"
            caption="TEDxNewy Youth Futures Lab · Smart + Kind Newcastle · 7 August 2026 · NUspace, University of Newcastle"
          />
        </div>
      </section>

      {/* PHOTO GALLERY — teaser + link through to the full gallery, once photos exist */}
      {photos.length > 0 && (
        <section className="bg-white">
          <div className="mx-auto max-w-[1180px] px-5 py-20 md:px-6 md:py-24">
            <h2
              className="max-w-[22ch] font-sans tracking-[-0.025em] text-[#141210] balance"
              style={{
                fontSize: "clamp(1.75rem, 3.4vw, 2.5rem)",
                lineHeight: 1.05,
                fontWeight: 500,
                fontVariationSettings: '"opsz" 144',
              }}
            >
              Photos from the day.
            </h2>
            <p className="mt-5 text-[16px] leading-[1.7] text-[#2a2521]">
              Every table, every poster, every pitch, captured across the day.
              Browse and download the full set.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-6">
              {photos.slice(0, 6).map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-square overflow-hidden rounded-[var(--radius-md)] bg-[#e9e2d5]"
                >
                  <PhotoFill
                    src={photo.thumbUrl}
                    alt=""
                    sizes="(min-width: 768px) 16vw, 33vw"
                    hoverZoom={false}
                  />
                </div>
              ))}
            </div>
            <Link
              href="/events/youth-futures-lab/gallery"
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

      {/* WHERE TO NEXT */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
          <div
            className="text-[10.5px] font-semibold uppercase text-[#b91404]"
            style={{ letterSpacing: "0.24em" }}
          >
            More TEDxNewy
          </div>
          <h2
            className="mt-5 max-w-[28ch] font-sans tracking-[-0.025em] text-[#141210] balance"
            style={{
              fontSize: "clamp(1.75rem, 3.4vw, 2.5rem)",
              lineHeight: 1.05,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            More Salons across the year.
          </h2>
          <p className="mt-5 text-[15.5px] leading-[1.6] text-[#2a2521]">
            Subscribe and we&rsquo;ll let you know the moment the next one is
            announced.
          </p>
          <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Link
              href="/subscribe"
              className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-7 py-3.5 font-sans text-[14.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e02214]/40"
            >
              Subscribe to find out when
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </Link>
            <Link
              href="/salons"
              className="inline-flex items-center gap-1.5 text-[14.5px] font-medium text-[#b91404]"
            >
              See all Salons
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

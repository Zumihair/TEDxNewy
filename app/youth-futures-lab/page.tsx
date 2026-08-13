import Link from "next/link";
import {
  ArrowUpRight,
  Calendar,
  Clock,
  MapPin,
  Users,
  Sparkles,
  HeartHandshake,
  Wrench,
  Images,
} from "lucide-react";
import PageHero from "@/components/PageHero";
import PhotoFill from "@/components/PhotoFill";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import RecapVideo from "@/components/RecapVideo";
import Scribble from "@/components/Scribble";
import FocusWheel, { type WheelItem } from "@/components/FocusWheel";
import { getEventBySlug, getPhotosForEvent } from "@/lib/cms-content";

export const metadata = {
  alternates: { canonical: "/youth-futures-lab" },
  title: "Youth Futures Lab · TEDxNewy Salon recap",
  description:
    "TEDxNewy's Youth Futures Lab: around 75 high school students spent a day thinking, building and pitching ideas for a smarter, kinder Newcastle. Held Friday 7 August 2026 at NUspace, University of Newcastle. See how the day unfolded.",
  openGraph: {
    title: "Youth Futures Lab · TEDxNewy Salon recap",
    description:
      "A day of collaborative thinking and pitching for a smarter, kinder Newcastle, led entirely by high school teams. 7 August 2026 at NUspace, University of Newcastle.",
    type: "website",
  },
};

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
  { Icon: Users, label: "Format", value: "Team pitches · ~75 students" },
];

const FOCUS_AREAS: WheelItem[] = [
  {
    icon: "route",
    title: "Getting around",
    question: "How can young people move around Newcastle more freely, safely, cheaply and independently?",
  },
  {
    icon: "sofa",
    title: "Places to hang out",
    question: "Where can young people spend time without needing to buy something, or being moved on?",
  },
  {
    icon: "wifi",
    title: "Digital life in the region",
    question: "How could technology make life here better without making it colder or more controlled?",
  },
  {
    icon: "shield",
    title: "Feeling safe, not watched",
    question: "How can a place help young people feel safe without making them feel controlled?",
  },
  {
    icon: "piggyBank",
    title: "The cost of being young",
    question: "What would Newcastle look like if being a teenager was less expensive?",
  },
  {
    icon: "graduationCap",
    title: "Learning beyond school",
    question: "Where else can young people learn, study, make, experiment and get support?",
  },
  {
    icon: "heartHandshake",
    title: "Mental health & quiet spaces",
    question: "Where can young people go when everything feels too much?",
  },
  {
    icon: "utensils",
    title: "Food & social life",
    question: "Where can young people eat, meet and spend time in ways that are affordable and welcoming?",
  },
  {
    icon: "palette",
    title: "Creative expression",
    question: "How can Newcastle become a better place for young people to make and share art, music, performance, games, writing, film, fashion or design?",
  },
  {
    icon: "rocket",
    title: "Future you: Newcastle at 25",
    question: "Would you want to stay in Newcastle as an adult? What would need to change?",
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
            For a day, around 75 high schoolers turned their attention to the
            region they&rsquo;re growing up in. Working in teams, they picked a
            problem that actually bothers them, argued their way to an idea,
            and stood up in front of a room to make their case for it. Held at
            NUspace City Campus, University of Newcastle, our third Salon of
            the 2026 season. This is how the day went.
          </>
        }
      />

      {/* HERO VIDEO — autoplay loop, muted, plays the moment the page loads */}
      <section className="relative" style={{ background: "var(--color-cream)" }}>
        <Scribble
          variant="spark"
          color={GOLD}
          className="pointer-events-none absolute left-[3%] top-[6%] h-8 w-8 opacity-70 md:h-11 md:w-11"
        />
        <Scribble
          variant="squiggle"
          color={TEAL}
          delayMs={150}
          className="pointer-events-none absolute bottom-[4%] right-[4%] h-6 w-20 opacity-60 md:h-8 md:w-28"
        />
        <div className="relative mx-auto max-w-[1180px] px-5 pb-12 pt-8 md:px-6 md:pb-16 md:pt-10">
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
        </div>
      </section>

      {/* DETAILS + INTRO */}
      <section className="relative" style={{ background: "var(--color-cream)" }}>
        <div className="relative mx-auto max-w-[1180px] px-5 pb-12 md:px-6 md:pb-16">
          <div className="grid gap-8 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-4">
              <div className="space-y-4">
                {DETAILS.map(({ Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#b91404]">
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
            <div className="relative md:col-span-8">
              <Scribble
                variant="spiral"
                color={ORANGE}
                className="pointer-events-none absolute -top-2 right-0 h-10 w-10 opacity-60 md:h-12 md:w-12"
              />
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
              <Scribble
                variant="underline"
                color={RED}
                delayMs={200}
                className="mt-2 h-3 w-28 md:h-4 md:w-36"
              />
              <p className="mt-5 text-[16.5px] leading-[1.7] text-[#2a2521] md:text-[17.5px]">
                No one told them the answers. Teams of five or six chose one
                part of life in the region they wanted to change, argued their
                way to a single idea, and built a case for it worth making to a
                room of strangers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SMART + KIND + REAL */}
      <section className="relative" style={{ background: "var(--color-cream)" }}>
        <div className="relative mx-auto max-w-[1180px] px-5 py-14 md:px-6 md:py-20">
          <div className="relative">
            <Scribble
              variant="lightbulb"
              color={GOLD}
              className="pointer-events-none absolute -top-3 right-[2%] h-11 w-11 opacity-70 md:right-[8%] md:h-16 md:w-16"
            />
            <h2
              className="max-w-[22ch] font-sans tracking-[-0.025em] text-[#141210] balance"
              style={{
                fontSize: "clamp(1.75rem, 3.4vw, 2.5rem)",
                lineHeight: 1.05,
                fontWeight: 500,
                fontVariationSettings: '"opsz" 144',
              }}
            >
              Smart. Kind. Real.
            </h2>
            <Scribble
              variant="underline"
              color={TEAL}
              delayMs={200}
              className="mt-2 h-3 w-24 md:h-4 md:w-32"
            />
          </div>
          <p className="mt-5 max-w-[62ch] text-[16px] leading-[1.7] text-[#2a2521]">
            We didn&rsquo;t lecture anyone on what to build. Every team found
            their own problem and their own idea, and the room simply asked the
            same three questions of every single one.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {[
              {
                Icon: Sparkles,
                label: "Make it smart",
                body: "Does it improve how the region actually works?",
                color: TEAL,
              },
              {
                Icon: HeartHandshake,
                label: "Make it kind",
                body: "Does it improve how people feel, belong, access, connect or participate?",
                color: RED,
              },
              {
                Icon: Wrench,
                label: "Make it real",
                body: "Is there something you could actually show a room, not just say to it?",
                color: GOLD,
              },
            ].map(({ Icon, label, body, color }) => (
              <div
                key={label}
                className="rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white p-6 md:p-7"
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

      {/* TEN QUESTIONS — scroll-driven wheel.
          No overflow-hidden on this section: it would break the wheel's
          sticky positioning (see the note in FocusWheel.tsx). */}
      <section className="relative" style={{ background: "var(--color-cream)" }}>
        <div className="relative mx-auto max-w-[1180px] px-5 pt-14 md:px-6 md:pt-20">
          <div className="relative">
            <Scribble
              variant="spark"
              color={ORANGE}
              className="pointer-events-none absolute -top-4 right-[4%] h-9 w-9 opacity-70 md:h-12 md:w-12"
            />
            <h2
              className="max-w-[20ch] font-sans tracking-[-0.025em] text-[#141210] balance"
              style={{
                fontSize: "clamp(1.85rem, 3.6vw, 2.75rem)",
                lineHeight: 1.05,
                fontWeight: 500,
                fontVariationSettings: '"opsz" 144',
              }}
            >
              Ten questions, chosen by the room.
            </h2>
            <Scribble
              variant="underline"
              color={GOLD}
              delayMs={200}
              className="mt-2 h-3 w-28 md:h-4 md:w-36"
            />
          </div>
          <p className="mt-5 max-w-[62ch] text-[16px] leading-[1.7] text-[#2a2521]">
            Every table picked their own lane and ran with it. Scroll to turn
            the dial through the ten questions on offer.
          </p>
        </div>
        <FocusWheel items={FOCUS_AREAS} accents={ACCENTS} />
      </section>

      {/* FULL RECAP VIDEO — click to play */}
      <section className="relative" style={{ background: "var(--color-cream)" }}>
        <Scribble
          variant="squiggle"
          color={TEAL}
          className="pointer-events-none absolute left-[3%] top-[6%] h-6 w-20 opacity-60 md:h-8 md:w-28"
        />
        <div className="relative mx-auto max-w-[1180px] px-5 py-14 md:px-6 md:py-20">
          <div className="mb-8">
            <div className="relative">
              <Scribble
                variant="spiral"
                color={RED}
                className="pointer-events-none absolute -top-3 right-[3%] h-10 w-10 opacity-60 md:h-14 md:w-14"
              />
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
              <Scribble
                variant="underline"
                color={ORANGE}
                delayMs={200}
                className="mt-2 h-3 w-24 md:h-4 md:w-32"
              />
            </div>
            <p className="mt-4 max-w-[62ch] text-[15.5px] leading-[1.7] text-[#2a2521]">
              By early afternoon, every team stood up and made their case, two
              minutes each, to a panel that was there to listen, not to judge.
            </p>
          </div>
          <RecapVideo
            src="/video/youth-futures-recap.mp4"
            poster="/video/youth-futures-recap-poster.jpg"
            caption="TEDxNewy Youth Futures Lab · Smart + Kind Newcastle · 7 August 2026 · NUspace, University of Newcastle"
          />
        </div>
      </section>

      {/* PHOTO GALLERY — real teaser once photos exist, otherwise a coming-soon note */}
      {photos.length > 0 ? (
        <section className="relative" style={{ background: "var(--color-cream)" }}>
          <div className="relative mx-auto max-w-[1180px] px-5 py-14 md:px-6 md:py-20">
            <div className="relative">
              <Scribble
                variant="spark"
                color={GOLD}
                className="pointer-events-none absolute -top-3 right-[4%] h-9 w-9 opacity-70 md:h-12 md:w-12"
              />
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
              <Scribble
                variant="underline"
                color={RED}
                delayMs={200}
                className="mt-2 h-3 w-24 md:h-4 md:w-32"
              />
            </div>
            <p className="mt-5 text-[16px] leading-[1.7] text-[#2a2521]">
              Every table, every poster, every pitch, captured across the day.
              Browse and download the full set.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-6">
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
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#e02214] px-6 py-3.5 font-sans text-[14.5px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404]"
            >
              <Images className="h-4 w-4" strokeWidth={2.25} />
              See the full gallery
              <span className="text-white/75">
                ({photos.length} photo{photos.length === 1 ? "" : "s"})
              </span>
            </Link>
          </div>
        </section>
      ) : (
        <section className="relative" style={{ background: "var(--color-cream)" }}>
          <Scribble
            variant="squiggle"
            color={ORANGE}
            className="pointer-events-none absolute left-[4%] top-[10%] h-6 w-20 opacity-60 md:h-8 md:w-28"
          />
          <div className="relative mx-auto max-w-[1180px] px-5 py-14 md:px-6 md:py-20">
            <div className="relative rounded-[var(--radius-md)] border border-dashed border-[rgba(20,18,16,0.16)] bg-white/60 p-8 text-center md:p-12">
              <Scribble
                variant="spark"
                color={GOLD}
                className="pointer-events-none absolute right-4 top-4 h-8 w-8 opacity-70 md:h-10 md:w-10"
              />
              <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#f4efe6] text-[#b91404]">
                <Images className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h2
                className="mx-auto mt-6 max-w-[26ch] font-sans tracking-[-0.025em] text-[#141210] balance"
                style={{
                  fontSize: "clamp(1.5rem, 2.8vw, 2rem)",
                  lineHeight: 1.15,
                  fontWeight: 500,
                  fontVariationSettings: '"opsz" 144',
                }}
              >
                The gallery&rsquo;s still being put together.
              </h2>
              <Scribble
                variant="underline"
                color={TEAL}
                delayMs={200}
                className="mx-auto mt-3 h-3 w-24 md:h-4 md:w-32"
              />
              <p className="mx-auto mt-4 max-w-[52ch] text-[15px] leading-[1.65] text-[#2a2521]">
                Every table, every poster, every pitch, was captured across the
                day. We&rsquo;re sorting through it all now: check back soon
                for the full set.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* WHERE TO NEXT */}
      <section className="relative" style={{ background: "var(--color-cream)" }}>
        <Scribble
          variant="lightbulb"
          color={TEAL}
          className="pointer-events-none absolute right-[5%] top-[12%] h-10 w-10 opacity-60 md:h-14 md:w-14"
        />
        <div className="relative mx-auto max-w-[1100px] px-5 py-14 md:px-6 md:py-20">
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
          <Scribble
            variant="underline"
            color={GOLD}
            delayMs={200}
            className="mt-2 h-3 w-28 md:h-4 md:w-36"
          />
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

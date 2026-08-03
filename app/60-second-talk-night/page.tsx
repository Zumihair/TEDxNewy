import {
  ArrowUpRight,
  Calendar,
  Clock,
  MapPin,
  Mic,
  Timer,
  FileText,
} from "lucide-react";
import PageHero from "@/components/PageHero";
import PhotoFill from "@/components/PhotoFill";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import RecapVideo from "@/components/RecapVideo";
import SoundWaves from "@/components/SoundWaves";
import SixtySecondRing from "@/components/SixtySecondRing";

export const metadata = {
  alternates: { canonical: "/60-second-talk-night" },
  title: "TEDxNewy 60-Second Talk Night · Salon 2 recap",
  description:
    "TEDxNewy Salon 2, the 60-Second Talk Night, was held on Thursday 16 July 2026 at The Base, Newcastle West. One idea, one minute, one audience. Watch the recap; the full line-up and content from the night are coming soon.",
  openGraph: {
    title: "TEDxNewy 60-Second Talk Night · Salon 2 recap",
    description:
      "One idea. One minute. One audience. A recap of TEDxNewy Salon 2, held on 16 July 2026 at The Base, Newcastle West.",
    type: "website",
  },
};

/* Translucent fills so the soundwave background reads through the section. */
const CREAM = "rgba(244,239,230,0.82)";
const NEUTRAL = "rgba(244,239,230,0.5)";

const DETAILS: {
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
}[] = [
  { Icon: Calendar, label: "Date", value: "Thursday 16 July 2026" },
  { Icon: Clock, label: "Time", value: "6:00pm to 8:00pm" },
  { Icon: MapPin, label: "Venue", value: "The Base, Newcastle West" },
  { Icon: Mic, label: "Format", value: "17 speakers · 60 seconds each" },
];

/**
 * Talks from the night, in the order speakers took the stage. Topics are
 * lightly tidied from the speakers' own submissions.
 */
const TALKS: { speaker: string; topic: string }[] = [
  {
    speaker: "Sam Watson",
    topic:
      "When you understand that you are always motivated, all of your behaviour begins to make perfect sense.",
  },
  {
    speaker: "Shane Williams",
    topic:
      "To value skills the way we value sport, we need both a grassroots pathway, where kids discover hands-on skills in their community, and a hero pathway, where our best tradespeople and makers are celebrated on the world stage.",
  },
  {
    speaker: "Danielle Godfrey",
    topic:
      "How politeness is putting women in danger, and what we should teach instead.",
  },
  {
    speaker: "Tracey Hamilton",
    topic:
      "It's the end of the world as we know it, but I feel fine: finding agency in flux.",
  },
  {
    speaker: "Michelle Heaton",
    topic: "How to build a better life: three lessons I learnt from my staffy.",
  },
  {
    speaker: "Lisa Keevill",
    topic:
      "We build structured transition pathways for leaving the military, the police or a career. So why do we treat the end of a decades-long marriage as something to simply move on from?",
  },
  {
    speaker: "Mel Sebastian",
    topic:
      "A diagnosis of autism or ADHD can open doors, but it can also quietly close them. Why support shouldn't depend on disclosure.",
  },
  {
    speaker: "Mathew Fox",
    topic:
      "A self-help book inspired by my brother, who had Down syndrome, reimagined as an AI coach in your pocket, guiding people from insight to action. Most of us know what to do, we just need someone beside us to help us do it.",
  },
  {
    speaker: "Melissa Horvat",
    topic: "Design is dead... or is it?",
  },
  {
    speaker: "Caroline De Vries",
    topic:
      "Climate change is only possible with social climate change at its foundation.",
  },
  {
    speaker: "Tricia Martin",
    topic:
      "We license people to drive because a car can cause harm. Smartphones are the most sophisticated psychological tools in history, so the next L-plates shouldn't be for roads, but for algorithms, with parents getting licensed first.",
  },
  {
    speaker: "Dave Connett",
    topic:
      "The key to overcoming victimhood is to give its thoughts no oxygen, and to be disciplined in replacing them with something far better.",
  },
  {
    speaker: "Angelo Piccione",
    topic:
      "Deep purpose is what gives ordinary people the courage to attempt extraordinary things before they know they're possible.",
  },
  {
    speaker: "Ryan Lynch",
    topic:
      "The future of work isn't humans versus AI. It's humans becoming stewards of AI agents, using taste, judgement and responsibility to guide the machines that do the doing.",
  },
  {
    speaker: "Shonavee Simpson-Anderson",
    topic:
      "SEO isn't a skill, it's a framework, and it's powerful enough to bridge knowledge gaps for every kind of digital professional.",
  },
  {
    speaker: "Annelise Dixon",
    topic:
      "A community-led movement connecting Newcastle's mental health and suicide prevention resources, helping people find the right support at the right time.",
  },
  {
    speaker: "Declan Edwards",
    topic:
      "Measuring a society's success through GDP and the economy alone is crippling our development.",
  },
];

const PARTNER = {
  name: "The Base Health",
  label: "Venue Partner",
  url: "https://www.thebasehealth.com.au/",
  blurb:
    "A wellbeing space in the heart of Newcastle, connecting our community with the range of services and supports that matter so much right now.",
  services: [
    "Psychology",
    "Family counselling",
    "Nature therapy",
    "Adventure therapy",
    "Art therapy",
    "And more...",
  ],
};

export default function TalkNightPage() {
  return (
    <>
      <BreadcrumbJsonLd
        name="60-Second Talk Night"
        path="/60-second-talk-night"
      />

      {/* Ambient soundwave motif, fixed behind the whole page. */}
      <SoundWaves className="pointer-events-none fixed inset-0 z-0 opacity-[0.12] md:opacity-[0.22]" />

      <div className="relative z-10">
        <PageHero
          kicker="Past event · 16 July 2026"
          titleTop="60-Second Talk Night"
          intro={
            <>
              Our second Salon of 2026, held on Thursday 16 July at The Base,
              Newcastle West. An intimate evening where Novocastrians took the
              stage, or a seat, to share and hear ideas, each in just 60 seconds.
              One idea. One minute. One audience.
            </>
          }
        />

        {/* BANNER VIDEO — muted autoplay loop */}
        <section className="mx-auto max-w-[1180px] px-5 pb-16 md:px-6 md:pb-20">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[var(--radius-md)] bg-[#0a0908]">
            <video
              src="/video/talk-night-banner.mp4"
              poster="/video/talk-night-banner-poster.jpg"
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
                Everyone has an idea worth a minute.
              </h2>
              <p className="mt-5 text-[16.5px] leading-[1.7] text-[#2a2521] md:text-[17.5px]">
                The 60-Second Talk Night stripped talks back to their core: a
                single idea, shared simply. No slide deck, no pressure. Just a
                speaker, the stage and 60 seconds to share an idea, insight,
                story or perspective that mattered to them.
              </p>
              <p className="mt-4 text-[16.5px] leading-[1.7] text-[#2a2521] md:text-[17.5px]">
                Seventeen speakers each took their minute, then the room stayed
                on to connect and unpack the ideas together. For many it was the
                easiest way to step onto a TEDx stage for the very first time.
              </p>
            </div>
          </div>
        </section>

        {/* PHOTO — wide editorial establishing shot of the room mingling */}
        <section className="mx-auto max-w-[1180px] px-5 pb-16 md:px-6 md:pb-20">
          <figure className="relative aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-md)] bg-[#0a0908] sm:aspect-[21/9]">
            <PhotoFill
              src="/images/talk-night/connecting-3.webp"
              alt="Attendees connecting among the plants and bookshelves at The Base, Newcastle West."
              sizes="(min-width: 1180px) 1180px, 100vw"
            />
            <div className="absolute inset-0 hidden bg-gradient-to-t from-black/55 via-black/10 to-transparent sm:block" />
            <figcaption className="absolute bottom-0 left-0 right-0 hidden p-6 sm:block md:p-10">
              <p className="max-w-[42ch] font-sans text-[19px] font-medium leading-[1.3] text-white md:text-[24px]">
                Before a word was said on stage, the room was already talking.
              </p>
            </figcaption>
          </figure>
          <p className="mt-3.5 max-w-[52ch] font-sans text-[15.5px] font-medium leading-[1.5] text-[#2a2521] sm:hidden">
            Before a word was said on stage, the room was already talking.
          </p>
        </section>

        {/* ONE MINUTE — dark theatrical band with the looping 60s ring */}
        <section className="relative overflow-hidden bg-[#2a0604] text-white">
          <SoundWaves
            variant="light"
            className="pointer-events-none absolute inset-0 opacity-[0.16]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4"
            style={{
              width: "min(90vw, 820px)",
              height: "min(90vw, 820px)",
              background:
                "radial-gradient(ellipse at center, rgba(255,54,38,0.24) 0%, rgba(138,13,5,0.08) 45%, rgba(42,6,4,0) 70%)",
            }}
          />
          <div className="relative z-10 mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-28">
            <div className="grid items-center gap-12 md:grid-cols-[1.3fr_1fr] md:gap-16">
              <div>
                <h2
                  className="font-sans tracking-[-0.025em] text-white balance"
                  style={{
                    fontSize: "clamp(2rem, 4.4vw, 3.25rem)",
                    lineHeight: 1.04,
                    fontWeight: 500,
                    fontVariationSettings: '"opsz" 144',
                  }}
                >
                  One idea. One minute. One audience.
                </h2>
                <p className="mt-6 max-w-[52ch] text-[16.5px] leading-[1.7] text-white/80 md:text-[17.5px]">
                  Sixty seconds was barely enough time to be nervous. That was
                  the point. Long enough to land one honest idea, and short
                  enough that anyone could find the courage to stand up and
                  share it. Seventeen times over, the room heard something new.
                </p>
              </div>
              <div className="flex justify-center md:justify-end">
                <SixtySecondRing size={240} />
              </div>
            </div>
          </div>
        </section>

        {/* MOMENTS FROM THE NIGHT — swipeable on mobile, 3-up from sm */}
        <section className="mx-auto max-w-[1180px] px-5 pt-16 md:px-6 md:pt-20">
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 [scrollbar-width:none] sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:pb-0">
            {[
              {
                src: "/images/talk-night/sign.webp",
                alt: "The TEDxNewy 'Ideas change everything' sign greeting the room at the door.",
              },
              {
                src: "/images/talk-night/audience.webp",
                alt: "The room settled into The Base's vintage armchairs and sofas, listening in.",
              },
              {
                src: "/images/talk-night/connecting-2.webp",
                alt: "Attendees connecting after the talks wrapped for the night.",
              },
            ].map((m) => (
              <div
                key={m.src}
                className="relative aspect-[4/3] w-[80%] shrink-0 snap-start overflow-hidden rounded-[var(--radius-md)] bg-[#e9e2d5] sm:w-auto"
              >
                <PhotoFill
                  src={m.src}
                  alt={m.alt}
                  sizes="(min-width: 640px) 33vw, 80vw"
                />
              </div>
            ))}
          </div>
        </section>

        {/* SPEAKERS & TOPICS */}
        <section className="mx-auto max-w-[1180px] px-5 pb-20 pt-16 md:px-6 md:pb-24 md:pt-20">
          <h2
            className="max-w-[20ch] font-sans tracking-[-0.025em] text-[#141210] balance"
            style={{
              fontSize: "clamp(1.75rem, 3.4vw, 2.5rem)",
              lineHeight: 1.05,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            The speakers and their ideas.
          </h2>
          <p className="mt-5 max-w-[62ch] text-[16px] leading-[1.7] text-[#2a2521]">
            Seventeen Novocastrians took the stage, in the order below. Here is
            what they came to say.
          </p>

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {TALKS.map((t, i) => (
              <article
                key={`${t.speaker}-${i}`}
                className="flex items-start gap-4 rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white p-6 md:p-7"
              >
                <span
                  className="tabular w-9 shrink-0 text-right font-sans text-[26px] font-medium leading-none text-[rgba(185,20,4,0.45)]"
                  style={{ fontVariationSettings: '"opsz" 144' }}
                  aria-hidden
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-sans text-[18px] font-medium leading-[1.25] tracking-[-0.01em] text-[#141210]">
                    {t.speaker}
                  </h3>
                  <p className="mt-2 text-[14.5px] leading-[1.6] text-[#2a2521]">
                    {t.topic}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* SIXTY SECOND SPEAKERS — a side-by-side pair */}
        <section className="mx-auto max-w-[1180px] px-5 pb-16 md:px-6 md:pb-20">
          <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
            {[
              {
                src: "/images/talk-night/speaker-1.webp",
                name: "Mathew Fox",
                alt: "Mathew Fox mid-flow, mic in hand, during his sixty seconds on stage.",
              },
              {
                src: "/images/talk-night/speaker-2.webp",
                name: "Tricia Martin",
                alt: "Tricia Martin mid-flow, mic in hand, during her sixty seconds on stage.",
              },
            ].map((s) => (
              <figure
                key={s.name}
                className="overflow-hidden rounded-[var(--radius-md)]"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#0a0908]">
                  <PhotoFill src={s.src} alt={s.alt} sizes="(min-width: 640px) 50vw, 100vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />
                  <figcaption className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                    <p className="font-sans text-white">
                      <span
                        className="font-mono text-[10px] font-semibold uppercase text-white/70"
                        style={{ letterSpacing: "0.16em" }}
                      >
                        60 Second Speaker:
                      </span>{" "}
                      <span className="text-[17px] font-medium md:text-[19px]">
                        {s.name}
                      </span>
                    </p>
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>
        </section>

        {/* PARTNER */}
        <section style={{ backgroundColor: CREAM }}>
          <div className="mx-auto max-w-[1180px] px-5 py-16 md:px-6 md:py-20">
            <h2
              className="max-w-[22ch] font-sans tracking-[-0.025em] text-[#141210] balance"
              style={{
                fontSize: "clamp(1.75rem, 3.4vw, 2.5rem)",
                lineHeight: 1.05,
                fontWeight: 500,
                fontVariationSettings: '"opsz" 144',
              }}
            >
              With thanks to our venue partner.
            </h2>
            <p className="mt-5 max-w-[58ch] text-[16px] leading-[1.7] text-[#2a2521]">
              TEDxNewy is volunteer-run and not-for-profit. Salon 2 was made
              possible by The Base Health, who opened their doors for the night.
            </p>

            <a
              href={PARTNER.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative mt-10 block overflow-hidden rounded-[18px] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
            >
              <div className="absolute inset-0">
                <PhotoFill
                  src="/images/talk-night/venue-integration.webp"
                  alt=""
                  sizes="(min-width: 1180px) 1180px, 100vw"
                  hoverZoom={false}
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/65 to-black/35" />

              <div className="relative p-8 md:p-12">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-center gap-5">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white p-3 md:h-24 md:w-24">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/partners/the-base.webp"
                        alt="The Base Integrated Health and Community Centre logo"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div>
                      <div
                        className="font-mono text-[9.5px] font-semibold uppercase text-[#ff8f78]"
                        style={{ letterSpacing: "0.2em" }}
                      >
                        {PARTNER.label}
                      </div>
                      <div
                        className="mt-2 font-sans text-[clamp(1.8rem,3.4vw,2.6rem)] font-medium leading-[1.05] tracking-[-0.02em] text-white"
                        style={{ fontVariationSettings: '"opsz" 144' }}
                      >
                        {PARTNER.name}
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65 transition-colors group-hover:text-white">
                    Visit site
                    <ArrowUpRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      strokeWidth={2}
                    />
                  </span>
                </div>

                <p className="mt-6 max-w-[70ch] text-[16px] leading-[1.7] text-white/85">
                  {PARTNER.blurb}
                </p>

                <ul className="mt-6 flex flex-wrap gap-2">
                  {PARTNER.services.map((s) => (
                    <li
                      key={s}
                      className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[13px] font-medium text-white backdrop-blur-sm"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </a>
          </div>
        </section>

        {/* RECAP VIDEO — click to play (has audio) */}
        <section style={{ backgroundColor: NEUTRAL }}>
          <div className="mx-auto max-w-[1180px] px-5 py-16 md:px-6 md:py-20">
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
                Sixty seconds, seventeen times over.
              </h2>
            </div>
            <RecapVideo
              src="/video/talk-night-recap.mp4"
              poster="/video/talk-night-recap-poster.jpg"
              caption="TEDxNewy Salon 2 · 60-Second Talk Night · 16 July 2026 · The Base, Newcastle West"
            />
          </div>
        </section>

        {/* MORE COMING SOON */}
        <section className="mx-auto max-w-[1180px] px-5 py-16 md:px-6 md:py-20">
          <div className="flex flex-col items-start gap-8 rounded-[18px] border border-[rgba(20,18,16,0.10)] bg-white p-8 md:flex-row md:items-center md:justify-between md:p-14">
            <div className="max-w-[62ch]">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#f4efe6] text-[#b91404]">
                  <FileText className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <span
                  className="rounded-full bg-[#f4efe6] px-3 py-1 font-mono text-[10.5px] font-semibold uppercase text-[#6b6459]"
                  style={{ letterSpacing: "0.16em" }}
                >
                  Coming soon
                </span>
              </div>
              <h2
                className="mt-6 max-w-[22ch] font-sans tracking-[-0.025em] text-[#141210] balance"
                style={{
                  fontSize: "clamp(1.6rem, 3vw, 2.25rem)",
                  lineHeight: 1.1,
                  fontWeight: 500,
                  fontVariationSettings: '"opsz" 144',
                }}
              >
                More from the night.
              </h2>
              <p className="mt-4 text-[16px] leading-[1.7] text-[#2a2521]">
                Individual talks from the 60-Second Talk Night are being
                pulled together. Check back here soon to see the ideas from
                the night in full.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(20,18,16,0.15)] px-6 py-3 font-sans text-[14.5px] font-medium text-[#6b6459]">
              <Timer className="h-4 w-4" strokeWidth={2} aria-hidden />
              Content coming soon
            </span>
          </div>
        </section>
      </div>
    </>
  );
}

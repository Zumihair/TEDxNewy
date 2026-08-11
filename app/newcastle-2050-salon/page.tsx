import {
  StickyNote,
  MapPin,
  Blocks,
  Vote,
  FileText,
  ArrowUpRight,
  Download,
  Calendar,
  Clock,
  Layers,
  Images,
} from "lucide-react";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import PhotoFill from "@/components/PhotoFill";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import RecapVideo from "@/components/RecapVideo";
import NodeNetwork from "@/components/NodeNetwork";
import { getEventBySlug, getPhotosForEvent } from "@/lib/cms-content";

export const metadata = {
  alternates: { canonical: "/newcastle-2050-salon" },
  title: "Newcastle 2050: What If? · TEDxNewy Salon recap",
  description:
    "TEDxNewy Salon Newcastle 2050: What If? was staged on Thursday 30 April 2026 at the Q Building, Honeysuckle. 122 Novocastrians across three rooms on how we move, live and gather in 2050. See what the night captured.",
};

/* Translucent fills so the background node network reads through the section. */
const CREAM = "rgba(244,239,230,0.82)";
/* Same hue as the page background, just more see-through, so these bands read
   as a whisper over the node network rather than a distinct block of colour. */
const NEUTRAL = "rgba(244,239,230,0.5)";

const DETAILS: {
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
}[] = [
  { Icon: Calendar, label: "Date", value: "Thursday 30 April 2026" },
  { Icon: Clock, label: "Time", value: "Doors 6pm" },
  { Icon: MapPin, label: "Venue", value: "Q Building, Honeysuckle" },
  { Icon: Layers, label: "Format", value: "Three themed rooms" },
];

/* ------------------------------------------------------------------ *
 * DATA
 * Captured at TEDxNewy Salon 1, 30 April 2026. Post-it counts are the
 * deduplicated totals from the raw data compendium; signals are lightly
 * tidied from the recordings, maps and table notes.
 * ------------------------------------------------------------------ */

type Room = {
  key: "transport" | "health" | "night";
  label: string;
  question: string;
  total: number;
  photo: string;
  photoAlt: string;
  /** Accent colour for this room, tuned to sit on warm cream. */
  accent: string;
  accentSoft: string;
  lead: string;
  signals: string[];
  themes: { name: string; count: number }[];
};

const ROOMS: Room[] = [
  {
    key: "transport",
    label: "Transport & Mobility",
    question: "How will we move through, in and out of Newcastle in 2050?",
    total: 117,
    photo: "/images/salon-2050/new-connections.webp",
    photoAlt:
      "Attendees making new connections in the Transport and Mobility room at the salon.",
    accent: "#17607a",
    accentSoft: "rgba(23,96,122,0.10)",
    lead: "Newcastle is ready to be an e-bike, light-rail, walkable city. The appetite is here; the infrastructure is lagging behind it.",
    signals: [
      "E-bikes are treated as inevitable. The unfinished work is separated lanes, learner schemes and lighting on the bike paths.",
      "The tram is loved, and limited. The most repeated wish was free or late-night service: light rail running when people actually want it.",
      "High-speed rail to Sydney is the next big shift, paired with real concern about housing affordability if that growth is not actively planned.",
    ],
    themes: [
      { name: "Public transport", count: 40 },
      { name: "Cycling & e-bikes", count: 21 },
      { name: "Cars, parking & EVs", count: 19 },
      { name: "Air & inter-city", count: 18 },
      { name: "Pain points & systemic", count: 11 },
      { name: "Tourism & experience", count: 8 },
    ],
  },
  {
    key: "health",
    label: "Health & Wellbeing",
    question: "How will we live well in the city in 2050?",
    total: 92,
    photo: "/images/salon-2050/group-discussion.webp",
    photoAlt:
      "Salon attendees deep in discussion around a table in the Health and Wellbeing room.",
    accent: "#2f6b41",
    accentSoft: "rgba(47,107,65,0.10)",
    lead: "The room named loneliness as the central health concern, and answered it with intergenerational mixing, third places, and food-and-fire rituals.",
    signals: [
      "Stop loneliness shows up word for word. Aged care beside child care, multi-generation activities, in Newy we say HI: all part of one answer.",
      "Third places before clinics. The notes asked for libraries, community gardens, informal amphitheatres and public gyms. Wellbeing is connecting with people.",
      "Newcastle's water is wellbeing infrastructure: ocean baths, the Bogey Hole, Glenrock at night, floating saunas in the harbour.",
      "By 2050, zero harassment of women and children. Posted three times, and underlined.",
    ],
    themes: [
      { name: "Active recreation", count: 23 },
      { name: "Green & nature", count: 20 },
      { name: "Loneliness & connection", count: 16 },
      { name: "Equity & inclusion", count: 14 },
      { name: "Aged care & intergenerational", count: 8 },
      { name: "Health system & policy", count: 8 },
      { name: "Buildings & housing", count: 3 },
    ],
  },
  {
    key: "night",
    label: "Night Culture & Economy",
    question: "How will we experience the city after dark in 2050?",
    total: 88,
    photo: "/images/salon-2050/sme-communicating.webp",
    photoAlt:
      "A subject-matter expert sharing ideas with a small group in the Night Culture and Economy room.",
    accent: "#6b4a8f",
    accentSoft: "rgba(107,74,143,0.10)",
    lead: "Newcastle after dark is a string of disconnected pockets. The room wanted them threaded together with light, transit and suburb-level life.",
    signals: [
      "Light is the connective tissue of the night: artistic lighting, lit bike paths, coloured footpaths to connect the city, lighting plus people to make a place feel safe.",
      "The 14 to 18 and the 30-plus crowds are underserved. Attendees proposed age-bracketed venues and family-friendly nights, with Adamstown Bowling Club named as the model.",
      "Activate what we have before building. The Wharf, Hunter St Mall, the old Post Office and Devonshire St are assets waiting for a hammer and a permission slip.",
    ],
    themes: [
      { name: "Programming & rituals", count: 17 },
      { name: "Live music & arts", count: 14 },
      { name: "Outdoor & waterfront", count: 13 },
      { name: "Activation & built form", count: 11 },
      { name: "Lighting & safety", count: 10 },
      { name: "Voices & vision", count: 7 },
      { name: "Suburbs & decentralised", count: 6 },
      { name: "Drinking culture", count: 6 },
      { name: "Age-bracket venues", count: 4 },
    ],
  },
];

const STATS: { num: string; label: string }[] = [
  { num: "122", label: "people across the night" },
  { num: "297", label: "post-it notes written" },
  { num: "7", label: "audio recordings captured" },
  { num: "~104", label: "minutes of conversation" },
  { num: "~15k", label: "words transcribed" },
];

const ACTIVITIES: {
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  body: string;
  photo: string;
  alt: string;
}[] = [
  {
    Icon: StickyNote,
    title: "Answered the big question on post-its",
    body: "Every room opened with a single question. Attendees wrote back, one idea per note, until hundreds of them covered the boards.",
    photo: "/images/salon-2050/activity-postits.webp",
    alt: "A prompt board surrounded by yellow, orange and blue post-it notes on the wall.",
  },
  {
    Icon: MapPin,
    title: "Marked a map of the city with dots",
    body: "Each room had its own printed street map. Attendees placed colour-coded dots and written annotations to show where change should land, and why.",
    photo: "/images/salon-2050/activity-map-dots.webp",
    alt: "A hand placing a coloured pin on a large printed map of Newcastle.",
  },
  {
    Icon: Blocks,
    title: "Moved models across the map",
    body: "Physical models were moved around the maps to show how people live, gather and travel, with each map photographed and the conversation around it recorded.",
    photo: "/images/salon-2050/activity-figurines.webp",
    alt: "Small coloured blocks and figures arranged on a TEDxNewy Salon table map while people sketch.",
  },
  {
    Icon: Vote,
    title: "Voted with tokens on the priorities",
    body: "Red, white and black tokens went into labelled jars, turning a room full of opinions into a clear, honest read on what mattered most.",
    photo: "/images/salon-2050/activity-voting-token.webp",
    alt: "Piles of red, white and black voting tokens beside labelled glass jars.",
  },
];

const MOMENTS: { src: string; alt: string }[] = [
  {
    src: "/images/salon-2050/happy-attendee.webp",
    alt: "A smiling attendee at the Newcastle 2050 salon.",
  },
  {
    src: "/images/salon-2050/partner-university.webp",
    alt: "University of Newcastle team at the Newcastle 2050 salon.",
  },
  {
    src: "/images/salon-2050/partner-frekl.webp",
    alt: "The Frekl team at the Newcastle 2050 salon.",
  },
];

// Caption for the wide photo-essay band. Overlaid on the image at sm+, shown
// below it on mobile (where the shorter image can't hold the full text).
const PHOTO_BAND_CAPTION =
  "A room of Novocastrians unpacking the next twenty-five years, guided by subject-matter experts and communication specialists from the University of Newcastle.";

const TENSIONS: { a: string; b: string; note: string }[] = [
  {
    a: "Car convenience",
    b: "Walking & cycling",
    note: "Most people drove to the venue. Most notes wanted the opposite future.",
  },
  {
    a: "Build new",
    b: "Activate existing",
    note: "We don't need to spend much. What we have, we just haven't activated yet.",
  },
  {
    a: "CBD focus",
    b: "Suburb life",
    note: "A village square in each neighbourhood. A western hub. Hubs in suburbs.",
  },
  {
    a: "Drinking culture",
    b: "Non-drinking culture",
    note: "Both wanted, neither replacing the other. Cafes, swims, good bands, not alcohol.",
  },
  {
    a: "E-bike freedom",
    b: "Pedestrian safety",
    note: "The room liked them, and also wanted them off Honeysuckle and off the Fernleigh footpath.",
  },
  {
    a: "Vibrancy at night",
    b: "Residential quiet",
    note: "The 65-plus apartment buyer and the 18 to 25 nightlife crowd share the same block.",
  },
  {
    a: "Growth: HSR, density",
    b: "Affordability",
    note: "If high-speed rail is not actively planned, it will decrease housing affordability.",
  },
  {
    a: "18 to 25 well served",
    b: "Every other age",
    note: "The night-time service curve is U-shaped, and the room noticed.",
  },
];

/** Partners who specifically backed this salon, with links to each site.
 *  NOTE: confirm the URLs below before this goes live. */
const PARTNERS: { name: string; label: string; url: string }[] = [
  {
    name: "University of Newcastle",
    label: "Presenting Partner",
    url: "https://www.newcastle.edu.au",
  },
  { name: "Henderson", label: "Platinum Partner", url: "https://henderson.com.au/" },
  { name: "Frekl", label: "Event Partner", url: "https://frekl.com.au/" },
  {
    name: "Newy Digital",
    label: "Media Partner",
    url: "https://www.newydigital.com/",
  },
];

/* Widest single theme bar, used to scale every bar to a common baseline. */
const MAX_THEME = Math.max(
  ...ROOMS.flatMap((r) => r.themes.map((t) => t.count)),
);

/* ------------------------------------------------------------------ *
 * PAGE
 * ------------------------------------------------------------------ */

export default async function Newcastle2050SalonPage() {
  const event = await getEventBySlug("newcastle-2050-salon");
  const photos = event ? await getPhotosForEvent(event.id) : [];

  return (
    <>
      <BreadcrumbJsonLd
        name="Newcastle 2050: What If?"
        path="/newcastle-2050-salon"
      />

      {/* Ambient node/edge network, fixed behind the whole page. */}
      <NodeNetwork className="pointer-events-none fixed inset-0 z-0 opacity-[0.14] md:opacity-[0.28]" />

      <div className="relative z-10">
        <PageHero
          kicker="Past event · 30 April 2026"
          titleTop="Newcastle 2050: What If?"
          intro={
            <>
              TEDxNewy&rsquo;s 2026 season opener, held on Thursday 30 April at
              the Q Building, Honeysuckle. Three themed rooms, bold questions and
              an evening spent imagining what Newcastle becomes by 2050. This is
              what the night captured.
            </>
          }
        />

        {/* BANNER VIDEO — autoplay loop, muted, plays the moment the page loads */}
        <section className="mx-auto max-w-[1180px] px-5 pb-16 md:px-6 md:pb-20">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[var(--radius-md)] bg-[#0a0908]">
            <video
              src="/video/salon-banner.mp4"
              poster="/video/salon-banner-poster.jpg"
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
                Three rooms. One question.
              </h2>
              <p className="mt-5 text-[16.5px] leading-[1.7] text-[#2a2521] md:text-[17.5px]">
                An evening of bold questions, creative thinking and new
                perspectives, across three themed rooms imagining how Newcastle
                moves, lives and gathers in 2050. Live discussion, interactive
                screens and hands-on activities, with one provocation in common:{" "}
                <em className="italic">what if</em>?
              </p>
              <p className="mt-4 text-[16.5px] leading-[1.7] text-[#2a2521] md:text-[17.5px]">
                Attendees didn&rsquo;t just watch. They wrote, mapped, modelled
                and voted, and by the end of the night the walls and maps were a
                live portrait of the city Novocastrians want. Everything below is
                drawn straight from that record.
              </p>
            </div>
          </div>
        </section>

        {/* WHAT HAPPENED ON THE NIGHT */}
        <section style={{ backgroundColor: CREAM }}>
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
              Four ways the room shaped the night.
            </h2>
            <p className="mt-5 text-[16px] leading-[1.7] text-[#2a2521]">
              Each of the three rooms worked around its own map of the city.
              Together these activities turned a night of conversation into
              something that could be counted, mapped and kept.
            </p>

            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {ACTIVITIES.map(({ Icon, title, body, photo, alt }) => (
                <article
                  key={title}
                  className="group overflow-hidden rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.08)] bg-white"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#e9e2d5]">
                    <PhotoFill
                      src={photo}
                      alt={alt}
                      sizes="(min-width: 640px) 50vw, 100vw"
                    />
                  </div>
                  <div className="p-6 md:p-7">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f4efe6] text-[#b91404]">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <h3 className="mt-4 font-sans text-[19px] font-medium leading-[1.25] tracking-[-0.01em] text-[#141210]">
                      {title}
                    </h3>
                    <p className="mt-2.5 text-[15px] leading-[1.6] text-[#2a2521]">
                      {body}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* PHOTO ESSAY — wide band + three moments */}
        <section className="mx-auto max-w-[1180px] px-5 py-16 md:px-6 md:py-20">
          <figure className="relative aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-md)] bg-[#0a0908] sm:aspect-[21/9]">
            <PhotoFill
              src="/images/salon-2050/community-event.webp"
              alt="A full room of Novocastrians gathered for the Newcastle 2050 salon."
              sizes="(min-width: 1180px) 1180px, 100vw"
            />
            {/* Overlaid caption on larger screens; below the image on mobile. */}
            <div className="absolute inset-0 hidden bg-gradient-to-t from-black/55 via-black/10 to-transparent sm:block" />
            <figcaption className="absolute bottom-0 left-0 right-0 hidden p-6 sm:block md:p-10">
              <p className="max-w-[42ch] font-sans text-[19px] font-medium leading-[1.3] text-white md:text-[24px]">
                {PHOTO_BAND_CAPTION}
              </p>
            </figcaption>
          </figure>
          <p className="mt-3.5 max-w-[52ch] font-sans text-[15.5px] font-medium leading-[1.5] text-[#2a2521] sm:hidden">
            {PHOTO_BAND_CAPTION}
          </p>

          {/* Swipeable on mobile so each moment reads at a decent size instead
              of a tall stack; a fixed 3-up grid from sm up. */}
          <div className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 [scrollbar-width:none] sm:mt-6 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:pb-0">
            {MOMENTS.map((m) => (
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

        {/* THE THREE ROOMS */}
        <section className="mx-auto max-w-[1180px] px-5 pb-8 md:px-6">
          <h2
            className="max-w-[20ch] font-sans tracking-[-0.025em] text-[#141210] balance"
            style={{
              fontSize: "clamp(1.85rem, 3.6vw, 2.75rem)",
              lineHeight: 1.05,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            The three rooms.
          </h2>
          <p className="mt-5 text-[16px] leading-[1.7] text-[#2a2521]">
            Each room explored one question about Newcastle in 2050. The findings
            below come straight from the notes, maps and conversations captured
            in each.
          </p>
        </section>

        <div className="mx-auto max-w-[1180px] px-5 pb-12 md:px-6 md:pb-16">
          {ROOMS.map((room, i) => (
            <section
              key={room.key}
              className="grid items-center gap-8 border-t border-[rgba(20,18,16,0.10)] py-14 md:grid-cols-12 md:gap-14 md:py-20"
            >
              {/* Photo */}
              <div
                className={`md:col-span-5 ${i % 2 === 1 ? "md:order-2" : ""}`}
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[var(--radius-md)] bg-[#e9e2d5]">
                  <PhotoFill
                    src={room.photo}
                    alt={room.photoAlt}
                    sizes="(min-width: 768px) 40vw, 100vw"
                  />
                </div>
              </div>

              {/* Copy */}
              <div className="md:col-span-7">
                <div className="flex items-center gap-3">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: room.accent }}
                  />
                  <div
                    className="font-mono text-[10.5px] font-semibold uppercase"
                    style={{ letterSpacing: "0.24em", color: room.accent }}
                  >
                    {room.label}
                  </div>
                </div>
                <p className="mt-4 text-[14.5px] italic leading-[1.5] text-[#6b6459]">
                  {room.question}
                </p>
                <p
                  className="mt-4 font-sans tracking-[-0.015em] text-[#141210] balance"
                  style={{
                    fontSize: "clamp(1.4rem, 2.4vw, 1.85rem)",
                    lineHeight: 1.25,
                    fontWeight: 500,
                  }}
                >
                  {room.lead}
                </p>

                <ul className="mt-6 space-y-3.5">
                  {room.signals.map((s, si) => (
                    <li key={si} className="grid grid-cols-[16px_1fr] gap-3">
                      <span
                        className="mt-[9px] h-1.5 w-1.5 rounded-full"
                        style={{ background: room.accent }}
                      />
                      <span className="text-[15px] leading-[1.6] text-[#2a2521]">
                        {s}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-7 flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full px-3 py-1 font-mono text-[11px] font-semibold uppercase"
                    style={{
                      letterSpacing: "0.12em",
                      background: room.accentSoft,
                      color: room.accent,
                    }}
                  >
                    {room.total} notes
                  </span>
                  {room.themes.slice(0, 3).map((t) => (
                    <span
                      key={t.name}
                      className="rounded-full border border-[rgba(20,18,16,0.12)] bg-white/60 px-3 py-1 text-[12.5px] text-[#4a453d]"
                    >
                      {t.name} · {t.count}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* THE NIGHT IN NUMBERS */}
        <section className="relative overflow-hidden bg-[#141210] text-white">
          <NodeNetwork
            variant="light"
            className="pointer-events-none absolute inset-0 opacity-[0.07] md:opacity-[0.11]"
          />
          <div className="relative z-10 mx-auto max-w-[1180px] px-5 py-20 md:px-6 md:py-24">
            <h2
              className="max-w-[24ch] font-sans tracking-[-0.025em] text-white balance"
              style={{
                fontSize: "clamp(1.75rem, 3.4vw, 2.5rem)",
                lineHeight: 1.05,
                fontWeight: 500,
                fontVariationSettings: '"opsz" 144',
              }}
            >
              The night in numbers.
            </h2>
            <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
              {STATS.map((s) => (
                <div key={s.label}>
                  <div
                    className="font-sans text-[clamp(2.4rem,5vw,3.4rem)] font-medium leading-none tracking-[-0.03em] text-white"
                    style={{ fontVariationSettings: '"opsz" 144' }}
                  >
                    {s.num}
                  </div>
                  <div className="mt-3 text-[13.5px] leading-[1.45] text-[rgba(255,255,255,0.62)]">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-14 text-[14.5px] leading-[1.7] text-[rgba(255,255,255,0.55)]">
              Across the three rooms, attendees left their mark on a map of the
              city through colour-coded dots, written annotations, and physical
              models moved across the map and captured on camera. Room
              conversations were recorded and transcribed, and every post-it note
              was read from photographs and deduplicated to a single entry. Health
              and Wellbeing was captured entirely on paper.
            </p>
          </div>
        </section>

        {/* THE DATA — POST-IT BREAKDOWN */}
        <section style={{ backgroundColor: NEUTRAL }}>
          <div className="mx-auto max-w-[1180px] px-5 py-20 md:px-6 md:py-28">
            <h2
              className="max-w-[22ch] font-sans tracking-[-0.025em] text-[#141210] balance"
              style={{
                fontSize: "clamp(1.75rem, 3.4vw, 2.5rem)",
                lineHeight: 1.05,
                fontWeight: 500,
                fontVariationSettings: '"opsz" 144',
              }}
            >
              Every post-it note, sorted by theme.
            </h2>
            <p className="mt-5 text-[16px] leading-[1.7] text-[#2a2521]">
              The 297 written notes from all three rooms, grouped by what they
              were about. They are one of several data streams from the night,
              sitting alongside the maps, dots, models and recordings.
            </p>

            <div className="mt-12 grid gap-x-12 gap-y-14 md:grid-cols-3">
              {ROOMS.map((room) => (
                <div key={room.key}>
                  <div
                    className="flex items-baseline justify-between border-b-2 pb-3"
                    style={{ borderColor: room.accent }}
                  >
                    <h3
                      className="font-sans text-[17px] font-medium tracking-[-0.01em]"
                      style={{ color: room.accent }}
                    >
                      {room.label}
                    </h3>
                    <span className="font-sans text-[15px] font-medium text-[#6b6459]">
                      {room.total}
                    </span>
                  </div>
                  <ul className="mt-5 space-y-4">
                    {room.themes.map((t) => (
                      <li key={t.name}>
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-[13.5px] leading-[1.3] text-[#2a2521]">
                            {t.name}
                          </span>
                          <span className="font-mono text-[12px] font-semibold text-[#6b6459]">
                            {t.count}
                          </span>
                        </div>
                        <div className="mt-1.5 h-[6px] w-full overflow-hidden rounded-full bg-[rgba(20,18,16,0.08)]">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(t.count / MAX_THEME) * 100}%`,
                              background: room.accent,
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* THE BIGGEST THREAD */}
        <section className="mx-auto max-w-[1180px] px-5 py-20 md:px-6 md:py-28">
          <div className="rounded-[18px] border border-[rgba(20,18,16,0.10)] bg-white p-8 md:p-14">
            <h3
              className="max-w-[22ch] font-sans tracking-[-0.02em] text-[#141210] balance"
              style={{
                fontSize: "clamp(1.9rem, 4.4vw, 3.1rem)",
                lineHeight: 1.08,
                fontWeight: 500,
                fontVariationSettings: '"opsz" 144',
              }}
            >
              One word showed up in every room:{" "}
              <em className="italic text-[#b91404]">connect</em>.
            </h3>
            <p className="mt-6 text-[16.5px] leading-[1.7] text-[#2a2521] md:text-[17.5px]">
              Connect the precincts, Darby to Beaumont to Honeysuckle to Wickham.
              Connect the ages, aged care beside child care, with the 14 to 18
              and the 65-plus crowds both named as underserved. Connect the
              suburbs to the centre, through park and ride, suburb hubs and
              village squares. Connect the senses, with light, lighting trails,
              walkable paths and coloured footpaths. The strongest civic ask in
              the room was not for new buildings. It was for the threads between
              what we already have.
            </p>
          </div>
        </section>

        {/* TENSIONS */}
        <section className="mx-auto max-w-[1180px] px-5 pb-20 md:px-6 md:pb-28">
          <h2
            className="max-w-[24ch] font-sans tracking-[-0.025em] text-[#141210] balance"
            style={{
              fontSize: "clamp(1.75rem, 3.4vw, 2.5rem)",
              lineHeight: 1.05,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            The tensions the room held at once.
          </h2>
          <p className="mt-5 text-[16px] leading-[1.7] text-[#2a2521]">
            These are not contradictions to resolve. They are the design tensions
            any 2050 plan has to negotiate, and the salon held them all in a
            single evening.
          </p>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TENSIONS.map((t) => (
              <div
                key={`${t.a}-${t.b}`}
                className="rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white p-6"
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] font-medium leading-tight">
                  <span className="text-[#b91404]">{t.a}</span>
                  <span className="rounded-full bg-[#f4efe6] px-2 py-0.5 text-[10.5px] uppercase tracking-[0.1em] text-[#6b6459]">
                    vs
                  </span>
                  <span className="text-[#17607a]">{t.b}</span>
                </div>
                <p className="mt-3 text-[13.5px] leading-[1.55] text-[#4a453d]">
                  {t.note}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* PARTNERS */}
        <section style={{ backgroundColor: CREAM }}>
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
              The partners who made the night possible.
            </h2>
            <p className="mt-5 text-[16px] leading-[1.7] text-[#2a2521]">
              TEDxNewy is volunteer-run and not-for-profit. This salon was made
              possible by four partners from across the Hunter.
            </p>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {PARTNERS.map((p) => (
                <a
                  key={p.name}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex aspect-[5/4] flex-col items-center justify-center rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white p-6 text-center transition-all duration-200 hover:-translate-y-1 hover:border-[rgba(20,18,16,0.2)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)]"
                >
                  <div
                    className="font-sans text-[clamp(1.4rem,2.2vw,1.95rem)] font-medium leading-[1.05] tracking-[-0.02em] text-[#141210] balance"
                    style={{ fontVariationSettings: '"opsz" 144' }}
                  >
                    {p.name}
                  </div>
                  <div
                    className="mt-3 font-mono text-[9.5px] font-semibold uppercase text-[#b91404]"
                    style={{ letterSpacing: "0.2em" }}
                  >
                    {p.label}
                  </div>
                  <span className="mt-5 inline-flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6b6459] transition-colors group-hover:text-[#b91404]">
                    Visit site
                    <ArrowUpRight
                      className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      strokeWidth={2}
                    />
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* RECAP VIDEO — click to play, larger file deferred */}
        <section style={{ backgroundColor: NEUTRAL }}>
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
                A few minutes from the room.
              </h2>
            </div>
            <RecapVideo
              src="/video/salon-recap.mp4"
              poster="/video/salon-recap-poster.jpg"
              caption="TEDxNewy Salon · Newcastle 2050: What If? · 30 April 2026 · Q Building, Honeysuckle"
            />
          </div>
        </section>

        {/* PHOTO GALLERY — teaser + link through to the full gallery */}
        {photos.length > 0 && (
          <section style={{ backgroundColor: CREAM }}>
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
                Photos from the night.
              </h2>
              <p className="mt-5 text-[16px] leading-[1.7] text-[#2a2521]">
                Every room, every map, every conversation, captured across the
                evening. Browse and download the full set.
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
                href="/events/newcastle-2050-salon/gallery"
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

        {/* WHITE PAPER REPORT — download */}
        <section className="mx-auto max-w-[1180px] px-5 py-20 md:px-6 md:py-24">
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
                  White paper · PDF
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
                The full report.
              </h2>
              <p className="mt-4 text-[16px] leading-[1.7] text-[#2a2521]">
                Everything from the night, written up into a white paper: the
                findings, the tensions and the next steps, with every post-it
                and the full transcripts reproduced in the appendices. Produced
                in partnership with the University of Newcastle.
              </p>
            </div>
            <a
              href="/newcastle-2050-what-if-white-paper.pdf"
              download="TEDxNewy Newcastle 2050 White Paper.pdf"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#e02214] px-7 py-3.5 font-sans text-[14.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404]"
            >
              <Download className="h-4 w-4" strokeWidth={2.25} />
              Download the white paper
            </a>
          </div>
        </section>
      </div>
    </>
  );
}

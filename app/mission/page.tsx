import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { CSSProperties } from "react";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import PageHero from "@/components/PageHero";
import StatBand from "@/components/StatBand";
import { ORG } from "@/lib/data";
import { getEvents, getTalks, getTeamMembers } from "@/lib/cms-content";

export const metadata = {
  alternates: { canonical: "/mission" },
  title: "Mission · TEDxNewy",
  description:
    "TEDxNewy is an independently licensed TED event in Newcastle, Australia, formerly TEDxCooksHill, on Awabakal and Worimi Country. Ideas worth spreading, from Newcastle.",
};

// Re-fetch from Supabase every 60s so the timeline and counts stay current.
export const revalidate = 60;

const BLOB = "https://ob67nrhuhoyfvgao.public.blob.vercel-storage.com/event-photos";
const MANIFESTO_PHOTO = `${BLOB}/reframe-2025/reframe-2025_100.webp`;

const pillars = [
  {
    label: "Connect",
    body: "A community of curious Novocastrians, engaging with ideas and each other.",
  },
  {
    label: "Inspire",
    body: "Speakers who challenge, influence and evoke the conversations that matter.",
  },
  {
    label: "Discover",
    body: "Deeper understanding of our city, our region and the world, through curiosity and wonder.",
  },
  {
    label: "Volunteer-driven",
    body: "100% volunteer-run, not-for-profit. Every dollar goes back into the stage and the speakers.",
  },
  {
    label: "Local",
    body: "We celebrate the brilliance and innovation of Newcastle, working with local vendors and providers to bring the event to life.",
  },
  {
    label: "Impact",
    body: "Ideas can shift attitudes, transform lives, and ultimately change everything.",
  },
];

const KIND_LABEL: Record<string, string> = {
  flagship: "Main stage",
  salon: "Salon",
  special: "Special event",
};

const participate = [
  {
    href: "/speak",
    title: "Nominate a speaker",
    body: "Know someone with an idea worth spreading? Tell us before we hear it elsewhere.",
  },
  {
    href: "/volunteer",
    title: "Join the crew",
    body: "Year-round roles across every crew. No experience needed, just reliability and curiosity.",
  },
  {
    href: "/sponsors",
    title: "Partner with us",
    body: "Back the speakers, the stage and the next generation of Novocastrian storytellers.",
  },
];

const displayStyle = { fontVariationSettings: '"opsz" 144' } as CSSProperties;

export default async function AboutPage() {
  const [events, talks, team] = await Promise.all([
    getEvents(),
    getTalks(),
    getTeamMembers(),
  ]);

  // Timeline: everything with a date, oldest first, so the story reads as a
  // story. Upcoming events sit at the end as where it goes next.
  const now = Date.now();
  const timeline = events
    .filter((e) => e.startsAt)
    .sort((a, b) => Date.parse(a.startsAt as string) - Date.parse(b.startsAt as string));
  const staged = timeline.filter((e) => Date.parse(e.startsAt as string) < now).length;

  return (
    <>
      <BreadcrumbJsonLd name="About" path="/mission" />

      <PageHero
        titleTop="Ideas worth spreading,"
        titleBottom="from Newcastle."
        intro={
          <>
            TEDxNewy is an independently licensed TED event in Newcastle,
            Australia, on Awabakal and Worimi Country. We believe in the
            power of ideas, and in giving a platform to those worth sharing.
            In a world where anyone can share an opinion, we care about
            curating credible, reliable, local voices, and sharing with the
            world the innovation and thinking happening right here in Newy.
          </>
        }
      />

      <StatBand
        items={[
          { value: String(staged), label: "Events staged", sub: "Since 2024" },
          { value: String(talks.length), label: "Talks online" },
          { value: String(team.length), label: "Volunteers" },
          { value: "100", suffix: "%", label: "Not-for-profit" },
        ]}
      />

      {/* MANIFESTO — one photograph, one sentence, in the site's image-block treatment. */}
      <section className="mx-auto max-w-[1100px] px-5 py-16 md:px-6 md:py-24">
        <div className="grid items-center gap-8 md:grid-cols-[1.25fr_1fr] md:gap-14">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-md)] bg-[#1a1714]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={MANIFESTO_PHOTO}
              alt="The audience at Reframe, TEDxNewy's 2025 main stage event"
              className="absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition: "center 30%" }}
            />
          </div>
          <div>
            <p
              className="mt-4 font-sans font-medium text-[#000000] balance"
              style={{ ...displayStyle, fontSize: "clamp(1.6rem, 2.8vw, 2.3rem)", lineHeight: 1.1, letterSpacing: "-0.025em" }}
            >
              A city this curious deserves a stage this serious.
            </p>
          </div>
        </div>
      </section>

      {/* PROMISES — the six pillars, on cream, numbered because the count is real. */}
      <section className="bg-[#f4efe6]">
       <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
        <h2
          className="mt-4 max-w-[16ch] font-sans font-medium text-[#000000] balance"
          style={{ ...displayStyle, fontSize: "clamp(2rem, 4.4vw, 3.4rem)", lineHeight: 1.02, letterSpacing: "-0.03em" }}
        >
          Six things we promise.
        </h2>
        <ul className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map((p, i) => (
            <li key={p.label} className="border-t border-[rgba(0,0,0,0.2)] pt-5">
              <div className="flex items-baseline gap-3">
                <span className="font-ui text-[12px] font-semibold text-[#b91404]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-sans text-[22px] font-medium tracking-[-0.015em] text-[#000000]" style={displayStyle}>
                  {p.label}
                </h3>
              </div>
              <p className="mt-3 max-w-[34ch] text-[15px] leading-[1.6] text-[#3d342e]">{p.body}</p>
            </li>
          ))}
        </ul>
       </div>
      </section>

      {/* WHAT IS TEDX — two columns, the licence explained plainly. */}
      <section className="bg-[#3d0a05] text-white">
        <div className="mx-auto grid max-w-[1100px] gap-8 px-5 py-20 md:grid-cols-[1fr_1.4fr] md:gap-16 md:px-6 md:py-24">
          <div>
            <h2
              className="mt-4 max-w-[14ch] font-sans font-medium text-white balance"
              style={{ ...displayStyle, fontSize: "clamp(1.8rem, 3.6vw, 2.8rem)", lineHeight: 1.04, letterSpacing: "-0.03em" }}
            >
              What is a TEDx event?
            </h2>
          </div>
          <div>
            <p className="text-[16.5px] leading-[1.65] text-white/85">
              In the spirit of <strong className="font-semibold text-white">ideas worth spreading</strong>,
              TEDx is a programme of local, self-organised events that bring people
              together to share a TED-like experience. At a TEDx event, TED Talks
              video and live speakers combine to spark deep discussion and
              connection. These local, self-organised events are branded TEDx,
              where <em>x = independently organised TED event</em>.
            </p>
            <p className="mt-4 text-[16.5px] leading-[1.65] text-white/85">
              The TED Conference provides general guidance for the TEDx programme,
              but individual TEDx events, like ours, are self-organised. TEDxNewy
              is operated under licence from TED by {ORG.legalName},
              and rebranded from TEDxCooksHill in 2026.
            </p>
            <a
              href="https://www.ted.com/about/programs-initiatives/tedx-program"
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-1.5 text-[14.5px] font-medium text-white underline underline-offset-4 hover:text-[#ffb4ab]"
            >
              Learn more about TEDx
              <ArrowUpRight className="h-4 w-4" strokeWidth={2.25} />
            </a>
          </div>
        </div>
      </section>

      {/* TIMELINE — driven by the CMS, so it stops going stale. */}
      <section className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
        <h2
          className="mt-4 max-w-[16ch] font-sans font-medium text-[#000000] balance"
          style={{ ...displayStyle, fontSize: "clamp(2rem, 4.4vw, 3.4rem)", lineHeight: 1.02, letterSpacing: "-0.03em" }}
        >
          From one night a year to a season.
        </h2>
        <ol className="mt-10 border-t border-[rgba(0,0,0,0.14)]">
          {timeline.map((e) => {
            const upcoming = Date.parse(e.startsAt as string) >= now;
            const year = (e.startsAt as string).slice(0, 4);
            const href = e.linkUrl ?? `/events/${e.slug}`;
            return (
              <li key={e.id} className="border-b border-[rgba(0,0,0,0.1)]">
                <Link
                  href={href}
                  className="group grid items-baseline gap-2 py-5 md:grid-cols-[120px_1fr_auto] md:gap-8"
                >
                  <span
                    className="font-sans text-[26px] font-medium leading-none tracking-[-0.03em] text-[#000000] md:text-[30px]"
                    style={displayStyle}
                  >
                    {year}
                  </span>
                  <span>
                    <span className="font-sans text-[19px] font-medium tracking-[-0.01em] text-[#000000] group-hover:text-[#b91404]">
                      {e.title}
                    </span>
                    <span className="mt-1 block font-ui text-[12px] font-semibold text-[#6b6459]">
                      {KIND_LABEL[e.kind] ?? e.kind}
                      {e.venue ? ` · ${e.venue}` : ""}
                    </span>
                  </span>
                  <span
                    className={
                      "justify-self-start rounded-full px-3 py-1 font-ui text-[12px] font-semibold md:justify-self-end " +
                      (upcoming ? "bg-[#e62b1e] text-white" : "bg-[rgba(0,0,0,0.06)] text-[#6b6459]")
                    }
                  >
                    {upcoming ? "Next" : "Staged"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      {/* PARTICIPATE — three ways in, matching the home page cards. */}
      <section className="bg-[#f4efe6]">
        <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
          <h2
            className="mt-4 max-w-[18ch] font-sans font-medium text-[#000000] balance"
            style={{ ...displayStyle, fontSize: "clamp(2rem, 4.4vw, 3.4rem)", lineHeight: 1.02, letterSpacing: "-0.03em" }}
          >
            Built by Novocastrians, for Novocastrians.
          </h2>
          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {participate.map((p) => (
              <li key={p.href}>
                <Link
                  href={p.href}
                  className="group flex h-full flex-col rounded-[var(--radius-md)] border border-[rgba(0,0,0,0.12)] bg-white p-7 transition-all hover:-translate-y-0.5 hover:border-[rgba(230,43,30,0.5)]"
                >
                  <h3 className="font-sans text-[21px] font-medium tracking-[-0.015em] text-[#000000]" style={displayStyle}>
                    {p.title}
                  </h3>
                  <p className="mt-3 flex-1 text-[14.5px] leading-[1.6] text-[#3d342e]">{p.body}</p>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[#b91404]">
                    Learn more
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={2.25} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* COUNTRY — unchanged in spirit; the closing statement. */}
      <section className="bg-[#2a0604] text-white">
        <div className="mx-auto max-w-[1100px] px-5 py-24 md:px-6 md:py-32">
          <p
            className="mt-6 max-w-[30ch] font-sans font-medium text-white balance"
            style={{ ...displayStyle, fontSize: "clamp(1.6rem, 3vw, 2.5rem)", lineHeight: 1.2, letterSpacing: "-0.02em" }}
          >
            {ORG.acknowledgment}
          </p>
        </div>
      </section>
    </>
  );
}

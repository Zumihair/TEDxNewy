import Link from "next/link";
import type { CSSProperties } from "react";
import { Mail, User } from "lucide-react";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import { getEvents, getTeamMembers, type TeamMember } from "@/lib/cms-content";

// Inline brand-mark SVGs — lucide doesn't ship brand icons.
function InstagramMark(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" />
    </svg>
  );
}
function LinkedInMark(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.22 8h4.55v14H.22V8zm7.27 0h4.36v1.92h.06c.61-1.15 2.1-2.36 4.32-2.36 4.62 0 5.47 3.04 5.47 6.99V22h-4.55v-6.18c0-1.47-.03-3.36-2.05-3.36-2.05 0-2.36 1.6-2.36 3.25V22H7.49V8z" />
    </svg>
  );
}

export const metadata = {
  alternates: { canonical: "/team" },
  title: "The team · TEDxNewy",
  description:
    "The volunteers who run TEDxNewy: six crews, zero salaries, one stage. Curators, producers, designers and crew.",
};

// Re-fetch from Supabase every 60s so admin edits land live without redeploys
export const revalidate = 60;

/**
 * Crews are derived from each member's role title, so the page organises
 * itself as the roster changes without a new CMS field. First match wins,
 * so leadership titles are tested before the broader crews.
 */
const CREWS: { title: string; blurb: string; match: RegExp }[] = [
  {
    title: "Leadership",
    blurb: "The licensees and the board. Strategy, money, partners and the licence with TED.",
    match: /licensee|director|chief|\bceo\b|\bcoo\b|\bcfo\b|chair|board/i,
  },
  {
    title: "Speakers",
    blurb: "Finding the ideas, and coaching the people who carry them into 18 minutes.",
    match: /speaker|curat|program/i,
  },
  {
    title: "Brand & Marketing",
    blurb: "Everything you see: the look, the channels, the campaigns and the words.",
    match: /brand|marketing|social|content|design|communic/i,
  },
  {
    title: "Salons & Education",
    blurb: "The year-round program: citizen salons, the schools lab and the student speaker competition.",
    match: /salon|activation|education|youth|school/i,
  },
  {
    title: "Events",
    blurb: "Venues, logistics, run sheets and the hundred things that make a day run on time.",
    match: /event|coordinator|production|stage|logistic|volunteer|operations/i,
  },
  {
    title: "Crew",
    blurb: "The people who make the rest of it happen.",
    match: /./,
  },
];

function crewFor(m: TeamMember): string {
  const role = m.role ?? "";
  return (CREWS.find((c) => c.match.test(role)) ?? CREWS[CREWS.length - 1]).title;
}

/** First sentence of the bio, short enough to sit under a name. */
function oneLiner(bio: string | null): string | null {
  if (!bio) return null;
  const first = bio.split(/(?<=[.!?])\s/)[0].trim();
  return first.length > 110 ? `${first.slice(0, 107).trimEnd()}…` : first;
}

export default async function TeamPage() {
  const [members, events] = await Promise.all([getTeamMembers(), getEvents()]);
  const eventsThisYear = events.filter((e) => e.startsAt?.startsWith("2026")).length;

  const grouped = CREWS.map((c) => ({
    ...c,
    people: members.filter((m) => crewFor(m) === c.title),
  })).filter((c) => c.people.length > 0);

  return (
    <>
      <BreadcrumbJsonLd name="The team" path="/team" />

      {/* HERO — the site's dark-room language, sized as a subpage. Nav.tsx
          lists /team as a dark-hero route so the top bar renders white
          content while transparent over this. */}
      <section className="relative overflow-hidden" style={{ background: "#141210" }}>
        <div
          aria-hidden
          className="pointer-events-none absolute -right-[18vw] -top-[30vw]"
          style={
            {
              width: "min(70vw, 900px)",
              height: "min(70vw, 900px)",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(224,34,20,0.55) 0%, rgba(224,34,20,0.18) 40%, rgba(20,18,16,0) 70%)",
            } as CSSProperties
          }
        />
        <div className="grain pointer-events-none absolute inset-0 opacity-40" />

        <div className="relative z-10 mx-auto w-full max-w-[1240px] px-6 pb-16 pt-36 md:px-10 md:pb-20 md:pt-44">
          <div
            className="font-mono text-[10.5px] font-semibold uppercase text-[#ff9b8f]"
            style={{ letterSpacing: "0.24em" }}
          >
            The crew
          </div>
          <h1
            className="mt-5 max-w-[12ch] font-sans font-medium text-white balance"
            style={{
              fontSize: "clamp(3rem, 8.2vw, 7.4rem)",
              lineHeight: 0.92,
              letterSpacing: "-0.04em",
              fontVariationSettings: '"opsz" 144',
            }}
          >
            Six crews.
            <br />
            Zero salaries.
            <br />
            One <span className="text-[#e02214]">stage.</span>
          </h1>
          <p className="mt-8 max-w-[58ch] text-[17px] leading-[1.6] text-white/78 md:text-[19px]">
            Every event TEDxNewy stages is built by volunteers who give their
            evenings and weekends because Newcastle deserves a stage for big
            ideas. These are the people behind it.
          </p>

          <dl className="mt-12 flex flex-wrap gap-x-14 gap-y-6 border-t border-white/15 pt-7">
            <div>
              <dt className="sr-only">Volunteers</dt>
              <dd className="font-sans text-[40px] font-medium leading-none tracking-[-0.03em] text-white" style={{ fontVariationSettings: '"opsz" 144' }}>
                {members.length}
              </dd>
              <dd className="mt-1.5 text-[12.5px] text-white/55">volunteers</dd>
            </div>
            {eventsThisYear > 0 && (
              <div>
                <dt className="sr-only">Events in 2026</dt>
                <dd className="font-sans text-[40px] font-medium leading-none tracking-[-0.03em] text-white" style={{ fontVariationSettings: '"opsz" 144' }}>
                  {eventsThisYear}
                </dd>
                <dd className="mt-1.5 text-[12.5px] text-white/55">events in 2026</dd>
              </div>
            )}
            <div>
              <dt className="sr-only">Not-for-profit</dt>
              <dd className="font-sans text-[40px] font-medium leading-none tracking-[-0.03em] text-white" style={{ fontVariationSettings: '"opsz" 144' }}>
                100%
              </dd>
              <dd className="mt-1.5 text-[12.5px] text-white/55">not-for-profit</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* CREWS — editorial rows. Small circular portraits keep a roster of
          mixed photography reading as one set; the type carries the page. */}
      <section className="mx-auto max-w-[1240px] px-6 pb-8 md:px-10">
        {members.length === 0 ? (
          <div className="my-20 rounded-[var(--radius-md)] border border-dashed border-[rgba(20,18,16,0.15)] bg-[#f9f5ec] px-6 py-20 text-center">
            <div
              className="font-mono text-[10.5px] font-semibold uppercase text-[#b91404]"
              style={{ letterSpacing: "0.24em" }}
            >
              Coming together
            </div>
            <p className="mx-auto mt-4 max-w-[44ch] text-[16px] leading-[1.6] text-[#2a2521]">
              The 2026 organising crew is being introduced over the coming
              weeks. Subscribe and we&rsquo;ll let you know when everyone is
              published.
            </p>
            <Link
              href="/subscribe"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#e02214] px-6 py-3 text-[14px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404]"
            >
              Subscribe for updates
            </Link>
          </div>
        ) : (
          grouped.map((crew, i) => (
            <div
              key={crew.title}
              className={
                "grid gap-8 py-12 md:grid-cols-[280px_1fr] md:gap-12 md:py-14 " +
                (i > 0 ? "border-t border-[rgba(20,18,16,0.14)]" : "")
              }
            >
              <div>
                <div
                  className="font-mono text-[10.5px] font-semibold uppercase text-[#b91404]"
                  style={{ letterSpacing: "0.24em" }}
                >
                  Crew {String(i + 1).padStart(2, "0")}
                </div>
                <h2
                  className="mt-3 font-sans text-[34px] font-medium leading-[1.02] tracking-[-0.03em] text-[#141210] md:text-[38px]"
                  style={{ fontVariationSettings: '"opsz" 144' }}
                >
                  {crew.title}
                </h2>
                <p className="mt-3 max-w-[28ch] text-[14.5px] leading-[1.55] text-[#6b6459]">
                  {crew.blurb}
                </p>
              </div>

              <ul className="grid gap-x-8 md:grid-cols-2">
                {crew.people.map((m) => {
                  const line = oneLiner(m.bio);
                  return (
                    <li
                      key={m.slug}
                      className="flex items-center gap-4 border-b border-[rgba(20,18,16,0.08)] py-4"
                    >
                      <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full bg-[#1a1714] ring-1 ring-[rgba(20,18,16,0.12)] ring-offset-2 ring-offset-[#f4efe6]">
                        {m.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.imageUrl}
                            alt={m.name}
                            loading="lazy"
                            className="absolute inset-0 h-full w-full object-cover"
                            style={{ objectPosition: "center 20%" }}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-white/40" aria-hidden>
                            <User className="h-7 w-7" strokeWidth={1.5} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3
                          className="font-sans text-[19px] font-medium leading-[1.2] tracking-[-0.015em] text-[#141210]"
                          style={{ fontVariationSettings: '"opsz" 96' }}
                        >
                          {m.name}
                        </h3>
                        {m.role && (
                          <div
                            className="mt-1 font-mono text-[10px] font-semibold uppercase text-[#b91404]"
                            style={{ letterSpacing: "0.18em" }}
                          >
                            {m.role}
                          </div>
                        )}
                        {line && (
                          <p className="mt-1 text-[13.5px] leading-[1.5] text-[#6b6459]">
                            {line}
                          </p>
                        )}
                      </div>
                      {(m.email || m.linkedinUrl || m.instagramUrl) && (
                        <div className="flex shrink-0 items-center gap-2">
                          {m.email && (
                            <a
                              href={`mailto:${m.email}`}
                              aria-label={`Email ${m.name}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(20,18,16,0.16)] text-[#141210] transition-colors hover:border-[#e02214] hover:bg-[#e02214] hover:text-white"
                            >
                              <Mail className="h-3.5 w-3.5" strokeWidth={2.25} />
                            </a>
                          )}
                          {m.linkedinUrl && (
                            <a
                              href={m.linkedinUrl}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`${m.name} on LinkedIn`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(20,18,16,0.16)] text-[#141210] transition-colors hover:border-[#e02214] hover:bg-[#e02214] hover:text-white"
                            >
                              <LinkedInMark className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {m.instagramUrl && (
                            <a
                              href={m.instagramUrl}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`${m.name} on Instagram`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(20,18,16,0.16)] text-[#141210] transition-colors hover:border-[#e02214] hover:bg-[#e02214] hover:text-white"
                            >
                              <InstagramMark className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </section>

      {/* JOIN — the recruitment close, given real weight. */}
      <section className="mx-auto max-w-[1240px] px-6 pb-24 pt-6 md:px-10 md:pb-32">
        <div className="flex flex-col gap-8 rounded-[18px] bg-[#e02214] px-8 py-12 text-white md:flex-row md:items-center md:justify-between md:px-14 md:py-14">
          <div>
            <h2
              className="max-w-[18ch] font-sans font-medium leading-[1.02] tracking-[-0.03em] balance"
              style={{ fontSize: "clamp(1.9rem, 3.6vw, 3rem)", fontVariationSettings: '"opsz" 144' }}
            >
              Want to be on this page next year?
            </h2>
            <p className="mt-4 max-w-[50ch] text-[15.5px] leading-[1.6] text-white/85">
              Six crews, year-round roles, no experience needed. Most volunteers
              come back the year after. Some end up running the whole thing.
            </p>
          </div>
          <Link
            href="/volunteer"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#141210] px-8 py-4 font-sans text-[15px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-black"
          >
            Apply to join
          </Link>
        </div>
      </section>
    </>
  );
}

import Link from "next/link";
import { Mail, User } from "lucide-react";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import PageHero from "@/components/PageHero";
import StatBand from "@/components/StatBand";
import { getEvents, getTeamMembers, type TeamMember } from "@/lib/cms-content";
import { SOCIAL_BY_KEY, socialsOf } from "@/lib/social-catalogue";
import { SocialIcon } from "@/components/SocialIcon";

export const metadata = {
  alternates: { canonical: "/team" },
  title: "The team · TEDxNewy",
  description:
    "The volunteers who run TEDxNewy: built by volunteers, for Newcastle. Curators, producers, designers and crew.",
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

      <PageHero
        titleTop="Built by volunteers."
        titleBottom="For Newcastle."
        intro={
          <>
            Every event TEDxNewy stages is built by volunteers who give their
            evenings and weekends because Newcastle deserves a stage for big
            ideas. These are the people behind it.
          </>
        }
      />

      <StatBand
        items={[
          { value: String(members.length), label: "Volunteers" },
          { value: String(eventsThisYear), label: "Events in 2026" },
          { value: "100", suffix: "%", label: "Not-for-profit" },
        ]}
      />

      {/* CREWS — editorial rows. Small circular portraits keep a roster of
          mixed photography reading as one set; the type carries the page. */}
      <section className="mx-auto max-w-[1100px] px-5 pb-8 md:px-6">
        {members.length === 0 ? (
          <div className="my-20 rounded-[var(--radius-md)] border border-dashed border-[rgba(0,0,0,0.15)] bg-[#f4efe6] px-6 py-20 text-center">
            <p className="mx-auto mt-4 max-w-[44ch] text-[16px] leading-[1.6] text-[#2a2521]">
              The 2026 organising crew is being introduced over the coming
              weeks. Subscribe and we&rsquo;ll let you know when everyone is
              published.
            </p>
            <Link
              href="/subscribe"
              className="btn-red mt-7"
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
                (i > 0 ? "border-t border-[rgba(0,0,0,0.14)]" : "")
              }
            >
              <div>
                <h2
                  className="font-sans text-[34px] font-medium leading-[1.02] tracking-[-0.03em] text-[#000000] md:text-[38px]"
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
                      className="flex items-center gap-4 border-b border-[rgba(0,0,0,0.08)] py-4 md:gap-5 md:py-5"
                    >
                      <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full bg-[#1a1714] ring-1 ring-[rgba(0,0,0,0.12)] ring-offset-2 ring-offset-white md:h-[112px] md:w-[112px]">
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
                          className="font-sans text-[19px] font-medium leading-[1.2] tracking-[-0.015em] text-[#000000]"
                          style={{ fontVariationSettings: '"opsz" 96' }}
                        >
                          {m.name}
                        </h3>
                        {m.role && (
                          <div
                            className="mt-1 font-ui text-[12px] font-semibold text-[#b91404]"
                          >
                            {m.role}
                          </div>
                        )}
                        {line && (
                          <p className="mt-1 text-[13.5px] leading-[1.5] text-[#6b6459]">
                            {line}
                          </p>
                        )}
                        {(m.email || socialsOf({ socials: m.socials, linkedin_url: m.linkedinUrl, instagram_url: m.instagramUrl }).length > 0) && (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {m.email && (
                              <a
                                href={`mailto:${m.email}`}
                                aria-label={`Email ${m.name}`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(0,0,0,0.16)] text-[#000000] transition-colors hover:border-[#e62b1e] hover:bg-[#e62b1e] hover:text-white"
                              >
                                <Mail className="h-3.5 w-3.5" strokeWidth={2.25} />
                              </a>
                            )}
                            {socialsOf({ socials: m.socials, linkedin_url: m.linkedinUrl, instagram_url: m.instagramUrl }).map((s) => (
                              <a
                                key={s.key + s.url}
                                href={s.url}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`${m.name} on ${SOCIAL_BY_KEY[s.key]?.label ?? s.key}`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(0,0,0,0.16)] text-[#000000] transition-colors hover:border-[#e62b1e] hover:bg-[#e62b1e] hover:text-white"
                              >
                                <SocialIcon name={s.key} size={14} />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </section>

      {/* JOIN — the recruitment close, given real weight. */}
      <section className="mx-auto max-w-[1100px] px-5 pb-24 pt-6 md:px-6 md:pb-32">
        <div className="flex flex-col gap-8 rounded-[18px] bg-[#e62b1e] px-8 py-12 text-white md:flex-row md:items-center md:justify-between md:px-14 md:py-14">
          <div>
            <h2
              className="max-w-[18ch] font-sans font-medium leading-[1.02] tracking-[-0.03em] balance"
              style={{ fontSize: "clamp(1.9rem, 3.6vw, 3rem)", fontVariationSettings: '"opsz" 144' }}
            >
              Want to be on this page next year?
            </h2>
            <p className="mt-4 max-w-[50ch] text-[15.5px] leading-[1.6] text-white/85">
              Year-round roles across every crew, no experience needed. Most volunteers
              come back the year after. Some end up running the whole thing.
            </p>
          </div>
          <Link
            href="/volunteer"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#000000] px-8 py-4 font-sans text-[15px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-black"
          >
            Apply to join
          </Link>
        </div>
      </section>
    </>
  );
}

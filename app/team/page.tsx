import Link from "next/link";
import { Mail, User } from "lucide-react";
import PageHero from "@/components/PageHero";
import { getTeamMembers } from "@/lib/cms-content";

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
  title: "The team · TEDxNewy",
  description:
    "The volunteers who run TEDxNewy — curators, producers, designers and crew. We're not paid. Some of us come back every year.",
};

// Re-fetch from Supabase every 60s so admin edits land live without redeploys
export const revalidate = 60;

export default async function TeamPage() {
  const members = await getTeamMembers();

  return (
    <>
      <PageHero
        kicker="The crew"
        titleTop="The volunteers"
        titleBottom="behind the stage."
        accent="red"
        intro={
          <>
            TEDxNewy is entirely volunteer-run. Curators, producers, designers,
            stage crew, hosts and partnership leads — every face here gives
            their time because Newcastle deserves a stage for big ideas.
          </>
        }
      />

      <section className="mx-auto max-w-[1100px] px-5 pb-24 md:px-6 md:pb-32">
        {members.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-dashed border-[rgba(20,18,16,0.15)] bg-[#f9f5ec] px-6 py-20 text-center">
            <div
              className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
              style={{ letterSpacing: "0.24em" }}
            >
              Coming together
            </div>
            <p className="mx-auto mt-4 max-w-[44ch] text-[16px] leading-[1.6] text-[#2a2521]">
              The 2026 organising crew is being introduced talk-by-talk over
              the coming weeks. Subscribe and we&rsquo;ll let you know when
              everyone is published.
            </p>
            <Link
              href="/subscribe"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#e02214] px-6 py-3 text-[14px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404]"
            >
              Subscribe for updates
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((m) => (
              <li key={m.slug}>
                <article>
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-md)] bg-[#1a1714]">
                    {m.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.imageUrl}
                        alt={m.name}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div
                        className="absolute inset-0 flex items-center justify-center text-white/40"
                        aria-hidden
                      >
                        <User
                          className="h-12 w-12"
                          strokeWidth={1.5}
                        />
                      </div>
                    )}
                  </div>
                  <div className="mt-5">
                    {m.role && (
                      <div
                        className="font-mono text-[10px] font-semibold uppercase text-[#e02214]"
                        style={{ letterSpacing: "0.24em" }}
                      >
                        {m.role}
                      </div>
                    )}
                    <h3
                      className="mt-2 font-sans text-[19px] font-medium leading-[1.2] tracking-[-0.01em] text-[#141210]"
                      style={{ fontVariationSettings: '"opsz" 96' }}
                    >
                      {m.name}
                    </h3>
                    {m.bio && (
                      <p className="mt-3 text-[14px] leading-[1.6] text-[#3d342e]">
                        {m.bio}
                      </p>
                    )}
                    {(m.email || m.linkedinUrl || m.instagramUrl) && (
                      <div className="mt-4 flex items-center gap-3">
                        {m.email && (
                          <a
                            href={`mailto:${m.email}`}
                            aria-label={`Email ${m.name}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(20,18,16,0.06)] text-[#141210] transition-colors hover:bg-[#e02214] hover:text-white"
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
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(20,18,16,0.06)] text-[#141210] transition-colors hover:bg-[#e02214] hover:text-white"
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
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(20,18,16,0.06)] text-[#141210] transition-colors hover:bg-[#e02214] hover:text-white"
                          >
                            <InstagramMark className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Join the crew nudge */}
      <section className="bg-[#f9f5ec]">
        <div className="mx-auto grid max-w-[1100px] gap-10 px-5 py-20 md:grid-cols-[1.4fr_1fr] md:items-center md:gap-16 md:px-6 md:py-24">
          <div>
            <div
              className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
              style={{ letterSpacing: "0.24em" }}
            >
              Want to be on this page next year?
            </div>
            <h2
              className="mt-5 max-w-[26ch] font-sans tracking-[-0.025em] text-[#141210] balance"
              style={{
                fontSize: "clamp(1.65rem, 3.2vw, 2.4rem)",
                lineHeight: 1.04,
                fontWeight: 500,
                fontVariationSettings: '"opsz" 144',
              }}
            >
              We&rsquo;re always looking for the next crew.
            </h2>
            <p className="mt-5 max-w-[58ch] text-[15.5px] leading-[1.65] text-[#2a2521]">
              Six crews. Year-round roles. Most volunteers come back the year
              after. Some end up running the whole thing.
            </p>
          </div>
          <div className="md:justify-self-end">
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-7 py-3.5 font-sans text-[14.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404]"
            >
              Apply to join
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

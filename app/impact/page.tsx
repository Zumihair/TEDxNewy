import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PageHero from "@/components/PageHero";
import { getImpactStats } from "@/lib/impact";
import { formatCount } from "@/lib/youtube";

export const metadata = {
  alternates: { canonical: "/impact" },
  title: "Impact · TEDxNewy",
  description:
    "The TEDxNewy community by the numbers. Talks published, students reached, ideas shared, and events held — the tally we're proudest of.",
  robots: { index: false, follow: false },
};

// Recompute at most every 15 minutes; refreshes when admins push new content
// or run "Refresh views" in /admin/talks.
export const revalidate = 900;

export default async function ImpactPage() {
  const s = await getImpactStats();

  return (
    <>
      <PageHero
        kicker="Impact"
        titleTop="The tally"
        titleBottom="we're proudest of."
        intro={
          <>
            TEDxNewy is volunteer-run and community-fed. These are the numbers
            behind what that means — talks published, students reached, ideas
            shared, and stages we&rsquo;ve built with the Hunter.
          </>
        }
      />

      {/* Headline hero stats — the big three */}
      <section className="mx-auto max-w-[1240px] px-5 pb-8 md:px-6 md:pb-12">
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <HeroStat
            value={s.totalViews != null ? formatCount(s.totalViews) : "—"}
            label="YouTube views on Novocastrian ideas"
            note={s.totalViews == null ? "Refreshing soon" : undefined}
          />
          <HeroStat
            value={String(s.totalSubscribers)}
            label="People on the newsletter"
          />
          <HeroStat
            value={String(s.totalTalks)}
            label="Talks in the archive"
          />
        </ul>
      </section>

      {/* Second row — the stage numbers */}
      <section className="mx-auto max-w-[1240px] px-5 pb-16 md:px-6 md:pb-20">
        <SectionEyebrow>On the stage</SectionEyebrow>
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MidStat value={s.totalSpeakers} label="Speakers on the mic" />
          <MidStat value={s.totalEvents} label="Events held" />
          <MidStat value={s.yearsRunning} label="Seasons in the archive" />
          <MidStat value={s.totalTeam} label="Crew running the show" />
        </ul>
      </section>

      {/* Third row — the participation numbers */}
      <section className="bg-[#f9f5ec]">
        <div className="mx-auto max-w-[1240px] px-5 py-16 md:px-6 md:py-24">
          <SectionEyebrow>Voices reaching us</SectionEyebrow>
          <h2
            className="mt-5 max-w-[24ch] font-sans tracking-[-0.025em] text-[#141210] balance"
            style={{
              fontSize: "clamp(1.75rem, 3.4vw, 2.5rem)",
              lineHeight: 1.05,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            Newcastle knocking on the door.
          </h2>
          <p className="mt-4 text-[16px] leading-[1.65] text-[#2a2521]">
            Every year more people put their hand up: to speak, to volunteer, to
            bring a class, to partner with us. These are the numbers behind that
            groundswell.
          </p>

          <ul className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <MidStat
              value={s.totalNominations}
              label="Speaker nominations"
              tone="dark"
            />
            <MidStat
              value={s.totalTalkNightRegistrations}
              label="Talk-Night sign-ups"
              tone="dark"
            />
            <MidStat
              value={s.totalStudentsReached}
              label="Students reached"
              tone="dark"
            />
            <MidStat
              value={s.totalSchools}
              label="Schools engaged"
              tone="dark"
            />
            <MidStat
              value={s.totalVolunteerApplications}
              label="Volunteer applications"
              tone="dark"
            />
            <MidStat
              value={s.totalPartnerEnquiries}
              label="Partnership enquiries"
              tone="dark"
            />
          </ul>
        </div>
      </section>

      {/* Where the ideas live — CTA row */}
      <section className="mx-auto max-w-[1240px] px-5 py-20 md:px-6 md:py-28">
        <SectionEyebrow>Where it lives online</SectionEyebrow>
        <h2
          className="mt-5 max-w-[26ch] font-sans tracking-[-0.025em] text-[#141210] balance"
          style={{
            fontSize: "clamp(1.75rem, 3.4vw, 2.5rem)",
            lineHeight: 1.05,
            fontWeight: 500,
            fontVariationSettings: '"opsz" 144',
          }}
        >
          Every talk. Every speaker. Every idea.
        </h2>
        <p className="mt-4 text-[16px] leading-[1.65] text-[#2a2521]">
          The impact isn&rsquo;t just numbers — it&rsquo;s the ideas themselves.
          Watch them, share them, back them.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <CtaLink href="/talks">Watch the talks</CtaLink>
          <CtaLink href="/speakers">Meet the speakers</CtaLink>
          <CtaLink href="/subscribe">Get the next one</CtaLink>
          <CtaLink href="/partner" tone="secondary">
            Partner with us
          </CtaLink>
        </div>

        {s.computedAt && (
          <p className="mt-14 font-mono text-[10.5px] text-[#6b6459]/70" style={{ letterSpacing: "0.18em" }}>
            Recomputed{" "}
            {new Date(s.computedAt).toLocaleString("en-AU", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            . Updated automatically as new talks, subscribers and stories land.
          </p>
        )}
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
// UI bits (kept inline — this page is the only place they're used)
// ---------------------------------------------------------------------------

function HeroStat({
  value,
  label,
  note,
}: {
  value: string;
  label: string;
  note?: string;
}) {
  return (
    <li className="rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.08)] bg-white p-8 shadow-[var(--shadow-sm)]">
      <div
        className="font-sans font-medium leading-none tracking-[-0.03em] text-[#e02214]"
        style={{
          fontSize: "clamp(3.5rem, 6.5vw, 5.5rem)",
          fontVariationSettings: '"opsz" 144',
        }}
      >
        {value}
      </div>
      <div className="mt-4 text-[15.5px] leading-[1.4] text-[#141210]">
        {label}
      </div>
      {note && (
        <div
          className="mt-3 font-mono text-[10px] font-semibold uppercase text-[#6b6459]/70"
          style={{ letterSpacing: "0.22em" }}
        >
          {note}
        </div>
      )}
    </li>
  );
}

function MidStat({
  value,
  label,
  tone = "light",
}: {
  value: number | string;
  label: string;
  tone?: "light" | "dark";
}) {
  const bg =
    tone === "dark"
      ? "bg-white border-[rgba(20,18,16,0.08)]"
      : "bg-[#f9f5ec] border-[rgba(20,18,16,0.06)]";
  return (
    <li
      className={`rounded-[var(--radius-md)] border ${bg} p-5 md:p-6`}
    >
      <div
        className="font-sans font-medium leading-none tracking-[-0.02em] text-[#141210]"
        style={{
          fontSize: "clamp(1.75rem, 3.2vw, 2.5rem)",
          fontVariationSettings: '"opsz" 144',
        }}
      >
        {typeof value === "number" ? value.toLocaleString("en-AU") : value}
      </div>
      <div className="mt-3 text-[13px] leading-[1.4] text-[#3d342e]">
        {label}
      </div>
    </li>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="font-mono text-[10.5px] font-semibold uppercase text-[#b91404]"
      style={{ letterSpacing: "0.24em" }}
    >
      {children}
    </div>
  );
}

function CtaLink({
  href,
  children,
  tone = "primary",
}: {
  href: string;
  children: React.ReactNode;
  tone?: "primary" | "secondary";
}) {
  const cls =
    tone === "primary"
      ? "bg-[#e02214] text-white hover:bg-[#b91404]"
      : "bg-[rgba(20,18,16,0.06)] text-[#141210] hover:bg-[rgba(20,18,16,0.10)]";
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-medium transition-all hover:-translate-y-0.5 ${cls}`}
    >
      {children}
      <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
    </Link>
  );
}

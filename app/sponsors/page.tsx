import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PageHero from "@/components/PageHero";
import { sponsors, type Sponsor } from "@/lib/data";

export const metadata = {
  title: "Partners · TEDxNewy",
  description:
    "TEDxNewy is supported by partners across the Hunter. Every partner dollar goes into the speakers, the stage, and the next generation of Novocastrian storytellers.",
};

/**
 * Visual presentation of the partner list. Each entry is one display "tier"
 * (one row, two sponsors). Sizing decreases top to bottom so the page reads
 * as a clear hierarchy. Decoupled from `Sponsor.tier` so we can pair, for
 * example, UoN (Presenting) alongside Henderson (Platinum) on the same row
 * without distorting the internal tier data.
 *
 * Names here are matched against `sponsors[].name` from lib/data. If a name
 * is missing or removed, the row silently drops it.
 */
type DisplayTier = {
  /** Inline clamp() size string applied to each sponsor name on this row. */
  nameSize: string;
  /** Sponsor names, in left-to-right order, that fill the row. */
  names: string[];
};

const DISPLAY_TIERS: DisplayTier[] = [
  {
    nameSize: "clamp(2.2rem, 5vw, 3.75rem)",
    names: ["University of Newcastle", "Henderson"],
  },
  {
    nameSize: "clamp(1.65rem, 3.2vw, 2.35rem)",
    names: ["Newy Digital", "Super Radio Network"],
  },
  {
    nameSize: "clamp(1.35rem, 2.6vw, 1.85rem)",
    names: ["Frekl", "Elqo"],
  },
];

function labelFor(s: Sponsor): string {
  return s.partnerType ?? `${s.tier} Partner`;
}

function findByName(name: string): Sponsor | undefined {
  return sponsors.find((s) => s.name === name);
}

export default function SponsorsPage() {
  // Resolve names → Sponsor objects. Skip rows that end up empty so we
  // don't render a divider on its own if every sponsor in a row is missing.
  const tiers = DISPLAY_TIERS.map((t) => ({
    nameSize: t.nameSize,
    sponsors: t.names
      .map(findByName)
      .filter((s): s is Sponsor => Boolean(s)),
  })).filter((t) => t.sponsors.length > 0);

  const isEmpty = tiers.length === 0;

  return (
    <>
      <PageHero
        kicker="Our partners"
        titleTop="Made possible"
        titleBottom="by the Hunter."
        accent="red"
        intro={
          <>
            TEDxNewy is volunteer-run and not-for-profit. Every partner dollar
            goes into the speakers, the stage, and the next generation of
            Novocastrian storytellers.
          </>
        }
      />

      {/* Partner list — three centred rows, two sponsors per row, sized to imply hierarchy. */}
      <section className="mx-auto max-w-[1000px] px-5 pb-20 md:px-6 md:pb-24">
        {isEmpty ? (
          <div className="rounded-[16px] border border-dashed border-[rgba(20,18,16,0.15)] bg-[#f9f5ec] px-6 py-16 text-center">
            <p className="max-w-[44ch] mx-auto text-[15.5px] leading-[1.6] text-[#2a2521]">
              We&rsquo;re lining up the 2026 partner roster now.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[rgba(20,18,16,0.10)]">
            {tiers.map((tier, ti) => (
              <li key={ti} className="py-12 md:py-16">
                <div className="grid grid-cols-1 items-center gap-y-10 sm:grid-cols-2 sm:gap-x-10 md:gap-x-16">
                  {tier.sponsors.map((s) => (
                    <div
                      key={s.name}
                      className="flex flex-col items-center gap-2 text-center"
                    >
                      <div
                        className="font-sans font-medium tracking-[-0.02em] text-[#141210] balance"
                        style={{
                          fontSize: tier.nameSize,
                          lineHeight: 1.04,
                          fontVariationSettings: '"opsz" 144',
                        }}
                      >
                        {s.name}
                      </div>
                      <div
                        className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
                        style={{ letterSpacing: "0.24em" }}
                      >
                        {labelFor(s)}
                      </div>
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Partner with us */}
      <section className="bg-[#f9f5ec]">
        <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
          <div
            className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
            style={{ letterSpacing: "0.24em" }}
          >
            Partner with us
          </div>
          <h2
            className="mt-5 max-w-[28ch] font-sans tracking-[-0.025em] text-[#141210] balance"
            style={{
              fontSize: "clamp(1.85rem, 3.6vw, 2.75rem)",
              lineHeight: 1.05,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            Back the next thinking from the Hunter.
          </h2>
          <p className="mt-5 text-[16px] leading-[1.65] text-[#2a2521]">
            The 2026 season runs four events with an audience that spans rooms
            in Newcastle and a YouTube reach across the TEDx network. Packages
            range from a single Salon presence to multi-event naming rights.
          </p>
          <Link
            href="/partner"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#e02214] px-7 py-3.5 font-sans text-[14.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e02214]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f9f5ec]"
          >
            Request the 2026 partner pack
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </section>
    </>
  );
}

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PageHero from "@/components/PageHero";
import { speakers } from "@/lib/data";

export const metadata = {
  title: "Watch · TEDxNewy",
  description:
    "Talks from TEDxCooksHill (now TEDxNewy) — videos from Reframe (2025) and Beyond Boundaries (2024) are rolling out on YouTube through 2026.",
};

export default function WatchPage() {
  const lineup2025 = speakers.filter((s) => s.year === 2025 && s.image);

  return (
    <>
      <PageHero
        kicker="The talk archive"
        titleTop="Talks rolling out"
        titleBottom="across the year."
        accent="red"
        intro={
          <>
            Videos from <strong>Reframe</strong> (2025, Conservatorium of Music)
            and <strong>Beyond Boundaries</strong> (2024, The Playhouse) are
            being prepared for YouTube — released through 2026 alongside the
            new season.
          </>
        }
      />

      {/* 2025 lineup */}
      <section className="mx-auto max-w-[1100px] px-5 pb-20 md:px-6 md:pb-24">
        <div
          className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
          style={{ letterSpacing: "0.24em" }}
        >
          Reframe · 2025 · Conservatorium of Music
        </div>
        <h2
          className="mt-5 max-w-[24ch] font-sans tracking-[-0.025em] text-[#141210] balance"
          style={{
            fontSize: "clamp(1.75rem, 3.4vw, 2.5rem)",
            lineHeight: 1.05,
            fontWeight: 500,
            fontVariationSettings: '"opsz" 144',
          }}
        >
          Ten speakers, talks coming through 2026.
        </h2>

        <ul className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-5">
          {lineup2025.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/speakers/${s.slug}`}
                className="group block focus-visible:outline-none"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-md)] bg-[#1a1714]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.image!}
                    alt={s.name}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="mt-3 font-sans text-[14px] font-medium leading-tight tracking-[-0.005em] text-[#141210]">
                  {s.name}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Subscribe note */}
      <section className="bg-[#f9f5ec]">
        <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-6 md:py-24">
          <h2
            className="max-w-[28ch] font-sans tracking-[-0.025em] text-[#141210] balance"
            style={{
              fontSize: "clamp(1.6rem, 3vw, 2.25rem)",
              lineHeight: 1.05,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            Be first to know when each talk goes live.
          </h2>
          <Link
            href="/#subscribe"
            className="mt-8 inline-flex items-center gap-1.5 font-sans text-[14.5px] font-medium text-[#e02214]"
          >
            Subscribe on the home page
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </section>
    </>
  );
}

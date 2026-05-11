import { Suspense } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PageHero from "@/components/PageHero";
import { getTalks } from "@/lib/cms-content";
import WatchClient from "./WatchClient";

export const metadata = {
  title: "Watch · TEDxNewy",
  description:
    "Talks from TEDxCooksHill (now TEDxNewy). The full 2024 Beyond Boundaries archive plus 2025 Reframe talks as they roll out on YouTube through 2026.",
};

// Re-fetch from Supabase every 60s so admin edits land live without redeploys
export const revalidate = 60;

export default async function WatchPage() {
  const talks = await getTalks();
  const count2024 = talks.filter((t) => t.year === 2024).length;
  const count2025 = talks.filter((t) => t.year === 2025).length;
  const total = talks.length;

  return (
    <>
      <PageHero
        kicker="The talk archive"
        titleTop="Newcastle ideas,"
        titleBottom="ready to play."
        accent="red"
        intro={
          <>
            Every TEDxCooksHill talk we can share, in one place. The complete{" "}
            <strong>Beyond Boundaries</strong> (2024) archive plus{" "}
            <strong>Reframe</strong> (2025) talks as each one lands on YouTube
            through 2026.
          </>
        }
      />

      {/* Quick count strip — anchors the archive scale */}
      <section className="border-y border-[rgba(20,18,16,0.08)] bg-[#f9f5ec]">
        <div className="mx-auto grid max-w-[1100px] grid-cols-3 divide-x divide-[rgba(20,18,16,0.10)] px-5 md:px-6">
          <CountCell value={total} label="Talks online" />
          <CountCell value={count2025} label="Reframe · 2025" />
          <CountCell value={count2024} label="Beyond Boundaries · 2024" />
        </div>
      </section>

      {/* Talk grid + filter */}
      <section className="mx-auto max-w-[1100px] px-5 pb-24 pt-20 md:px-6 md:pb-32 md:pt-24">
        <Suspense fallback={<div className="min-h-[60vh]" aria-hidden />}>
          <WatchClient talks={talks} />
        </Suspense>
      </section>

      {/* Subscribe nudge */}
      <section className="bg-[#141210] text-white">
        <div className="mx-auto grid max-w-[1100px] gap-10 px-5 py-20 md:grid-cols-[1.4fr_1fr] md:items-center md:gap-16 md:px-6 md:py-24">
          <div>
            <div
              className="font-mono text-[10.5px] font-semibold uppercase text-[#ff6e62]"
              style={{ letterSpacing: "0.24em" }}
            >
              More talks dropping
            </div>
            <h2
              className="mt-5 max-w-[26ch] font-sans tracking-[-0.025em] balance"
              style={{
                fontSize: "clamp(1.65rem, 3.2vw, 2.4rem)",
                lineHeight: 1.04,
                fontWeight: 500,
                fontVariationSettings: '"opsz" 144',
              }}
            >
              Be first to know when each Reframe talk goes live.
            </h2>
            <p className="mt-5 max-w-[58ch] text-[15.5px] leading-[1.65] text-white/75">
              We&rsquo;re publishing the 2025 lineup talk-by-talk through 2026.
              No spam, no sponsor blasts — just a heads-up when a new video
              drops.
            </p>
          </div>
          <div className="md:justify-self-end">
            <Link
              href="/#identity"
              className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-7 py-3.5 font-sans text-[14.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e02214]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141210]"
            >
              Subscribe on the home page
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function CountCell({ value, label }: { value: number; label: string }) {
  return (
    <div className="py-10 text-center md:py-12">
      <div
        className="font-sans font-medium leading-none tracking-[-0.02em] text-[#141210]"
        style={{
          fontSize: "clamp(2.5rem, 5vw, 3.75rem)",
          fontVariationSettings: '"opsz" 144',
        }}
      >
        {value}
      </div>
      <div
        className="mt-3 font-mono text-[10.5px] font-semibold uppercase text-[#6b6459]"
        style={{ letterSpacing: "0.22em" }}
      >
        {label}
      </div>
    </div>
  );
}

import { Suspense } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PageHero from "@/components/PageHero";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import { getSpeakersWithTalks, getTalks } from "@/lib/cms-content";
import SpeakerLineup from "@/components/SpeakerLineup";
import WatchClient from "./WatchClient";

export const metadata = {
  alternates: { canonical: "/talks" },
  title: "Talks · TEDxNewy",
  description:
    "Talks from TEDxCooksHill (now TEDxNewy). The full 2024 Beyond Boundaries archive plus 2025 Reframe talks as they roll out on YouTube through 2026.",
};

// Re-fetch from Supabase every 60s so admin edits land live without redeploys
export const revalidate = 60;

export default async function WatchPage() {
  // Speakers come along so "More about the speaker" inside a talk can open
  // their bio in place, now that the /speakers index is retired.
  const [talks, speakers] = await Promise.all([
    getTalks(),
    getSpeakersWithTalks(),
  ]);
  const count2024 = talks.filter((t) => t.year === 2024).length;
  const count2025 = talks.filter((t) => t.year === 2025).length;
  const total = talks.length;

  return (
    <>
      <BreadcrumbJsonLd name="Talks" path="/talks" />
      <PageHero
        titleTop="The TEDxNewy talk archive."
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

      {/* Archive scale: three quiet cards */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-[1100px] grid-cols-3 gap-2.5 px-5 pt-10 md:gap-4 md:px-6 md:pt-14">
          <CountCell value={total} label="Talks online" />
          <CountCell value={count2025} label="Reframe, 2025" />
          <CountCell value={count2024} label="Beyond Boundaries, 2024" />
        </div>
      </section>

      {/* Talk grid + filter */}
      <section className="mx-auto max-w-[1100px] px-5 pb-24 pt-12 md:px-6 md:pb-32 md:pt-16">
        <SpeakerLineup speakers={speakers}>
          <Suspense fallback={<div className="min-h-[60vh]" aria-hidden />}>
            <WatchClient talks={talks} />
          </Suspense>
        </SpeakerLineup>
      </section>

      {/* Subscribe nudge */}
      <section className="bg-[#000000] text-white">
        <div className="mx-auto grid max-w-[1100px] gap-10 px-5 py-20 md:grid-cols-[1.4fr_1fr] md:items-center md:gap-16 md:px-6 md:py-24">
          <div>
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
            <p className="mt-5 text-[15.5px] leading-[1.65] text-white/75">
              We&rsquo;re publishing the 2025 lineup talk-by-talk through 2026.
              No spam, no sponsor blasts, just a heads-up when a new video
              drops.
            </p>
          </div>
          <div className="md:justify-self-end">
            <Link
              href="/#identity"
              className="btn-red"
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
    <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-[#faf7f2] px-3 py-5 text-center md:px-6 md:py-8">
      <div
        className="font-sans font-medium leading-none tracking-[-0.02em] text-[#000000]"
        style={{ fontSize: "clamp(1.75rem, 4.5vw, 3rem)" }}
      >
        {value}
      </div>
      <div className="mt-2 text-[11.5px] font-medium leading-snug text-[#6b6459] md:mt-3 md:text-[13px]">
        {label}
      </div>
    </div>
  );
}

import { Suspense } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PageHero from "@/components/PageHero";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import { getEvents, getSpeakersWithTalks, getTalks } from "@/lib/cms-content";
import StatBand from "@/components/StatBand";
import { getTotalTalkViews, millions, TED_COM_VIEWS } from "@/lib/talk-views";
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
  const [talks, speakers, events, totalViews] = await Promise.all([
    getTalks(),
    getSpeakersWithTalks(),
    getEvents(),
    getTotalTalkViews(),
  ]);
  const total = talks.length;
  // Same count the mission page uses: every dated event that has already happened.
  const staged = events.filter((e) => e.startsAt && Date.parse(e.startsAt) < Date.now()).length;
  // Same figure as the homepage: the live YouTube total plus Maggie's talk on TED.com.
  const views = totalViews != null ? millions(totalViews + TED_COM_VIEWS) : null;

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

      <StatBand
        items={[
          { value: String(total), label: "Talks online" },
          { value: String(staged), label: "Events staged" },
          ...(views ? [{ value: views.value, suffix: views.suffix, label: "Total views" }] : []),
        ]}
      />

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

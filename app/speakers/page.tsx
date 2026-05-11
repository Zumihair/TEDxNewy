import PageHero from "@/components/PageHero";
import { speakers } from "@/lib/data";
import SpeakersClient from "./SpeakersClient";

export const metadata = {
  title: "Past speakers · TEDxNewy",
  description:
    "Past TEDxNewy speakers — filter by year. 2025: Reframe at the Conservatorium of Music. 2024: Beyond Boundaries at The Playhouse.",
};

export default function SpeakersPage() {
  return (
    <>
      <PageHero
        kicker="Past speakers"
        titleTop="Voices from our stages."
        intro={
          <>
            The lineups from past TEDxNewy events (formerly TEDxCooksHill).
            Filter by year — talk titles and bios publish alongside each
            YouTube release through 2026.
          </>
        }
      />

      <section className="mx-auto max-w-[1100px] px-5 pb-24 md:px-6 md:pb-32">
        <SpeakersClient speakers={speakers} />
      </section>
    </>
  );
}

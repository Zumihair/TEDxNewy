import PageHero from "@/components/PageHero";
import { speakers } from "@/lib/data";
import SpeakersClient from "./SpeakersClient";

export const metadata = {
  title: "2025 Lineup · TEDxNewy",
  description:
    "The 2025 lineup — TEDxCooksHill: Reframe, at the Conservatorium of Music, Newcastle.",
};

export default function SpeakersPage() {
  return (
    <>
      <PageHero
        kicker="Past speakers · Reframe 2025"
        titleTop="Ten speakers from our 2025 stage."
        intro={
          <>
            The lineup that took the stage at the Conservatorium of Music for{" "}
            <strong>Reframe</strong> — our 2025 event under the TEDxCooksHill
            name. Talk titles and bios coming as we publish each video on
            YouTube through 2026.
          </>
        }
      />

      <section className="mx-auto max-w-[1100px] px-5 pb-24 md:px-6 md:pb-32">
        <SpeakersClient speakers={speakers} />
      </section>
    </>
  );
}

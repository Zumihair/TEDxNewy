import { Network, Waves, Scribble } from "@/components/ds";
import type { Motif } from "@/lib/programme-motif";

/** A programme motif drawn behind a card or hero: Network (Newcastle 2050), Waves (60-Second Talk Night), Scribble (Youth Futures Lab). */
export default function ProgrammeMotif({ motif, seed = 7 }: { motif: Motif; seed?: number }) {
  if (motif === "network") return <Network tone="dark" nodes={22} seed={seed} accents={2} animate={false} opacity={0.5} />;
  if (motif === "waves") return <Waves tone="dark" lines={5} amplitude={22} animate={false} opacity={0.5} />;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ opacity: 0.7 }}>
      <Scribble shape="squiggle" tone="dark" width={150} draw={false} style={{ position: "absolute", left: "8%", top: "10%", transform: "rotate(-8deg)" }} />
      <Scribble shape="spark" tone="red" width={46} draw={false} style={{ position: "absolute", right: "12%", top: "14%" }} />
      <Scribble shape="underline" tone="dark" width={130} draw={false} style={{ position: "absolute", right: "10%", bottom: "16%", transform: "rotate(4deg)" }} />
      <Scribble shape="star" tone="dark" width={34} draw={false} style={{ position: "absolute", left: "12%", bottom: "18%" }} />
    </div>
  );
}

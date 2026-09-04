"use client";

import PhotoFill from "@/components/PhotoFill";
import { useSpeakerLineup } from "@/components/SpeakerLineup";
import type { Speaker } from "@/lib/data";
import { Plus } from "lucide-react";

/**
 * Mobile-only speaker "puzzle": the lineup as a tight, tessellated mosaic of
 * square headshots instead of the tall two-column named grid. Tapping a
 * portrait opens that speaker in the shared modal via the surrounding
 * <SpeakerLineup>. Identity is revealed on tap rather than labelled per tile,
 * which is what keeps it compact. Hidden from `sm` up, where the named grid
 * (SignalSpeakerCard) takes over.
 *
 * Tuned for the current six-speaker lineup: six 1x1 portraits plus the 2-wide
 * "and more" teaser fill a 4-column grid exactly (a 4x2 block). A different
 * speaker count would leave a gap in the last row, which is fine but less neat.
 */
export default function SignalSpeakerPuzzle({
  speakers,
}: {
  speakers: Speaker[];
}) {
  const lineup = useSpeakerLineup();

  return (
    <div className="grid grid-cols-4 gap-1.5 sm:hidden">
      {speakers.map((s) => (
        <button
          key={s.slug}
          type="button"
          onClick={() => lineup?.open(s.slug)}
          aria-label={`Read about ${s.name}`}
          className="group relative aspect-square overflow-hidden rounded-[var(--radius-sm)] bg-[#1a0604] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff9b8f]"
        >
          {s.image && (
            <PhotoFill
              src={s.image}
              alt={s.name}
              sizes="25vw"
              className="object-center"
            />
          )}
        </button>
      ))}

      {/* The rest of the lineup (a performer and the acknowledgement), as a
          wide piece that squares off the block. Not tappable: nothing to open. */}
      <div className="col-span-2 flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-dashed border-white/20 bg-white/[0.02] text-white/45">
        <Plus className="h-4 w-4" strokeWidth={1.5} />
        <span className="font-sans text-[12.5px] font-medium">and more</span>
      </div>
    </div>
  );
}

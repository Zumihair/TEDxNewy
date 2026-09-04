"use client";

import PhotoFill from "@/components/PhotoFill";
import { useSpeakerLineup } from "@/components/SpeakerLineup";
import type { Speaker } from "@/lib/data";

/**
 * Signal's own speaker card. Same behaviour as the shared `SpeakerCard` (opens
 * the bio in place via the surrounding `<SpeakerLineup>`), but styled for this
 * page's dark palette rather than the cream event template, which is why it
 * isn't just a variant prop on the shared one.
 */
export default function SignalSpeakerCard({ speaker }: { speaker: Speaker }) {
  const lineup = useSpeakerLineup();

  return (
    <button
      type="button"
      onClick={() => lineup?.open(speaker.slug)}
      aria-label={`Read about ${speaker.name}`}
      className="group block w-full text-left focus-visible:outline-none"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-md)] bg-[#1a0604]">
        {speaker.image && (
          <PhotoFill
            src={speaker.image}
            alt={speaker.name}
            sizes="(min-width: 640px) 22vw, 45vw"
          />
        )}
      </div>
      {/* Reserve two lines for every name (min-h + clamp) so a long one like
          "Professor Kelvin Kong AM" wraps tidily without pushing its tile,
          and every portrait stays in line across the grid. */}
      <div className="mt-3 line-clamp-2 min-h-[2.5em] font-sans text-[14.5px] font-medium leading-tight tracking-[-0.005em] text-white group-hover:text-[#ff9b8f]">
        {speaker.name}
      </div>
    </button>
  );
}

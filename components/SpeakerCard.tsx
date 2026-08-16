"use client";

import PhotoFill from "@/components/PhotoFill";
import { useSpeakerLineup } from "@/components/SpeakerLineup";
import type { Speaker } from "@/lib/data";

/**
 * A speaker's photo, name and role line. Clicking opens their bio, talk video
 * and socials in a modal **on the current page**, via the surrounding
 * `<SpeakerLineup>` (which also puts `?speaker=<slug>` in the URL).
 *
 * Outside a lineup there is nowhere to open, so the card renders as plain
 * content rather than a dead control. Don't reintroduce a link to `/speakers`:
 * that index was retired 2026-08-16 and now redirects to /talks.
 */
export default function SpeakerCard({
  speaker,
}: {
  speaker: Speaker;
  index?: number;
}) {
  const lineup = useSpeakerLineup();

  const body = (
    <>
      <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-md)] bg-[#1a1714]">
        {speaker.image && (
          <PhotoFill
            src={speaker.image}
            alt={speaker.name}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            hoverZoom
          />
        )}
      </div>

      <div className="mt-4">
        <div className="font-sans text-[18px] font-medium leading-tight tracking-[-0.01em] text-[#141210] group-hover:text-[#b91404]">
          {speaker.name}
        </div>
        {!speaker.title.includes("to be added") && (
          <div className="mt-1.5 text-[13.5px] leading-[1.5] text-[#6b6459]">
            {speaker.title}
          </div>
        )}
      </div>
    </>
  );

  if (!lineup) return <div className="block">{body}</div>;

  return (
    <button
      type="button"
      onClick={() => lineup.open(speaker.slug)}
      aria-label={`Read about ${speaker.name}`}
      className="group block w-full text-left focus-visible:outline-none"
    >
      {body}
    </button>
  );
}

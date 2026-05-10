import Link from "next/link";
import PhotoFill from "@/components/PhotoFill";
import type { Speaker } from "@/lib/data";

export default function SpeakerCard({
  speaker,
}: {
  speaker: Speaker;
  index?: number;
}) {
  return (
    <Link
      href={`/speakers/${speaker.slug}`}
      className="group block focus-visible:outline-none"
    >
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
        <div className="font-sans text-[18px] font-medium leading-tight tracking-[-0.01em] text-[#141210] group-hover:text-[#e02214]">
          {speaker.name}
        </div>
        {!speaker.title.includes("to be added") && (
          <div className="mt-1.5 text-[13.5px] leading-[1.5] text-[#6b6459]">
            {speaker.title}
          </div>
        )}
      </div>
    </Link>
  );
}

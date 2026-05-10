"use client";

import { useCallback, useState } from "react";
import PhotoFill from "@/components/PhotoFill";
import SpeakerModal from "@/components/SpeakerModal";
import type { Speaker } from "@/lib/data";

export default function SpeakersClient({ speakers }: { speakers: Speaker[] }) {
  const [index, setIndex] = useState<number | null>(null);

  const close = useCallback(() => setIndex(null), []);
  const prev = useCallback(
    () =>
      setIndex((i) =>
        i === null ? null : (i - 1 + speakers.length) % speakers.length,
      ),
    [speakers.length],
  );
  const next = useCallback(
    () =>
      setIndex((i) => (i === null ? null : (i + 1) % speakers.length)),
    [speakers.length],
  );

  return (
    <>
      <ul className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {speakers.map((s, i) => (
          <li key={s.slug}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="group block w-full text-left focus-visible:outline-none"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-md)] bg-[#1a1714]">
                {s.image && (
                  <PhotoFill
                    src={s.image}
                    alt={s.name}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    hoverZoom
                  />
                )}
              </div>
              <div className="mt-4">
                <div className="font-sans text-[18px] font-medium leading-tight tracking-[-0.01em] text-[#141210] group-hover:text-[#e02214]">
                  {s.name}
                </div>
                {!s.title.includes("to be added") && (
                  <div className="mt-1.5 text-[13.5px] leading-[1.5] text-[#6b6459]">
                    {s.title}
                  </div>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>

      <SpeakerModal
        speakers={speakers}
        index={index}
        onClose={close}
        onPrev={prev}
        onNext={next}
      />
    </>
  );
}

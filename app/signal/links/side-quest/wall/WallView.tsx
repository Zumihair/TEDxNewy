"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "../../TileModal";

type WallPhoto = {
  id: string;
  thumbUrl: string;
  url: string;
  uploadedAt: string;
  firstName: string;
  quest: string;
};

const POLL_MS = 5000;

/**
 * The projector view. Polls the public wall feed every few seconds (no
 * realtime channel: that would need public read policies on the photo table)
 * and shows approved photos in a masonry grid. A photo an admin hides is
 * simply absent from the next poll, so it vanishes within one cycle.
 *
 * Photos that arrive after the first load fade and scale in. The first load
 * and reduced-motion players get no animation at all.
 */
export default function WallView() {
  const [photos, setPhotos] = useState<WallPhoto[]>([]);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const known = useRef<Set<string>>(new Set());
  const first = useRef(true);

  useEffect(() => {
    let live = true;
    let timer: ReturnType<typeof setTimeout>;
    const reduced = prefersReducedMotion();

    const tick = async () => {
      try {
        const res = await fetch("/api/side-quest/wall", { cache: "no-store" });
        const json = (await res.json()) as { photos?: WallPhoto[] };
        if (!live) return;
        const next = json.photos ?? [];
        const added = next
          .filter((p) => !known.current.has(p.id))
          .map((p) => p.id);
        next.forEach((p) => known.current.add(p.id));
        setPhotos(next);
        setLoaded(true);
        if (!first.current && !reduced && added.length > 0) {
          setFresh(new Set(added));
          window.setTimeout(() => live && setFresh(new Set()), 2400);
        }
        first.current = false;
      } catch {
        // Keep the current wall on screen through a dropped connection.
      }
      if (live) timer = setTimeout(tick, POLL_MS);
    };
    tick();
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="min-h-[100dvh] w-full bg-[#0d0503] px-6 pb-10 pt-8 font-sans text-white">
      <header className="mb-6 flex items-end justify-between gap-6">
        <div>
          <p
            className="font-mono text-[12px] font-semibold uppercase text-[#ff9b8f]"
            style={{ letterSpacing: "0.24em" }}
          >
            Signal · Intermission
          </p>
          <h1 className="mt-1 font-sans text-[clamp(2rem,4vw,3.5rem)] font-medium leading-none tracking-[-0.035em]">
            Signal Side Quest photo wall
          </h1>
        </div>
        <p className="font-sans text-[clamp(0.9rem,1.6vw,1.4rem)] text-white/55">
          Scan the code. Play along.
        </p>
      </header>

      {loaded && photos.length === 0 && (
        <p className="mt-24 text-center font-sans text-[clamp(1.2rem,2.4vw,2rem)] text-white/50">
          Photos will appear here as they come in.
        </p>
      )}

      <ul className="columns-2 gap-4 md:columns-3 xl:columns-4 2xl:columns-5 [&>li]:mb-4">
        {photos.map((p) => (
          <li
            key={p.id}
            className="relative break-inside-avoid overflow-hidden rounded-2xl bg-white/5"
            style={
              fresh.has(p.id)
                ? { animation: "sq-wall-in 700ms cubic-bezier(0.2,0.8,0.2,1) both" }
                : undefined
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.url}
              alt={p.quest ? `${p.quest}, by ${p.firstName}` : "Side Quest photo"}
              loading="lazy"
              decoding="async"
              className="block h-auto w-full"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-4 pb-3 pt-10">
              <p className="font-sans text-[15px] font-medium leading-tight">
                {p.firstName}
              </p>
              {p.quest && (
                <p className="mt-0.5 text-[12.5px] text-white/65">{p.quest}</p>
              )}
            </div>
          </li>
        ))}
      </ul>

      <style>{`
        @keyframes sq-wall-in {
          from { opacity: 0; transform: scale(0.94); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { prefersReducedMotion } from "../../TileModal";

type WallPhoto = {
  id: string;
  thumbUrl: string;
  url: string;
  uploadedAt: string;
};

const POLL_MS = 4000;
/** Never show more than this, however big the screen. */
const MAX_TILES = 60;
/** Tiles smaller than this are not worth showing, so older photos drop off. */
const MIN_TILE_PX = 90;
const GAP = 2;
const PAD = 6;
const HEADER_PX = 76;
/** Every tile is 4:5 (portrait), whatever shape the photo was. */
const RATIO = 5 / 4;

type Layout = { cols: number; rows: number; tile: number; count: number };

/** The biggest uniform 4:5 grid of `count` tiles that fits the box. */
function bestLayout(count: number, W: number, H: number): Layout | null {
  let best: (Layout & { empty: number }) | null = null;
  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols);
    // The tile is limited by whichever runs out first, width or height, so a
    // single photo fills the height of the screen instead of being rejected.
    const byWidth = Math.floor((W - GAP * (cols - 1)) / cols);
    const byHeight = Math.floor((H - GAP * (rows - 1)) / rows / RATIO);
    const tile = Math.min(byWidth, byHeight);
    if (tile < 1) continue;
    const empty = rows * cols - count;
    const cand = { cols, rows, tile, count, empty };
    // Prefer the largest tile. Within 4% of it, prefer fewer empty cells in
    // the last row, so the grid does not end on a ragged line when it can
    // avoid it.
    if (
      !best ||
      cand.tile > best.tile * 1.04 ||
      (cand.tile >= best.tile * 0.96 && cand.empty < best.empty)
    ) {
      best = cand;
    }
  }
  return best;
}

function chooseLayout(n: number, W: number, H: number): Layout | null {
  for (let k = Math.min(n, MAX_TILES); k >= 1; k--) {
    const l = bestLayout(k, W, H);
    if (l && (l.tile >= MIN_TILE_PX || k === 1)) return l;
  }
  return null;
}

/**
 * The projector view: only photos. Every photo is cropped to the same 4:5
 * tile with a 2px gap, and the grid is recalculated from the screen size and
 * the number of photos, so a handful of photos fill the screen with big tiles
 * and a crowd of them shrinks to fit without scrolling. New photos fade and
 * scale in; photos already on the wall are never re-animated. It polls the
 * public wall feed (no realtime channel, which would need public read policies
 * on the photo table), so a photo an admin hides is simply absent from the
 * next poll.
 */
export default function WallView() {
  const [photos, setPhotos] = useState<WallPhoto[]>([]);
  const [animated, setAnimated] = useState<Set<string>>(new Set());
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const known = useRef<Set<string>>(new Set());
  const first = useRef(true);

  useEffect(() => {
    const measure = () =>
      setSize({ w: window.innerWidth, h: window.innerHeight });
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

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
        if (!first.current && !reduced && added.length > 0) {
          setAnimated((prev) => new Set([...prev, ...added]));
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

  const layout = useMemo(() => {
    if (!size.w || photos.length === 0) return null;
    const W = size.w - PAD * 2;
    const H = size.h - HEADER_PX - PAD;
    return chooseLayout(photos.length, W, H);
  }, [photos.length, size]);

  const shown = layout ? photos.slice(0, layout.count) : [];
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const useFull = layout ? layout.tile * dpr > 460 : false;

  return (
    <div
      className="flex w-full flex-col overflow-hidden bg-[#0d0503]"
      style={{ height: "100dvh", padding: `0 ${PAD}px ${PAD}px` }}
    >
      <header
        className="flex shrink-0 items-center justify-center"
        style={{ height: HEADER_PX }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/media/TEDxNewy-Standard-white.png"
          alt="TEDxNewy"
          className="h-10 w-auto"
        />
      </header>

      {layout && (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <ul
            className="flex flex-wrap content-start justify-center"
            style={{
              width: layout.cols * layout.tile + GAP * (layout.cols - 1),
              gap: GAP,
            }}
          >
            {shown.map((p) => (
              <li
                key={p.id}
                className="relative overflow-hidden bg-white/5"
                style={{
                  width: layout.tile,
                  height: Math.round(layout.tile * RATIO),
                  transition:
                    "width 500ms ease, height 500ms ease",
                  animation: animated.has(p.id)
                    ? "sq-wall-in 800ms cubic-bezier(0.2,0.8,0.2,1) both"
                    : undefined,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={useFull ? p.url : p.thumbUrl}
                  alt=""
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      <style>{`
        @keyframes sq-wall-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

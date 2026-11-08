"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import PhotoFill from "@/components/PhotoFill";

export type Illustration = { file: string; name: string; topic: string };

/**
 * Horizontal scroll-snap strip of live illustrations. Swipe on phones, drag
 * or trackpad on desktop, plus prev/next buttons. The next card peeks in so
 * it reads as scrollable. Motion is deliberately not gated on
 * prefers-reduced-motion.
 */
export default function IllustrationCarousel({ items }: { items: readonly Illustration[] }) {
  const ref = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const drag = useRef({ down: false, x: 0, left: 0, moved: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update]);

  function step(dir: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    const card = el.querySelector("li");
    const w = card ? card.getBoundingClientRect().width + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * w, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <ul
        ref={ref}
        onScroll={update}
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse" || !ref.current) return;
          drag.current = { down: true, x: e.clientX, left: ref.current.scrollLeft, moved: false };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d.down || !ref.current) return;
          const dx = e.clientX - d.x;
          if (Math.abs(dx) > 5) d.moved = true;
          if (d.moved) {
            ref.current.style.scrollSnapType = "none";
            ref.current.scrollLeft = d.left - dx;
          }
        }}
        onPointerUp={() => {
          drag.current.down = false;
          if (ref.current) ref.current.style.scrollSnapType = "";
        }}
        onPointerLeave={() => {
          drag.current.down = false;
          if (ref.current) ref.current.style.scrollSnapType = "";
        }}
        onClickCapture={(e) => {
          if (drag.current.moved) {
            e.preventDefault();
            drag.current.moved = false;
          }
        }}
        className="carousel-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-5 pb-2 md:mx-0 md:cursor-grab md:px-0"
        style={{ scrollPaddingLeft: 20 }}
        aria-label="Live illustrations from Signal"
      >
        {items.map((item) => (
          <li
            key={item.file}
            className="w-[82%] shrink-0 snap-start md:w-[calc((100%-32px)/2.25)]"
          >
            <a
              href={`/images/signal-illustrations/${item.file}.jpg`}
              target="_blank"
              rel="noreferrer"
              draggable={false}
              className="block"
            >
              <div className="relative aspect-video w-full overflow-hidden rounded-[var(--radius-md)] bg-white">
                <PhotoFill
                  src={`/images/signal-illustrations/${item.file}.jpg`}
                  alt={`Live illustration of ${item.name}'s talk: ${item.topic.toLowerCase()}`}
                  sizes="(min-width: 1100px) 480px, (min-width: 768px) 45vw, 82vw"
                  hoverZoom={false}
                />
              </div>
            </a>
            <div className="mt-3 text-[17px] font-medium tracking-[-0.01em] text-[#000000]">
              {item.name}
            </div>
            <p className="mt-1 text-[14.5px] leading-[1.55] text-[#2a2521]">{item.topic}</p>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={!canPrev}
          aria-label="Previous illustration"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-black/15 bg-white text-black transition disabled:opacity-35"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          disabled={!canNext}
          aria-label="Next illustration"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-black/15 bg-white text-black transition disabled:opacity-35"
        >
          <ArrowRight className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

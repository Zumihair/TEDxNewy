"use client";

/**
 * Inline page-by-page viewer for the Event Week Guide, inside its modal.
 *
 * Will was explicit this must NOT be a PDF download or a browser PDF
 * viewer: it needs to actually be viewable inside this page. The guide is a
 * fixed, print-designed 9-page layout (see the build note below), so
 * re-flowing it as HTML would fight the design rather than show it, and a
 * page-image gallery is the sensible fit. Each page was rendered from the
 * source PDF with PyMuPDF at ~1600px wide and saved as webp
 * (`public/images/event-week-guide/page-<n>.webp`, ~100-280KB each, 1.7MB
 * total for all nine pages versus the 13.8MB source PDF).
 *
 * Source: `1. Business/TEDx/2026/Partnerships/Make the Most of Event Week
 * Guide/Web Guide/Make the Most of Event Week Guide.pdf`. Re-run the same
 * PyMuPDF render if that PDF is rebuilt.
 *
 * No pinch-zoom beyond the browser's native pinch-to-zoom on the image
 * itself, per the brief. Swipe left/right on touch, tap the side edges or
 * the arrows to advance, arrow keys work too.
 */

import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_COUNT = 9;
const PAGES = Array.from(
  { length: PAGE_COUNT },
  (_, i) => `/images/event-week-guide/page-${i + 1}.webp`,
);

export default function GuideGallery() {
  const [page, setPage] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const goTo = (next: number) => {
    setPage(Math.max(0, Math.min(PAGE_COUNT - 1, next)));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) goTo(page + 1);
    else goTo(page - 1);
  };

  return (
    <div
      className="flex flex-col"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") goTo(page + 1);
        if (e.key === "ArrowLeft") goTo(page - 1);
      }}
      tabIndex={0}
    >
      <div
        className="relative aspect-[1600/2265] w-full overflow-hidden rounded-[var(--radius-md)] bg-black/40"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <Image
          key={page}
          src={PAGES[page]}
          alt={`Event Week Guide, page ${page + 1} of ${PAGE_COUNT}`}
          fill
          sizes="(min-width: 640px) 480px, 100vw"
          className="object-contain"
          priority={page === 0}
        />

        {/* Invisible tap zones, big enough for a thumb, alongside the
            visible arrow buttons: either works. */}
        {page > 0 && (
          <button
            type="button"
            aria-label="Previous page"
            onClick={() => goTo(page - 1)}
            className="absolute inset-y-0 left-0 w-1/4"
          />
        )}
        {page < PAGE_COUNT - 1 && (
          <button
            type="button"
            aria-label="Next page"
            onClick={() => goTo(page + 1)}
            className="absolute inset-y-0 right-0 w-1/4"
          />
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => goTo(page - 1)}
          disabled={page === 0}
          aria-label="Previous page"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-white/80 transition-colors hover:bg-white/[0.12] disabled:opacity-30"
        >
          <ChevronLeft className="h-4.5 w-4.5" strokeWidth={2} />
        </button>

        <div
          className="tabular text-[12.5px] font-medium uppercase tracking-[0.08em] text-white/55"
        >
          Page {page + 1} of {PAGE_COUNT}
        </div>

        <button
          type="button"
          onClick={() => goTo(page + 1)}
          disabled={page === PAGE_COUNT - 1}
          aria-label="Next page"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-white/80 transition-colors hover:bg-white/[0.12] disabled:opacity-30"
        >
          <ChevronRight className="h-4.5 w-4.5" strokeWidth={2} />
        </button>
      </div>

      {/* Page dots, wraps on 9. Tapping jumps straight there. */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
        {PAGES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to page ${i + 1}`}
            onClick={() => goTo(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === page ? "w-5 bg-[#ff9b8f]" : "w-1.5 bg-white/25"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

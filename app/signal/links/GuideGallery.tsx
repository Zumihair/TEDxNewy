"use client";

/**
 * Inline page-by-page viewer for the Event Week Guide, inside its modal.
 *
 * Will was explicit this must NOT be a PDF download or a browser PDF
 * viewer: it needs to actually be viewable inside this page. The guide is a
 * fixed, print-designed 9-page layout (see the build note below), so
 * re-flowing it as HTML would fight the design rather than show it, and a
 * page-image gallery is the sensible fit. Each page was rendered from the
 * source PDF with PyMuPDF at 1400px wide and saved as webp (quality 78,
 * `public/images/event-week-guide/page-<n>.webp`, ~40-205KB each, 1.26MB
 * total for all nine pages versus the 13.8MB source PDF). 1400px covers a
 * roughly 2.5x DPR device at this modal's ~560px max width, so there's no
 * real headroom left to trim without visible softening at typical viewing
 * size; the file-size lever that matters more is per-device delivery,
 * which is what the two points below are about.
 *
 * Source: `1. Business/TEDx/2026/Partnerships/Make the Most of Event Week
 * Guide/Web Guide/Make the Most of Event Week Guide.pdf`. Re-run the same
 * PyMuPDF render (1400px wide) if that PDF is rebuilt.
 *
 * **Responsive delivery.** The `<Image>` below goes through next/image
 * (`next.config.js` has no `images.unoptimized`), so each page is actually
 * re-encoded and served at whatever width the visiting device needs via
 * `/_next/image?...&w=<deviceSize>` — a phone gets a ~420-640px variant,
 * not the full 1400px original. That was already true before this pass;
 * confirmed by inspecting the real request URL under mobile emulation
 * rather than assumed.
 *
 * **Preloading: current + immediate neighbours only, not all nine.** A
 * prior pass warmed the browser cache for all 9 pages the moment the link
 * tree loaded, on the theory that pre-fetched images can't cause jank when
 * a modal opens. That fetched all nine RAW originals directly (bypassing
 * next/image's resizing, since a plain `new Image()` always requests the
 * literal `src` given), which worked against "loads quickly" on mobile
 * data exactly as flagged: up to 1.26MB of network traffic before anyone
 * had even opened the Guide. That eager whole-gallery preload was removed;
 * this component instead renders two invisible, correctly-sized
 * `next/image` prefetch tags for the pages either side of whichever one is
 * showing, so flipping a page one at a time is instant, but the other six
 * or seven pages are never fetched until they're actually needed.
 *
 * No pinch-zoom beyond the browser's native pinch-to-zoom on the image
 * itself, per the brief. Swipe left/right on touch, tap the side edges or
 * the arrows to advance, arrow keys work too. `touch-action: pan-y` on the
 * swipeable box tells the browser upfront that horizontal gestures here are
 * ours to handle and vertical ones should pass straight through to native
 * scroll, rather than the browser spending a frame or two disambiguating a
 * touch's intent, which reads as a small stutter right as a swipe starts.
 */

import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_COUNT = 9;

// Exported so LinksExperience's speaker/sponsor preload effect can stay
// scoped to just those — the Guide's own pages are intentionally NOT in a
// sitewide eager-preload list any more (see file note above).
export const GUIDE_PAGES = Array.from(
  { length: PAGE_COUNT },
  (_, i) => `/images/event-week-guide/page-${i + 1}.webp`,
);

const IMAGE_SIZES = "(min-width: 640px) 480px, 100vw";

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
        className="relative aspect-[1400/1982] w-full overflow-hidden rounded-[var(--radius-md)] bg-black/40"
        style={{ touchAction: "pan-y" }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <Image
          key={page}
          src={GUIDE_PAGES[page]}
          alt={`Event Week Guide, page ${page + 1} of ${PAGE_COUNT}`}
          fill
          sizes={IMAGE_SIZES}
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

      {/* Hidden prefetch for the immediate neighbours only (see file note).
          Real <Image> tags so they go through the same optimizer/size
          negotiation as the visible one, just never painted. */}
      {page > 0 && (
        <Image
          src={GUIDE_PAGES[page - 1]}
          alt=""
          width={1}
          height={1}
          sizes={IMAGE_SIZES}
          style={{ display: "none" }}
          aria-hidden
        />
      )}
      {page < PAGE_COUNT - 1 && (
        <Image
          src={GUIDE_PAGES[page + 1]}
          alt=""
          width={1}
          height={1}
          sizes={IMAGE_SIZES}
          style={{ display: "none" }}
          aria-hidden
        />
      )}

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

        <div className="tabular text-[12.5px] font-medium uppercase tracking-[0.08em] text-white/55">
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
    </div>
  );
}

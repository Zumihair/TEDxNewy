"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Download, X } from "lucide-react";
import type { EventPhoto } from "@/lib/cms-content";

export default function PhotoGallery({
  photos,
  eventTitle,
}: {
  photos: EventPhoto[];
  eventTitle: string;
}) {
  const [index, setIndex] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = index !== null;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIndex(null);
      else if (e.key === "ArrowLeft") setIndex((i) => (i === null ? i : (i - 1 + photos.length) % photos.length));
      else if (e.key === "ArrowRight") setIndex((i) => (i === null ? i : (i + 1) % photos.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, photos.length]);

  const current = index !== null ? photos[index] : null;

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Open photo ${i + 1} of ${photos.length}`}
            className="group relative aspect-square overflow-hidden rounded-[var(--radius-md)] bg-[#1a1714] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e02214]/50"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.thumbUrl}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            />
          </button>
        ))}
      </div>

      {open && current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${eventTitle} photo, ${index! + 1} of ${photos.length}`}
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 md:p-10"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setIndex(null)}
            className="absolute inset-0 cursor-default bg-[#141210]/90 backdrop-blur-sm"
          />

          <button
            type="button"
            ref={closeRef}
            onClick={() => setIndex(null)}
            aria-label="Close"
            className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:right-5 sm:top-5"
          >
            <X className="h-5 w-5" strokeWidth={2.5} />
          </button>

          <a
            href={current.url}
            download
            aria-label="Download this photo"
            className="absolute left-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:left-5 sm:top-5"
          >
            <Download className="h-4.5 w-4.5" strokeWidth={2.25} />
          </a>

          <button
            type="button"
            onClick={() => setIndex((i) => (i === null ? i : (i - 1 + photos.length) % photos.length))}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-black/40 p-2.5 text-white transition-colors hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:flex md:left-5"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => (i === null ? i : (i + 1) % photos.length))}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-black/40 p-2.5 text-white transition-colors hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:flex md:right-5"
          >
            <ArrowRight className="h-5 w-5" strokeWidth={2.25} />
          </button>

          <div className="relative z-[5] flex max-h-full max-w-full items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={current.id}
              src={current.url}
              alt={`${eventTitle}, photo ${index! + 1} of ${photos.length}`}
              className="max-h-[86vh] max-w-full rounded-[var(--radius-sm)] object-contain shadow-[0_20px_80px_rgba(0,0,0,0.5)]"
            />
          </div>

          <div
            className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 font-mono text-[11px] font-medium uppercase text-white/70"
            style={{ letterSpacing: "0.18em" }}
          >
            {index! + 1} / {photos.length}
          </div>

          {/* Mobile prev/next: tap zones on either edge of the image */}
          <button
            type="button"
            onClick={() => setIndex((i) => (i === null ? i : (i - 1 + photos.length) % photos.length))}
            aria-label="Previous photo"
            className="absolute inset-y-0 left-0 z-[4] w-1/4 sm:hidden"
          />
          <button
            type="button"
            onClick={() => setIndex((i) => (i === null ? i : (i + 1) % photos.length))}
            aria-label="Next photo"
            className="absolute inset-y-0 right-0 z-[4] w-1/4 sm:hidden"
          />
        </div>
      )}
    </>
  );
}

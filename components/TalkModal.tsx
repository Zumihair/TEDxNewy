"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, X } from "lucide-react";
import type { Talk } from "@/lib/data";

type Props = {
  talks: Talk[];
  /** Index into `talks`; null = closed. */
  index: number | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
};

const eventVenue = (year: number) =>
  year === 2025
    ? "Conservatorium of Music · October 2025"
    : year === 2024
    ? "The Playhouse · October 2024"
    : `Newcastle · ${year}`;

export default function TalkModal({
  talks,
  index,
  onClose,
  onPrev,
  onNext,
}: Props) {
  const open = index !== null;
  const talk = open ? talks[index] : null;
  const closeRef = useRef<HTMLButtonElement>(null);

  // Lock body scroll while open + autofocus close button
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Keyboard: Escape closes, arrows navigate
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") onPrev();
      else if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, onPrev, onNext]);

  if (!open || !talk) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="talk-modal-title"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 md:p-10"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[#141210]/82 backdrop-blur-md"
      />

      {/* Card */}
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-[1080px] flex-col overflow-hidden rounded-[var(--radius-lg)] bg-[#141210] text-white shadow-[0_30px_120px_rgba(20,18,16,0.55)]">
        {/* YouTube embed */}
        <div className="relative aspect-video w-full bg-black">
          <iframe
            key={talk.id}
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${talk.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
            title={`${talk.title} — ${talk.speaker}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>

        {/* Body */}
        <div className="relative overflow-y-auto px-6 py-7 md:px-10 md:py-9">
          <button
            type="button"
            ref={closeRef}
            onClick={onClose}
            aria-label="Close talk"
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e02214]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141210] md:right-6 md:top-6"
          >
            <X className="h-4 w-4" strokeWidth={2.25} />
          </button>

          <div
            className="font-mono text-[10.5px] font-semibold uppercase text-[#ff6e62]"
            style={{ letterSpacing: "0.24em" }}
          >
            {talk.event} · {talk.year}
          </div>

          <h2
            id="talk-modal-title"
            className="mt-3 font-sans tracking-[-0.02em] text-white balance"
            style={{
              fontSize: "clamp(1.5rem, 2.8vw, 2.1rem)",
              lineHeight: 1.08,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            {talk.title}
          </h2>

          <div className="mt-2 text-[15px] font-medium text-white/80">
            {talk.speaker}
          </div>

          <div
            className="mt-2 font-mono text-[10.5px] font-semibold uppercase text-white/50"
            style={{ letterSpacing: "0.22em" }}
          >
            {eventVenue(talk.year)}
          </div>

          {talk.blurb && (
            <p className="mt-5 max-w-[68ch] text-[15px] leading-[1.65] text-white/80">
              {talk.blurb}
            </p>
          )}

          {/* Actions row */}
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <a
              href={`https://www.youtube.com/watch?v=${talk.youtubeId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-white/80 transition-colors hover:text-white"
            >
              Open on YouTube
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.25} />
            </a>
            {talk.speakerSlug && (
              <Link
                href={`/speakers/${talk.speakerSlug}`}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[#ff9b8f] transition-colors hover:text-white"
              >
                More about the speaker
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} />
              </Link>
            )}
          </div>

          {/* Prev / next */}
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-white/12 pt-5">
            <button
              type="button"
              onClick={onPrev}
              className="inline-flex items-center gap-2 text-[13.5px] font-medium text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e02214]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141210]"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
              Previous
            </button>
            <div
              className="font-mono text-[10.5px] font-semibold uppercase text-white/50"
              style={{ letterSpacing: "0.22em" }}
            >
              {String((index ?? 0) + 1).padStart(2, "0")} /{" "}
              {String(talks.length).padStart(2, "0")}
            </div>
            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center gap-2 text-[13.5px] font-medium text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e02214]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141210]"
            >
              Next
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

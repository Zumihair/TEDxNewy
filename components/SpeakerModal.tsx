"use client";

import { useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import PhotoFill from "./PhotoFill";
import type { Speaker } from "@/lib/data";

type Props = {
  speakers: Speaker[];
  /** Index into `speakers`; null = closed. */
  index: number | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
};

const eventLabelFor = (year: number) =>
  year === 2025
    ? "Reframe · TEDxCooksHill"
    : year === 2024
    ? "Beyond Boundaries · TEDxCooksHill"
    : `TEDxNewy · ${year}`;
const venueLabelFor = (year: number) =>
  year === 2025
    ? "Conservatorium of Music · October 2025"
    : year === 2024
    ? "The Playhouse · October 2024"
    : "Newcastle";

export default function SpeakerModal({
  speakers,
  index,
  onClose,
  onPrev,
  onNext,
}: Props) {
  const open = index !== null;
  const speaker = open ? speakers[index] : null;
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

  if (!open || !speaker) return null;

  const titleClean = speaker.title.includes("to be added") ? "" : speaker.title;
  const talkClean = speaker.talk.includes("to be added") ? "" : speaker.talk;
  const blurbClean = speaker.blurb.includes("to be added") ? "" : speaker.blurb;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="speaker-modal-name"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 md:p-10"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[#141210]/72 backdrop-blur-sm"
      />

      {/* Card */}
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-[1080px] flex-col overflow-hidden rounded-[var(--radius-lg)] bg-white shadow-[0_30px_120px_rgba(20,18,16,0.40)] md:flex-row">
        {/* Photo */}
        <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden bg-[#1a1714] md:aspect-auto md:w-[44%] md:max-w-[480px]">
          {speaker.image && (
            <PhotoFill
              src={speaker.image}
              alt={speaker.name}
              sizes="(max-width: 768px) 100vw, 480px"
              priority
              hoverZoom={false}
            />
          )}
        </div>

        {/* Body */}
        <div className="relative flex-1 overflow-y-auto px-6 py-8 md:px-10 md:py-12">
          <button
            type="button"
            ref={closeRef}
            onClick={onClose}
            aria-label="Close speaker"
            className="absolute right-5 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(20,18,16,0.06)] text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e02214]/40 focus-visible:ring-offset-2 md:right-7 md:top-7"
          >
            <X className="h-4 w-4" strokeWidth={2.25} />
          </button>

          <div
            className="text-[10.5px] font-semibold uppercase text-[#e02214]"
            style={{ letterSpacing: "0.24em" }}
          >
            {eventLabelFor(speaker.year)}
          </div>

          <h2
            id="speaker-modal-name"
            className="mt-3 font-sans tracking-[-0.02em] text-[#141210] balance"
            style={{
              fontSize: "clamp(1.85rem, 3.4vw, 2.6rem)",
              lineHeight: 1.04,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            {speaker.name}
          </h2>

          {titleClean && (
            <p className="mt-3 max-w-[55ch] text-[15.5px] leading-[1.55] text-[#2a2521]">
              {titleClean}
            </p>
          )}

          <div
            className="mt-3 text-[10.5px] font-semibold uppercase text-[#6b6459]"
            style={{ letterSpacing: "0.22em" }}
          >
            {venueLabelFor(speaker.year)}
          </div>

          {(talkClean || blurbClean) && (
            <div className="mt-7 border-t border-[rgba(20,18,16,0.10)] pt-7">
              <div
                className="text-[10.5px] font-semibold uppercase text-[#e02214]"
                style={{ letterSpacing: "0.24em" }}
              >
                The talk
              </div>
              {talkClean && (
                <h3
                  className="mt-3 font-sans italic tracking-[-0.015em] text-[#141210]"
                  style={{
                    fontSize: "clamp(1.25rem, 2.2vw, 1.65rem)",
                    lineHeight: 1.15,
                    fontWeight: 500,
                    fontVariationSettings: '"opsz" 96',
                  }}
                >
                  &ldquo;{talkClean}&rdquo;
                </h3>
              )}
              {blurbClean && (
                <p className="mt-4 text-[15.5px] leading-[1.65] text-[#2a2521]">
                  {blurbClean}
                </p>
              )}
            </div>
          )}

          {!talkClean && !blurbClean && (
            <p className="mt-7 max-w-[55ch] border-t border-[rgba(20,18,16,0.10)] pt-7 text-[14.5px] leading-[1.6] text-[#6b6459]">
              Talk title and full bio publish alongside the YouTube release.
            </p>
          )}

          {/* Prev / next */}
          <div className="mt-10 flex items-center justify-between gap-3 border-t border-[rgba(20,18,16,0.10)] pt-6">
            <button
              type="button"
              onClick={onPrev}
              className="inline-flex items-center gap-2 text-[13.5px] font-medium text-[#141210] transition-colors hover:text-[#e02214] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e02214]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
              Previous
            </button>
            <div
              className="text-[10.5px] font-semibold uppercase text-[#6b6459]"
              style={{ letterSpacing: "0.22em" }}
            >
              {String((index ?? 0) + 1).padStart(2, "0")} / {String(speakers.length).padStart(2, "0")}
            </div>
            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center gap-2 text-[13.5px] font-medium text-[#141210] transition-colors hover:text-[#e02214] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e02214]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
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

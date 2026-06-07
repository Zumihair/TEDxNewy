"use client";

import { useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import PhotoFill from "./PhotoFill";
import type { SpeakerWithTalk } from "@/lib/cms-content";

type Props = {
  speakers: SpeakerWithTalk[];
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

const clean = (v: string | undefined) =>
  v && !v.includes("to be added") ? v : "";

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

  const titleClean = clean(speaker.title);
  const bioClean = clean(speaker.blurb);
  const firstName = speaker.name.split(" ")[0];

  const talk = speaker.linkedTalk;
  const talkTitle = talk?.title ?? clean(speaker.talk);
  const talkBlurb = talk?.blurb ?? "";
  const youtubeId = talk?.youtubeId;
  const hasTalk = Boolean(talkTitle || youtubeId);

  const socials = [
    speaker.linkedinUrl
      ? { label: "LinkedIn", href: speaker.linkedinUrl, Icon: LinkedInIcon }
      : null,
    speaker.instagramUrl
      ? { label: "Instagram", href: speaker.instagramUrl, Icon: InstagramIcon }
      : null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="speaker-modal-name"
      className="fixed inset-0 z-[60] flex items-stretch justify-center sm:items-center sm:p-6 md:p-10"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[#141210]/72 backdrop-blur-sm"
      />

      {/* Card */}
      <div className="relative z-10 flex max-h-full w-full max-w-[1000px] flex-col overflow-hidden bg-white shadow-[0_30px_120px_rgba(20,18,16,0.40)] sm:max-h-[92vh] sm:rounded-[var(--radius-lg)] md:flex-row">
        {/* Photo — 3:2 banner on mobile, 4:5 portrait centred in a panel on
            desktop, so the headshot keeps a clean ratio instead of stretching. */}
        <div className="relative w-full shrink-0 overflow-hidden bg-[#1a1714] md:flex md:w-[40%] md:max-w-[400px] md:items-center">
          <div className="relative aspect-[3/2] w-full md:aspect-[4/5]">
            {speaker.image && (
              <PhotoFill
                src={speaker.image}
                alt={speaker.name}
                sizes="(max-width: 768px) 100vw, 400px"
                priority
                hoverZoom={false}
                className="object-top"
              />
            )}
          </div>
        </div>

        {/* Body */}
        <div className="relative flex-1 overflow-y-auto px-6 py-8 md:px-10 md:py-11">
          <button
            type="button"
            ref={closeRef}
            onClick={onClose}
            aria-label="Close speaker"
            className="absolute right-5 top-5 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(20,18,16,0.06)] text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e02214]/40 focus-visible:ring-offset-2 md:right-7 md:top-7"
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
            className="mt-3 pr-10 font-sans tracking-[-0.02em] text-[#141210] balance"
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

          {/* Socials — in the header, under the name */}
          {socials.length > 0 && (
            <div className="mt-5 flex items-center gap-2.5">
              {socials.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${speaker.name} on ${label}`}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(20,18,16,0.15)] text-[#6b6459] transition-colors hover:border-[#141210] hover:bg-[#141210] hover:text-white"
                >
                  <Icon />
                </a>
              ))}
            </div>
          )}

          <div
            className="mt-5 text-[10.5px] font-semibold uppercase text-[#6b6459]"
            style={{ letterSpacing: "0.22em" }}
          >
            {venueLabelFor(speaker.year)}
          </div>

          {/* The talk — video player + title + blurb */}
          {hasTalk && (
            <div className="mt-7 border-t border-[rgba(20,18,16,0.10)] pt-7">
              <div
                className="text-[10.5px] font-semibold uppercase text-[#e02214]"
                style={{ letterSpacing: "0.24em" }}
              >
                The talk
              </div>
              {talkTitle && (
                <h3
                  className="mt-3 font-sans italic tracking-[-0.015em] text-[#141210]"
                  style={{
                    fontSize: "clamp(1.25rem, 2.2vw, 1.6rem)",
                    lineHeight: 1.15,
                    fontWeight: 500,
                    fontVariationSettings: '"opsz" 96',
                  }}
                >
                  &ldquo;{talkTitle}&rdquo;
                </h3>
              )}
              {youtubeId && (
                <div className="relative mt-5 aspect-video w-full overflow-hidden rounded-[var(--radius-md)] bg-black">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
                    title={talkTitle || speaker.name}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                    className="absolute inset-0 h-full w-full"
                  />
                </div>
              )}
              {talkBlurb && (
                <p className="mt-4 text-[15.5px] leading-[1.65] text-[#2a2521]">
                  {talkBlurb}
                </p>
              )}
            </div>
          )}

          {/* About — the speaker bio */}
          {bioClean && (
            <div className="mt-7 border-t border-[rgba(20,18,16,0.10)] pt-7">
              <div
                className="text-[10.5px] font-semibold uppercase text-[#e02214]"
                style={{ letterSpacing: "0.24em" }}
              >
                About {firstName}
              </div>
              <p className="mt-3 text-[15.5px] leading-[1.65] text-[#2a2521]">
                {bioClean}
              </p>
            </div>
          )}

          {!hasTalk && !bioClean && (
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
              {String((index ?? 0) + 1).padStart(2, "0")} /{" "}
              {String(speakers.length).padStart(2, "0")}
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

function LinkedInIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.6" cy="6.4" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  );
}

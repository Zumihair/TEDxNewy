"use client";

import { useState, useRef } from "react";
import { Play } from "lucide-react";

type Props = {
  src: string;
  /** Optional poster image (extracted frame). */
  poster?: string;
  /** Aspect ratio class, e.g. "aspect-[16/9]". */
  aspect?: string;
  /** Caption shown below the video. */
  caption?: string;
};

/**
 * Click-to-play recap video. Defers loading until the user clicks the
 * play button (`preload="none"`), so heavy files don't auto-download.
 */
export default function RecapVideo({
  src,
  poster,
  aspect = "aspect-[16/9]",
  caption,
}: Props) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const start = () => {
    setPlaying(true);
    // Give React a tick to render the <video>, then play
    setTimeout(() => {
      videoRef.current?.play().catch(() => {
        /* autoplay may be blocked; user can click the native control */
      });
    }, 0);
  };

  return (
    <figure>
      <div
        className={`relative ${aspect} w-full overflow-hidden rounded-[var(--radius-md)] bg-[#0a0908]`}
      >
        {!playing ? (
          <button
            type="button"
            onClick={start}
            aria-label="Play recap video"
            className="group absolute inset-0 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e02214]/40 focus-visible:ring-offset-2"
          >
            {poster && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={poster}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <span className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-[#e02214] text-white shadow-[0_18px_60px_rgba(224,34,20,0.35)] transition-transform duration-300 group-hover:scale-110 md:h-24 md:w-24">
              <Play
                className="ml-1 h-8 w-8 fill-current md:h-9 md:w-9"
                strokeWidth={0}
              />
            </span>
          </button>
        ) : (
          <video
            ref={videoRef}
            src={src}
            className="absolute inset-0 h-full w-full"
            controls
            playsInline
            preload="auto"
          />
        )}
      </div>
      {caption && (
        <figcaption className="mt-4 text-[14px] leading-[1.5] text-[#6b6459]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

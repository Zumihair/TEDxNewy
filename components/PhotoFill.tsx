"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  quality?: number;
  /** CSS mix-blend-mode applied to the image (preserves the spotlight overlays on door rows). */
  blendMode?: "normal" | "multiply" | "screen" | "luminosity" | "overlay";
  /** Static opacity (the door rows dim their photo behind the red spotlight). */
  opacity?: number;
  /** Group-hover scale. Set false on door rows where the panel doesn't zoom. */
  hoverZoom?: boolean;
  className?: string;
};

/**
 * Fills its (positioned) parent with an optimised <Image>. If the file is
 * missing, hides itself so the parent's gradient fallback shows through.
 */
export default function PhotoFill({
  src,
  alt,
  sizes,
  priority,
  quality = 80,
  blendMode = "normal",
  opacity = 1,
  hoverZoom = true,
  className,
}: Props) {
  const [missing, setMissing] = useState(false);
  if (missing) return null;

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      quality={quality}
      onError={() => setMissing(true)}
      className={`object-cover ${
        hoverZoom ? "transition-transform duration-700 group-hover:scale-[1.03]" : ""
      } ${className ?? ""}`}
      style={{ mixBlendMode: blendMode, opacity }}
    />
  );
}

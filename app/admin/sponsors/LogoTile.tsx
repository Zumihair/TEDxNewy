"use client";

import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";

/**
 * A logo on a neutral tile. Logos that are mostly white would vanish on white, so the
 * tile reads the image once and switches to black behind a pale logo.
 */
export default function LogoTile({ src, size = 48 }: { src: string | null; size?: number }) {
  const [pale, setPale] = useState(false);

  useEffect(() => {
    setPale(false);
    if (!src) return;
    let dead = false;
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = 32;
        c.height = 32;
        const ctx = c.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(im, 0, 0, 32, 32);
        const d = ctx.getImageData(0, 0, 32, 32).data;
        let sum = 0;
        let n = 0;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] < 40) continue;
          sum += (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
          n++;
        }
        if (!dead && n > 0 && sum / n > 0.8) setPale(true);
      } catch {
        /* a blocked read just leaves the light tile */
      }
    };
    im.src = src;
    return () => {
      dead = true;
    };
  }, [src]);

  return (
    <span className={"adm-logotile" + (pale ? " is-dark" : "")} style={{ width: size, height: size }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" />
      ) : (
        <Building2 className="h-4 w-4" strokeWidth={2} />
      )}
    </span>
  );
}

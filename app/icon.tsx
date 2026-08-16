import { ImageResponse } from "next/og";

export const contentType = "image/png";

/**
 * Browser tab icon: a bold white X in a red dot, matching the circular avatar
 * the socials use.
 *
 * **Three sizes are emitted, on purpose.** A single 32px icon looked
 * off-centre in a Windows tab strip even though the file measured dead
 * centre: at 125%/150% display scaling the browser squeezes 32px into a 20 or
 * 24px slot, and that fractional resample lands the four arms on different
 * subpixel boundaries, so one side picks up more ink than the other. Shipping
 * 16 / 32 / 48 gives an exact or 2:1 match for 100%, 125%, 150% and 200%
 * scaling, so the browser rarely has to invent pixels. Don't collapse this
 * back to one size.
 *
 * **The X is drawn as two rotated bars, not typed as a character.** A text
 * glyph was tried first and was wrong twice over: a lowercase "x" sits
 * between the baseline and the x-height, so it rendered ~3px low in the
 * circle, and the centring used the text's advance width (which includes
 * trailing letter-spacing), so it also sat right of centre. Bars are
 * positioned by arithmetic instead, so the mark is exactly centred, and the
 * thickness is a number we control rather than whatever weight the fallback
 * font happens to have. Don't "simplify" this back to a character.
 *
 * Two constraints if you change the ratios:
 *
 *  - Keep the bar's half-diagonal (`hypot(w, h) / 2`) under the circle radius
 *    (`size / 2`), or the corners poke outside the red into the transparent
 *    corners. `border-radius` does not clip children, so nothing trims an
 *    oversized mark for you.
 *  - **Keep every derived width and height EVEN.** `left`/`top` are
 *    `(size - bar) / 2`, so an odd bar lands on a half pixel and antialiasing
 *    drags the mark off centre. Measured at 32px: bar height 7 renders 0.48px
 *    low, height 8 renders dead centre. `evenly()` below enforces it.
 *
 * Transparent outside the circle on purpose, so the dot reads as a dot on
 * both light and dark tab strips. The iOS icon (`apple-icon.tsx`) is the
 * opposite: full-bleed and opaque, because iOS composites a transparent icon
 * onto black and applies its own rounding. Keep the two marks in step.
 */

const SIZES = [16, 32, 48];

/** Round to the nearest even number, so the bar always centres on whole pixels. */
const evenly = (n: number) => Math.round(n / 2) * 2;

export function generateImageMetadata() {
  return SIZES.map((s) => ({
    id: String(s),
    size: { width: s, height: s },
    contentType: "image/png",
    sizes: `${s}x${s}`,
  }));
}

export default async function Icon({ id }: { id: Promise<string> }) {
  // `id` is a Promise in Next 16, not a plain string. Awaiting it is what
  // makes this work; using it directly yields NaN and every CSS value below
  // becomes `NaN`, which fails the render with a bare "inputValue.trim is not
  // a function".
  const size = Number(await id);
  const barW = evenly(size * 0.75);
  const barH = evenly(size * 0.25);

  const bar = (deg: number) =>
    ({
      position: "absolute" as const,
      left: (size - barW) / 2,
      top: (size - barH) / 2,
      width: barW,
      height: barH,
      background: "#ffffff",
      transform: `rotate(${deg}deg)`,
    });

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          borderRadius: "50%",
          background: "#e02214",
        }}
      >
        <div style={bar(45)} />
        <div style={bar(-45)} />
      </div>
    ),
    { width: size, height: size },
  );
}

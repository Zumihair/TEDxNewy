import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Browser tab icon: a bold white X in a red dot, matching the circular avatar
 * the socials use.
 *
 * **The X is drawn as two rotated bars, not typed as a character.** A text
 * glyph was tried first and was wrong twice over: a lowercase "x" sits
 * between the baseline and the x-height, so it rendered noticeably low in the
 * circle, and the centring used the text's advance width (which includes
 * trailing letter-spacing), so it also sat right of centre. Bars are
 * positioned by arithmetic instead, so the mark is exactly centred, and the
 * thickness is a number we control rather than whatever weight the fallback
 * font happens to have. Don't "simplify" this back to a character.
 *
 * Geometry: each bar is BAR_W x BAR_H, placed at the exact centre and rotated
 * +/-45deg about its own middle. Two constraints if you change the numbers:
 *
 *  - Keep the half-diagonal (`hypot(BAR_W, BAR_H) / 2`) under 16, the
 *    circle's radius, or the corners poke outside the red into the
 *    transparent corners. `border-radius` does not clip children, so nothing
 *    trims an oversized mark for you. 24 x 8 gives 12.6, comfortably inside.
 *  - **Keep BAR_H even.** `top` is `(32 - BAR_H) / 2`, so an odd height lands
 *    the bar on a half pixel and antialiasing drags the mark half a pixel
 *    low. Measured: height 7 renders 0.48px below centre, height 8 renders
 *    dead centre.
 *
 * Transparent outside the circle on purpose, so the dot reads as a dot on
 * both light and dark tab strips. The iOS icon (`apple-icon.tsx`) is the
 * opposite: full-bleed and opaque, because iOS composites a transparent icon
 * onto black and applies its own rounding. Keep the two marks in step.
 */

const CANVAS = 32;
const BAR_W = 24;
const BAR_H = 8;

const bar = (deg: number) =>
  ({
    position: "absolute" as const,
    left: (CANVAS - BAR_W) / 2,
    top: (CANVAS - BAR_H) / 2,
    width: BAR_W,
    height: BAR_H,
    background: "#ffffff",
    transform: `rotate(${deg}deg)`,
  });

export default function Icon() {
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
    { ...size },
  );
}

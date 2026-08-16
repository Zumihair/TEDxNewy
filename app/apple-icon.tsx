import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * iOS home-screen icon. Same bold white X and brand red as the tab icon
 * (`icon.tsx`), and drawn the same way: two bars rotated +/-45deg, not a
 * typed character. A text glyph sits on its baseline, which rendered the
 * mark low and off-centre; bars are positioned by arithmetic and land dead
 * centre. Keep the two files in step.
 *
 * Unlike the tab icon this is **full-bleed and opaque, not a circle**: iOS
 * applies its own rounded-square mask and fills any transparency with black,
 * so a transparent circle here would render as a red dot on a black tile.
 * That also means there is no circle for the mark to spill out of, just the
 * square's own padding, so the bars can sit proportionally larger.
 */

const CANVAS = 180;
const BAR_W = 108;
const BAR_H = 36;

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

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
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

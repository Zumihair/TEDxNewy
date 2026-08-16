import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Browser tab icon: the bold white "x" in a red dot, matching the circular
 * avatar the socials use.
 *
 * The single glyph is the point. Four letters ("TEDx") was tried and dropped
 * because a tab icon renders at 16 to 32px, where a wordmark turns to mush;
 * one bold mark stays legible all the way down.
 *
 * Transparent outside the circle on purpose, so the dot reads as a dot on
 * both light and dark tab strips. The iOS icon (`apple-icon.tsx`) is the
 * opposite: full-bleed and opaque, because iOS composites a transparent icon
 * onto black and applies its own rounding.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          background: "#e02214",
          color: "#ffffff",
          fontFamily: "Helvetica, Arial, sans-serif",
          fontWeight: 800,
          fontSize: 21,
          letterSpacing: -1,
          lineHeight: 1,
        }}
      >
        x
      </div>
    ),
    { ...size },
  );
}

import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Browser tab icon: the TEDx wordmark in a red dot, matching the circular
 * avatar the socials use, so a tab reads as the same brand as the Instagram
 * profile rather than a generic red square with an "x".
 *
 * Transparent outside the circle on purpose, so the dot reads as a dot on
 * both light and dark tab strips. The iOS icon (`apple-icon.tsx`) is the
 * opposite: full-bleed and opaque, because iOS composites a transparent icon
 * onto black and applies its own rounding.
 *
 * `TEDx` is deliberately close to the circle's edge: four glyphs in 32px is
 * already tight, and at the 16px some browsers still use it resolves to a red
 * dot, which is on-brand rather than broken. Don't add padding or a border
 * here, it eats the only space the wordmark has.
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
          fontWeight: 700,
          fontSize: 10,
          letterSpacing: -0.5,
          lineHeight: 1,
        }}
      >
        TEDx
      </div>
    ),
    { ...size },
  );
}

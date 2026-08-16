import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * iOS home-screen icon. Same bold white "x" and red as the tab icon
 * (`icon.tsx`), but **full-bleed and opaque, not a circle**: iOS applies its
 * own rounded-square mask, and fills any transparency with black, so a
 * transparent circle here would render as a red dot on a black tile.
 *
 * Keep the two in step. If the brand red or the mark changes, change both.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#e02214",
          color: "#ffffff",
          fontFamily: "Helvetica, Arial, sans-serif",
          fontWeight: 800,
          fontSize: 122,
          letterSpacing: -6,
          lineHeight: 1,
        }}
      >
        x
      </div>
    ),
    { ...size },
  );
}

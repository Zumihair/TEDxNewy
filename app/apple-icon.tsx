import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * iOS home-screen icon. Same TEDx wordmark and red as the tab icon
 * (`icon.tsx`), but **full-bleed and opaque, not a circle**: iOS applies its
 * own rounded-square mask, and fills any transparency with black, so a
 * transparent circle here would render as a red dot on a black tile.
 *
 * Keep the two in step. If the brand red or the wordmark changes, change both.
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
          fontWeight: 700,
          fontSize: 58,
          letterSpacing: -2,
          lineHeight: 1,
        }}
      >
        TEDx
      </div>
    ),
    { ...size },
  );
}

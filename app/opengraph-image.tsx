import { ImageResponse } from "next/og";

export const alt = "TEDxNewy — Ideas that refuse to sit still.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background:
            "radial-gradient(circle at 50% 50%, #ff3626 0%, #e11905 18%, #b91404 40%, #2a0604 78%)",
          color: "#ffffff",
          fontFamily: "Helvetica, Arial, sans-serif",
        }}
      >
        {/* Wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            fontWeight: 800,
            fontSize: 64,
            letterSpacing: -2,
            color: "#ffffff",
          }}
        >
          <span style={{ display: "flex" }}>TED</span>
          <span style={{ display: "flex", fontSize: 32, marginLeft: 2, position: "relative", top: -22 }}>x</span>
          <span style={{ display: "flex", marginLeft: 4, fontWeight: 500 }}>Newy</span>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              display: "flex",
              fontSize: 96,
              fontWeight: 600,
              letterSpacing: -3,
              lineHeight: 1,
            }}
          >
            Ideas that refuse to sit still.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: 4,
              textTransform: "uppercase",
              opacity: 0.8,
            }}
          >
            Newcastle · Awabakal &amp; Worimi Country
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

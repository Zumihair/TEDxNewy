import { ImageResponse } from "next/og";

export const alt =
  "2026 Youth Futures Lab · TEDxNewy × University of Newcastle";
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
            "radial-gradient(circle at 22% 12%, #ff3626 0%, #e11905 22%, #b91404 46%, #2a0604 84%)",
          color: "#ffffff",
          fontFamily: "Helvetica, Arial, sans-serif",
        }}
      >
        {/* Top row: wordmark + partner */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              fontWeight: 800,
              fontSize: 52,
              letterSpacing: -2,
              color: "#ffffff",
            }}
          >
            <span style={{ display: "flex" }}>TED</span>
            <span
              style={{
                display: "flex",
                fontSize: 26,
                marginLeft: 2,
                position: "relative",
                top: -18,
              }}
            >
              x
            </span>
            <span style={{ display: "flex", marginLeft: 4, fontWeight: 500 }}>
              Newy
            </span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 19,
              fontWeight: 500,
              letterSpacing: 3,
              textTransform: "uppercase",
              opacity: 0.85,
            }}
          >
            × University of Newcastle
          </div>
        </div>

        {/* Middle: eyebrow + headline + tagline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#ffd2cc",
            }}
          >
            Youth Futures Lab · 2026
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 100,
              fontWeight: 600,
              letterSpacing: -4,
              lineHeight: 0.95,
            }}
          >
            Ideas worth building.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              fontWeight: 500,
              lineHeight: 1.3,
              opacity: 0.92,
              maxWidth: 880,
            }}
          >
            A one-day hackathon for the next generation of Newcastle leaders.
          </div>
        </div>

        {/* Bottom: event details */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 22,
            fontSize: 22,
            fontWeight: 500,
          }}
        >
          <div style={{ display: "flex" }}>Fri 7 Aug 2026</div>
          <div style={{ display: "flex", opacity: 0.45 }}>·</div>
          <div style={{ display: "flex" }}>NUspace City Campus</div>
          <div style={{ display: "flex", opacity: 0.45 }}>·</div>
          <div
            style={{
              display: "flex",
              padding: "9px 20px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.32)",
            }}
          >
            Free for selected schools
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

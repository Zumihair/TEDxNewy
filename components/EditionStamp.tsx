"use client";

/**
 * Rotating circular stamp — TEDxNewy signature element.
 * Echoes the "red circle" on the TEDx stage.
 */
export default function EditionStamp({
  size = 120,
  className = "",
  tone = "light",
}: {
  size?: number;
  className?: string;
  tone?: "light" | "dark";
}) {
  const stroke = tone === "light" ? "rgba(255,255,255,0.85)" : "#141210";
  const fill = tone === "light" ? "#ffffff" : "#141210";
  const textColor = tone === "light" ? "rgba(255,255,255,0.95)" : "#141210";
  const dotFill = "#e02214";
  const id = `stamp-path-${size}`;

  return (
    <div
      className={`pointer-events-none relative ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        viewBox="0 0 120 120"
        width={size}
        height={size}
        className="absolute inset-0"
        style={{ animation: "stamp-rotate 28s linear infinite" }}
      >
        <defs>
          <path
            id={id}
            d="M 60,60 m -48,0 a 48,48 0 1,1 96,0 a 48,48 0 1,1 -96,0"
          />
        </defs>
        <circle
          cx="60"
          cy="60"
          r="58"
          fill="none"
          stroke={stroke}
          strokeOpacity="0.3"
          strokeWidth="0.8"
          strokeDasharray="1 3"
        />
        <circle
          cx="60"
          cy="60"
          r="40"
          fill="none"
          stroke={stroke}
          strokeOpacity="0.2"
          strokeWidth="0.6"
        />
        <text
          fill={textColor}
          fontFamily="var(--font-plex-mono)"
          fontSize="8.4"
          fontWeight="600"
          letterSpacing="2.8"
          textLength="290"
        >
          <textPath href={`#${id}`} startOffset="0">
            TEDxNEWY · EDITION 11 · 2026 · TIDES & TURBINES ·
          </textPath>
        </text>
      </svg>
      {/* Inner dot */}
      <div
        className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: dotFill, boxShadow: "0 0 20px rgba(224,34,20,0.6)" }}
      />
      <style>{`
        @keyframes stamp-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

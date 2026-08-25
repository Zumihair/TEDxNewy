import React from "react";

/** Slowly rotating circular stamp: the edition, year and theme around a red dot. */
export function EditionStamp({ text = "TEDxNEWY · EDITION 11 · 2026 · TIDES & TURBINES ·", size = 120, tone = "light", style }) {
  const stroke = tone === "light" ? "rgba(255,255,255,0.85)" : "#141210";
  const id = React.useMemo(() => `stamp-${Math.random().toString(36).slice(2, 8)}`, []);
  return (
    <div aria-hidden="true" style={{ position: "relative", width: size, height: size, pointerEvents: "none", ...style }}>
      <style>{`@keyframes stamp-rotate{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      <svg viewBox="0 0 120 120" width={size} height={size} style={{ position: "absolute", inset: 0, animation: "stamp-rotate 28s linear infinite" }}>
        <defs>
          <path id={id} d="M 60,60 m -48,0 a 48,48 0 1,1 96,0 a 48,48 0 1,1 -96,0" />
        </defs>
        <circle cx="60" cy="60" r="58" fill="none" stroke={stroke} strokeOpacity="0.3" strokeWidth="0.8" strokeDasharray="1 3" />
        <circle cx="60" cy="60" r="40" fill="none" stroke={stroke} strokeOpacity="0.2" strokeWidth="0.6" />
        <text fill={tone === "light" ? "rgba(255,255,255,0.95)" : "#141210"} fontFamily="var(--font-sans)" fontSize="8.4" fontWeight="600" letterSpacing="2.8" textLength="290">
          <textPath href={`#${id}`} startOffset="0">{text}</textPath>
        </text>
      </svg>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 12,
          height: 12,
          transform: "translate(-50%,-50%)",
          borderRadius: "50%",
          background: "var(--red)",
          boxShadow: "0 0 20px rgba(224,34,20,0.6)",
        }}
      />
    </div>
  );
}

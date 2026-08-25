import React from "react";

/** The stage's red circle, as a decorative sphere. Purely presentational. */
export function RedCircle({ size = 200, opacity = 1, style }) {
  return (
    <div
      aria-hidden="true"
      style={{
        pointerEvents: "none",
        borderRadius: "50%",
        width: size,
        height: size,
        opacity,
        background: "radial-gradient(circle at 38% 38%, #ff5247 0%, #e62b1e 42%, #b91d12 75%, #8a1409 100%)",
        boxShadow: "inset 6px -14px 24px rgba(0,0,0,0.22), 0 10px 30px rgba(230,43,30,0.35)",
        ...style,
      }}
    />
  );
}

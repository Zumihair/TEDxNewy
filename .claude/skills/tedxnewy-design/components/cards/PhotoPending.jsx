import React from "react";
import { Icon } from "../core/Icon";

/** Stands in for an event photo that doesn't exist yet. Always brand red. */
export function PhotoPending({ title }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: "0 20px",
        textAlign: "center",
        background: "var(--grad-brand)",
      }}
    >
      <Icon name="image" size={20} strokeWidth={1.75} color="rgba(255,255,255,0.45)" />
      <div style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.15, letterSpacing: "-0.01em", color: "#fff" }}>{title}</div>
      <div style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "var(--tracking-kicker)", color: "rgba(255,255,255,0.6)" }}>
        Photos coming soon
      </div>
    </div>
  );
}

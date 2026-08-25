import React from "react";

/** A speaker's portrait, name and role line. Opens their bio in a modal on the real site. */
export function SpeakerCard({ name, title, image, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label={`Read about ${name}`}
      style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: 0, padding: 0, font: "inherit" }}
    >
      <div style={{ position: "relative", aspectRatio: "4/5", overflow: "hidden", borderRadius: "var(--radius-md)", background: "#1a1714" }}>
        {image && (
          <img
            src={image}
            alt={name}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: hover ? "scale(1.03)" : "none", transition: "transform var(--dur-zoom) var(--ease-out-quint)" }}
          />
        )}
      </div>
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.15, letterSpacing: "-0.01em", color: hover ? "var(--red-mid)" : "var(--ink)", transition: "color var(--dur-hover) var(--ease-out-quint)" }}>{name}</div>
        {title && <div style={{ marginTop: 6, fontSize: 13.5, lineHeight: 1.5, color: "var(--ink-3)" }}>{title}</div>}
      </div>
    </button>
  );
}

import React from "react";
import { Icon } from "../core/Icon";
import { PhotoPending } from "./PhotoPending";

/** Past-event card for dark surfaces: photo on top, date eyebrow, title, circle-arrow CTA. */
export function PastEventCard({ href = "#", image, imageAlt, imageGradient = "var(--grad-brand)", date, title, subtitle, cta = "View Event" }) {
  const [hover, setHover] = React.useState(false);
  return (
    <a
      href={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display: "block", textDecoration: "none", color: "inherit" }}
    >
      <div style={{ position: "relative", aspectRatio: "4/3", width: "100%", overflow: "hidden", borderRadius: "var(--radius-lg)", background: imageGradient }}>
        {image ? (
          <img
            src={image}
            alt={imageAlt || title}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: hover ? "scale(1.03)" : "none", transition: "transform var(--dur-zoom) var(--ease-out-quint)" }}
          />
        ) : (
          <PhotoPending title={title} />
        )}
      </div>
      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{date}</div>
        <h3 style={{ marginTop: 8, fontSize: "var(--fs-card-title)", lineHeight: "var(--lh-title)", fontWeight: 500, letterSpacing: "var(--tracking-title)", color: "#fff", fontVariationSettings: '"opsz" 96' }}>
          {title}
        </h3>
        {subtitle && <div style={{ marginTop: 6, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{subtitle}</div>}
        <div style={{ marginTop: 20, display: "inline-flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: 500, color: "#fff" }}>
          {cta}
          <span
            aria-hidden="true"
            style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: hover ? "var(--red-mid)" : "var(--red)", boxShadow: "0 8px 22px rgba(224,34,20,0.35)", transform: hover ? "translateX(4px)" : "none", transition: "all var(--dur-hover) var(--ease-out-quint)" }}
          >
            <Icon name="arrow-right" size={16} strokeWidth={2.25} color="#fff" />
          </span>
        </div>
      </div>
    </a>
  );
}

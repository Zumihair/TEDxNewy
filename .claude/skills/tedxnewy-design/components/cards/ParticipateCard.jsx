import React from "react";
import { Icon } from "../core/Icon";

/** Full-bleed photo card with a bottom scrim: title top, blurb and circle arrow bottom. */
export function ParticipateCard({ href = "#", title, body, image, gradient = "var(--grad-brand)", cta = "Learn more", ratio = "4/5" }) {
  const [hover, setHover] = React.useState(false);
  return (
    <a
      href={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ position: "relative", display: "block", aspectRatio: ratio, overflow: "hidden", borderRadius: "var(--radius-md)", background: gradient, textDecoration: "none" }}
    >
      {image && <img src={image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.65 }} />}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "var(--grad-photo-scrim)" }} />
      <div style={{ position: "relative", display: "flex", height: "100%", flexDirection: "column", justifyContent: "space-between", padding: 28 }}>
        <h3 style={{ maxWidth: "14ch", fontSize: "clamp(1.65rem,2.4vw,2rem)", lineHeight: 1.05, fontWeight: 500, letterSpacing: "var(--tracking-title)", color: "#fff", fontVariationSettings: '"opsz" 96' }}>{title}</h3>
        <div style={{ display: "grid", gap: 20 }}>
          {body && <p style={{ fontSize: 14.5, lineHeight: 1.5, color: "rgba(255,255,255,0.85)" }}>{body}</p>}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontSize: 13.5, fontWeight: 500, color: "#fff" }}>{cta}</span>
            <span
              aria-hidden="true"
              style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: hover ? "var(--red-mid)" : "var(--red)", boxShadow: "0 8px 22px rgba(224,34,20,0.35)", transform: hover ? "translateX(4px)" : "none", transition: "all var(--dur-hover) var(--ease-out-quint)" }}
            >
              <Icon name="arrow-right" size={16} strokeWidth={2.25} color="#fff" />
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}

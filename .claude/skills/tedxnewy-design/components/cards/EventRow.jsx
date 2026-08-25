import React from "react";
import { Icon } from "../core/Icon";
import { PhotoPending } from "./PhotoPending";

/** Minimal event row: compact photo left, text right, no card frame. */
export function EventRow({ href = "#", image, imageAlt, imageGradient = "var(--grad-brand)", label, labelAccent = "neutral", title, meta, description, linkLabel = "Read more" }) {
  const [hover, setHover] = React.useState(false);
  return (
    <a
      href={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display: "grid", gridTemplateColumns: "minmax(0,4fr) minmax(0,7fr)", gap: 40, padding: "36px 0", textDecoration: "none", color: "inherit" }}
    >
      <div style={{ position: "relative", aspectRatio: "4/3", overflow: "hidden", borderRadius: "var(--radius-md)", background: imageGradient }}>
        {image ? (
          <img src={image} alt={imageAlt || title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: hover ? "scale(1.03)" : "none", transition: "transform var(--dur-zoom) var(--ease-out-quint)" }} />
        ) : (
          <PhotoPending title={title} />
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 10 }}>
        {label && (
          <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "var(--tracking-kicker)", color: labelAccent === "red" ? "var(--red)" : "var(--ink-3)" }}>{label}</div>
        )}
        <h3 style={{ fontSize: "var(--fs-card-title)", lineHeight: "var(--lh-title)", fontWeight: 500, letterSpacing: "var(--tracking-title)", color: "var(--ink)", fontVariationSettings: '"opsz" 96' }}>
          <span style={{ backgroundImage: "linear-gradient(var(--red),var(--red))", backgroundSize: hover ? "100% 1px" : "0% 1px", backgroundPosition: "0 100%", backgroundRepeat: "no-repeat", transition: "background-size 500ms var(--ease-out-quint)" }}>{title}</span>
        </h3>
        {meta && <div style={{ fontSize: 14, color: "var(--ink-3)" }}>{meta}</div>}
        {description && <p style={{ fontSize: 14.5, lineHeight: 1.55, color: "var(--ink-2)" }}>{description}</p>}
        <div style={{ marginTop: 4, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 500, color: "var(--red-mid)" }}>
          {linkLabel}
          <span style={{ display: "inline-flex", transform: hover ? "translate(2px,-2px)" : "none", transition: "transform var(--dur-hover) var(--ease-out-quint)" }}>
            <Icon name="arrow-up-right" size={14} strokeWidth={2} />
          </span>
        </div>
      </div>
    </a>
  );
}

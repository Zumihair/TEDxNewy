import React from "react";
import { Icon } from "../core/Icon";
import { SpeakerCard } from "../cards/SpeakerCard";

/** Swipeable speaker lineup. Arrow controls on desktop, swipe on touch. */
export function SpeakerCarousel({ speakers = [], kicker = "The lineup", heading = "Speakers", onSelect }) {
  const track = React.useRef(null);
  const step = (dir) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector("li");
    el.scrollBy({ left: ((card && card.clientWidth) || 240 + 24) * dir, behavior: "smooth" });
  };
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "0 24px" }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.24em", color: "var(--red-mid)" }}>{kicker}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {[-1, 1].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => step(d)}
              aria-label={d < 0 ? "Scroll speakers left" : "Scroll speakers right"}
              style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", border: "1px solid rgba(20,18,16,0.15)", background: "transparent", color: "var(--ink)" }}
            >
              <Icon name={d < 0 ? "chevron-left" : "chevron-right"} size={16} strokeWidth={2.25} />
            </button>
          ))}
        </div>
      </div>
      <h2 style={{ marginTop: 16, padding: "0 24px", fontSize: "clamp(1.65rem,3vw,2.25rem)", lineHeight: 1.1, fontWeight: 500, letterSpacing: "var(--tracking-display)", color: "var(--ink)", fontVariationSettings: '"opsz" 144' }}>{heading}</h2>
      <ul ref={track} className="carousel-scrollbar" style={{ listStyle: "none", display: "flex", gap: 24, overflowX: "auto", scrollSnapType: "x mandatory", margin: "40px 0 0", padding: "0 24px 16px" }}>
        {speakers.map((s) => (
          <li key={s.name} style={{ width: 240, flexShrink: 0, scrollSnapAlign: "start" }}>
            <SpeakerCard name={s.name} title={s.title} image={s.image} onClick={() => onSelect && onSelect(s)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

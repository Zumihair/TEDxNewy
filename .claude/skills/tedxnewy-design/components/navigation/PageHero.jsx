import React from "react";

/** The cream page hero every inner page opens with. Kicker, big title, intro. */
export function PageHero({ kicker, title, intro, body, meta }) {
  return (
    <section style={{ background: "var(--cream)", padding: "144px 0 64px" }}>
      <div style={{ margin: "0 auto", maxWidth: "var(--container-prose)", padding: "0 24px" }}>
        {kicker && (
          <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.24em", color: "var(--red-mid)" }}>{kicker}</div>
        )}
        <h1 style={{ marginTop: kicker ? 24 : 0, fontSize: "var(--fs-display)", lineHeight: 0.98, fontWeight: 500, letterSpacing: "var(--tracking-display)", color: "var(--ink)", fontVariationSettings: '"opsz" 144' }}>{title}</h1>
        {intro && <p style={{ marginTop: 32, fontSize: 18, lineHeight: 1.65, color: "var(--ink-2)" }}>{intro}</p>}
        {body && <p style={{ marginTop: 16, fontSize: 18, lineHeight: 1.65, color: "var(--ink-2)" }}>{body}</p>}
        {meta && <div style={{ marginTop: 32 }}>{meta}</div>}
      </div>
    </section>
  );
}

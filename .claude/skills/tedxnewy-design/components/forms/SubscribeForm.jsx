import React from "react";

/** Email + red pill submit. The site's newsletter row, on the deep-red close of the homepage. */
export function SubscribeForm({ placeholder = "your@email.com", cta = "Subscribe", onSubmit }) {
  const [hover, setHover] = React.useState(false);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit && onSubmit(e);
      }}
      style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}
    >
      <label htmlFor="subscribe-email" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Email address</label>
      <input
        id="subscribe-email"
        type="email"
        name="email"
        required
        placeholder={placeholder}
        style={{ flex: 1, minWidth: 220, boxSizing: "border-box", borderRadius: "var(--radius-input)", border: "1px solid rgba(97,74,68,0.13)", background: "#fff", padding: "16px 20px", fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 500, color: "#1a1513", outline: "none" }}
      />
      <button
        type="submit"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, whiteSpace: "nowrap", borderRadius: "var(--radius-pill)", border: 0, background: hover ? "var(--red-mid)" : "var(--red)", padding: "14px 28px", fontFamily: "var(--font-sans)", fontSize: 14.5, fontWeight: 500, color: "#fff", transform: hover ? "translateY(-2px)" : "none", transition: "all var(--dur-hover) var(--ease-out-quint)" }}
      >
        {cta}
      </button>
    </form>
  );
}

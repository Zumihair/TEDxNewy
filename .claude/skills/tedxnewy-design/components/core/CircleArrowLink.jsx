import React from "react";
import { Icon } from "./Icon";

/** Label + red filled circle with a white arrow. The whole row is the target. */
export function CircleArrowLink({ href = "#", children, size = "md", color = "#ffffff", style, ...rest }) {
  const dim = size === "lg" ? 48 : size === "sm" ? 36 : 40;
  const font = size === "lg" ? 16 : size === "sm" ? 13 : 14.5;
  const [hover, setHover] = React.useState(false);
  return (
    <a
      href={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display: "inline-flex", alignItems: "center", gap: 14, color, textDecoration: "none", ...style }}
      {...rest}
    >
      <span style={{ fontSize: font, fontWeight: 500 }}>{children}</span>
      <span
        aria-hidden="true"
        style={{
          width: dim,
          height: dim,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          background: hover ? "var(--red-mid)" : "var(--red)",
          color: "#fff",
          boxShadow: "var(--shadow-red-circle)",
          transform: hover ? "translateX(4px)" : "none",
          transition: "transform var(--dur-hover) var(--ease-out-quint), background var(--dur-hover) var(--ease-out-quint)",
        }}
      >
        <Icon name="arrow-right" size={size === "lg" ? 20 : 16} strokeWidth={2.25} />
      </span>
    </a>
  );
}

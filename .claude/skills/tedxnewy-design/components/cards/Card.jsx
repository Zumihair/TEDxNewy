import React from "react";

/** The standard white card: 8px radius, hairline border, 2px lift + soft shadow on hover. */
export function Card({ children, padding = 24, hoverable = true, as = "div", style, ...rest }) {
  const Tag = as;
  return (
    <Tag className={hoverable ? "card" : undefined} style={{ padding, background: "var(--surface-card)", borderRadius: "var(--radius-card)", border: "1px solid var(--border-card)", ...style }} {...rest}>
      {children}
    </Tag>
  );
}

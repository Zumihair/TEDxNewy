import React from "react";

/** Small status / category pill. Four tints, same radius as every other pill. */
export function Pill({ tone = "cream", children, style, ...rest }) {
  return (
    <span className={`pill pill-${tone}`} style={style} {...rest}>
      {children}
    </span>
  );
}

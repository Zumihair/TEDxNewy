import React from "react";

/**
 * Thin wrapper over the lucide-react icon set the admin uses everywhere.
 * The design system ships no icon binaries: it reads the lucide UMD build
 * (window.lucide) so card HTML and UI kits can name icons the same way the
 * codebase imports them ("Pencil", "Trash2", "CalendarDays").
 */
export function Icon({ name, size = 16, strokeWidth = 2, color = "currentColor", className = "", style }) {
  const lib = (typeof window !== "undefined" && window.lucide) || null;
  const raw = lib ? (lib.icons ? lib.icons[name] : lib[name]) : null;
  const nodes = !raw ? null : raw[0] === "svg" ? raw[2] : raw;
  const box = { width: size, height: size, display: "inline-block", flexShrink: 0, ...style };
  if (!nodes) return <span aria-hidden className={className} style={box} />;
  return (
    <svg
      aria-hidden
      className={className}
      style={box}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {nodes.map(([tag, attrs], i) => React.createElement(tag, { key: i, ...attrs }))}
    </svg>
  );
}

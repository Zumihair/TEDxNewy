import React from "react";

// Lucide (lucide.dev, ISC) is the site's icon set — imported in the real code as
// `lucide-react`. These are the glyphs the site actually uses, with Lucide's own
// 24x24 stroke geometry, so a design-system consumer gets identical icons without
// a package install. Add a glyph here rather than hand-drawing one inline.
const PATHS = {
  "arrow-right": ["M5 12h14", "m12 5 7 7-7 7"],
  "arrow-up-right": ["M7 7h10v10", "M7 17 17 7"],
  "arrow-left": ["m12 19-7-7 7-7", "M19 12H5"],
  "chevron-down": ["m6 9 6 6 6-6"],
  "chevron-left": ["m15 18-6-6 6-6"],
  "chevron-right": ["m9 18 6-6-6-6"],
  menu: ["M4 12h16", "M4 6h16", "M4 18h16"],
  x: ["M18 6 6 18", "m6 6 12 12"],
  play: ["m6 3 14 9-14 9V3z"],
  mail: ["m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"],
  "map-pin": ["M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"],
  calendar: ["M8 2v4", "M16 2v4", "M3 10h18"],
};

const EXTRA = {
  mail: <rect key="r" x="2" y="4" width="20" height="16" rx="2" />,
  "map-pin": <circle key="c" cx="12" cy="10" r="3" />,
  calendar: <rect key="r" x="3" y="4" width="18" height="18" rx="2" />,
  image: [
    <rect key="r" x="3" y="3" width="18" height="18" rx="2" />,
    <circle key="c" cx="9" cy="9" r="2" />,
  ],
};

export function Icon({ name, size = 16, strokeWidth = 2, color = "currentColor", style, ...rest }) {
  const paths = name === "image" ? ["m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"] : PATHS[name] || [];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={name === "play" ? color : "none"}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0, ...style }}
      {...rest}
    >
      {EXTRA[name]}
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

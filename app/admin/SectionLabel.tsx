"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { sectionThemeFor } from "./section-theme";

/**
 * A small section heading with a section-coloured accent dot, so sub-headings
 * across every admin page share the same colour identity as their page header
 * and dashboard tile. Client-only because it reads the route to pick the hue.
 */
export function SectionLabel({ children }: { children: ReactNode }) {
  const theme = sectionThemeFor(usePathname());
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: theme.ink }}
        aria-hidden
      />
      <span
        className="font-mono text-[10.5px] font-semibold uppercase text-[#6b6459]"
        style={{ letterSpacing: "0.24em" }}
      >
        {children}
      </span>
    </div>
  );
}

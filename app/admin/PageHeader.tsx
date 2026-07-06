"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { sectionThemeFor } from "./section-theme";

/**
 * The header at the top of every admin page. It picks up its section's colour
 * (from section-theme, keyed on the route) for the accent bar, eyebrow and the
 * back-link hover, so each section reads as a coloured family that matches its
 * dashboard tile.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  backHref,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  backHref?: string;
  actions?: ReactNode;
}) {
  const theme = sectionThemeFor(usePathname());
  const hoverVar = { "--hc": theme.ink } as CSSProperties;

  return (
    <header className="space-y-5">
      {backHref && (
        <Link
          href={backHref}
          style={hoverVar}
          className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase text-[#6b6459] transition-colors hover:text-[color:var(--hc)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
          Back
        </Link>
      )}
      <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-end">
        <div className="min-w-0">
          {eyebrow && (
            <div className="flex items-center gap-2">
              <span
                className="h-3.5 w-1 rounded-full"
                style={{ backgroundColor: theme.ink }}
                aria-hidden
              />
              <span
                className="font-mono text-[10.5px] font-semibold uppercase"
                style={{ letterSpacing: "0.24em", color: theme.ink }}
              >
                {eyebrow}
              </span>
            </div>
          )}
          <h1
            className={
              (eyebrow ? "mt-3 " : "") +
              "font-sans tracking-[-0.025em] text-[#141210] balance"
            }
            style={{
              fontSize: "clamp(1.85rem, 3.6vw, 2.5rem)",
              lineHeight: 1.04,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            {title}
          </h1>
          {description && (
            <p className="mt-3 max-w-[62ch] text-[14.5px] leading-[1.6] text-[#6b6459]">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 self-stretch md:self-auto">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

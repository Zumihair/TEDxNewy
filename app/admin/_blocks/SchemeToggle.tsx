"use client";

import { Moon, Sun } from "lucide-react";
import type { PreviewScheme } from "@/lib/newsletter-blocks";

/**
 * Light/dark switch for the two email previews. Shared so the pop-up and the
 * side panel offer the same control in the same place.
 *
 * Switching costs a server re-render, not a CSS class: the email's dark mode is
 * a `prefers-color-scheme` media query inside the document, so it answers to
 * the viewer's OS and nothing outside the iframe can override it. The renderer
 * pins the scheme instead (see `previewScheme` in lib/newsletter-render).
 */
export default function SchemeToggle({
  value,
  onChange,
  size = "md",
}: {
  value: PreviewScheme;
  onChange: (scheme: PreviewScheme) => void;
  /** "sm" matches the side panel's tighter toolbar. */
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  return (
    <div className="flex items-center gap-0.5">
      <SchemeBtn
        active={value === "light"}
        onClick={() => onChange("light")}
        label="Preview in light mode"
        box={box}
      >
        <Sun className="h-4 w-4" strokeWidth={2} />
      </SchemeBtn>
      <SchemeBtn
        active={value === "dark"}
        onClick={() => onChange("dark")}
        label="Preview in dark mode"
        box={box}
      >
        <Moon className="h-4 w-4" strokeWidth={2} />
      </SchemeBtn>
    </div>
  );
}

/** The surround behind the iframe, so a dark email isn't ringed in cream (and
 *  the letterboxing at mobile width matches what is being previewed). */
export function previewChrome(scheme: PreviewScheme): string {
  return scheme === "dark" ? "#100f0d" : "#f4efe6";
}

function SchemeBtn({
  active,
  onClick,
  label,
  box,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  box: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={
        "inline-flex items-center justify-center rounded-[8px] transition-colors " +
        box +
        " " +
        (active
          ? "bg-[rgba(20,18,16,0.10)] text-[#141210]"
          : "text-[#6b6459] hover:bg-[rgba(20,18,16,0.06)]")
      }
    >
      {children}
    </button>
  );
}

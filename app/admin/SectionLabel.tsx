import type { ReactNode } from "react";

/** A small section heading inside an admin page (sentence case, no accent dot). */
export function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="adm-section__title">{children}</h2>;
}

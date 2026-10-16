import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/ds";

/**
 * The header at the top of every admin page: title, optional description,
 * a back link and page actions. The design system has no eyebrows, so the
 * `eyebrow` prop is accepted for older call sites and ignored.
 */
export function PageHeader({
  title,
  description,
  backHref,
  actions,
}: {
  /** Retired: accepted and ignored. */
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  backHref?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="adm-head">
      <div style={{ minWidth: 0 }}>
        {backHref && (
          <Link href={backHref} className="adm-head__back" style={{ marginBottom: "var(--space-3)" }}>
            <Icon name="arrow-left" size={14} />
            Back
          </Link>
        )}
        <h1 className="adm-head__title">{title}</h1>
        {description && <p className="adm-head__desc">{description}</p>}
      </div>
      {actions && <div className="adm-head__actions">{actions}</div>}
    </header>
  );
}

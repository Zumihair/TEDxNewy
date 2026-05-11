import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

/**
 * Tight, reusable admin chrome primitives. All live in one file so admin
 * pages stay short and stylistically aligned.
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
  return (
    <header className="space-y-5">
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase text-[#6b6459] transition-colors hover:text-[#e02214]"
          style={{ letterSpacing: "0.22em" }}
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
          Back
        </Link>
      )}
      <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-end">
        <div className="min-w-0">
          {eyebrow && (
            <div
              className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
              style={{ letterSpacing: "0.24em" }}
            >
              {eyebrow}
            </div>
          )}
          <h1
            className="mt-3 font-sans tracking-[-0.025em] text-[#141210] balance"
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

export function Flash({
  tone = "ok",
  children,
}: {
  tone?: "ok" | "info" | "error";
  children: ReactNode;
}) {
  const styles: Record<typeof tone, string> = {
    ok: "border-[#22c55e]/30 bg-[#22c55e]/10 text-[#155724]",
    info: "border-[#3b82f6]/30 bg-[#3b82f6]/10 text-[#1e3a8a]",
    error: "border-[#e02214]/30 bg-[#e02214]/10 text-[#b91404]",
  };
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-[var(--radius-md)] border px-4 py-3 text-[13.5px] ${styles[tone]}`}
    >
      {children}
    </div>
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "red" | "live" | "soon";
  children: ReactNode;
}) {
  const styles: Record<typeof tone, string> = {
    neutral: "bg-[rgba(20,18,16,0.06)] text-[#6b6459]",
    red: "bg-[#e02214]/10 text-[#b91404]",
    live: "bg-[#22c55e]/15 text-[#15803d]",
    soon: "bg-[rgba(20,18,16,0.06)] text-[#6b6459]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase ${styles[tone]}`}
      style={{ letterSpacing: "0.22em" }}
    >
      {children}
    </span>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div
      className="font-mono text-[10.5px] font-semibold uppercase text-[#6b6459]"
      style={{ letterSpacing: "0.24em" }}
    >
      {children}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white ${className}`}
    >
      {children}
    </div>
  );
}

export function PrimaryButton({
  children,
  type = "button",
  disabled,
  name,
  value,
}: {
  children: ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  name?: string;
  value?: string;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      name={name}
      value={value}
      className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-5 py-2.5 text-[13.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  type = "button",
  disabled,
  name,
  value,
}: {
  children: ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  name?: string;
  value?: string;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      name={name}
      value={value}
      className="inline-flex items-center gap-2 rounded-full bg-[rgba(20,18,16,0.06)] px-5 py-2.5 text-[13.5px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {children}
    </button>
  );
}

export function DangerButton({
  children,
  type = "submit",
  disabled,
}: {
  children: ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(224,34,20,0.08)] px-3 py-1.5 text-[12.5px] font-medium text-[#b91404] transition-colors hover:bg-[rgba(224,34,20,0.15)] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div>
      {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
      <label
        htmlFor={htmlFor}
        className="block font-mono text-[10.5px] font-semibold uppercase text-[#6b6459]"
        style={{ letterSpacing: "0.24em" }}
      >
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {hint && !error && (
        <p className="mt-1.5 text-[12px] text-[#6b6459]">{hint}</p>
      )}
      {error && (
        <p className="mt-1.5 text-[12.5px] font-medium text-[#b91404]">
          {error}
        </p>
      )}
    </div>
  );
}

export const inputCls =
  "block w-full rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.15)] bg-white px-4 py-3 text-[14.5px] text-[#141210] focus:border-[#e02214]/40 focus:outline-none focus:ring-2 focus:ring-[#e02214]/20";

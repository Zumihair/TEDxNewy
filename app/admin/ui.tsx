import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Tight, reusable admin chrome primitives. All live in one file so admin
 * pages stay short and stylistically aligned.
 */

// The page header is a client component (it reads the route to colour itself
// by section); re-exported here so pages keep importing it from "../ui".
export { PageHeader } from "./PageHeader";

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
  tone?: "neutral" | "red" | "live" | "soon" | "draft";
  children: ReactNode;
}) {
  const styles: Record<typeof tone, string> = {
    neutral: "bg-[rgba(20,18,16,0.06)] text-[#6b6459]",
    red: "bg-[#e02214]/10 text-[#b91404]",
    live: "bg-[#22c55e]/15 text-[#15803d]",
    soon: "bg-[rgba(20,18,16,0.06)] text-[#6b6459]",
    draft: "bg-[#f59e0b]/15 text-[#a16207]",
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

// Client component (reads the route to colour its accent dot); re-exported so
// pages keep importing it from "../ui".
export { SectionLabel } from "./SectionLabel";

// Large stat number on a dark band (tickets, partners summary rows) — not to
// be confused with StatChip, which is the light-background tile version.
export function BandStat({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone?: "good";
}) {
  return (
    <div>
      <div
        className={`font-sans text-[clamp(1.9rem,3.4vw,2.6rem)] font-medium leading-none tracking-[-0.03em] tabular-nums ${
          tone === "good" ? "text-[#8fd0a2]" : "text-white"
        }`}
        style={{ fontVariationSettings: '"opsz" 144' }}
      >
        {value}
      </div>
      <div className="mt-2 text-[12.5px] leading-[1.45] text-[rgba(255,255,255,0.62)]">
        {label}
      </div>
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
      className={`rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.08)] bg-white shadow-[var(--shadow-sm)] ${className}`}
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
  onClick,
}: {
  children: ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  name?: string;
  value?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      name={name}
      value={value}
      onClick={onClick}
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
  onClick,
}: {
  children: ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  name?: string;
  value?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      name={name}
      value={value}
      onClick={onClick}
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
  onClick,
}: {
  children: ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
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

/**
 * The house tab bar: an underline row, red-underline + dark text when active.
 * One definition so every tabbed admin page (newsletter campaigns, media,
 * anywhere else that grows tabs) reads the same. Plain links to a `?tab=`
 * query param, so it works with no client JS — the page re-renders server
 * side for the selected tab.
 */
export function TabBar({
  tabs,
  active,
  hrefFor,
}: {
  tabs: { key: string; label: string }[];
  active: string;
  hrefFor: (key: string) => string;
}) {
  return (
    <div className="flex items-center gap-1 border-b border-[rgba(20,18,16,0.10)]">
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <Link
            key={t.key}
            href={hrefFor(t.key)}
            className={
              "-mb-px border-b-2 px-4 py-2.5 text-[13.5px] font-medium transition-colors " +
              (isActive
                ? "border-[#e02214] text-[#141210]"
                : "border-transparent text-[#6b6459] hover:text-[#141210]")
            }
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

export const inputCls =
  "block w-full rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.15)] bg-white px-4 py-3 text-[14.5px] text-[#141210] focus:border-[#e02214]/40 focus:outline-none focus:ring-2 focus:ring-[#e02214]/20";

/**
 * Friendly "the database update hasn't been applied yet" state, shown by admin
 * pages whose tables don't exist yet so they never crash before the migration
 * is run.
 */
export function NotSetUp({
  title = "Not set up yet",
  children,
}: {
  title?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-dashed border-[rgba(20,18,16,0.18)] bg-[#f9f5ec] px-6 py-14 text-center">
      <div className="font-sans text-[17px] font-medium text-[#141210]">
        {title}
      </div>
      <p className="mx-auto mt-2 max-w-[52ch] text-[13.5px] leading-[1.6] text-[#6b6459]">
        {children ??
          "This feature needs a database update before it can be used. Ask Will to run the database update, then reload this page."}
      </p>
    </div>
  );
}

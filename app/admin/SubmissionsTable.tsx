"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Copy,
  Download,
  ExternalLink,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Badge, Card, DangerButton } from "./ui";

/**
 * Reusable submissions viewer used by every form's /admin/* page.
 *
 * Each row is a plain object keyed by column.id. The component handles:
 *  - Live filtering across the configured `searchKeys`
 *  - A compact headline row: when submitted + the `headline` columns
 *  - "View details" → a modal with the full record + copy + delete
 *  - One-click CSV export of the currently-filtered view
 *
 * Columns are declarative (no functions) so a server component can pass them
 * across the server → client boundary.
 */

export type Row = Record<string, unknown> & {
  id: string;
  created_at: string;
};

export type Column = {
  /** Property key on the row */
  id: string;
  /** Column header */
  label: string;
  /** Show this column in the compact headline row (not just the modal). */
  headline?: boolean;
  /** Render in the modal only, never in the headline row. */
  detailOnly?: boolean;
  /** Mono styling for the value. */
  mono?: boolean;
  /** Turn the value into an anchor. "url" extracts the first http(s) URL. */
  link?: "mailto" | "tel" | "url";
  /** Anchor text override (e.g. "Watch entry" instead of the raw URL). */
  linkLabel?: string;
  /** Render the value as a coloured Badge. */
  badge?: "red" | "neutral";
  /** Render a boolean as Yes / No. */
  boolean?: boolean;
  /** Prefix prepended to a non-empty value when displayed (e.g. "via "). */
  prefix?: string;
  /** Join these row fields with a space and show as this column's value. */
  combine?: string[];
};

type Props = {
  rows: Row[];
  columns: Column[];
  /** Property keys that get searched against */
  searchKeys: string[];
  /** Server action: form posts { id } */
  deleteAction: (formData: FormData) => Promise<void>;
  /** Filename stem for CSV export — e.g. "subscribers" */
  exportName: string;
  /** Opt into a spam heuristic by preset name (see SPAM_PRESETS). */
  spamPreset?: keyof typeof SPAM_PRESETS;
};

/**
 * Spam heuristics, keyed by a serialisable preset name so a server component
 * can opt in without passing a function across the boundary.
 */
const SPAM_PRESETS: Record<string, (row: Row) => boolean> = {
  contact(row) {
    const msg = String(row.message ?? "").toLowerCase();
    const email = String(row.email ?? "").toLowerCase();
    const tells = [
      "seo",
      "google 1st page",
      "first page of google",
      "rocketdigitaltech",
      "money robot",
      "moneyrobot",
      "ethical marketing",
      "organic clients",
      "website design",
      "online visibility",
      "best regards",
    ];
    const hits = tells.filter((t) => msg.includes(t)).length;
    if (hits >= 2) return true;
    if (email.includes("rocketdigitaltech")) return true;
    if (hits >= 1 && /^\d{10}$/.test(String(row.phone ?? ""))) return true;
    return false;
  },
};

/** Joined / prefixed / boolean display string for a column's value. */
function cellText(col: Column, row: Row): string {
  if (col.combine) {
    return col.combine
      .map((k) => row[k])
      .filter(Boolean)
      .map(String)
      .join(" ");
  }
  const v = row[col.id];
  if (col.boolean) return v ? "Yes" : "No";
  if (v == null) return "";
  const s = String(v);
  if (!s) return "";
  return col.prefix ? `${col.prefix}${s}` : s;
}

/** Anchor href for a column, or null when there's nothing to link. */
function cellHref(col: Column, row: Row): string | null {
  if (!col.link) return null;
  const raw = row[col.id];
  if (raw == null || raw === "") return null;
  const s = String(raw);
  switch (col.link) {
    case "mailto":
      return `mailto:${s}`;
    case "tel":
      return `tel:${s}`;
    case "url": {
      const m = s.match(/https?:\/\/\S+/);
      return m?.[0] ?? null;
    }
    default:
      return null;
  }
}

export default function SubmissionsTable({
  rows,
  columns,
  searchKeys,
  deleteAction,
  exportName,
  spamPreset,
}: Props) {
  const [q, setQ] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hideSpam, setHideSpam] = useState(false);

  const isLikelySpam = spamPreset ? SPAM_PRESETS[spamPreset] : undefined;

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((row) => {
      if (hideSpam && isLikelySpam?.(row)) return false;
      if (!needle) return true;
      return searchKeys.some((key) => {
        const v = row[key];
        if (v == null) return false;
        return String(v).toLowerCase().includes(needle);
      });
    });
  }, [rows, q, searchKeys, hideSpam, isLikelySpam]);

  const spamCount = useMemo(
    () => (isLikelySpam ? rows.filter(isLikelySpam).length : 0),
    [rows, isLikelySpam],
  );

  // Columns to surface in the compact row. Falls back to the first two
  // non-detail columns when no `headline` flags are set.
  const headlineCols = useMemo(() => {
    const flagged = columns.filter((c) => c.headline && !c.detailOnly);
    if (flagged.length > 0) return flagged;
    return columns.filter((c) => !c.detailOnly).slice(0, 2);
  }, [columns]);
  const [primaryCol, ...secondaryCols] = headlineCols;

  const activeRow = activeId
    ? (filtered.find((r) => r.id === activeId) ?? null)
    : null;

  const downloadCsv = () => {
    const headers = ["created_at", ...columns.map((c) => c.id)];
    const escape = (s: string) =>
      `"${s.replace(/"/g, '""').replace(/\r?\n/g, " ").trim()}"`;
    const csv = [
      headers.join(","),
      ...filtered.map((r) =>
        headers
          .map((h) => {
            const v = r[h];
            if (v == null) return "";
            return escape(String(v));
          })
          .join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `${exportName}-${today}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 md:max-w-[480px]">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b6459]"
            strokeWidth={2.25}
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${searchKeys.join(", ")}…`}
            className="block w-full rounded-full border border-[rgba(20,18,16,0.10)] bg-white py-2.5 pl-10 pr-9 text-[13.5px] text-[#141210] placeholder:text-[#6b6459] focus:border-[#e02214]/40 focus:outline-none focus:ring-2 focus:ring-[#e02214]/20"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[#6b6459] hover:bg-[rgba(20,18,16,0.06)] hover:text-[#141210]"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isLikelySpam && spamCount > 0 && (
            <button
              type="button"
              onClick={() => setHideSpam((v) => !v)}
              className={
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors " +
                (hideSpam
                  ? "bg-[#141210] text-white hover:bg-[#000]"
                  : "bg-[rgba(20,18,16,0.06)] text-[#141210] hover:bg-[rgba(20,18,16,0.10)]")
              }
            >
              {hideSpam ? "Showing real only" : `Hide ${spamCount} likely spam`}
            </button>
          )}
          <button
            type="button"
            onClick={downloadCsv}
            className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-3.5 py-1.5 text-[12px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={2.25} />
            CSV ({filtered.length})
          </button>
        </div>
      </div>

      {/* List */}
      <div className="mt-6">
        {filtered.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-dashed border-[rgba(20,18,16,0.15)] bg-[#f9f5ec] px-6 py-16 text-center">
            <p className="text-[15px] text-[#2a2521]">
              {q
                ? "No submissions match that search."
                : hideSpam
                  ? "Nothing left after hiding spam."
                  : "No submissions yet."}
            </p>
          </div>
        ) : (
          <Card>
            <ul className="divide-y divide-[rgba(20,18,16,0.08)]">
              {filtered.map((row) => {
                const spam = isLikelySpam?.(row) ?? false;
                const primary = primaryCol ? cellText(primaryCol, row) : "";
                const secondary = secondaryCols
                  .map((c) => cellText(c, row))
                  .filter(Boolean);
                return (
                  <li
                    key={row.id}
                    className={
                      "flex items-center gap-4 px-4 py-3.5 md:px-5 " +
                      (spam ? "bg-[rgba(20,18,16,0.02)]" : "")
                    }
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <span className="text-[14.5px] font-semibold text-[#141210]">
                          {primary || "—"}
                        </span>
                        {primaryCol?.badge && primary && (
                          <Badge tone={primaryCol.badge}>{primary}</Badge>
                        )}
                        {spam && <Badge tone="neutral">Likely spam</Badge>}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[12px] text-[#6b6459]">
                        <span className="font-mono">
                          {formatDateTime(row.created_at)}
                        </span>
                        {secondary.map((s, i) => (
                          <span
                            key={i}
                            className="flex items-center gap-2.5 before:text-[#c4bdb0] before:content-['·']"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveId(row.id)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-3.5 py-1.5 text-[12.5px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
                    >
                      View details
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>

      {activeRow && (
        <DetailModal
          row={activeRow}
          columns={columns}
          deleteAction={deleteAction}
          onClose={() => setActiveId(null)}
        />
      )}
    </>
  );
}

function DetailModal({
  row,
  columns,
  deleteAction,
  onClose,
}: {
  row: Row;
  columns: Column[];
  deleteAction: (formData: FormData) => Promise<void>;
  onClose: () => void;
}) {
  // Close on ESC + lock background scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 md:items-center md:p-6">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/45"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[88vh] w-full max-w-[640px] flex-col overflow-hidden rounded-t-[var(--radius-md)] bg-white md:rounded-[var(--radius-md)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[rgba(20,18,16,0.08)] px-5 py-4 md:px-6">
          <div className="min-w-0">
            <div
              className="font-mono text-[10px] font-semibold uppercase text-[#6b6459]"
              style={{ letterSpacing: "0.22em" }}
            >
              {formatDateTime(row.created_at, true)}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[rgba(20,18,16,0.06)] text-[#141210] hover:bg-[rgba(20,18,16,0.12)]"
          >
            <X className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 md:px-6">
          <dl className="grid gap-3">
            {columns.map((col) => {
              const v = row[col.id];
              if (!col.boolean && (v == null || v === "")) return null;
              const href = cellHref(col, row);
              const text = cellText(col, row);
              return (
                <div
                  key={col.id}
                  className="grid grid-cols-1 gap-1 md:grid-cols-[150px_1fr] md:gap-4"
                >
                  <dt
                    className="font-mono text-[10.5px] font-semibold uppercase text-[#6b6459]"
                    style={{ letterSpacing: "0.22em" }}
                  >
                    {col.label}
                  </dt>
                  <dd className="whitespace-pre-wrap text-[13.5px] leading-[1.6] text-[#141210]">
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 underline decoration-[#e02214]/40 underline-offset-2 hover:text-[#e02214]"
                      >
                        {col.linkLabel ?? text ?? String(v)}
                        <ExternalLink className="h-3 w-3" strokeWidth={2.25} />
                      </a>
                    ) : col.badge ? (
                      <Badge tone={col.badge}>{text}</Badge>
                    ) : (
                      text
                    )}
                  </dd>
                </div>
              );
            })}
            {row.ip != null && row.ip !== "" && (
              <div className="grid grid-cols-1 gap-1 md:grid-cols-[150px_1fr] md:gap-4">
                <dt
                  className="font-mono text-[10.5px] font-semibold uppercase text-[#6b6459]"
                  style={{ letterSpacing: "0.22em" }}
                >
                  IP
                </dt>
                <dd className="font-mono text-[12px] text-[#6b6459]">
                  {String(row.ip)}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[rgba(20,18,16,0.08)] px-5 py-4 md:px-6">
          <CopyAllButton row={row} columns={columns} />
          <form action={deleteAction}>
            <input type="hidden" name="id" value={row.id} />
            <DangerButton type="submit">
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
              Delete
            </DangerButton>
          </form>
        </div>
      </div>
    </div>
  );
}

function CopyAllButton({ row, columns }: { row: Row; columns: Column[] }) {
  const [copied, setCopied] = useState(false);
  const text = [
    `Submitted: ${formatDateTime(row.created_at, true)}`,
    ...columns
      .map((c) => {
        const value = cellText(c, row);
        if (!value) return null;
        return `${c.label}: ${value}`;
      })
      .filter(Boolean),
  ].join("\n");

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };
  return (
    <button
      type="button"
      onClick={onCopy}
      className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-3 py-1.5 text-[12px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
    >
      <Copy className="h-3.5 w-3.5" strokeWidth={2.25} />
      {copied ? "Copied" : "Copy details"}
    </button>
  );
}

function formatDateTime(iso: string, full = false): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  if (full) {
    return d.toLocaleString("en-AU", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return d.toLocaleString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
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
 *  - Date-desc sort by `created_at`
 *  - Expand/collapse to reveal the full record + a CSV-ready dump
 *  - Per-row delete via a server action (form action prop)
 *  - One-click CSV export of the currently-filtered view
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
  /** Optional formatter — string or React node */
  format?: (value: unknown, row: Row) => React.ReactNode;
  /** Tailwind width hint */
  width?: string;
  /** Render in the expanded detail block instead of the row */
  detailOnly?: boolean;
  /** If true, render as a single mono span with copy-on-click */
  mono?: boolean;
  /** Optional link href fn — turns the value into an anchor */
  hrefFor?: (value: unknown, row: Row) => string | null;
};

type Props = {
  rows: Row[];
  /** Columns shown in the table row (in addition to date + actions) */
  columns: Column[];
  /** Property keys that get searched against */
  searchKeys: string[];
  /** Server action: form posts { id } */
  deleteAction: (formData: FormData) => Promise<void>;
  /** Filename stem for CSV export — e.g. "subscribers" */
  exportName: string;
  /** Optional "Spam?" predicate to highlight + offer 1-click delete */
  isLikelySpam?: (row: Row) => boolean;
};

export default function SubmissionsTable({
  rows,
  columns,
  searchKeys,
  deleteAction,
  exportName,
  isLikelySpam,
}: Props) {
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [hideSpam, setHideSpam] = useState(false);

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

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const downloadCsv = () => {
    const headers = ["created_at", ...columns.map((c) => c.id)];
    const escape = (s: string) => `"${s.replace(/"/g, '""').replace(/\r?\n/g, " ").trim()}"`;
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

  const rowColumns = columns.filter((c) => !c.detailOnly);

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

      {/* Table */}
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
                const isExpanded = expanded.has(row.id);
                const spam = isLikelySpam?.(row) ?? false;
                return (
                  <li
                    key={row.id}
                    className={spam ? "bg-[rgba(20,18,16,0.02)]" : ""}
                  >
                    <button
                      type="button"
                      onClick={() => toggle(row.id)}
                      className="w-full px-4 py-3.5 text-left transition-colors hover:bg-[rgba(20,18,16,0.03)] md:px-5"
                      aria-expanded={isExpanded}
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className={
                            "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors " +
                            (isExpanded
                              ? "bg-[#141210] text-white"
                              : "bg-[rgba(20,18,16,0.06)] text-[#6b6459]")
                          }
                          aria-hidden
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5" strokeWidth={2.25} />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.25} />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            {rowColumns.map((col) => {
                              const v = row[col.id];
                              const formatted = col.format
                                ? col.format(v, row)
                                : v == null
                                  ? ""
                                  : String(v);
                              return (
                                <span
                                  key={col.id}
                                  className={
                                    col.mono
                                      ? "font-mono text-[11.5px] text-[#6b6459]"
                                      : "text-[13.5px] font-medium text-[#141210]"
                                  }
                                >
                                  {formatted}
                                </span>
                              );
                            })}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[#6b6459]">
                            <span>{formatDateTime(row.created_at)}</span>
                            {spam && <Badge tone="neutral">Likely spam</Badge>}
                          </div>
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-[rgba(20,18,16,0.06)] bg-[#f9f5ec] px-4 py-5 md:px-5">
                        <dl className="grid gap-3">
                          {columns.map((col) => {
                            const v = row[col.id];
                            if (v == null || v === "") return null;
                            const href = col.hrefFor?.(v, row) ?? null;
                            return (
                              <div
                                key={col.id}
                                className="grid grid-cols-1 gap-1 md:grid-cols-[140px_1fr] md:gap-4"
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
                                      {String(v)}
                                      <ExternalLink
                                        className="h-3 w-3"
                                        strokeWidth={2.25}
                                      />
                                    </a>
                                  ) : col.format ? (
                                    col.format(v, row)
                                  ) : (
                                    String(v)
                                  )}
                                </dd>
                              </div>
                            );
                          })}
                          <div className="grid grid-cols-1 gap-1 md:grid-cols-[140px_1fr] md:gap-4">
                            <dt
                              className="font-mono text-[10.5px] font-semibold uppercase text-[#6b6459]"
                              style={{ letterSpacing: "0.22em" }}
                            >
                              Submitted
                            </dt>
                            <dd className="text-[13px] text-[#141210]">
                              {formatDateTime(row.created_at, true)}
                            </dd>
                          </div>
                          {row.ip != null && row.ip !== "" && (
                            <div className="grid grid-cols-1 gap-1 md:grid-cols-[140px_1fr] md:gap-4">
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

                        <div className="mt-5 flex items-center justify-between gap-3 border-t border-[rgba(20,18,16,0.08)] pt-4">
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
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>
    </>
  );
}

function CopyAllButton({ row, columns }: { row: Row; columns: Column[] }) {
  const [copied, setCopied] = useState(false);
  const text = [
    `Submitted: ${formatDateTime(row.created_at, true)}`,
    ...columns
      .map((c) => {
        const v = row[c.id];
        if (v == null || v === "") return null;
        return `${c.label}: ${String(v)}`;
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
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

"use client";

import { useEffect, useMemo, useOptimistic, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
  ChevronRight,
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
  /** Present once the page passes a `contactedAction`; tracked per submission. */
  contacted?: boolean;
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
  /**
   * Server action: form posts { id, contacted }. Passing this opts the table
   * into "contacted" tracking — a tick per row plus an All / Uncontacted /
   * Contacted filter. Omit it and the table behaves exactly as before.
   */
  contactedAction?: (formData: FormData) => Promise<void>;
};

type ContactFilter = "all" | "uncontacted" | "contacted";

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
  contactedAction,
}: Props) {
  const [q, setQ] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hideSpam, setHideSpam] = useState(false);
  const [contactFilter, setContactFilter] = useState<ContactFilter>("all");

  // A delete that hits an RLS wall (or any error) redirects back with
  // ?error=delete. Surface it so the action can't fail silently.
  const deleteFailed = useSearchParams().get("error") === "delete";

  const contactEnabled = Boolean(contactedAction);
  const isLikelySpam = spamPreset ? SPAM_PRESETS[spamPreset] : undefined;

  // Optimistic layer over the server rows: ticking a row updates instantly,
  // then the server action persists and revalidates. `rows` stays the source
  // of truth, so once revalidation lands the optimistic value just matches.
  const [optimisticRows, setContacted] = useOptimistic(
    rows,
    (state, { id, contacted }: { id: string; contacted: boolean }) =>
      state.map((r) => (r.id === id ? { ...r, contacted } : r)),
  );
  const [, startTransition] = useTransition();

  const onToggleContacted = (row: Row) => {
    if (!contactedAction) return;
    const next = !row.contacted;
    startTransition(async () => {
      setContacted({ id: row.id, contacted: next });
      const fd = new FormData();
      fd.set("id", row.id);
      fd.set("contacted", next ? "1" : "0");
      await contactedAction(fd);
    });
  };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return optimisticRows.filter((row) => {
      if (hideSpam && isLikelySpam?.(row)) return false;
      if (contactEnabled) {
        if (contactFilter === "contacted" && !row.contacted) return false;
        if (contactFilter === "uncontacted" && row.contacted) return false;
      }
      if (!needle) return true;
      return searchKeys.some((key) => {
        const v = row[key];
        if (v == null) return false;
        return String(v).toLowerCase().includes(needle);
      });
    });
  }, [
    optimisticRows,
    q,
    searchKeys,
    hideSpam,
    isLikelySpam,
    contactEnabled,
    contactFilter,
  ]);

  const spamCount = useMemo(
    () => (isLikelySpam ? optimisticRows.filter(isLikelySpam).length : 0),
    [optimisticRows, isLikelySpam],
  );

  // Counts for the All / Uncontacted / Contacted control. Based on the full
  // set (search + spam filters don't move these numbers) so they stay stable.
  const contactedCount = useMemo(
    () => optimisticRows.filter((r) => r.contacted).length,
    [optimisticRows],
  );
  const totalCount = optimisticRows.length;

  // Columns to surface in the compact row. Falls back to the first two
  // non-detail columns when no `headline` flags are set.
  const headlineCols = useMemo(() => {
    const flagged = columns.filter((c) => c.headline && !c.detailOnly);
    if (flagged.length > 0) return flagged;
    return columns.filter((c) => !c.detailOnly).slice(0, 2);
  }, [columns]);
  const [primaryCol, ...secondaryCols] = headlineCols;

  // Look up the open row in the full set, not `filtered`, so toggling its
  // contacted state in the modal doesn't yank it out from under the filter.
  const activeRow = activeId
    ? (optimisticRows.find((r) => r.id === activeId) ?? null)
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
      {deleteFailed && (
        <div className="mb-4 rounded-[var(--radius-md)] border border-[#e02214]/30 bg-[#e02214]/10 px-4 py-3 text-[13.5px] text-[#b91404]">
          That delete didn&rsquo;t go through — the row is still here. If this
          keeps happening, the table is likely missing its &ldquo;admins can
          delete&rdquo; RLS policy in Supabase.
        </div>
      )}

      {/* Contacted filter — All / Uncontacted / Contacted */}
      {contactEnabled && (
        <div className="mb-4 inline-flex items-center gap-0.5 rounded-full bg-[rgba(20,18,16,0.06)] p-1">
          {(
            [
              ["all", "All", totalCount],
              ["uncontacted", "Uncontacted", totalCount - contactedCount],
              ["contacted", "Contacted", contactedCount],
            ] as const
          ).map(([value, label, count]) => {
            const active = contactFilter === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setContactFilter(value)}
                aria-pressed={active}
                className={
                  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors " +
                  (active
                    ? "bg-white text-[#141210] shadow-[0_1px_2px_rgba(20,18,16,0.10)]"
                    : "text-[#6b6459] hover:text-[#141210]")
                }
              >
                {label}
                <span
                  className={
                    "tabular-nums " +
                    (active ? "text-[#6b6459]" : "text-[#a59f93]")
                  }
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

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
                const contacted = Boolean(row.contacted);
                return (
                  <li key={row.id}>
                    <div
                      className={
                        "group flex items-center transition-colors hover:bg-[rgba(20,18,16,0.03)] " +
                        (spam ? "bg-[rgba(20,18,16,0.02)]" : "")
                      }
                    >
                      {contactEnabled && (
                        <ContactCheckbox
                          checked={contacted}
                          name={primary}
                          onToggle={() => onToggleContacted(row)}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => setActiveId(row.id)}
                        aria-label={`View details for ${primary || "submission"}`}
                        className={
                          "flex flex-1 items-center gap-4 py-3.5 text-left " +
                          (contactEnabled
                            ? "pl-2 pr-4 md:pr-5"
                            : "px-4 md:px-5")
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
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[rgba(20,18,16,0.06)] px-3.5 py-1.5 text-[12.5px] font-medium text-[#141210] transition-colors group-hover:bg-[rgba(20,18,16,0.12)]">
                          View details
                          <ChevronRight
                            className="h-3.5 w-3.5"
                            strokeWidth={2.25}
                          />
                        </span>
                      </button>
                    </div>
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
          contactEnabled={contactEnabled}
          onToggleContacted={() => onToggleContacted(activeRow)}
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
  contactEnabled,
  onToggleContacted,
}: {
  row: Row;
  columns: Column[];
  deleteAction: (formData: FormData) => Promise<void>;
  onClose: () => void;
  contactEnabled: boolean;
  onToggleContacted: () => void;
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
          {contactEnabled && (
            <button
              type="button"
              onClick={onToggleContacted}
              aria-pressed={Boolean(row.contacted)}
              className={
                "mb-5 flex w-full items-center gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-left transition-colors " +
                (row.contacted
                  ? "border-[#141210]/15 bg-[rgba(20,18,16,0.04)]"
                  : "border-[rgba(20,18,16,0.12)] bg-white hover:bg-[rgba(20,18,16,0.03)]")
              }
            >
              <CheckBoxVisual checked={Boolean(row.contacted)} />
              <span className="text-[13.5px] font-medium text-[#141210]">
                {row.contacted ? "Contacted" : "Mark as contacted"}
              </span>
            </button>
          )}
          <dl className="grid gap-3">
            {columns.map((col) => {
              const v = row[col.id];
              if (!col.boolean && (v == null || v === "")) return null;
              const href = cellHref(col, row);
              const text = cellText(col, row);
              // Emails + phones aren't links — admins copy them to paste into
              // their own mail/dialler app. URLs stay clickable.
              const isCopy = col.link === "mailto" || col.link === "tel";
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
                    {isCopy ? (
                      <CopyValue value={text || String(v)} />
                    ) : href ? (
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

/** The square tick itself — dark ink when checked, matching the admin chrome. */
function CheckBoxVisual({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={
        "inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border transition-colors " +
        (checked
          ? "border-[#141210] bg-[#141210] text-white"
          : "border-[rgba(20,18,16,0.25)] bg-white text-transparent")
      }
    >
      <Check className="h-3.5 w-3.5" strokeWidth={3} />
    </span>
  );
}

/** List-row contacted tick. A real checkbox so it's keyboard + screen-reader friendly. */
function ContactCheckbox({
  checked,
  name,
  onToggle,
}: {
  checked: boolean;
  name: string;
  onToggle: () => void;
}) {
  return (
    <label
      className="flex shrink-0 cursor-pointer items-center self-stretch pl-4 pr-1 md:pl-5"
      title={checked ? "Contacted — click to unmark" : "Mark as contacted"}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        aria-label={`Mark ${name || "submission"} as contacted`}
        className="peer sr-only"
      />
      <span className="transition-transform peer-focus-visible:ring-2 peer-focus-visible:ring-[#141210]/30 peer-focus-visible:ring-offset-1 peer-focus-visible:rounded-md group-hover:scale-105">
        <CheckBoxVisual checked={checked} />
      </span>
    </label>
  );
}

function CopyValue({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="break-all">{value}</span>
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[rgba(20,18,16,0.06)] px-2 py-0.5 text-[11.5px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.12)]"
      >
        <Copy className="h-3 w-3" strokeWidth={2.25} />
        {copied ? "Copied" : "Copy"}
      </button>
    </span>
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

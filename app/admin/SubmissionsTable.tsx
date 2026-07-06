"use client";

import { useEffect, useMemo, useOptimistic, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Mail,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Badge, Card } from "./ui";
import { PendingDangerButton } from "./PendingButtons";
import { useConfirm } from "./ConfirmDialog";

/**
 * Reusable submissions viewer used by every form's /admin/* page.
 *
 * Each row is a plain object keyed by column.id. The component handles:
 *  - Live filtering across the configured `searchKeys`
 *  - A compact headline row: when submitted + the `headline` columns
 *  - "View details" → a modal with the full record + copy + delete
 *  - One-click CSV export of the currently-filtered view
 *  - Bulk selection (delete / mark contacted / export) when the matching
 *    bulk actions are passed
 *  - An optional applicant status pipeline (e.g. new → accepted → declined)
 *    when `statuses` + `statusAction` are passed
 *
 * Columns are declarative (no functions) so a server component can pass them
 * across the server → client boundary.
 */

export type Row = Record<string, unknown> & {
  id: string;
  created_at: string;
  /** Present once the page passes a `contactedAction`; tracked per submission. */
  contacted?: boolean;
  /** Present once the page passes `statuses`; the pipeline stage. */
  status?: string;
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

/** One stage in an applicant pipeline (e.g. New / Accepted / Declined). */
export type StatusOption = {
  value: string;
  label: string;
  tone: "neutral" | "red" | "live" | "soon" | "draft";
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
  /**
   * Server action: form posts { ids } (comma-separated). Passing this opts
   * the table into bulk selection with a "Delete selected" action.
   */
  bulkDeleteAction?: (formData: FormData) => Promise<void>;
  /**
   * Server action: form posts { ids, contacted }. Adds bulk "Mark contacted /
   * uncontacted" to the selection bar. Only meaningful with contactedAction.
   */
  bulkContactedAction?: (formData: FormData) => Promise<void>;
  /**
   * The applicant pipeline stages. Passing this (with statusAction) opts the
   * table into status tracking — a per-stage filter, a badge per row, and a
   * setter in the detail modal.
   */
  statuses?: StatusOption[];
  /** Server action: form posts { id, status }. */
  statusAction?: (formData: FormData) => Promise<void>;
  /**
   * The status value that counts as "in the pool" for the Email button.
   * Defaults to "accepted".
   */
  acceptedStatus?: string;
  /** Row field holding the email, used by the Email button. Defaults to "email". */
  emailField?: string;
  /**
   * Optional live head-count breakdown of the currently-filtered rows. Each
   * bucket counts every field in `fields` whose value is one of `values`,
   * summed across the in-view rows — so listing both the registrant and the
   * guest attendance field counts guests as their own person. Reflects every
   * active filter, so it updates as you switch status tabs.
   */
  breakdown?: {
    buckets: { label: string; fields: string[]; values: string[] }[];
  };
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
  bulkDeleteAction,
  bulkContactedAction,
  statuses,
  statusAction,
  acceptedStatus = "accepted",
  emailField = "email",
  breakdown,
}: Props) {
  const [q, setQ] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hideSpam, setHideSpam] = useState(false);
  const [contactFilter, setContactFilter] = useState<ContactFilter>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { confirm, dialogs } = useConfirm();

  // A delete that hits a permissions wall (or any error) redirects back with
  // ?error=delete. Surface it so the action can't fail silently.
  const deleteFailed = useSearchParams().get("error") === "delete";

  const contactEnabled = Boolean(contactedAction);
  const statusEnabled = Boolean(statuses && statusAction);
  const bulkEnabled = Boolean(bulkDeleteAction || bulkContactedAction);
  const isLikelySpam = spamPreset ? SPAM_PRESETS[spamPreset] : undefined;

  // Optimistic layer over the server rows: ticking a row (or a batch) updates
  // instantly, then the server action persists and revalidates. `rows` stays
  // the source of truth, so once revalidation lands the values just match.
  const [optimisticRows, applyPatch] = useOptimistic(
    rows,
    (state, { ids, patch }: { ids: string[]; patch: Partial<Row> }) =>
      state.map((r) => (ids.includes(r.id) ? { ...r, ...patch } : r)),
  );
  const [, startTransition] = useTransition();

  const onToggleContacted = (row: Row) => {
    if (!contactedAction) return;
    const next = !row.contacted;
    startTransition(async () => {
      applyPatch({ ids: [row.id], patch: { contacted: next } });
      const fd = new FormData();
      fd.set("id", row.id);
      fd.set("contacted", next ? "1" : "0");
      await contactedAction(fd);
    });
  };

  const onSetStatus = (row: Row, status: string) => {
    if (!statusAction || row.status === status) return;
    startTransition(async () => {
      applyPatch({ ids: [row.id], patch: { status } });
      const fd = new FormData();
      fd.set("id", row.id);
      fd.set("status", status);
      await statusAction(fd);
    });
  };

  const statusByValue = useMemo(() => {
    const m = new Map<string, StatusOption>();
    (statuses ?? []).forEach((s) => m.set(s.value, s));
    return m;
  }, [statuses]);

  /** The stage a row sits in, defaulting to the first configured stage. */
  const rowStatus = (row: Row): string =>
    String(row.status ?? statuses?.[0]?.value ?? "");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return optimisticRows.filter((row) => {
      if (hideSpam && isLikelySpam?.(row)) return false;
      if (contactEnabled) {
        if (contactFilter === "contacted" && !row.contacted) return false;
        if (contactFilter === "uncontacted" && row.contacted) return false;
      }
      if (statusEnabled && statusFilter !== "all") {
        if (rowStatus(row) !== statusFilter) return false;
      }
      if (!needle) return true;
      return searchKeys.some((key) => {
        const v = row[key];
        if (v == null) return false;
        return String(v).toLowerCase().includes(needle);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    optimisticRows,
    q,
    searchKeys,
    hideSpam,
    isLikelySpam,
    contactEnabled,
    contactFilter,
    statusEnabled,
    statusFilter,
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

  // Per-stage counts for the status pipeline control.
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (statusEnabled) {
      optimisticRows.forEach((r) => {
        const s = rowStatus(r);
        counts[s] = (counts[s] ?? 0) + 1;
      });
    }
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optimisticRows, statusEnabled, statuses]);

  // Accepted-pool emails, for the "Email accepted" button. De-duplicated and
  // lower-cased so the same address never lands in the compose box twice.
  const acceptedEmails = useMemo(() => {
    if (!statusEnabled) return [] as string[];
    const seen = new Set<string>();
    optimisticRows.forEach((r) => {
      if (rowStatus(r) !== acceptedStatus) return;
      const e = String(r[emailField] ?? "").trim().toLowerCase();
      if (e) seen.add(e);
    });
    return [...seen];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optimisticRows, statusEnabled, acceptedStatus, emailField]);

  // Selection is held as a Set of ids. Intersect with what's currently in
  // view so a stale id (e.g. after a delete) never counts toward an action.
  const selectedInView = useMemo(
    () => filtered.filter((r) => selected.has(r.id)),
    [filtered, selected],
  );
  const selectedCount = selectedInView.length;
  const allInViewSelected =
    filtered.length > 0 && selectedCount === filtered.length;

  const toggleSelected = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleSelectAll = () =>
    setSelected((prev) => {
      // If everything in view is already selected, clear those; otherwise add
      // every visible row.
      const next = new Set(prev);
      if (allInViewSelected) {
        filtered.forEach((r) => next.delete(r.id));
      } else {
        filtered.forEach((r) => next.add(r.id));
      }
      return next;
    });

  const clearSelection = () => setSelected(new Set());

  const onBulkContacted = (contacted: boolean) => {
    if (!bulkContactedAction || selectedCount === 0) return;
    const ids = selectedInView.map((r) => r.id);
    startTransition(async () => {
      applyPatch({ ids, patch: { contacted } });
      const fd = new FormData();
      fd.set("ids", ids.join(","));
      fd.set("contacted", contacted ? "1" : "0");
      await bulkContactedAction(fd);
      clearSelection();
    });
  };

  const onBulkDelete = async () => {
    if (!bulkDeleteAction || selectedCount === 0) return;
    const ids = selectedInView.map((r) => r.id);
    const ok = await confirm({
      title: `Delete ${ids.length} submission${ids.length === 1 ? "" : "s"}?`,
      body: "This can't be undone.",
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("ids", ids.join(","));
      await bulkDeleteAction(fd);
      clearSelection();
    });
  };

  // Columns to surface in the compact row. Falls back to the first two
  // non-detail columns when no `headline` flags are set.
  const headlineCols = useMemo(() => {
    const flagged = columns.filter((c) => c.headline && !c.detailOnly);
    if (flagged.length > 0) return flagged;
    return columns.filter((c) => !c.detailOnly).slice(0, 2);
  }, [columns]);
  const [primaryCol, ...secondaryCols] = headlineCols;

  // Look up the open row in the full set, not `filtered`, so toggling its
  // contacted/status state in the modal doesn't yank it out from the filter.
  const activeRow = activeId
    ? (optimisticRows.find((r) => r.id === activeId) ?? null)
    : null;

  const exportRows = (rowsToExport: Row[], stem: string) => {
    const headers = ["created_at", ...columns.map((c) => c.id)];
    const escape = (s: string) =>
      `"${s.replace(/"/g, '""').replace(/\r?\n/g, " ").trim()}"`;
    const csv = [
      headers.join(","),
      ...rowsToExport.map((r) =>
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
    a.download = `${stem}-${today}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {dialogs}
      {deleteFailed && (
        <div className="mb-4 rounded-[var(--radius-md)] border border-[#e02214]/30 bg-[#e02214]/10 px-4 py-3 text-[13.5px] text-[#b91404]">
          That delete didn&rsquo;t go through, the row is still here. If this
          keeps happening, ask Will to check the delete permissions.
        </div>
      )}

      {/* Filters: status pipeline + contacted */}
      {(statusEnabled || contactEnabled) && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {statusEnabled && (
            <Segmented
              options={[
                { value: "all", label: "All", count: totalCount },
                ...(statuses ?? []).map((s) => ({
                  value: s.value,
                  label: s.label,
                  count: statusCounts[s.value] ?? 0,
                })),
              ]}
              active={statusFilter}
              onChange={setStatusFilter}
            />
          )}
          {contactEnabled && (
            <Segmented
              options={[
                { value: "all", label: "All", count: totalCount },
                {
                  value: "uncontacted",
                  label: "Uncontacted",
                  count: totalCount - contactedCount,
                },
                {
                  value: "contacted",
                  label: "Contacted",
                  count: contactedCount,
                },
              ]}
              active={contactFilter}
              onChange={(v) => setContactFilter(v as ContactFilter)}
            />
          )}
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

        <div className="flex flex-wrap items-center gap-2">
          {statusEnabled && (
            <a
              href={
                acceptedEmails.length
                  ? `/admin/emails?template=talk-night-confirmation&to=${encodeURIComponent(acceptedEmails.join(", "))}#compose`
                  : undefined
              }
              aria-disabled={acceptedEmails.length === 0}
              onClick={(e) => {
                if (acceptedEmails.length === 0) e.preventDefault();
              }}
              className={
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors " +
                (acceptedEmails.length
                  ? "bg-[#e02214] text-white hover:bg-[#b91404]"
                  : "cursor-not-allowed bg-[rgba(20,18,16,0.06)] text-[#a59f93]")
              }
              title={
                acceptedEmails.length
                  ? "Open the compose form pre-filled with every accepted applicant (each gets their own email)"
                  : "No accepted applicants yet"
              }
            >
              <Mail className="h-3.5 w-3.5" strokeWidth={2.25} />
              Email accepted ({acceptedEmails.length})
            </a>
          )}
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
            onClick={() => exportRows(filtered, exportName)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-3.5 py-1.5 text-[12px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={2.25} />
            CSV ({filtered.length})
          </button>
        </div>
      </div>

      {/* Bulk selection bar */}
      {bulkEnabled && filtered.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-[#f9f5ec] px-3.5 py-2.5">
          <label className="inline-flex cursor-pointer items-center gap-2.5 text-[12.5px] font-medium text-[#141210]">
            <input
              type="checkbox"
              checked={allInViewSelected}
              ref={(el) => {
                if (el)
                  el.indeterminate =
                    selectedCount > 0 && !allInViewSelected;
              }}
              onChange={toggleSelectAll}
              className="peer sr-only"
            />
            <span className="peer-focus-visible:ring-2 peer-focus-visible:ring-[#e02214]/40 peer-focus-visible:ring-offset-1 peer-focus-visible:rounded-md">
              <CheckBoxVisual
                checked={allInViewSelected}
                indeterminate={selectedCount > 0 && !allInViewSelected}
                tone="select"
              />
            </span>
            {selectedCount > 0 ? `${selectedCount} selected` : "Select all"}
          </label>

          {selectedCount > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {bulkContactedAction && (
                <>
                  <BulkBtn onClick={() => onBulkContacted(true)}>
                    Mark contacted
                  </BulkBtn>
                  <BulkBtn onClick={() => onBulkContacted(false)}>
                    Mark uncontacted
                  </BulkBtn>
                </>
              )}
              <BulkBtn
                onClick={() =>
                  exportRows(selectedInView, `${exportName}-selected`)
                }
              >
                <Download className="h-3.5 w-3.5" strokeWidth={2.25} />
                Export ({selectedCount})
              </BulkBtn>
              {bulkDeleteAction && (
                <button
                  type="button"
                  onClick={onBulkDelete}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(224,34,20,0.10)] px-3 py-1.5 text-[12px] font-medium text-[#b91404] transition-colors hover:bg-[rgba(224,34,20,0.18)]"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                  Delete ({selectedCount})
                </button>
              )}
              <button
                type="button"
                onClick={clearSelection}
                className="text-[12px] font-medium text-[#6b6459] underline-offset-2 hover:text-[#141210] hover:underline"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}

      {/* Live breakdown of the filtered view (e.g. speak vs listen) */}
      {breakdown && filtered.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-[#6b6459]">
          <span
            className="font-mono text-[10px] font-semibold uppercase text-[#a59f93]"
            style={{ letterSpacing: "0.2em" }}
          >
            In view
          </span>
          {breakdown.buckets.map((b) => {
            const n = filtered.reduce(
              (acc, r) =>
                acc +
                b.fields.filter((f) => b.values.includes(String(r[f] ?? "")))
                  .length,
              0,
            );
            return (
              <span key={b.label} className="tabular-nums">
                <strong className="font-semibold text-[#141210]">{n}</strong>{" "}
                {b.label}
              </span>
            );
          })}
        </div>
      )}

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
                const isSelected = selected.has(row.id);
                const statusOpt = statusEnabled
                  ? statusByValue.get(rowStatus(row))
                  : undefined;
                return (
                  <li key={row.id}>
                    <div
                      className={
                        "group flex items-center transition-colors hover:bg-[rgba(20,18,16,0.03)] " +
                        (isSelected ? "bg-[rgba(224,34,20,0.04)] " : "") +
                        (spam ? "bg-[rgba(20,18,16,0.02)]" : "")
                      }
                    >
                      {bulkEnabled && (
                        <SelectCheckbox
                          checked={isSelected}
                          name={primary}
                          onToggle={() => toggleSelected(row.id)}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => setActiveId(row.id)}
                        aria-label={`View details for ${primary || "submission"}`}
                        className={
                          "flex flex-1 items-center gap-4 py-3.5 text-left " +
                          (bulkEnabled ? "pl-2 pr-4 md:pr-5" : "px-4 md:px-5")
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
                            {statusOpt && (
                              <Badge tone={statusOpt.tone}>
                                {statusOpt.label}
                              </Badge>
                            )}
                            {contactEnabled && contacted && (
                              <Badge tone="live">Contacted</Badge>
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
          statuses={statusEnabled ? statuses : undefined}
          currentStatus={statusEnabled ? rowStatus(activeRow) : undefined}
          onSetStatus={(s) => onSetStatus(activeRow, s)}
        />
      )}
    </>
  );
}

/** A pill segmented control (All / … filters). */
function Segmented({
  options,
  active,
  onChange,
}: {
  options: { value: string; label: string; count: number }[];
  active: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full bg-[rgba(20,18,16,0.06)] p-1">
      {options.map(({ value, label, count }) => {
        const isActive = active === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            aria-pressed={isActive}
            className={
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors " +
              (isActive
                ? "bg-white text-[#141210] shadow-[0_1px_2px_rgba(20,18,16,0.10)]"
                : "text-[#6b6459] hover:text-[#141210]")
            }
          >
            {label}
            <span
              className={
                "tabular-nums " +
                (isActive ? "text-[#6b6459]" : "text-[#a59f93]")
              }
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Small neutral pill button used in the bulk selection bar. */
function BulkBtn({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-medium text-[#141210] shadow-[0_1px_2px_rgba(20,18,16,0.08)] transition-colors hover:bg-[rgba(20,18,16,0.04)]"
    >
      {children}
    </button>
  );
}

function DetailModal({
  row,
  columns,
  deleteAction,
  onClose,
  contactEnabled,
  onToggleContacted,
  statuses,
  currentStatus,
  onSetStatus,
}: {
  row: Row;
  columns: Column[];
  deleteAction: (formData: FormData) => Promise<void>;
  onClose: () => void;
  contactEnabled: boolean;
  onToggleContacted: () => void;
  statuses?: StatusOption[];
  currentStatus?: string;
  onSetStatus: (status: string) => void;
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
          {statuses && statuses.length > 0 && (
            <div className="mb-5">
              <div
                className="mb-2 font-mono text-[10.5px] font-semibold uppercase text-[#6b6459]"
                style={{ letterSpacing: "0.22em" }}
              >
                Status
              </div>
              <div className="inline-flex flex-wrap items-center gap-1.5">
                {statuses.map((s) => {
                  const active = currentStatus === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => onSetStatus(s.value)}
                      aria-pressed={active}
                      className={
                        "inline-flex items-center rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors " +
                        (active
                          ? "bg-[#141210] text-white"
                          : "bg-[rgba(20,18,16,0.06)] text-[#141210] hover:bg-[rgba(20,18,16,0.10)]")
                      }
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
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
            <PendingDangerButton
              icon={<Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />}
            >
              Delete
            </PendingDangerButton>
          </form>
        </div>
      </div>
    </div>
  );
}

/** The square tick itself — dark ink when checked, matching the admin chrome. */
function CheckBoxVisual({
  checked,
  indeterminate = false,
  tone = "ink",
}: {
  checked: boolean;
  indeterminate?: boolean;
  tone?: "ink" | "select";
}) {
  const on = checked || indeterminate;
  const onClasses =
    tone === "select"
      ? "border-[#e02214] bg-[#e02214] text-white"
      : "border-[#141210] bg-[#141210] text-white";
  return (
    <span
      aria-hidden
      className={
        "inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border transition-colors " +
        (on ? onClasses : "border-[rgba(20,18,16,0.25)] bg-white text-transparent")
      }
    >
      {indeterminate && !checked ? (
        <span className="h-[2px] w-[10px] rounded-full bg-white" />
      ) : (
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      )}
    </span>
  );
}

/** List-row bulk-selection tick. */
function SelectCheckbox({
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
      title={checked ? "Selected — click to deselect" : "Select"}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        aria-label={`Select ${name || "submission"}`}
        className="peer sr-only"
      />
      <span className="peer-focus-visible:ring-2 peer-focus-visible:ring-[#e02214]/40 peer-focus-visible:ring-offset-1 peer-focus-visible:rounded-md">
        <CheckBoxVisual checked={checked} tone="select" />
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

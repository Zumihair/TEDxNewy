"use client";

import { useMemo, useState } from "react";
import { Eye, Search, Trash2, X } from "lucide-react";
import { formatCount } from "@/lib/youtube";
import { Badge, Card, IconButton } from "../ui";
import { Modal } from "../Modal";
import { useOptimisticDelete } from "../useOptimisticDelete";
import { deleteTalk, updateTalk } from "./actions";
import TalkForm, { type EventOption } from "./TalkForm";

type Row = {
  id: string;
  speaker: string;
  speaker_slug: string | null;
  title: string;
  year: number;
  event: "Reframe" | "Beyond Boundaries";
  event_id: string | null;
  youtube_id: string;
  blurb: string | null;
  display_order: number;
  /** From cms_talk_stats join — null if never fetched. */
  view_count?: number | null;
  stats_fetched_at?: string | null;
};

export default function TalksTable({
  talks,
  events,
}: {
  talks: Row[];
  events: EventOption[];
}) {
  const [q, setQ] = useState("");
  const [year, setYear] = useState<"all" | "2025" | "2024">("all");
  const { items: optimisticTalks, onDelete, dialogs } = useOptimisticDelete({
    items: talks,
    getKey: (t) => t.id,
    fieldName: "id",
    confirmTitle: () => "Delete this talk?",
    confirmBody: (t) => `Delete "${t.title}"? This can't be undone.`,
    deleteAction: deleteTalk,
  });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return optimisticTalks.filter((t) => {
      if (year !== "all" && String(t.year) !== year) return false;
      if (!needle) return true;
      return (
        t.title.toLowerCase().includes(needle) ||
        t.speaker.toLowerCase().includes(needle) ||
        t.youtube_id.toLowerCase().includes(needle)
      );
    });
  }, [optimisticTalks, q, year]);

  const byYear = useMemo(() => {
    const acc: Record<string, Row[]> = {};
    for (const t of filtered) {
      (acc[String(t.year)] ||= []).push(t);
    }
    return acc;
  }, [filtered]);
  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));

  return (
    <>
      {dialogs}
      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 md:max-w-[420px]">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b6459]"
            strokeWidth={2.25}
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by speaker, talk title, or video ID…"
            className="block w-full rounded-full border border-[rgba(20,18,16,0.10)] bg-white py-2.5 pl-10 pr-9 text-[13.5px] text-[#141210] placeholder:text-[#6b6459] focus:border-[#1f4a5c]/40 focus:outline-none focus:ring-2 focus:ring-[#1f4a5c]/20"
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
        <div
          role="tablist"
          aria-label="Filter by year"
          className="inline-flex items-center self-start rounded-full border border-[rgba(20,18,16,0.10)] bg-white p-1"
        >
          {(["all", "2025", "2024"] as const).map((y) => {
            const active = y === year;
            return (
              <button
                key={y}
                role="tab"
                aria-selected={active}
                onClick={() => setYear(y)}
                className={
                  "rounded-full px-4 py-1.5 text-[12.5px] font-medium transition-all " +
                  (active
                    ? "bg-[#141210] text-white"
                    : "text-[#6b6459] hover:text-[#141210]")
                }
              >
                {y === "all" ? "All years" : y}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      <div className="mt-8 space-y-10">
        {years.map((y) => (
          <section key={y}>
            <div
              className="mb-4 flex items-center gap-3 font-mono text-[10.5px] font-semibold uppercase text-[#6b6459]"
              style={{ letterSpacing: "0.24em" }}
            >
              <span>
                {y} · {byYear[y]!.length} talk
                {byYear[y]!.length === 1 ? "" : "s"}
              </span>
              <span className="h-px flex-1 bg-[rgba(20,18,16,0.08)]" />
            </div>
            <Card>
              <ul className="divide-y divide-[rgba(20,18,16,0.08)]">
                {byYear[y]!.map((t) => (
                  <li
                    key={t.id}
                    className="grid grid-cols-[64px_1fr_auto] items-center gap-4 px-4 py-3.5 md:gap-5 md:px-5"
                  >
                    <Modal
                      title={`Edit ${t.title}`}
                      size="xl"
                      trigger={
                        <div className="col-span-2 grid cursor-pointer grid-cols-[64px_1fr] items-center gap-4 md:gap-5">
                          <div className="relative block aspect-video w-16 overflow-hidden rounded bg-[#1a1714]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`https://i.ytimg.com/vi/${t.youtube_id}/default.jpg`}
                              alt=""
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="font-sans text-[15px] font-medium tracking-[-0.005em] text-[#141210] hover:text-[#1f4a5c]">
                              {t.title}
                            </span>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#6b6459]">
                              <span className="font-medium text-[#141210]">
                                {t.speaker}
                              </span>
                              <Badge tone={t.event === "Reframe" ? "red" : "neutral"}>
                                {t.event}
                              </Badge>
                              <span className="font-mono text-[10.5px] text-[#6b6459]">
                                {t.youtube_id}
                              </span>
                            </div>
                          </div>
                        </div>
                      }
                    >
                      <TalkForm
                        mode="edit"
                        initial={t}
                        events={events}
                        action={updateTalk}
                      />
                    </Modal>
                    <div className="flex items-center gap-2">
                      <div
                        className="hidden min-w-[62px] flex-col items-end pr-1 text-right sm:flex"
                        title={
                          t.view_count == null
                            ? "No view data yet — click Refresh views to fetch."
                            : `${t.view_count.toLocaleString("en-AU")} views${
                                t.stats_fetched_at
                                  ? ` · updated ${new Date(
                                      t.stats_fetched_at,
                                    ).toLocaleString("en-AU", {
                                      day: "numeric",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}`
                                  : ""
                              }`
                        }
                      >
                        <span
                          className={
                            "inline-flex items-center gap-1 font-mono text-[13px] font-semibold tabular-nums " +
                            (t.view_count == null ? "text-[#6b6459]/60" : "text-[#141210]")
                          }
                        >
                          <Eye className="h-3 w-3" strokeWidth={2.25} />
                          {formatCount(t.view_count ?? null)}
                        </span>
                        <span
                          className="font-mono text-[9.5px] font-medium uppercase text-[#6b6459]/70"
                          style={{ letterSpacing: "0.22em" }}
                        >
                          views
                        </span>
                      </div>
                      <IconButton
                        tone="danger"
                        ariaLabel={`Delete ${t.title}`}
                        title="Delete"
                        onClick={() => onDelete(t)}
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2.25} />
                      </IconButton>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-[var(--radius-md)] border border-dashed border-[rgba(20,18,16,0.15)] bg-[#f9f5ec] px-6 py-16 text-center">
            <p className="text-[15px] text-[#2a2521]">
              {q || year !== "all"
                ? "No talks match those filters."
                : "No talks yet. Hit Add talk to embed your first."}
            </p>
          </div>
        )}
      </div>
    </>
  );
}

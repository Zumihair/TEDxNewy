"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Search, Trash2, X } from "lucide-react";
import { Badge, Card, DangerButton } from "../ui";
import { deleteTalk } from "./actions";

type Row = {
  id: string;
  speaker: string;
  speaker_slug: string | null;
  title: string;
  year: number;
  event: "Reframe" | "Beyond Boundaries";
  youtube_id: string;
  display_order: number;
};

export default function TalksTable({ talks }: { talks: Row[] }) {
  const [q, setQ] = useState("");
  const [year, setYear] = useState<"all" | "2025" | "2024">("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return talks.filter((t) => {
      if (year !== "all" && String(t.year) !== year) return false;
      if (!needle) return true;
      return (
        t.title.toLowerCase().includes(needle) ||
        t.speaker.toLowerCase().includes(needle) ||
        t.youtube_id.toLowerCase().includes(needle)
      );
    });
  }, [talks, q, year]);

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
                    <Link
                      href={`/admin/talks/${encodeURIComponent(t.id)}`}
                      className="relative block aspect-video w-16 overflow-hidden rounded bg-[#1a1714]"
                      aria-label={`Edit ${t.title}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://i.ytimg.com/vi/${t.youtube_id}/default.jpg`}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </Link>
                    <div className="min-w-0">
                      <Link
                        href={`/admin/talks/${encodeURIComponent(t.id)}`}
                        className="font-sans text-[15px] font-medium tracking-[-0.005em] text-[#141210] hover:text-[#e02214]"
                      >
                        {t.title}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#6b6459]">
                        <span className="font-medium text-[#141210]">
                          {t.speaker}
                        </span>
                        <Badge tone={t.event === "Reframe" ? "red" : "neutral"}>
                          {t.event}
                        </Badge>
                        <a
                          href={`https://www.youtube.com/watch?v=${t.youtube_id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-[10.5px] text-[#6b6459] hover:text-[#e02214]"
                        >
                          {t.youtube_id}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/talks/${encodeURIComponent(t.id)}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-3 py-1.5 text-[12px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={2.25} />
                        Edit
                      </Link>
                      <form action={deleteTalk}>
                        <input type="hidden" name="id" value={t.id} />
                        <DangerButton type="submit">
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                          Delete
                        </DangerButton>
                      </form>
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

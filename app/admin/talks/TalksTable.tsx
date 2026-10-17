"use client";

import { useMemo, useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { formatCount } from "@/lib/youtube";
import { Badge, IconButton } from "../ui";
import { Modal } from "../Modal";
import { useOptimisticDelete } from "../useOptimisticDelete";
import { deleteTalk, updateTalk } from "./actions";
import TalkForm, { type EventOption } from "./TalkForm";
import ArchiveToolbar, { type ArchiveView } from "./ArchiveToolbar";

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
  /** From cms_talk_stats join, null if never fetched. */
  view_count?: number | null;
  stats_fetched_at?: string | null;
};

export default function TalksTable({ talks, events }: { talks: Row[]; events: EventOption[] }) {
  const [q, setQ] = useState("");
  const [year, setYear] = useState("all");
  const [view, setView] = useState<ArchiveView>("list");
  const { items, onDelete, dialogs } = useOptimisticDelete({
    items: talks,
    getKey: (t) => t.id,
    fieldName: "id",
    confirmTitle: () => "Delete this talk?",
    confirmBody: (t) => `Delete "${t.title}"? This can't be undone.`,
    deleteAction: deleteTalk,
  });

  const allYears = useMemo(
    () => Array.from(new Set(items.map((t) => String(t.year)))).sort((a, b) => Number(b) - Number(a)),
    [items],
  );
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((t) => {
      if (year !== "all" && String(t.year) !== year) return false;
      if (!needle) return true;
      return (
        t.title.toLowerCase().includes(needle) ||
        t.speaker.toLowerCase().includes(needle) ||
        t.youtube_id.toLowerCase().includes(needle)
      );
    });
  }, [items, q, year]);
  const byYear = useMemo(() => {
    const acc: Record<string, Row[]> = {};
    for (const t of filtered) (acc[String(t.year)] ||= []).push(t);
    return acc;
  }, [filtered]);
  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));

  return (
    <>
      {dialogs}
      <ArchiveToolbar
        q={q}
        onQ={setQ}
        placeholder="Search talks or speakers"
        years={allYears}
        year={year}
        onYear={setYear}
        view={view}
        onView={setView}
      />

      <div className="adm-stack adm-stack--tight">
        {years.map((y) => (
          <section key={y} className="adm-section">
            <h2 className="adm-section__title">
              {y} <span className="adm-pill__n">{byYear[y]!.length}</span>
            </h2>
            <ul className={view === "grid" ? "adm-agrid" : "adm-alist"}>
              {byYear[y]!.map((t) => (
                <li key={t.id} className="adm-arow">
                  <div className="adm-arow__thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`https://i.ytimg.com/vi/${t.youtube_id}/mqdefault.jpg`} alt="" />
                  </div>
                  <div className="adm-arow__body">
                    <span className="adm-arow__title">{t.title}</span>
                    <span className="adm-arow__sub">
                      {t.speaker}
                      <Badge tone={t.event === "Reframe" ? "red" : "neutral"}>{t.event}</Badge>
                    </span>
                  </div>
                  <div className="adm-arow__side">
                    {t.view_count != null && (
                      <span className="adm-arow__stat" title="YouTube views">
                        <Eye className="h-3.5 w-3.5" strokeWidth={2.25} />
                        {formatCount(t.view_count)}
                      </span>
                    )}
                    <Modal
                      title={`Edit ${t.title}`}
                      size="xl"
                      trigger={
                        <IconButton ariaLabel={`Edit ${t.title}`} title="Edit">
                          <Pencil className="h-4 w-4" strokeWidth={2.25} />
                        </IconButton>
                      }
                    >
                      <TalkForm mode="edit" initial={t} events={events} action={updateTalk} />
                    </Modal>
                    <IconButton tone="danger" ariaLabel={`Delete ${t.title}`} title="Delete" onClick={() => onDelete(t)}>
                      <Trash2 className="h-4 w-4" strokeWidth={2.25} />
                    </IconButton>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {filtered.length === 0 && (
          <p className="adm-empty">{q || year !== "all" ? "No talks match those filters." : "No talks yet. Use Add talk to embed the first."}</p>
        )}
      </div>
    </>
  );
}

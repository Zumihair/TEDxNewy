"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2, User } from "lucide-react";
import { Badge, IconButton } from "../ui";
import { Modal } from "../Modal";
import { useOptimisticDelete } from "../useOptimisticDelete";
import { deleteSpeaker, updateSpeaker } from "./actions";
import SpeakerForm, { type EventOption, type TalkOption } from "./SpeakerForm";
import ArchiveToolbar, { type ArchiveView } from "../talks/ArchiveToolbar";

export type SpeakerRow = {
  slug: string;
  name: string;
  year: number;
  image_url: string | null;
  title: string | null;
  talk_id: string | null;
  event_id: string | null;
  blurb: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  display_order: number;
};

export default function SpeakersList({
  speakers,
  talks,
  events,
}: {
  speakers: SpeakerRow[];
  talks: TalkOption[];
  events: EventOption[];
}) {
  const [q, setQ] = useState("");
  const [year, setYear] = useState("all");
  const [view, setView] = useState<ArchiveView>("list");
  const { items, onDelete, dialogs } = useOptimisticDelete({
    items: speakers,
    getKey: (s) => s.slug,
    fieldName: "slug",
    confirmTitle: () => "Delete this speaker?",
    confirmBody: (s) => `Delete "${s.name}"? This can't be undone.`,
    deleteAction: deleteSpeaker,
  });

  const allYears = useMemo(
    () => Array.from(new Set(items.map((s) => String(s.year)))).sort((a, b) => Number(b) - Number(a)),
    [items],
  );
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((s) => {
      if (year !== "all" && String(s.year) !== year) return false;
      if (!needle) return true;
      return s.name.toLowerCase().includes(needle) || (s.title ?? "").toLowerCase().includes(needle);
    });
  }, [items, q, year]);
  const byYear = useMemo(() => {
    const acc: Record<string, SpeakerRow[]> = {};
    for (const s of filtered) (acc[String(s.year)] ||= []).push(s);
    return acc;
  }, [filtered]);
  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));

  return (
    <>
      {dialogs}
      <ArchiveToolbar
        q={q}
        onQ={setQ}
        placeholder="Search speakers or talks"
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
              {byYear[y]!.map((s) => (
                <li key={s.slug} className="adm-arow">
                  <div className="adm-arow__thumb">
                    {s.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.image_url} alt="" style={{ objectPosition: "center 20%" }} />
                    ) : (
                      <span className="adm-arow__ph">
                        <User className="h-5 w-5" strokeWidth={2} />
                      </span>
                    )}
                  </div>
                  <div className="adm-arow__body">
                    <span className="adm-arow__title">{s.name}</span>
                    <span className="adm-arow__sub">
                      {s.title && <span className="line-clamp-1">{s.title}</span>}
                      {!s.talk_id && <Badge tone="draft">no talk linked</Badge>}
                    </span>
                  </div>
                  <div className="adm-arow__side">
                    <Modal
                      title={`Edit ${s.name}`}
                      size="xl"
                      trigger={
                        <IconButton ariaLabel={`Edit ${s.name}`} title="Edit">
                          <Pencil className="h-4 w-4" strokeWidth={2.25} />
                        </IconButton>
                      }
                    >
                      <SpeakerForm mode="edit" initial={s} talks={talks} events={events} action={updateSpeaker} />
                    </Modal>
                    <IconButton tone="danger" ariaLabel={`Delete ${s.name}`} title="Delete" onClick={() => onDelete(s)}>
                      <Trash2 className="h-4 w-4" strokeWidth={2.25} />
                    </IconButton>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {filtered.length === 0 && (
          <p className="adm-empty">{q || year !== "all" ? "No speakers match those filters." : "No speakers yet. Use Add speaker to start the lineup."}</p>
        )}
      </div>
    </>
  );
}

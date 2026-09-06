"use client";

import { useMemo } from "react";
import { Trash2, User } from "lucide-react";
import { Badge, Card, IconButton } from "../ui";
import { Modal } from "../Modal";
import { useOptimisticDelete } from "../useOptimisticDelete";
import { deleteSpeaker, updateSpeaker } from "./actions";
import SpeakerForm, { type EventOption, type TalkOption } from "./SpeakerForm";

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
  const { items: rows, onDelete, dialogs } = useOptimisticDelete({
    items: speakers,
    getKey: (s) => s.slug,
    fieldName: "slug",
    confirmTitle: () => "Delete this speaker?",
    confirmBody: (s) => `Delete "${s.name}"? This can't be undone.`,
    deleteAction: deleteSpeaker,
  });

  const byYear = useMemo(() => {
    const acc: Record<string, SpeakerRow[]> = {};
    for (const s of rows) {
      (acc[String(s.year)] ||= []).push(s);
    }
    return acc;
  }, [rows]);
  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));

  if (rows.length === 0) {
    return (
      <>
        {dialogs}
        <div className="rounded-[var(--radius-md)] border border-dashed border-[rgba(20,18,16,0.15)] bg-[#f9f5ec] px-6 py-16 text-center">
          <p className="text-[15px] text-[#2a2521]">
            No speakers yet. Hit Add speaker to start the lineup.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      {dialogs}
      <div className="space-y-10">
        {years.map((y) => (
          <section key={y}>
            <div
              className="mb-4 flex items-center gap-3 font-mono text-[10.5px] font-semibold uppercase text-[#6b6459]"
              style={{ letterSpacing: "0.24em" }}
            >
              <span>
                {y} · {byYear[y]!.length} speaker
                {byYear[y]!.length === 1 ? "" : "s"}
              </span>
              <span className="h-px flex-1 bg-[rgba(20,18,16,0.08)]" />
            </div>
            <Card>
              <ul className="divide-y divide-[rgba(20,18,16,0.08)]">
                {byYear[y]!.map((s) => (
                  <li
                    key={s.slug}
                    className="grid grid-cols-[56px_1fr_auto] items-center gap-4 px-4 py-3.5 md:gap-5 md:px-5"
                  >
                    <Modal
                      title={`Edit ${s.name}`}
                      size="xl"
                      trigger={
                        <div className="col-span-2 grid cursor-pointer grid-cols-[56px_1fr] items-center gap-4 md:gap-5">
                          <div className="relative block aspect-[4/5] w-14 overflow-hidden rounded bg-[#1a1714]">
                            {s.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={s.image_url}
                                alt=""
                                className="absolute inset-0 h-full w-full object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-white/40">
                                <User className="h-4 w-4" strokeWidth={2} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-sans text-[15px] font-medium tracking-[-0.005em] text-[#141210] hover:text-[#1f4a5c]">
                              {s.name}
                            </span>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#6b6459]">
                              {s.title && (
                                <span className="line-clamp-1">{s.title}</span>
                              )}
                              {!s.talk_id && (
                                <Badge tone="draft">no talk linked</Badge>
                              )}
                              <span className="font-mono text-[10.5px] text-[#6b6459]/70">
                                {s.slug}
                              </span>
                            </div>
                          </div>
                        </div>
                      }
                    >
                      <SpeakerForm
                        mode="edit"
                        initial={s}
                        talks={talks}
                        events={events}
                        action={updateSpeaker}
                      />
                    </Modal>
                    <div className="flex items-center">
                      <IconButton
                        tone="danger"
                        ariaLabel={`Delete ${s.name}`}
                        title="Delete"
                        onClick={() => onDelete(s)}
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
      </div>
    </>
  );
}

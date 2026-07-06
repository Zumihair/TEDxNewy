"use client";

import { useMemo, useOptimistic, useTransition } from "react";
import Link from "next/link";
import { Pencil, Trash2, User } from "lucide-react";
import { Badge, Card, DangerButton } from "../ui";
import { useConfirm } from "../ConfirmDialog";
import { deleteSpeaker } from "./actions";

export type SpeakerRow = {
  slug: string;
  name: string;
  year: number;
  image_url: string | null;
  title: string | null;
  talk_id: string | null;
};

export default function SpeakersList({ speakers }: { speakers: SpeakerRow[] }) {
  const { confirm, dialogs } = useConfirm();
  const [, startTransition] = useTransition();
  const [rows, removeSpeaker] = useOptimistic(speakers, (state, slug: string) =>
    state.filter((s) => s.slug !== slug),
  );

  const onDelete = async (s: SpeakerRow) => {
    const ok = await confirm({
      title: "Delete this speaker?",
      body: `Delete "${s.name}"? This can't be undone.`,
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    startTransition(async () => {
      removeSpeaker(s.slug);
      const fd = new FormData();
      fd.set("slug", s.slug);
      await deleteSpeaker(fd);
    });
  };

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
                    <Link
                      href={`/admin/speakers/${encodeURIComponent(s.slug)}`}
                      className="relative block aspect-[4/5] w-14 overflow-hidden rounded bg-[#1a1714]"
                      aria-label={`Edit ${s.name}`}
                    >
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
                    </Link>
                    <div className="min-w-0">
                      <Link
                        href={`/admin/speakers/${encodeURIComponent(s.slug)}`}
                        className="font-sans text-[15px] font-medium tracking-[-0.005em] text-[#141210] hover:text-[#1f4a5c]"
                      >
                        {s.name}
                      </Link>
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
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/speakers/${encodeURIComponent(s.slug)}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-3 py-1.5 text-[12px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={2.25} />
                        Edit
                      </Link>
                      <DangerButton type="button" onClick={() => onDelete(s)}>
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                        Delete
                      </DangerButton>
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

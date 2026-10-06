"use client";

import { useState, useTransition } from "react";
import { Download, Eye, EyeOff, ExternalLink, Trash2 } from "lucide-react";
import { Card, DangerButton, Field, PrimaryButton, SectionLabel, inputCls } from "../ui";
import { useConfirm } from "../ConfirmDialog";
import { useToast } from "../Toaster";
import { THEMES } from "../section-theme";
import {
  clearAllSessions,
  deletePhoto,
  saveChallenge,
  setPhotoHidden,
} from "./actions";

const coast = THEMES.coast;

export type AdminChallenge = {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  points: number;
  active: boolean;
  qr_number: number | null;
  puzzle_prompt: string | null;
};

export type AdminPhoto = {
  id: string;
  thumbUrl: string;
  url: string;
  uploadedAt: string;
  firstName: string;
  quest: string;
  hidden: boolean;
};

export type AdminSessionRow = {
  id: string;
  shortId: string;
  firstName: string;
  score: number;
  eligibleAt: string | null;
  photoCount: number;
};

const timeFmt = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Australia/Sydney",
});

function fmt(iso: string | null): string {
  return iso ? timeFmt.format(new Date(iso)) : "";
}

export default function SideQuestAdmin({
  prizeRows,
  photos,
  challenges,
  threshold,
}: {
  prizeRows: AdminSessionRow[];
  photos: AdminPhoto[];
  challenges: AdminChallenge[];
  threshold: number;
}) {
  const { confirm, dialogs } = useConfirm();
  const toast = useToast();

  return (
    <>
      {dialogs}
      <PrizeDraw rows={prizeRows} threshold={threshold} />
      <PhotoModeration photos={photos} confirm={confirm} toast={toast} />
      <QuestEditor challenges={challenges} toast={toast} />
      <ResetZone confirm={confirm} toast={toast} />
    </>
  );
}

type ConfirmFn = ReturnType<typeof useConfirm>["confirm"];
type ToastApi = ReturnType<typeof useToast>;

// ------------------------------------------------------------ prize draw

function PrizeDraw({
  rows,
  threshold,
}: {
  rows: AdminSessionRow[];
  threshold: number;
}) {
  const exportCsv = () => {
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const header = ["first_name", "session_id", "score", "eligible_at", "photos"];
    const lines = rows.map((r) =>
      [
        esc(r.firstName),
        esc(r.shortId),
        String(r.score),
        esc(r.eligibleAt ?? ""),
        String(r.photoCount),
      ].join(","),
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `side-quest-prize-draw-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionLabel>Prize draw · {rows.length}</SectionLabel>
        <button
          type="button"
          onClick={exportCsv}
          disabled={rows.length === 0}
          className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(0,0,0,0.06)] px-3.5 py-1.5 text-[12px] font-medium text-[#000000] transition-colors hover:bg-[rgba(0,0,0,0.10)] disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={2.25} />
          CSV ({rows.length})
        </button>
      </div>
      <p className="text-[13px] text-[#4a453d]">
        Everyone with {threshold} or more points has one entry. Pick a row at
        random from this list to draw a winner.
      </p>
      <Card>
        {rows.length === 0 ? (
          <div className="px-5 py-10 text-center text-[14px] text-[#6b6459]">
            Nobody has reached {threshold} points yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-[13.5px]">
              <thead>
                <tr
                  className="border-b border-[rgba(0,0,0,0.08)] font-mono text-[10px] uppercase text-[#6b6459]"
                  style={{ letterSpacing: "0.2em" }}
                >
                  <th className="px-4 py-3 font-semibold">First name</th>
                  <th className="px-4 py-3 font-semibold">Session</th>
                  <th className="px-4 py-3 text-right font-semibold">Score</th>
                  <th className="px-4 py-3 font-semibold">Qualified</th>
                  <th className="px-4 py-3 text-right font-semibold">Photos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(0,0,0,0.06)]">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2.5 font-medium text-[#000000]">
                      {r.firstName}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[12px] text-[#6b6459]">
                      {r.shortId}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {r.score}
                    </td>
                    <td className="px-4 py-2.5 text-[#4a453d]">
                      {fmt(r.eligibleAt)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {r.photoCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  );
}

// ---------------------------------------------------------------- photos

function PhotoModeration({
  photos,
  confirm,
  toast,
}: {
  photos: AdminPhoto[];
  confirm: ConfirmFn;
  toast: ToastApi;
}) {
  const [pending, start] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const toggle = (p: AdminPhoto) => {
    setBusyId(p.id);
    start(async () => {
      const r = await setPhotoHidden(p.id, !p.hidden);
      setBusyId(null);
      if (r.ok) toast.success(p.hidden ? "Photo is back on the wall." : "Photo hidden from the wall.");
      else toast.error(r.error);
    });
  };

  const remove = async (p: AdminPhoto) => {
    const ok = await confirm({
      title: `Delete this photo by ${p.firstName || "a player"}?`,
      body: "It is removed from the wall and from storage. Their points are kept. This can't be undone.",
      confirmLabel: "Delete photo",
      tone: "danger",
    });
    if (!ok) return;
    setBusyId(p.id);
    start(async () => {
      const r = await deletePhoto(p.id);
      setBusyId(null);
      if (r.ok) toast.success("Photo deleted.");
      else toast.error(r.error);
    });
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionLabel>Photos · {photos.length}</SectionLabel>
        <a
          href="/signal/links/side-quest/wall"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(0,0,0,0.06)] px-3.5 py-1.5 text-[12px] font-medium text-[#000000] transition-colors hover:bg-[rgba(0,0,0,0.10)]"
        >
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.25} />
          Open the photo wall
        </a>
      </div>
      <p className="text-[13px] text-[#4a453d]">
        Photos go on the wall as soon as they are uploaded. Hide one and it
        leaves the wall within a few seconds. Hiding or deleting never takes
        points away.
      </p>
      {photos.length === 0 ? (
        <Card>
          <div className="px-5 py-10 text-center text-[14px] text-[#6b6459]">
            No photos yet.
          </div>
        </Card>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {photos.map((p) => (
            <li
              key={p.id}
              className="overflow-hidden rounded-[var(--radius-md)] border border-[rgba(0,0,0,0.08)] bg-white"
            >
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative block aspect-square bg-[#eeece7]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.thumbUrl}
                  alt={`${p.quest} by ${p.firstName}`}
                  loading="lazy"
                  className={`h-full w-full object-cover ${p.hidden ? "opacity-40" : ""}`}
                />
                {p.hidden && (
                  <span
                    className="absolute left-2 top-2 rounded-full bg-[#000000] px-2 py-0.5 font-mono text-[9.5px] font-semibold uppercase text-white"
                    style={{ letterSpacing: "0.18em" }}
                  >
                    Hidden
                  </span>
                )}
              </a>
              <div className="px-3 pb-3 pt-2.5">
                <div className="truncate text-[13px] font-medium text-[#000000]">
                  {p.firstName || "Unknown"}
                </div>
                <div className="truncate text-[12px] text-[#6b6459]">
                  {p.quest} · {fmt(p.uploadedAt)}
                </div>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={pending && busyId === p.id}
                    onClick={() => toggle(p)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(0,0,0,0.06)] px-3 py-1.5 text-[12px] font-medium text-[#000000] transition-colors hover:bg-[rgba(0,0,0,0.10)] disabled:opacity-60"
                  >
                    {p.hidden ? (
                      <Eye className="h-3.5 w-3.5" strokeWidth={2.25} />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" strokeWidth={2.25} />
                    )}
                    {p.hidden ? "Show" : "Hide"}
                  </button>
                  <button
                    type="button"
                    disabled={pending && busyId === p.id}
                    onClick={() => remove(p)}
                    aria-label="Delete photo"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6b6459] transition-colors hover:bg-[rgba(230,43,30,0.10)] hover:text-[#b91404] disabled:opacity-60"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- quests

function QuestEditor({
  challenges,
  toast,
}: {
  challenges: AdminChallenge[];
  toast: ToastApi;
}) {
  return (
    <section className="space-y-3">
      <SectionLabel>Quests · {challenges.length}</SectionLabel>
      <p className="text-[13px] text-[#4a453d]">
        Change the wording, points or puzzle for next time without a rebuild.
        Turning a quest off hides it from players. Puzzle answers are matched
        ignoring capitals, spaces and punctuation, and never leave the server.
        Separate alternative answers with a pipe, for example red|crimson.
      </p>
      <div className="space-y-3">
        {challenges.map((c) => (
          <QuestRow key={c.id} c={c} toast={toast} />
        ))}
      </div>
    </section>
  );
}

function QuestRow({ c, toast }: { c: AdminChallenge; toast: ToastApi }) {
  const [title, setTitle] = useState(c.title);
  const [description, setDescription] = useState(c.description);
  const [points, setPoints] = useState(String(c.points));
  const [active, setActive] = useState(c.active);
  const [prompt, setPrompt] = useState(c.puzzle_prompt ?? "");
  const [answer, setAnswer] = useState("");
  const [pending, start] = useTransition();
  const isQr = c.type === "qr";

  const save = () =>
    start(async () => {
      const r = await saveChallenge({
        id: c.id,
        title,
        description,
        points: Number(points),
        active,
        puzzlePrompt: prompt,
        puzzleAnswer: answer,
      });
      if (r.ok) {
        setAnswer("");
        toast.success(`${title} saved.`);
      } else {
        toast.error(r.error);
      }
    });

  return (
    <Card>
      <div className="space-y-4 p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 font-mono text-[9.5px] font-semibold uppercase"
            style={{
              letterSpacing: "0.18em",
              backgroundColor: coast.chipBg,
              color: coast.chipFg,
            }}
          >
            {c.category}
          </span>
          <span className="text-[12px] text-[#6b6459]">
            {c.type === "qr" ? `QR code ${c.qr_number ?? ""}`.trim() : c.type}
          </span>
          <label className="ml-auto inline-flex cursor-pointer items-center gap-2 text-[13px] text-[#000000]">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 accent-[#e62b1e]"
            />
            Active
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_120px]">
          <Field label="Title" htmlFor={`t-${c.id}`}>
            <input
              id={`t-${c.id}`}
              className={inputCls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
            />
          </Field>
          <Field label="Points" htmlFor={`p-${c.id}`}>
            <input
              id={`p-${c.id}`}
              className={inputCls}
              type="number"
              min={0}
              max={50}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
            />
          </Field>
        </div>
        <Field label="What players see" htmlFor={`d-${c.id}`}>
          <textarea
            id={`d-${c.id}`}
            className={inputCls}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={240}
          />
        </Field>

        {isQr && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Puzzle prompt"
              htmlFor={`pp-${c.id}`}
              hint="Shown in the pop-up after the QR code is scanned."
            >
              <textarea
                id={`pp-${c.id}`}
                className={inputCls}
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                maxLength={400}
              />
            </Field>
            <Field
              label="Puzzle answer"
              htmlFor={`pa-${c.id}`}
              hint="Leave blank to keep the current answer. It is never shown here."
            >
              <input
                id={`pa-${c.id}`}
                className={inputCls}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                autoComplete="off"
                placeholder="New answer"
                maxLength={120}
              />
            </Field>
          </div>
        )}

        <div className="flex justify-end">
          <PrimaryButton type="button" onClick={save} disabled={pending}>
            {pending ? "Saving" : "Save quest"}
          </PrimaryButton>
        </div>
      </div>
    </Card>
  );
}

// ----------------------------------------------------------------- reset

function ResetZone({
  confirm,
  toast,
}: {
  confirm: ConfirmFn;
  toast: ToastApi;
}) {
  const [pending, start] = useTransition();
  const run = async () => {
    const ok = await confirm({
      title: "Clear all Side Quest players?",
      body: "Every player, score, photo and puzzle attempt is deleted, and the photos are removed from storage. The quests and puzzles are kept. Export the prize draw first. This can't be undone.",
      confirmLabel: "Clear everything",
      tone: "danger",
    });
    if (!ok) return;
    start(async () => {
      const r = await clearAllSessions();
      if (r.ok) toast.success("Cleared. Ready for a fresh start.");
      else toast.error(r.error);
    });
  };
  return (
    <section className="space-y-3">
      <SectionLabel>Start fresh</SectionLabel>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-5">
          <p className="max-w-[56ch] text-[13px] leading-[1.55] text-[#4a453d]">
            For a dress rehearsal or a future event: clear all players,
            scores and photos but keep the quests.
          </p>
          <DangerButton type="button" onClick={run} disabled={pending}>
            <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
            {pending ? "Clearing" : "Clear all players"}
          </DangerButton>
        </div>
      </Card>
    </section>
  );
}

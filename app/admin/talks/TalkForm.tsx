"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Loader2, Play } from "lucide-react";
import { Card, Field, Flash, PageHeader, SectionLabel, inputCls } from "../ui";

type ActionResult =
  | { ok: true }
  | { ok: false; errors: { field?: string; message: string }[] };

type Talk = {
  id?: string;
  speaker?: string;
  speaker_slug?: string | null;
  title?: string;
  year?: number;
  event?: "Reframe" | "Beyond Boundaries" | "";
  youtube_id?: string;
  blurb?: string | null;
  display_order?: number;
};

const YEARS = [
  { value: 2025, label: "2025 · Reframe", event: "Reframe" as const },
  {
    value: 2024,
    label: "2024 · Beyond Boundaries",
    event: "Beyond Boundaries" as const,
  },
];

export default function TalkForm({
  mode,
  initial,
  action,
}: {
  mode: "new" | "edit";
  initial: Talk;
  action: (prev: unknown, form: FormData) => Promise<ActionResult>;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    action,
    { ok: true } as ActionResult,
  );

  const [year, setYear] = useState<number>(initial.year ?? 2025);
  const [event, setEvent] = useState<string>(
    initial.event ?? (year === 2024 ? "Beyond Boundaries" : "Reframe"),
  );
  const [youtube, setYoutube] = useState<string>(initial.youtube_id ?? "");

  const setYearKeepEventSynced = (next: number) => {
    setYear(next);
    const match = YEARS.find((y) => y.value === next);
    if (match) setEvent(match.event);
  };

  const youtubeId = extractYouTubeId(youtube);
  const errors = state.ok ? [] : state.errors;
  const errorFor = (field: string) =>
    errors.find((e) => e.field === field)?.message;
  const generalErrors = errors.filter((e) => !e.field);

  return (
    <div className="space-y-8 pb-24">
      <PageHeader
        eyebrow={mode === "new" ? "Add talk" : "Edit talk"}
        title={mode === "new" ? "Add a talk to the archive" : (initial.title ?? "Edit talk")}
        backHref="/admin/talks"
        description={
          mode === "new"
            ? "Paste a YouTube URL — we'll extract the ID and pull a thumbnail."
            : undefined
        }
      />

      {generalErrors.length > 0 && (
        <Flash tone="error">
          {generalErrors.map((e, i) => (
            <div key={i}>{e.message}</div>
          ))}
        </Flash>
      )}

      <form
        action={formAction}
        className="grid gap-8 md:grid-cols-[1fr_320px]"
      >
        <div className="space-y-6">
          {initial.id && <input type="hidden" name="id" value={initial.id} />}

          <Card className="space-y-6 p-6">
            <SectionLabel>Video</SectionLabel>
            <Field label="YouTube URL or video ID" error={errorFor("youtube")}>
              <input
                name="youtube"
                required
                defaultValue={initial.youtube_id ?? ""}
                onChange={(e) => setYoutube(e.currentTarget.value)}
                placeholder="https://www.youtube.com/watch?v=… or 11-char ID"
                className={inputCls}
              />
            </Field>
          </Card>

          <Card className="space-y-6 p-6">
            <SectionLabel>Talk</SectionLabel>
            <Field label="Speaker name" error={errorFor("speaker")}>
              <input
                name="speaker"
                required
                defaultValue={initial.speaker ?? ""}
                placeholder="e.g. Brittney Saunders"
                className={inputCls}
              />
            </Field>
            <Field label="Talk title" error={errorFor("title")}>
              <input
                name="title"
                required
                defaultValue={initial.title ?? ""}
                placeholder="e.g. The power in quitting"
                className={inputCls}
              />
            </Field>
            <div className="grid gap-6 md:grid-cols-2">
              <Field
                label="Year + event"
                error={errorFor("year") ?? errorFor("event")}
              >
                <select
                  name="year"
                  value={year}
                  onChange={(e) =>
                    setYearKeepEventSynced(Number(e.currentTarget.value))
                  }
                  className={inputCls}
                >
                  {YEARS.map((y) => (
                    <option key={y.value} value={y.value}>
                      {y.label}
                    </option>
                  ))}
                </select>
                <input type="hidden" name="event" value={event} />
              </Field>
              <Field
                label="Display order"
                hint="Lower = earlier in the grid"
              >
                <input
                  type="number"
                  name="display_order"
                  min={0}
                  defaultValue={initial.display_order ?? 999}
                  className={inputCls}
                />
              </Field>
            </div>
            <Field
              label="Speaker slug"
              hint="Optional — link to /speakers/[slug]. Leave blank if no page."
            >
              <input
                name="speaker_slug"
                defaultValue={initial.speaker_slug ?? ""}
                placeholder="e.g. brittney-saunders"
                className={inputCls}
              />
            </Field>
            <Field
              label="Blurb"
              hint="One or two sentences. Shown in the modal on /watch."
            >
              <textarea
                name="blurb"
                rows={4}
                defaultValue={initial.blurb ?? ""}
                placeholder="Reframing quitting as exploration…"
                className={`${inputCls} leading-[1.55]`}
              />
            </Field>
          </Card>
        </div>

        {/* Live preview */}
        <aside className="space-y-4 md:sticky md:top-8 md:self-start">
          <SectionLabel>Preview</SectionLabel>
          <div className="relative aspect-video overflow-hidden rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-[#1a1714] shadow-[var(--shadow-sm)]">
            {youtubeId ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 100%)",
                  }}
                />
                <div className="absolute bottom-3 left-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#e02214] text-white shadow-[0_8px_22px_rgba(224,34,20,0.35)]">
                  <Play className="ml-[2px] h-4 w-4 fill-current" strokeWidth={0} />
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-[12.5px] text-white/45">
                Paste a YouTube URL to preview
              </div>
            )}
          </div>
          {youtubeId && (
            <a
              href={`https://www.youtube.com/watch?v=${youtubeId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#e02214] hover:text-[#b91404]"
            >
              Open on YouTube ↗
            </a>
          )}
        </aside>

        {/* Sticky save bar */}
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[rgba(20,18,16,0.08)] bg-white/95 backdrop-blur-sm md:left-[260px]">
          <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-3 px-5 py-3.5 md:px-12">
            <Link
              href="/admin/talks"
              className="text-[13px] font-medium text-[#6b6459] hover:text-[#141210]"
            >
              Cancel
            </Link>
            <div className="flex items-center gap-2">
              {mode === "new" && (
                <button
                  type="submit"
                  name="next"
                  value="add-another"
                  disabled={pending}
                  className="inline-flex items-center gap-2 rounded-full bg-[rgba(20,18,16,0.06)] px-5 py-2.5 text-[13px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Save & add another
                </button>
              )}
              <button
                type="submit"
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-6 py-2.5 text-[13.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {pending && (
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
                )}
                {pending
                  ? "Saving…"
                  : mode === "new"
                    ? "Add talk"
                    : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const u = new URL(trimmed);
    if (u.hostname.endsWith("youtu.be")) {
      const id = u.pathname.slice(1);
      if (/^[A-Za-z0-9_-]{11}$/.test(id)) return id;
    }
    if (
      u.hostname.endsWith("youtube.com") ||
      u.hostname.endsWith("youtube-nocookie.com")
    ) {
      const v = u.searchParams.get("v");
      if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;
      const m = u.pathname.match(/\/embed\/([A-Za-z0-9_-]{11})/);
      if (m) return m[1];
    }
  } catch {
    return null;
  }
  return null;
}

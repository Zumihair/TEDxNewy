"use client";

import { useActionState, useState } from "react";
import { Loader2, Play } from "lucide-react";
import { Card, Field, SectionLabel, inputCls } from "../ui";
import { useFormErrorToast } from "../Toaster";

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
  event_id?: string | null;
  youtube_id?: string;
  blurb?: string | null;
  display_order?: number;
};

export type EventOption = { id: string; label: string };

export default function TalkForm({
  mode,
  initial,
  events,
  action,
}: {
  mode: "new" | "edit";
  initial: Talk;
  events: EventOption[];
  action: (prev: unknown, form: FormData) => Promise<ActionResult>;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    action,
    { ok: true } as ActionResult,
  );

  const [youtube, setYoutube] = useState<string>(initial.youtube_id ?? "");

  const youtubeId = extractYouTubeId(youtube);
  const errors = state.ok ? [] : state.errors;
  const errorFor = (field: string) =>
    errors.find((e) => e.field === field)?.message;

  useFormErrorToast(state, errors);

  return (
    <form action={formAction} className="space-y-6">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      {/* Legacy year + event kept for back-compat when no event is linked. */}
      <input type="hidden" name="fallback_year" value={initial.year ?? 2025} />
      <input
        type="hidden"
        name="fallback_event"
        value={initial.event ?? "Reframe"}
      />

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
        {youtubeId && (
          <div className="relative aspect-video overflow-hidden rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-[#1a1714]">
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
            <a
              href={`https://www.youtube.com/watch?v=${youtubeId}`}
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-[11.5px] font-medium text-white hover:bg-black/70"
            >
              Open on YouTube ↗
            </a>
          </div>
        )}
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
            label="Event"
            error={errorFor("event")}
            hint="Which event this talk is from. Sets the year automatically."
          >
            <select
              name="event_id"
              defaultValue={initial.event_id ?? ""}
              className={inputCls}
            >
              <option value="">No event</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.label}
                </option>
              ))}
            </select>
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
          hint="One or two sentences. Shown in the modal on /talks."
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

      {/* Save bar — sticky within the modal's own scroll container. -mx-5/-mb-5
          bleed past Modal.tsx's p-5 body padding so it reaches the modal's
          true edges; pb-5 restores that inset ON the bar itself. */}
      <div className="sticky bottom-0 -mx-5 -mb-5 flex items-center justify-end gap-2 border-t border-[rgba(20,18,16,0.08)] bg-white/95 px-5 pb-5 pt-4 backdrop-blur-sm">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-6 py-2.5 text-[13.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {pending && (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
          )}
          {pending ? "Saving…" : mode === "new" ? "Add talk" : "Save changes"}
        </button>
      </div>
    </form>
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

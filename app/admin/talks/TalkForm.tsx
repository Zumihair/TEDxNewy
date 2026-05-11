"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

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
    <>
      <Link
        href="/admin/talks"
        className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase text-[#6b6459] transition-colors hover:text-[#e02214]"
        style={{ letterSpacing: "0.22em" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
        All talks
      </Link>

      <h1
        className="mt-6 font-sans tracking-[-0.025em] text-[#141210] balance"
        style={{
          fontSize: "clamp(1.85rem, 3.6vw, 2.5rem)",
          lineHeight: 1.04,
          fontWeight: 500,
          fontVariationSettings: '"opsz" 144',
        }}
      >
        {mode === "new" ? "Add a talk" : "Edit talk"}
      </h1>

      {generalErrors.length > 0 && (
        <div className="mt-6 rounded-[var(--radius-md)] border border-[#e02214]/30 bg-[#e02214]/10 px-4 py-3 text-[13.5px] text-[#b91404]">
          {generalErrors.map((e, i) => (
            <div key={i}>{e.message}</div>
          ))}
        </div>
      )}

      <form
        action={formAction}
        className="mt-10 grid gap-8 md:grid-cols-[1fr_320px]"
      >
        {/* Left: fields */}
        <div className="space-y-6">
          {initial.id && (
            <input type="hidden" name="id" value={initial.id} />
          )}

          <Field label="YouTube URL or video ID" error={errorFor("youtube")}>
            <input
              name="youtube"
              required
              defaultValue={initial.youtube_id ?? ""}
              onChange={(e) => setYoutube(e.currentTarget.value)}
              placeholder="https://www.youtube.com/watch?v=… or 11-char ID"
              className="block w-full rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.15)] bg-white px-4 py-3 text-[14.5px] text-[#141210] focus:border-[#e02214]/40 focus:outline-none focus:ring-2 focus:ring-[#e02214]/20"
            />
            <p className="mt-1.5 text-[12px] text-[#6b6459]">
              We&rsquo;ll pull the ID automatically. Watch / share / embed URLs
              all work.
            </p>
          </Field>

          <Field label="Speaker name" error={errorFor("speaker")}>
            <input
              name="speaker"
              required
              defaultValue={initial.speaker ?? ""}
              placeholder="e.g. Brittney Saunders"
              className="block w-full rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.15)] bg-white px-4 py-3 text-[14.5px] text-[#141210] focus:border-[#e02214]/40 focus:outline-none focus:ring-2 focus:ring-[#e02214]/20"
            />
          </Field>

          <Field label="Talk title" error={errorFor("title")}>
            <input
              name="title"
              required
              defaultValue={initial.title ?? ""}
              placeholder="e.g. The power in quitting"
              className="block w-full rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.15)] bg-white px-4 py-3 text-[14.5px] text-[#141210] focus:border-[#e02214]/40 focus:outline-none focus:ring-2 focus:ring-[#e02214]/20"
            />
          </Field>

          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Year + event" error={errorFor("year") ?? errorFor("event")}>
              <select
                name="year"
                value={year}
                onChange={(e) => setYearKeepEventSynced(Number(e.currentTarget.value))}
                className="block w-full rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.15)] bg-white px-4 py-3 text-[14.5px] text-[#141210] focus:border-[#e02214]/40 focus:outline-none focus:ring-2 focus:ring-[#e02214]/20"
              >
                {YEARS.map((y) => (
                  <option key={y.value} value={y.value}>
                    {y.label}
                  </option>
                ))}
              </select>
              <input type="hidden" name="event" value={event} />
            </Field>

            <Field label="Display order" hint="Lower = earlier in the grid">
              <input
                type="number"
                name="display_order"
                min={0}
                defaultValue={initial.display_order ?? 999}
                className="block w-full rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.15)] bg-white px-4 py-3 text-[14.5px] text-[#141210] focus:border-[#e02214]/40 focus:outline-none focus:ring-2 focus:ring-[#e02214]/20"
              />
            </Field>
          </div>

          <Field
            label="Speaker slug"
            hint="Optional — link to /speakers/[slug]. Leave blank if no speaker page."
          >
            <input
              name="speaker_slug"
              defaultValue={initial.speaker_slug ?? ""}
              placeholder="e.g. brittney-saunders"
              className="block w-full rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.15)] bg-white px-4 py-3 text-[14.5px] text-[#141210] focus:border-[#e02214]/40 focus:outline-none focus:ring-2 focus:ring-[#e02214]/20"
            />
          </Field>

          <Field label="Blurb" hint="One or two sentences. Shown in the modal.">
            <textarea
              name="blurb"
              rows={4}
              defaultValue={initial.blurb ?? ""}
              placeholder="Reframing quitting as exploration…"
              className="block w-full rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.15)] bg-white px-4 py-3 text-[14.5px] leading-[1.55] text-[#141210] focus:border-[#e02214]/40 focus:outline-none focus:ring-2 focus:ring-[#e02214]/20"
            />
          </Field>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-6 py-3 text-[14px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />}
              {pending
                ? "Saving…"
                : mode === "new"
                  ? "Add talk"
                  : "Save changes"}
            </button>
            <Link
              href="/admin/talks"
              className="text-[13.5px] font-medium text-[#6b6459] hover:text-[#141210]"
            >
              Cancel
            </Link>
          </div>
        </div>

        {/* Right: live YouTube preview */}
        <aside className="space-y-4">
          <div
            className="font-mono text-[10.5px] font-semibold uppercase text-[#6b6459]"
            style={{ letterSpacing: "0.24em" }}
          >
            Preview
          </div>
          <div className="relative aspect-video overflow-hidden rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-[#1a1714]">
            {youtubeId ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[12px] text-white/45">
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
      </form>
    </>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span
        className="block font-mono text-[10.5px] font-semibold uppercase text-[#6b6459]"
        style={{ letterSpacing: "0.24em" }}
      >
        {label}
      </span>
      <div className="mt-2">{children}</div>
      {hint && !error && (
        <p className="mt-1.5 text-[12px] text-[#6b6459]">{hint}</p>
      )}
      {error && (
        <p className="mt-1.5 text-[12.5px] font-medium text-[#b91404]">
          {error}
        </p>
      )}
    </label>
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
    if (u.hostname.endsWith("youtube.com") || u.hostname.endsWith("youtube-nocookie.com")) {
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

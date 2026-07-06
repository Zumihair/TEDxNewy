"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Loader2, User } from "lucide-react";
import ImageUploadField from "../ImageUploadField";
import { Card, Field, Flash, PageHeader, SectionLabel, inputCls } from "../ui";

type ActionResult =
  | { ok: true }
  | { ok: false; errors: { field?: string; message: string }[] };

type Speaker = {
  slug?: string;
  name?: string;
  title?: string | null;
  talk_id?: string | null;
  event_id?: string | null;
  blurb?: string | null;
  year?: number;
  image_url?: string | null;
  linkedin_url?: string | null;
  instagram_url?: string | null;
  display_order?: number;
};

type TalkOption = { id: string; label: string };
type EventOption = { id: string; label: string };

export default function SpeakerForm({
  mode,
  initial,
  talks,
  events,
  action,
}: {
  mode: "new" | "edit";
  initial: Speaker;
  talks: TalkOption[];
  events: EventOption[];
  action: (prev: unknown, form: FormData) => Promise<ActionResult>;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    action,
    { ok: true } as ActionResult,
  );

  const [imageUrl, setImageUrl] = useState<string>(initial.image_url ?? "");

  const errors = state.ok ? [] : state.errors;
  const errorFor = (field: string) =>
    errors.find((e) => e.field === field)?.message;
  const generalErrors = errors.filter((e) => !e.field);

  return (
    <div className="space-y-8 pb-24">
      <PageHeader
        eyebrow={mode === "new" ? "Add speaker" : "Edit speaker"}
        title={mode === "new" ? "Add a speaker" : (initial.name ?? "Edit speaker")}
        backHref="/admin/speakers"
        description={
          mode === "new"
            ? "Capture the basics — you can fill in talk + bio when content is finalised."
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

      <form action={formAction} className="grid gap-8 md:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          {initial.slug && (
            <input type="hidden" name="original_slug" value={initial.slug} />
          )}
          {/* Legacy year kept in sync for back-compat when no event is linked. */}
          <input type="hidden" name="fallback_year" value={initial.year ?? 2025} />

          <Card className="space-y-6 p-6">
            <SectionLabel>Speaker</SectionLabel>
            <Field label="Name" error={errorFor("name")}>
              <input
                name="name"
                required
                defaultValue={initial.name ?? ""}
                placeholder="e.g. Brittney Saunders"
                className={inputCls}
              />
            </Field>
            <Field
              label="Slug"
              hint="URL-safe id. Leave blank to auto-generate from the name."
            >
              <input
                name="slug"
                defaultValue={initial.slug ?? ""}
                placeholder="brittney-saunders"
                className={inputCls}
              />
            </Field>
            <Field
              label="Title / role"
              hint="A short descriptor shown under the name."
            >
              <input
                name="title"
                defaultValue={initial.title ?? ""}
                placeholder="e.g. Founder · Fayt the Label · Creator"
                className={inputCls}
              />
            </Field>
            <div className="grid gap-6 md:grid-cols-[1fr_140px]">
              <Field
                label="Event"
                error={errorFor("event")}
                hint="Which event this speaker is from. Sets the year automatically."
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
              <Field label="Display order" hint="Lower = earlier">
                <input
                  type="number"
                  name="display_order"
                  min={0}
                  defaultValue={initial.display_order ?? 999}
                  className={inputCls}
                />
              </Field>
            </div>
          </Card>

          <Card className="space-y-6 p-6">
            <SectionLabel>Talk</SectionLabel>
            <Field
              label="Linked talk"
              hint="Pick an existing talk. The speaker page pulls its title, blurb and video automatically."
            >
              <select
                name="talk_id"
                defaultValue={initial.talk_id ?? ""}
                className={inputCls}
              >
                <option value="">No talk linked yet</option>
                {talks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
          </Card>

          <Card className="space-y-6 p-6">
            <SectionLabel>Bio</SectionLabel>
            <Field
              label="Short bio"
              hint="A couple of human sentences about the speaker. Leave blank if unsure."
            >
              <textarea
                name="blurb"
                rows={5}
                defaultValue={initial.blurb ?? ""}
                placeholder="e.g. Newcastle-based founder building tools for…"
                className={`${inputCls} leading-[1.55]`}
              />
            </Field>
          </Card>

          <Card className="space-y-6 p-6">
            <SectionLabel>Social profiles</SectionLabel>
            <Field label="LinkedIn URL">
              <input
                name="linkedin_url"
                defaultValue={initial.linkedin_url ?? ""}
                placeholder="https://www.linkedin.com/in/…"
                className={inputCls}
              />
            </Field>
            <Field label="Instagram URL">
              <input
                name="instagram_url"
                defaultValue={initial.instagram_url ?? ""}
                placeholder="https://instagram.com/…"
                className={inputCls}
              />
            </Field>
          </Card>

          <Card className="space-y-6 p-6">
            <SectionLabel>Portrait</SectionLabel>
            <ImageUploadField
              name="image_url"
              label="Portrait"
              defaultValue={initial.image_url ?? ""}
              folder="speakers"
              baseName={initial.slug ?? initial.name}
              aspect="4/5"
              error={errorFor("image_url") ?? undefined}
              hint="Drag & drop, click to pick, or paste an external URL. 4:5 crop works best."
              onChange={setImageUrl}
            />
          </Card>
        </div>

        {/* Live preview */}
        <aside className="space-y-4 md:sticky md:top-8 md:self-start">
          <SectionLabel>Preview</SectionLabel>
          <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-[#1a1714] shadow-[var(--shadow-sm)]">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-white/40">
                <User className="h-10 w-10" strokeWidth={1.5} />
              </div>
            )}
          </div>
        </aside>

        {/* Sticky save bar */}
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[rgba(20,18,16,0.08)] bg-white/95 backdrop-blur-sm md:left-[260px]">
          <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-3 px-5 py-3.5 md:px-12">
            <Link
              href="/admin/speakers"
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
                    ? "Add speaker"
                    : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

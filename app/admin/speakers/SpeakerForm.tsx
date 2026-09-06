"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import ImageUploadField from "../ImageUploadField";
import { Card, Field, SectionLabel, inputCls } from "../ui";
import { useFormErrorToast } from "../Toaster";

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

export type TalkOption = { id: string; label: string };
export type EventOption = { id: string; label: string };

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

  const errors = state.ok ? [] : state.errors;
  const errorFor = (field: string) =>
    errors.find((e) => e.field === field)?.message;

  useFormErrorToast(state, errors);

  return (
    <form action={formAction} className="space-y-6">
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
        />
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
          {pending ? "Saving…" : mode === "new" ? "Add speaker" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

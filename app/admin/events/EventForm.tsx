"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import ImageUploadField from "../ImageUploadField";
import { Card, Field, SectionLabel, inputCls } from "../ui";
import { useFormErrorToast } from "../Toaster";

type ActionResult =
  | { ok: true }
  | { ok: false; errors: { field?: string; message: string }[] };

type EventInitial = {
  id: string;
  slug?: string;
  title?: string;
  tagline?: string | null;
  blurb?: string | null;
  kind?: string;
  status?: string;
  starts_at?: string | null;
  date_label?: string | null;
  short_date?: string | null;
  venue?: string | null;
  hero_image_url?: string | null;
  link_url?: string | null;
  link_label?: string | null;
  ticket_url?: string | null;
  show_in_nav?: boolean;
  display_order?: number;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Convert a stored UTC ISO string to the value a datetime-local input expects,
// in the browser's local time (Australia/Sydney for the admin).
function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const offMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offMs).toISOString().slice(0, 16);
}

// The reverse: a local datetime-local value back to a UTC ISO string.
function localInputToIso(local: string): string {
  if (!local) return "";
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

export default function EventForm({
  initial,
  action,
}: {
  initial: EventInitial;
  action: (prev: unknown, form: FormData) => Promise<ActionResult>;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    action,
    { ok: true } as ActionResult,
  );

  const [title, setTitle] = useState(initial.title ?? "");
  const [slug, setSlug] = useState(initial.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(initial.slug));
  const [startsLocal, setStartsLocal] = useState(
    isoToLocalInput(initial.starts_at),
  );
  const [showInNav, setShowInNav] = useState(initial.show_in_nav ?? true);

  const onTitleChange = (v: string) => {
    setTitle(v);
    if (!slugEdited) setSlug(slugify(v));
  };

  const errors = state.ok ? [] : state.errors;
  const errorFor = (field: string) =>
    errors.find((e) => e.field === field)?.message;

  useFormErrorToast(state, errors);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="id" value={initial.id} />
      {/* Client-converted UTC ISO for the start time. */}
      <input
        type="hidden"
        name="starts_at"
        value={localInputToIso(startsLocal)}
      />
      <input type="hidden" name="show_in_nav" value={showInNav ? "true" : "false"} />

      <Card className="space-y-6 p-6">
            <SectionLabel>Basics</SectionLabel>
            <Field label="Title" error={errorFor("title")}>
              <input
                name="title"
                required
                value={title}
                onChange={(e) => onTitleChange(e.currentTarget.value)}
                placeholder="e.g. Flagship TEDxNewy 2026"
                className={inputCls}
              />
            </Field>
            <Field
              label="Slug"
              hint="The web address, e.g. /events/signal-2026. Auto-filled from the title; edit if you like."
            >
              <input
                name="slug"
                value={slug}
                onChange={(e) => {
                  setSlug(e.currentTarget.value);
                  setSlugEdited(true);
                }}
                placeholder="signal-2026"
                className={inputCls}
              />
            </Field>
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Type" error={errorFor("kind")}>
                <select
                  name="kind"
                  defaultValue={initial.kind ?? "salon"}
                  className={inputCls}
                >
                  <option value="flagship">Flagship (main stage)</option>
                  <option value="salon">Salon</option>
                  <option value="special">Special event</option>
                </select>
              </Field>
              <Field
                label="Status"
                error={errorFor("status")}
                hint="Draft is hidden. Announced shows in the menu and coming up. Past shows in archives."
              >
                <select
                  name="status"
                  defaultValue={initial.status ?? "draft"}
                  className={inputCls}
                >
                  <option value="draft">Draft (hidden)</option>
                  <option value="announced">Announced</option>
                  <option value="past">Past</option>
                </select>
              </Field>
            </div>
            <Field
              label="Tagline"
              hint="A short one-line hook shown under the title."
            >
              <input
                name="tagline"
                defaultValue={initial.tagline ?? ""}
                placeholder="e.g. One idea, one minute."
                className={inputCls}
              />
            </Field>
            <Field
              label="Blurb"
              hint="A paragraph describing the event. Shown on its page."
            >
              <textarea
                name="blurb"
                rows={5}
                defaultValue={initial.blurb ?? ""}
                placeholder="What the event is about…"
                className={`${inputCls} leading-[1.55]`}
              />
            </Field>
          </Card>

          <Card className="space-y-6 p-6">
            <SectionLabel>When and where</SectionLabel>
            <Field
              label="Date and time"
              hint="Australia/Sydney. Used for ordering. Leave blank if not set yet."
            >
              <input
                type="datetime-local"
                value={startsLocal}
                onChange={(e) => setStartsLocal(e.currentTarget.value)}
                className={inputCls}
              />
            </Field>
            <div className="grid gap-6 md:grid-cols-2">
              <Field
                label="Date label"
                hint="How the date reads on the site, e.g. Friday 22 May 2026"
              >
                <input
                  name="date_label"
                  defaultValue={initial.date_label ?? ""}
                  placeholder="Friday 22 May 2026"
                  className={inputCls}
                />
              </Field>
              <Field
                label="Short date"
                hint="Short form for menus, e.g. 22 May"
              >
                <input
                  name="short_date"
                  defaultValue={initial.short_date ?? ""}
                  placeholder="22 May"
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Venue" hint="Where it's held, e.g. NUspace">
              <input
                name="venue"
                defaultValue={initial.venue ?? ""}
                placeholder="e.g. Conservatorium of Music"
                className={inputCls}
              />
            </Field>
          </Card>

          <Card className="space-y-6 p-6">
            <SectionLabel>Links</SectionLabel>
            <Field
              label="Link URL"
              hint="Optional. Where this event links instead of its own page, e.g. /60-second-talk-night or a ticket site."
            >
              <input
                name="link_url"
                defaultValue={initial.link_url ?? ""}
                placeholder="/60-second-talk-night"
                className={inputCls}
              />
            </Field>
            <Field
              label="Link label"
              hint="Optional. The words on the button, e.g. Register now."
            >
              <input
                name="link_label"
                defaultValue={initial.link_label ?? ""}
                placeholder="Register now"
                className={inputCls}
              />
            </Field>
            <Field
              label="Ticket URL"
              hint="Optional. A ticketing link shown as a button on the event page."
            >
              <input
                name="ticket_url"
                defaultValue={initial.ticket_url ?? ""}
                placeholder="https://…"
                className={inputCls}
              />
            </Field>
          </Card>

          <Card className="space-y-6 p-6">
            <SectionLabel>Hero image</SectionLabel>
            <ImageUploadField
              name="hero_image_url"
              label="Hero image"
              defaultValue={initial.hero_image_url ?? ""}
              folder="events"
              baseName={slug || title}
              aspect="16/9"
              hint="Wide 16:9 works best. Drag and drop, click to pick, or paste a URL."
            />
          </Card>

          <Card className="space-y-6 p-6">
            <SectionLabel>Menu</SectionLabel>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={showInNav}
                onChange={(e) => setShowInNav(e.currentTarget.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[rgba(20,18,16,0.3)] text-[#e02214] focus:ring-[#e02214]/30"
              />
              <span className="text-[13.5px] leading-[1.5] text-[#2a2521]">
                Show in the header menu.
                <span className="mt-0.5 block text-[12px] text-[#6b6459]">
                  Only announced events appear in the Upcoming menu.
                </span>
              </span>
            </label>
            <Field label="Display order" hint="Lower = earlier in lists and menus">
              <input
                type="number"
                name="display_order"
                min={0}
                defaultValue={initial.display_order ?? 999}
                className={inputCls}
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
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

"use client";

import {
  useActionState,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  CalendarX,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  CopyPlus,
  Download,
  ExternalLink,
  Loader2,
  Paintbrush,
  Send,
  Smartphone,
  Trash2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import type { PostSpec } from "@/lib/creative-canvas";
import CreativeStudio, {
  type AttachPayload,
} from "@/components/team-brand/CreativeStudio";
import { Card, Field, Flash, PageHeader, SectionLabel, inputCls } from "../../ui";
import { PendingButton, PendingIconButton } from "../../PendingButtons";
import { useConfirm } from "../../ConfirmDialog";
import PostPreview from "./PostPreview";
import {
  addMedia,
  deleteMedia,
  deletePost,
  duplicateMedia,
  moveMedia,
  publishToChannel,
  setStatus,
  updateMedia,
  updatePost,
  type ActionResult,
} from "../actions";
import {
  CHANNELS,
  resultFor,
  STATUS_CHIP,
  statusLabel,
  type ChannelId,
  type SocialConnectionRow,
  type SocialMediaRow,
  type SocialPostRow,
} from "../shared";

const MAX_BYTES = 8 * 1024 * 1024; // matches the cms-uploads bucket cap

function slugify(s: string) {
  return (
    (s || "tedxnewy-post")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "tedxnewy-post"
  );
}

// Stored UTC ISO -> the value a datetime-local input expects, and back.
function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const offMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offMs).toISOString().slice(0, 16);
}
function localInputToIso(local: string): string {
  if (!local) return "";
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

function fmtDateTime(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Australia/Sydney",
  });
}

async function uploadToStorage(
  data: Blob,
  path: string,
  contentType: string,
): Promise<string> {
  const supabase = getBrowserSupabase();
  const { error } = await supabase.storage
    .from("cms-uploads")
    .upload(path, data, {
      cacheControl: "31536000",
      upsert: false,
      contentType,
    });
  if (error) throw new Error(error.message);
  return supabase.storage.from("cms-uploads").getPublicUrl(path).data.publicUrl;
}

function extOf(name: string, fallback = "jpg") {
  return (
    (name.split(".").pop() || fallback)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "") || fallback
  );
}

export default function PostEditor({
  post,
  media,
  connections,
}: {
  post: SocialPostRow;
  media: SocialMediaRow[];
  connections: SocialConnectionRow[];
}) {
  const router = useRouter();
  const { confirm, dialogs } = useConfirm();
  const [, startTransition] = useTransition();

  // ---- details form ----
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    updatePost,
    null,
  );
  const [caption, setCaption] = useState(post.caption);
  const [channels, setChannels] = useState<ChannelId[]>(post.channels ?? []);
  const [overrides, setOverrides] = useState<Partial<Record<ChannelId, string>>>(
    post.channel_captions ?? {},
  );
  const [publishLocal, setPublishLocal] = useState(isoToLocalInput(post.publish_at));

  // ---- design studio ----
  const [studioOpen, setStudioOpen] = useState(false);
  const [editing, setEditing] = useState<SocialMediaRow | null>(null);
  const [studioKey, setStudioKey] = useState(0);

  const openStudio = (m: SocialMediaRow | null) => {
    setEditing(m);
    setStudioKey((k) => k + 1);
    setStudioOpen(true);
  };

  // ---- media upload / errors / copy feedback ----
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [copied, setCopied] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  // ---- publish (Buffer) ----
  const [publishChannel, setPublishChannel] = useState<ChannelId | null>(null);
  const [publishPending, setPublishPending] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const connectionFor = (c: ChannelId) =>
    connections.find((x) => x.channel === c) ?? null;

  const effectiveCaption = (c: ChannelId) =>
    (overrides[c] ?? "").trim() || caption;

  const refresh = () => startTransition(() => router.refresh());

  const handlePublish = async (channel: ChannelId) => {
    setPublishPending(true);
    setPublishError(null);
    try {
      const res = await publishToChannel(post.id, channel);
      if (!res.ok) {
        setPublishError(res.error);
        return;
      }
      setPublishChannel(null);
      refresh();
    } catch (e) {
      setPublishError(e instanceof Error ? e.message : "Publish failed.");
    } finally {
      setPublishPending(false);
    }
  };

  const handleUploadFile = async (file: File | undefined) => {
    if (!file) return;
    setMediaError(null);
    if (!file.type.startsWith("image/")) {
      setMediaError("Pick an image file (PNG, JPG, WebP).");
      return;
    }
    if (file.size > MAX_BYTES) {
      setMediaError(`File too big. Keep it under ${MAX_BYTES / 1024 / 1024}MB.`);
      return;
    }
    setUploading(true);
    try {
      const url = await uploadToStorage(
        file,
        `socials/${post.id}/upload-${Date.now()}.${extOf(file.name)}`,
        file.type,
      );
      const fd = new FormData();
      fd.set("post_id", post.id);
      fd.set("image_url", url);
      const res = await addMedia(fd);
      if (!res.ok) throw new Error(res.errors[0]?.message ?? "Could not save");
      refresh();
    } catch (e) {
      setMediaError(e instanceof Error ? e.message : "Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleAttach = async ({ blob, spec, sourceFile, sourceImageUrl }: AttachPayload) => {
    const imageUrl = await uploadToStorage(
      blob,
      `socials/${post.id}/design-${Date.now()}.png`,
      "image/png",
    );
    let sourceUrl = editing?.source_image_url ?? "";
    if (sourceFile) {
      sourceUrl = await uploadToStorage(
        sourceFile,
        `socials/${post.id}/source-${Date.now()}.${extOf(sourceFile.name)}`,
        sourceFile.type,
      );
    } else if (sourceImageUrl) {
      // Already permanently hosted (an event photo from the gallery) — no
      // need to re-upload a copy into cms-uploads.
      sourceUrl = sourceImageUrl;
    }
    const fd = new FormData();
    fd.set("post_id", post.id);
    fd.set("image_url", imageUrl);
    fd.set("source_image_url", sourceUrl);
    fd.set("spec", JSON.stringify(spec));
    let res: ActionResult;
    if (editing) {
      fd.set("media_id", editing.id);
      res = await updateMedia(fd);
    } else {
      res = await addMedia(fd);
    }
    if (!res.ok) throw new Error(res.errors[0]?.message ?? "Could not save");
    setStudioOpen(false);
    setEditing(null);
    refresh();
  };

  const handleDeleteMedia = async (m: SocialMediaRow) => {
    const ok = await confirm({
      title: "Remove this image?",
      body: "It comes off this post. The file stays in storage.",
      confirmLabel: "Remove",
      tone: "danger",
    });
    if (!ok) return;
    const fd = new FormData();
    fd.set("media_id", m.id);
    fd.set("post_id", post.id);
    await deleteMedia(fd);
    refresh();
  };

  const handleDeletePost = async () => {
    const ok = await confirm({
      title: "Delete this post?",
      body: "The draft, its caption and its image list are removed. This cannot be undone.",
      confirmLabel: "Delete post",
      tone: "danger",
    });
    if (!ok) return;
    const fd = new FormData();
    fd.set("id", post.id);
    await deletePost(fd);
  };

  const copyCaption = (label: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      window.setTimeout(() => setCopied(""), 1800);
    });
  };

  const posted = fmtDateTime(post.posted_at);
  const errors = state && !state.ok ? state.errors : [];
  const errorFor = (field: string) =>
    errors.find((e) => e.field === field)?.message;
  const generalErrors = errors.filter((e) => !e.field);

  return (
    <div className="space-y-8">
      {dialogs}
      <PageHeader
        eyebrow="Community · Socials"
        title={post.title}
        backHref="/admin/socials"
        actions={
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 font-mono text-[10px] font-semibold uppercase ${STATUS_CHIP[post.status]}`}
            style={{ letterSpacing: "0.18em" }}
          >
            {statusLabel(post.status)}
          </span>
        }
      />

      {state?.ok && <Flash tone="ok">Saved.</Flash>}
      {generalErrors.length > 0 && (
        <Flash tone="error">
          {generalErrors.map((e, i) => (
            <div key={i}>{e.message}</div>
          ))}
        </Flash>
      )}

      {/* ---- status workflow ---- */}
      <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <SectionLabel>Status</SectionLabel>
          <p className="mt-2 text-[13px] leading-[1.5] text-[#6b6459]">
            {post.status === "draft" &&
              "Still a draft. Mark it Scheduled once it's ready to go out."}
            {post.status === "scheduled" &&
              "Approved. Publish it below on any connected channel, or by hand on any that isn't."}
            {post.status === "posted" &&
              `Posted${posted ? ` ${posted}` : ""}${post.posted_by ? ` by ${post.posted_by}` : ""} — happens automatically once every selected channel is out.`}
          </p>
        </div>
        {post.status !== "posted" && (
          <form action={setStatus}>
            <input type="hidden" name="id" value={post.id} />
            <input
              type="hidden"
              name="status"
              value={post.status === "draft" ? "scheduled" : "draft"}
            />
            <PendingButton
              icon={
                post.status === "draft" ? (
                  <CalendarClock className="h-4 w-4" strokeWidth={2.25} />
                ) : (
                  <CalendarX className="h-4 w-4" strokeWidth={2.25} />
                )
              }
            >
              {post.status === "draft" ? "Mark as scheduled" : "Move back to draft"}
            </PendingButton>
          </form>
        )}
      </Card>

      {/* ---- details ---- */}
      <form action={formAction}>
        <Card className="space-y-6 p-6">
          <SectionLabel>Post</SectionLabel>
          <input type="hidden" name="id" value={post.id} />
          <input
            type="hidden"
            name="publish_at"
            value={localInputToIso(publishLocal)}
          />

          <Field label="Title" hint="Internal only, so the list stays readable." error={errorFor("title")}>
            <input
              name="title"
              required
              defaultValue={post.title}
              placeholder="e.g. Flagship speaker reveal 1 of 3"
              className={inputCls}
            />
          </Field>

          <Field label="Channels" hint="Where this post is going.">
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map((c) => {
                const on = channels.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={`cursor-pointer rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                      on
                        ? "bg-[#e02214] text-white"
                        : "bg-[rgba(20,18,16,0.06)] text-[#141210] hover:bg-[rgba(20,18,16,0.10)]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="channels"
                      value={c.id}
                      checked={on}
                      onChange={(e) =>
                        setChannels((prev) =>
                          e.target.checked
                            ? [...prev, c.id]
                            : prev.filter((x) => x !== c.id),
                        )
                      }
                      className="sr-only"
                    />
                    {c.label}
                  </label>
                );
              })}
            </div>
          </Field>

          <Field
            label="Planned date"
            hint="Australia/Sydney. A target for the calendar, not a scheduler: nothing sends automatically."
            error={errorFor("publish_at")}
          >
            <input
              type="datetime-local"
              value={publishLocal}
              onChange={(e) => setPublishLocal(e.currentTarget.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Caption" hint="Written once, used on every channel unless a channel version below overrides it.">
            <textarea
              name="caption"
              rows={6}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="The caption, hashtags and call to action…"
              className={`${inputCls} leading-[1.55]`}
            />
            {channels.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px]">
                {channels.map((id) => {
                  const c = CHANNELS.find((x) => x.id === id)!;
                  const len = effectiveCaption(id).length;
                  const over = len > c.captionLimit;
                  return (
                    <span
                      key={id}
                      className={over ? "font-semibold text-[#b91404]" : "text-[#6b6459]"}
                    >
                      {c.label} {len.toLocaleString()}/{c.captionLimit.toLocaleString()}
                      {over ? " · too long" : ""}
                    </span>
                  );
                })}
              </div>
            )}
          </Field>

          {channels.map((id) => {
            const c = CHANNELS.find((x) => x.id === id)!;
            return (
              <Field
                key={id}
                label={`${c.label} version`}
                hint={`Optional. Leave blank to use the main caption on ${c.label}.`}
              >
                <textarea
                  name={`caption_${id}`}
                  rows={3}
                  value={overrides[id] ?? ""}
                  onChange={(e) =>
                    setOverrides((prev) => ({ ...prev, [id]: e.target.value }))
                  }
                  placeholder={`A ${c.label}-specific take, if it needs one…`}
                  className={`${inputCls} leading-[1.55]`}
                />
              </Field>
            );
          })}

          <Field label="Notes" hint="Internal only, never published. Anything worth flagging for whoever looks at this next.">
            <input
              name="notes"
              defaultValue={post.status_note ?? ""}
              placeholder="e.g. Waiting on final speaker approval before this goes out."
              className={inputCls}
            />
          </Field>

          <div className="flex items-center justify-between gap-3 border-t border-[rgba(20,18,16,0.08)] pt-5">
            <button
              type="button"
              onClick={handleDeletePost}
              className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(224,34,20,0.08)] px-3 py-1.5 text-[12.5px] font-medium text-[#b91404] transition-colors hover:bg-[rgba(224,34,20,0.15)]"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
              Delete post
            </button>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-[rgba(20,18,16,0.06)] px-5 py-2.5 text-[13.5px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
              >
                <Smartphone className="h-4 w-4" strokeWidth={2.25} />
                Preview post
              </button>
              <PendingButton disabled={pending}>Save changes</PendingButton>
            </div>
          </div>
        </Card>
      </form>

      {/* ---- media ---- */}
      <Card className="space-y-5 p-6">
        <SectionLabel>Graphics</SectionLabel>
        <p className="max-w-[70ch] text-[13px] leading-[1.6] text-[#6b6459]">
          The images for this post, in carousel order. Design them here with the
          same Creative studio as the team brand portal, or upload finished
          files. Designs stay editable: reopen them any time.
        </p>

        {mediaError && <Flash tone="error">{mediaError}</Flash>}

        {media.length > 0 && (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {media.map((m, i) => {
              const canEdit = Boolean(m.spec && m.source_image_url);
              const dlName = `${slugify(post.title)}-${i + 1}.${extOf(m.image_url, "png")}`;
              return (
                <li
                  key={m.id}
                  className="overflow-hidden rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white"
                >
                  <div className="relative aspect-square bg-[#1a1714]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.image_url}
                      alt=""
                      className="absolute inset-0 h-full w-full object-contain"
                    />
                    <span className="absolute left-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white">
                      {i + 1}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                    <div className="flex items-center">
                      <form action={moveMedia}>
                        <input type="hidden" name="media_id" value={m.id} />
                        <input type="hidden" name="post_id" value={post.id} />
                        <input type="hidden" name="dir" value="up" />
                        <PendingIconButton ariaLabel="Move earlier" disabled={i === 0}>
                          <ChevronUp className="h-4 w-4" strokeWidth={2.25} />
                        </PendingIconButton>
                      </form>
                      <form action={moveMedia}>
                        <input type="hidden" name="media_id" value={m.id} />
                        <input type="hidden" name="post_id" value={post.id} />
                        <input type="hidden" name="dir" value="down" />
                        <PendingIconButton
                          ariaLabel="Move later"
                          disabled={i === media.length - 1}
                        >
                          <ChevronDown className="h-4 w-4" strokeWidth={2.25} />
                        </PendingIconButton>
                      </form>
                    </div>
                    <div className="flex items-center">
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => openStudio(m)}
                          title="Edit design"
                          aria-label="Edit design"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6b6459] transition-colors hover:bg-[rgba(20,18,16,0.08)] hover:text-[#141210]"
                        >
                          <Paintbrush className="h-4 w-4" strokeWidth={2.25} />
                        </button>
                      )}
                      <form action={duplicateMedia}>
                        <input type="hidden" name="media_id" value={m.id} />
                        <input type="hidden" name="post_id" value={post.id} />
                        <PendingIconButton
                          ariaLabel="Duplicate"
                          title="Duplicate: start a second graphic from this one"
                        >
                          <CopyPlus className="h-4 w-4" strokeWidth={2.25} />
                        </PendingIconButton>
                      </form>
                      <a
                        href={`${m.image_url}?download=${dlName}`}
                        title="Download"
                        aria-label="Download"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6b6459] transition-colors hover:bg-[rgba(20,18,16,0.08)] hover:text-[#141210]"
                      >
                        <Download className="h-4 w-4" strokeWidth={2.25} />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDeleteMedia(m)}
                        title="Remove"
                        aria-label="Remove"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6b6459] transition-colors hover:bg-[rgba(224,34,20,0.10)] hover:text-[#b91404]"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2.25} />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => openStudio(null)}
            className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-5 py-2.5 text-[13.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404]"
          >
            <Paintbrush className="h-4 w-4" strokeWidth={2.25} />
            Design a graphic
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-full bg-[rgba(20,18,16,0.06)] px-5 py-2.5 text-[13.5px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
            ) : (
              <Upload className="h-4 w-4" strokeWidth={2.25} />
            )}
            {uploading ? "Uploading…" : "Upload an image"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            hidden
            onChange={(e) => {
              handleUploadFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>

        {studioOpen && (
          <div className="rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-[#faf6ee] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="font-sans text-[15px] font-medium text-[#141210]">
                {editing ? "Edit design" : "Creative studio"}
              </div>
              <button
                type="button"
                onClick={() => {
                  setStudioOpen(false);
                  setEditing(null);
                }}
                aria-label="Close the studio"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6b6459] transition-colors hover:bg-[rgba(20,18,16,0.08)] hover:text-[#141210]"
              >
                <X className="h-4 w-4" strokeWidth={2.25} />
              </button>
            </div>
            <CreativeStudio
              key={`${editing?.id ?? "new"}-${studioKey}`}
              initialSpec={
                editing?.spec ? (editing.spec as unknown as PostSpec) : undefined
              }
              initialImageUrl={editing?.source_image_url ?? undefined}
              attachLabel={editing ? "Save design" : "Attach to post"}
              onAttach={handleAttach}
            />
          </div>
        )}
      </Card>

      {/* ---- manual posting run sheet ---- */}
      {post.status === "scheduled" && (
        <Card className="space-y-5 border-[#3b82f6]/25 p-6">
          <SectionLabel>Post it by hand</SectionLabel>
          <p className="max-w-[70ch] text-[13px] leading-[1.6] text-[#6b6459]">
            This post is approved but nothing sends itself. For each channel:
            copy the caption, download the graphics above, post natively, then
            mark the post as posted.
          </p>
          {channels.length === 0 ? (
            <Flash tone="info">
              Pick at least one channel above so the run sheet knows where this
              is going.
            </Flash>
          ) : (
            <ul className="space-y-2.5">
              {channels.map((id) => {
                const c = CHANNELS.find((x) => x.id === id)!;
                const text = effectiveCaption(id);
                const over = text.length > c.captionLimit;
                const connection = connectionFor(id);
                const connected = connection?.status === "connected";
                const result = resultFor(post, id);

                return (
                  <li
                    key={id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[rgba(20,18,16,0.10)] bg-white px-4 py-3"
                  >
                    <div>
                      <div className="text-[13.5px] font-medium text-[#141210]">
                        {c.label}
                      </div>
                      <div
                        className={`font-mono text-[11px] ${over ? "font-semibold text-[#b91404]" : "text-[#6b6459]"}`}
                      >
                        {text.length.toLocaleString()}/{c.captionLimit.toLocaleString()}
                        {over ? " · too long, trim before posting" : ""}
                      </div>
                      {result?.status === "posted" && (
                        <div className="mt-1 flex items-center gap-1.5 text-[11.5px] font-medium text-[#15803d]">
                          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                          Posted
                        </div>
                      )}
                      {result?.status === "failed" && (
                        <div className="mt-1 flex items-center gap-1.5 text-[11.5px] font-medium text-[#b91404]">
                          <XCircle className="h-3.5 w-3.5" strokeWidth={2.25} />
                          {result.error ?? "Publish failed"}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {connected ? (
                        <>
                          {result?.permalink && (
                            <a
                              href={result.permalink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-3.5 py-1.5 text-[12px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
                            >
                              <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.25} />
                              View post
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setPublishError(null);
                              setPublishChannel(id);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-full bg-[#e02214] px-3.5 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[#b91404]"
                          >
                            <Send className="h-3.5 w-3.5" strokeWidth={2.25} />
                            {result?.status === "posted"
                              ? "Publish again"
                              : result?.status === "failed"
                                ? "Retry publish"
                                : `Publish to ${c.label}`}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => copyCaption(c.label, text)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-3.5 py-1.5 text-[12px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
                          >
                            {copied === c.label ? (
                              <Check className="h-3.5 w-3.5" strokeWidth={2.25} />
                            ) : (
                              <Copy className="h-3.5 w-3.5" strokeWidth={2.25} />
                            )}
                            {copied === c.label ? "Copied" : "Copy caption"}
                          </button>
                          <a
                            href={c.postUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-3.5 py-1.5 text-[12px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
                          >
                            <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.25} />
                            Open {c.label}
                          </a>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <form action={setStatus}>
            <input type="hidden" name="id" value={post.id} />
            <input type="hidden" name="status" value="posted" />
            <PendingButton icon={<Check className="h-4 w-4" strokeWidth={2.25} />}>
              Mark as posted
            </PendingButton>
          </form>
        </Card>
      )}

      {previewOpen && (
        <PostPreview
          channels={channels}
          captions={
            Object.fromEntries(
              CHANNELS.map((c) => [c.id, effectiveCaption(c.id)]),
            ) as Record<ChannelId, string>
          }
          media={media.map((m) => m.image_url)}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      {publishChannel && (
        <PostPreview
          channels={channels}
          lockedChannel={publishChannel}
          captions={
            Object.fromEntries(
              CHANNELS.map((c) => [c.id, effectiveCaption(c.id)]),
            ) as Record<ChannelId, string>
          }
          media={media.map((m) => m.image_url)}
          onClose={() => {
            if (publishPending) return;
            setPublishChannel(null);
            setPublishError(null);
          }}
          footer={
            <div className="w-[375px] max-w-[92vw] space-y-3 rounded-[16px] bg-white p-4 shadow-2xl">
              <p className="text-center text-[13.5px] font-medium text-[#141210]">
                Are you happy with how this looks?
              </p>
              {publishError && (
                <p className="text-center text-[12.5px] font-medium text-[#b91404]">
                  {publishError}
                </p>
              )}
              <div className="flex gap-2.5">
                <button
                  type="button"
                  disabled={publishPending}
                  onClick={() => {
                    setPublishChannel(null);
                    setPublishError(null);
                  }}
                  className="flex-1 rounded-full bg-[rgba(20,18,16,0.06)] px-4 py-2.5 text-[13.5px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  No, go back
                </button>
                <button
                  type="button"
                  disabled={publishPending}
                  onClick={() => handlePublish(publishChannel)}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#e02214] px-4 py-2.5 text-[13.5px] font-medium text-white transition-colors hover:bg-[#b91404] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {publishPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
                  ) : (
                    <Send className="h-4 w-4" strokeWidth={2.25} />
                  )}
                  {publishPending ? "Posting…" : "Yes, post it"}
                </button>
              </div>
            </div>
          }
        />
      )}
    </div>
  );
}

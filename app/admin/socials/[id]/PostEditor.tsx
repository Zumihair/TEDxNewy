"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
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
  Lock,
  Paintbrush,
  Send,
  Smartphone,
  Trash2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { compressImage } from "@/lib/image-compress";
import type { PostSpec } from "@/lib/creative-canvas";
import CreativeStudio, {
  type AttachPayload,
} from "@/components/team-brand/CreativeStudio";
import { Card, Field, Flash, PageHeader, SectionLabel, inputCls } from "../../ui";
import AutoGrowTextarea from "../../AutoGrowTextarea";
import { PendingButton, PendingIconButton } from "../../PendingButtons";
import { useConfirm } from "../../ConfirmDialog";
import DateTimePicker from "../../DateTimePicker";
import { useUnsavedGuard } from "../../useUnsavedGuard";
import { asStage, draftStages, type DraftStage } from "../../stages";
import PostPreview from "./PostPreview";
import {
  addMedia,
  clearSchedule,
  deleteMedia,
  deletePost,
  duplicateMedia,
  duplicatePost,
  moveMedia,
  publishToChannel,
  setStage,
  setStatus,
  updateMedia,
  updatePost,
  type ActionResult,
} from "../actions";
import {
  CHANNELS,
  IMAGE_ACCEPT,
  isVideo,
  mediaAddError,
  resultFor,
  AUTOPUBLISH_MAX_ATTEMPTS,
  STATUS_CHIP,
  statusLabel,
  VIDEO_ACCEPT,
  type ChannelId,
  type SocialConnectionRow,
  type SocialMediaRow,
  type SocialPostRow,
} from "../shared";
import { useFormErrorToast, useToast } from "../../Toaster";

const MAX_BYTES = 8 * 1024 * 1024; // matches the cms-uploads bucket cap
// Video needs far more headroom than a still: a 30s Reel at a sane bitrate is
// tens of MB. The cms-uploads bucket must allow at least this much or the
// upload fails at the storage layer, not here (see README, Socials video).
const VIDEO_MAX_BYTES = 50 * 1024 * 1024;

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
  const toast = useToast();
  const [, startTransition] = useTransition();

  // ---- details form ----
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    updatePost,
    null,
  );
  const [title, setTitle] = useState(post.title);
  const [caption, setCaption] = useState(post.caption);
  const [notes, setNotes] = useState(post.status_note ?? "");
  const [channels, setChannels] = useState<ChannelId[]>(post.channels ?? []);
  const [overrides, setOverrides] = useState<Partial<Record<ChannelId, string>>>(
    post.channel_captions ?? {},
  );
  // Which channels get their own caption. Per-channel captions are the
  // exception, not the rule (LinkedIn is the usual one, for link posts), so
  // nothing is shown until a channel is picked. Seeded from whatever this
  // post already has a version for.
  const [customChannels, setCustomChannels] = useState<ChannelId[]>(() =>
    CHANNELS.map((c) => c.id).filter((id) =>
      (post.channel_captions?.[id] ?? "").trim(),
    ),
  );
  const [publishLocal, setPublishLocal] = useState(isoToLocalInput(post.publish_at));
  const [stage, setStageLocal] = useState<DraftStage>(asStage(post.stage));

  // ---- unsaved-changes guard ----
  // Everything the Post form owns, snapshotted. Dirty until the next
  // successful save. Stage is not in here: it saves the moment it's clicked.
  const serialize = () =>
    JSON.stringify({
      title,
      caption,
      notes,
      channels: [...channels].sort(),
      // Only the channels actually carrying a version count, and in a stable
      // order, so picking and unpicking the same channel isn't "dirty".
      overrides: Object.fromEntries(
        [...customChannels]
          .sort()
          .map((c) => [c, (overrides[c] ?? "").trim()]),
      ),
      publishLocal,
    });
  const [baseline, setBaseline] = useState(serialize);
  const dirty = serialize() !== baseline;
  const { release } = useUnsavedGuard({ dirty, confirm });

  // ---- design studio ----
  const [studioOpen, setStudioOpen] = useState(false);
  const [editing, setEditing] = useState<SocialMediaRow | null>(null);
  const [studioKey, setStudioKey] = useState(0);
  const studioRef = useRef<HTMLDivElement>(null);

  const openStudio = (m: SocialMediaRow | null) => {
    setEditing(m);
    setStudioKey((k) => k + 1);
    setStudioOpen(true);
  };

  // Bring the studio into view when it opens or switches design. It renders
  // below a long form, so without this a click on "Design a graphic" or a
  // brush icon looks like nothing happened.
  useEffect(() => {
    if (!studioOpen) return;
    studioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [studioOpen, studioKey]);

  // ---- media upload / copy feedback ----
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  // ---- publish (Buffer) ----
  const [publishChannel, setPublishChannel] = useState<ChannelId | null>(null);
  const [publishPending, setPublishPending] = useState(false);

  /** A post is either one video or a set of images, so this switches the
   *  whole media section between the two modes. */
  const hasVideo = media.some(isVideo);

  const connectionFor = (c: ChannelId) =>
    connections.find((x) => x.channel === c) ?? null;

  const effectiveCaption = (c: ChannelId) =>
    (customChannels.includes(c) ? (overrides[c] ?? "").trim() : "") || caption;

  /** Channels offered a caption of their own: the ones this post is going to. */
  const captionTargets = CHANNELS.filter((c) => channels.includes(c.id));

  const toggleCustomChannel = (id: ChannelId) =>
    setCustomChannels((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const refresh = () => startTransition(() => router.refresh());

  // A successful save is the new clean baseline.
  useEffect(() => {
    if (state?.ok) {
      setBaseline(serialize());
      toast.success("Saved.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const changeStage = (next: DraftStage) => {
    setStageLocal(next);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", post.id);
      fd.set("stage", next);
      await setStage(fd);
      router.refresh();
    });
  };

  const handleClearSchedule = async () => {
    const ok = await confirm({
      title: "Clear the schedule?",
      body: "The date and time come off this post and it goes back to Drafts. The post itself, its caption and its images are untouched, and you can schedule it again any time.",
      confirmLabel: "Clear scheduling",
    });
    if (!ok) return;

    setPublishLocal("");
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", post.id);
      await clearSchedule(fd);
      // Mark just the date clean again. Rewriting the whole baseline here
      // would quietly swallow any other unsaved edits sitting in the form.
      setBaseline((b) => {
        try {
          return JSON.stringify({ ...JSON.parse(b), publishLocal: "" });
        } catch {
          return b;
        }
      });
      router.refresh();
    });
  };

  const handlePublish = async (channel: ChannelId) => {
    setPublishPending(true);
    try {
      const res = await publishToChannel(post.id, channel);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setPublishChannel(null);
      toast.success(`Published to ${CHANNELS.find((c) => c.id === channel)?.label ?? channel}.`);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Publish failed.");
    } finally {
      setPublishPending(false);
    }
  };

  const handleUploadFile = async (file: File | undefined) => {
    if (!file) return;

    const isVideoFile = file.type.startsWith("video/");
    if (!isVideoFile && !file.type.startsWith("image/")) {
      toast.error("Pick an image (PNG, JPG, WebP) or a video (MP4, MOV).");
      return;
    }
    // The one-video / no-mixing rule, checked here so the file never gets
    // uploaded just to be rejected by the server. addMedia re-checks it.
    const clash = mediaAddError(media, isVideoFile ? "video" : "image");
    if (clash) {
      toast.error(clash);
      return;
    }
    // A video is uploaded as-is (it has its own, larger limit); Instagram
    // takes it as a Reel. Videos are never compressed here.
    if (isVideoFile && file.size > VIDEO_MAX_BYTES) {
      toast.error(
        `File too big. Keep video under ${VIDEO_MAX_BYTES / 1024 / 1024}MB.`,
      );
      return;
    }

    setUploading(true);
    try {
      // Shrink a big photo before it goes anywhere, so it clears both the 8MB
      // upload cap and Instagram's own 8MB / 1440px publish limits. An image
      // already within bounds is returned untouched, so a well-sized photo
      // keeps its original quality.
      let upload: Blob = file;
      let uploadType = file.type;
      let uploadExt = extOf(file.name);
      if (!isVideoFile) {
        const result = await compressImage(file);
        upload = result.file;
        uploadType = result.file.type;
        uploadExt = extOf(result.file.name);
        if (upload.size > MAX_BYTES) {
          toast.error(
            `This image is still ${(upload.size / 1024 / 1024).toFixed(1)}MB after compression. Try a tighter crop or a smaller export.`,
          );
          return;
        }
        if (result.compressed) {
          toast.success(
            `Compressed for upload: ${(result.originalBytes / 1024 / 1024).toFixed(1)}MB → ${(result.finalBytes / 1024 / 1024).toFixed(1)}MB.`,
          );
        }
      }

      const url = await uploadToStorage(
        upload,
        `socials/${post.id}/upload-${Date.now()}.${uploadExt}`,
        uploadType,
      );
      const fd = new FormData();
      fd.set("post_id", post.id);
      fd.set("image_url", url);
      fd.set("media_type", isVideoFile ? "video" : "image");
      const res = await addMedia(fd);
      if (!res.ok) throw new Error(res.errors[0]?.message ?? "Could not save");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed. Try again.");
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
    // The post is going away; don't warn about unsaved edits on the way out.
    release();
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
  const locked = post.status === "posted";
  const errors = state && !state.ok ? state.errors : [];
  useFormErrorToast(state, errors);
  const errorFor = (field: string) =>
    errors.find((e) => e.field === field)?.message;

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

      {/* ---- stage ----
          Only a draft asks for a stage judgement. Scheduled and posted are
          both already-finalised states, so the picker gives way to a plain
          status line instead. */}
      {post.status === "draft" ? (
        <Card className="space-y-4 p-6">
          <SectionLabel>Stage</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {draftStages("social").map((s) => {
              const on = s.id === stage;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => changeStage(s.id)}
                  title={s.blurb}
                  aria-pressed={on}
                  className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                    on
                      ? "bg-[#e02214] text-white"
                      : "bg-[rgba(20,18,16,0.06)] text-[#141210] hover:bg-[rgba(20,18,16,0.10)]"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
          <p className="text-[13px] leading-[1.5] text-[#6b6459]">
            {draftStages("social").find((s) => s.id === stage)?.blurb}
          </p>
        </Card>
      ) : (
        <Card className="flex items-start gap-3 p-6">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#6b6459]" strokeWidth={2.25} />
          <p className="text-[13px] leading-[1.5] text-[#6b6459]">
            {post.status === "posted"
              ? `Posted${posted ? ` ${posted}` : ""}${post.posted_by ? ` by ${post.posted_by}` : ""}.`
              : "Scheduled. Clear the schedule below to edit its stage again."}
          </p>
        </Card>
      )}

      {/* ---- details ----
          Locked once posted: view only, no inputs, no Save. Duplicate to a
          fresh draft is the way to reuse it. */}
      {post.status === "posted" ? (
        <Card className="space-y-6 p-6">
          <div className="flex items-center justify-between gap-3">
            <SectionLabel>Post</SectionLabel>
            <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-[#6b6459]">
              <Lock className="h-3.5 w-3.5" strokeWidth={2.25} />
              Locked
            </span>
          </div>

          <ReadOnlyField label="Channels">
            {channels.length
              ? channels.map((id) => CHANNELS.find((c) => c.id === id)?.label ?? id).join(" · ")
              : "None"}
          </ReadOnlyField>

          <ReadOnlyField label="Caption">
            <span className="whitespace-pre-wrap">{caption || "—"}</span>
          </ReadOnlyField>

          {captionTargets
            .filter((c) => customChannels.includes(c.id))
            .map((c) => (
              <ReadOnlyField key={c.id} label={`${c.label} version`}>
                <span className="whitespace-pre-wrap">{overrides[c.id]}</span>
              </ReadOnlyField>
            ))}

          {notes && <ReadOnlyField label="Notes">{notes}</ReadOnlyField>}

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
              <form action={duplicatePost}>
                <input type="hidden" name="id" value={post.id} />
                <PendingButton icon={<Copy className="h-4 w-4" strokeWidth={2.25} />}>
                  Duplicate to drafts
                </PendingButton>
              </form>
            </div>
          </div>
        </Card>
      ) : (
      <form action={formAction}>
        <Card className="space-y-6 p-6">
          <SectionLabel>Post</SectionLabel>
          <input type="hidden" name="id" value={post.id} />
          <input
            type="hidden"
            name="publish_at"
            value={localInputToIso(publishLocal)}
          />

          <Field label="Title" hint="Internal only." error={errorFor("title")}>
            <input
              name="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Flagship speaker reveal 1 of 3"
              className={inputCls}
            />
          </Field>

          <Field label="Channels">
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
            label="Schedule date"
            hint="Australia/Sydney. Connected channels publish automatically once this passes."
            error={errorFor("publish_at")}
          >
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-[240px] flex-1">
                <DateTimePicker
                  value={publishLocal}
                  onChange={setPublishLocal}
                  placeholder="No schedule date"
                />
              </div>
              {post.publish_at && (
                <button
                  type="button"
                  onClick={handleClearSchedule}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-3.5 py-2 text-[12.5px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
                >
                  <CalendarX className="h-3.5 w-3.5" strokeWidth={2.25} />
                  Clear scheduling
                </button>
              )}
            </div>
          </Field>

          <Field label="Caption" hint="Used on every channel unless overridden below.">
            <AutoGrowTextarea
              name="caption"
              minRows={6}
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

          {/* Per-channel captions: nothing shows until a channel is picked,
              since almost every post runs the same caption everywhere.
              Unpicking a channel drops its version on the next save: the
              inputs only exist while the channel is picked, so nothing
              hidden gets submitted. */}
          {captionTargets.length > 0 && (
            <div className="space-y-4">
              <Field
                label="Give a channel its own caption"
                hint="Unpicked channels use the caption above."
              >
                <div className="flex flex-wrap gap-2">
                  {captionTargets.map((c) => {
                    const on = customChannels.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCustomChannel(c.id)}
                        aria-pressed={on}
                        className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                          on
                            ? "bg-[#e02214] text-white"
                            : "bg-[rgba(20,18,16,0.06)] text-[#141210] hover:bg-[rgba(20,18,16,0.10)]"
                        }`}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </Field>

              {captionTargets
                .filter((c) => customChannels.includes(c.id))
                .map((c) => (
                  <Field
                    key={c.id}
                    label={`${c.label} version`}
                    hint={`Leave blank to fall back to the main caption on ${c.label}.`}
                  >
                    <AutoGrowTextarea
                      name={`caption_${c.id}`}
                      minRows={3}
                      value={overrides[c.id] ?? ""}
                      onChange={(e) =>
                        setOverrides((prev) => ({
                          ...prev,
                          [c.id]: e.target.value,
                        }))
                      }
                      placeholder={`A ${c.label}-specific take, if it needs one…`}
                      className={`${inputCls} leading-[1.55]`}
                    />
                  </Field>
                ))}
            </div>
          )}

          <Field label="Notes" hint="Internal only, never published.">
            <input
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
      )}

      {/* ---- media ---- */}
      <Card className="space-y-5 p-6">
        <SectionLabel>Graphics</SectionLabel>
        {!locked && (
          <p className="max-w-[70ch] text-[13px] leading-[1.6] text-[#6b6459]">
            Design graphics here, or upload finished images or a video. Large
            photos are shrunk automatically to fit Instagram, so a
            straight-from-camera shot is fine. One video per post (MP4 or MOV,
            under {VIDEO_MAX_BYTES / 1024 / 1024}MB), not mixed with images.
          </p>
        )}

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
                    {isVideo(m) ? (
                      // Muted + controls so it can be checked here without a
                      // surprise blast of audio in a quiet office.
                      <video
                        src={m.image_url}
                        muted
                        playsInline
                        controls
                        preload="metadata"
                        className="absolute inset-0 h-full w-full object-contain"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.image_url}
                        alt=""
                        className="absolute inset-0 h-full w-full object-contain"
                      />
                    )}
                    <span className="absolute left-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white">
                      {isVideo(m) ? "Video" : i + 1}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                    {locked ? (
                      <a
                        href={`${m.image_url}?download=${dlName}`}
                        title="Download"
                        aria-label="Download"
                        className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6b6459] transition-colors hover:bg-[rgba(20,18,16,0.08)] hover:text-[#141210]"
                      >
                        <Download className="h-4 w-4" strokeWidth={2.25} />
                      </a>
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {!locked && (
        <div className="flex flex-wrap items-center gap-2.5">
          {!hasVideo && (
          <button
            type="button"
            onClick={() => openStudio(null)}
            className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-5 py-2.5 text-[13.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404]"
          >
            <Paintbrush className="h-4 w-4" strokeWidth={2.25} />
            Design a graphic
          </button>
          )}
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
            {uploading ? "Uploading…" : hasVideo ? "Upload" : "Upload image or video"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept={`${IMAGE_ACCEPT},${VIDEO_ACCEPT}`}
            hidden
            onChange={(e) => {
              handleUploadFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
        )}

        {studioOpen && (
          <div
            ref={studioRef}
            className="scroll-mt-6 rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-[#faf6ee] p-5"
          >
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

      {/* ---- posting run sheet ----
          Gated on the stage, not the tab: "Ready" is the point at which
          getting it out becomes the job, whether or not a date is on it.

          Note the scheduler does NOT consult the stage: a date is the
          instruction to publish, the same as a scheduled newsletter. So this
          panel is where a human posts early or mops up a manual channel, not
          the only route out. */}
      {stage === "ready" && post.status !== "posted" && (
        <Card className="space-y-5 border-[#3b82f6]/25 p-6">
          <SectionLabel>Get it out</SectionLabel>
          <p className="max-w-[70ch] text-[13px] leading-[1.6] text-[#6b6459]">
            {post.publish_at
              ? "Connected channels below publish automatically. Publish early here if you don't want to wait."
              : "Publish a connected channel now, or set a schedule date above."}{" "}
            For anything unconnected: copy the caption, download the graphics,
            and post it yourself.
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
                          {result.via === "cron" ? "Posted on schedule" : "Posted"}
                        </div>
                      )}
                      {result?.status === "failed" && (
                        <div className="mt-1 space-y-0.5">
                          <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-[#b91404]">
                            <XCircle className="h-3.5 w-3.5" strokeWidth={2.25} />
                            {result.error ?? "Publish failed"}
                          </div>
                          {/* Say so rather than leaving a scheduled post that
                              looks like it is still coming. */}
                          {(result.attempts ?? 0) >= AUTOPUBLISH_MAX_ATTEMPTS && (
                            <div className="pl-5 text-[11.5px] text-[#6b6459]">
                              Tried {result.attempts} times and gave up. Fix it, then
                              retry below.
                            </div>
                          )}
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
                            onClick={() => setPublishChannel(id)}
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

      {/* ---- published summary ---- read-only, replaces the run sheet once posted */}
      {locked && channels.length > 0 && (
        <Card className="space-y-3 p-6">
          <SectionLabel>Published</SectionLabel>
          <ul className="space-y-2">
            {channels.map((id) => {
              const c = CHANNELS.find((x) => x.id === id)!;
              const result = resultFor(post, id);
              return (
                <li
                  key={id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[rgba(20,18,16,0.10)] bg-white px-4 py-3"
                >
                  <div className="text-[13.5px] font-medium text-[#141210]">{c.label}</div>
                  <div className="flex items-center gap-3">
                    {result?.status === "posted" ? (
                      <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-[#15803d]">
                        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                        Posted
                      </span>
                    ) : result?.status === "failed" ? (
                      <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-[#b91404]">
                        <XCircle className="h-3.5 w-3.5" strokeWidth={2.25} />
                        {result.error ?? "Failed"}
                      </span>
                    ) : (
                      <span className="text-[11.5px] text-[#6b6459]">Posted manually</span>
                    )}
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
                  </div>
                </li>
              );
            })}
          </ul>
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
          isVideo={hasVideo}
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
          isVideo={hasVideo}
          onClose={() => {
            if (publishPending) return;
            setPublishChannel(null);
          }}
          footer={
            <div className="w-[375px] max-w-[92vw] space-y-3 rounded-[16px] bg-white p-4 shadow-2xl">
              <p className="text-center text-[13.5px] font-medium text-[#141210]">
                Are you happy with how this looks?
              </p>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  disabled={publishPending}
                  onClick={() => setPublishChannel(null)}
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

/** A Field-styled label with plain text underneath, for the locked posted view. */
function ReadOnlyField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        className="font-mono text-[10.5px] font-semibold uppercase text-[#6b6459]"
        style={{ letterSpacing: "0.24em" }}
      >
        {label}
      </div>
      <div className="mt-2 text-[14px] leading-[1.55] text-[#141210]">
        {children}
      </div>
    </div>
  );
}

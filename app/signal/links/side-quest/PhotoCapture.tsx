"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImageIcon, Loader2, RotateCcw } from "lucide-react";
import type { MeResponse } from "@/lib/side-quest";
import { compressImage } from "@/lib/image-compress";
import SqModal, { ghostBtn, primaryBtn } from "./SqModal";
import {
  PHOTO_NOTICE,
  readToken,
  sqFetch,
  type PhotoResponse,
} from "./client";

/** The server accepts up to 4MB. Stay well under it after compression. */
const MAX_UPLOAD_BYTES = Math.floor(3.5 * 1024 * 1024);
const MAX_EDGE = 1600;
const TARGET_BYTES = Math.floor(1.5 * 1024 * 1024);
const OK_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type Picked = { file: File; previewUrl: string };

/**
 * Photo capture for a CAPTURE quest, shown over the quest list.
 *
 * Flow: a one-time "Got it" photo use notice (stored per session on the
 * server), then pick or take a photo, preview it, upload. The browser shrinks
 * the photo first (Vercel functions cap bodies at 4.5MB, and a phone camera
 * photo is far bigger), re-encoding HEIC to JPEG where the browser can decode
 * it. Points are awarded on upload and are not taken back if an admin later
 * hides the photo.
 */
export default function PhotoCapture({
  challengeId,
  title,
  points,
  noticeAcknowledged,
  onNoticeAcknowledged,
  onDone,
  onClose,
}: {
  challengeId: string;
  title: string;
  points: number;
  noticeAcknowledged: boolean;
  onNoticeAcknowledged: () => void;
  onDone: (me: MeResponse, crossedPrizeLine: boolean) => void;
  onClose: () => void;
}) {
  const [acked, setAcked] = useState(noticeAcknowledged);
  const [savingNotice, setSavingNotice] = useState(false);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ crossed: boolean } | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);

  const uploading = progress !== null;

  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );

  const acknowledge = async () => {
    setSavingNotice(true);
    setError(null);
    const r = await sqFetch<{ ok: true }>("/api/side-quest/photo-notice", {
      method: "POST",
    });
    setSavingNotice(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setAcked(true);
    onNoticeAcknowledged();
  };

  const clearPicked = () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
    setPicked(null);
  };

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    clearPicked();
    setPreparing(true);
    try {
      const isHeic = /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
      const result = await compressImage(file, {
        maxEdge: MAX_EDGE,
        maxBytes: TARGET_BYTES,
        quality: 0.82,
        forceReencode: isHeic,
      });
      const out = result.file;
      if (!OK_TYPES.has(out.type)) {
        setError(
          "This phone's photo format cannot be read here. Try the camera button, or a different photo.",
        );
        return;
      }
      if (out.size > MAX_UPLOAD_BYTES) {
        setError("That photo is still too big. Try a different one.");
        return;
      }
      const previewUrl = URL.createObjectURL(out);
      previewRef.current = previewUrl;
      setPicked({ file: out, previewUrl });
    } catch {
      setError("We could not read that photo. Try another.");
    } finally {
      setPreparing(false);
    }
  };

  const upload = () => {
    if (!picked || uploading) return;
    setError(null);
    setProgress(0);
    const form = new FormData();
    form.append("challengeId", challengeId);
    form.append("file", picked.file, picked.file.name || "photo.jpg");

    // XHR rather than fetch, purely for upload progress.
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/side-quest/photo");
    const token = readToken();
    if (token) xhr.setRequestHeader("x-side-quest-token", token);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onerror = () => {
      setProgress(null);
      setError("No connection. Check your signal and try again.");
    };
    xhr.onload = () => {
      setProgress(null);
      let json: (PhotoResponse & { error?: string }) | null = null;
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        // handled below
      }
      if (xhr.status >= 200 && xhr.status < 300 && json?.me) {
        setDone({ crossed: !!json.crossedPrizeLine });
        onDone(json.me, !!json.crossedPrizeLine);
        return;
      }
      if (xhr.status === 409) {
        setError("You already added a photo for this quest.");
        return;
      }
      setError(json?.error ?? "The upload failed. Try again.");
    };
    xhr.send(form);
  };

  // Step 1: the one-time notice.
  if (!acked) {
    return (
      <SqModal title="Before you snap" onClose={onClose}>
        <p className="text-[15.5px] leading-[1.6] text-white/85">
          {PHOTO_NOTICE}
        </p>
        {error && <p className="mt-3 text-[14px] text-[#ffb4aa]">{error}</p>}
        <button
          type="button"
          onClick={acknowledge}
          disabled={savingNotice}
          className={`${primaryBtn} mt-6`}
        >
          {savingNotice && (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          )}
          Got it
        </button>
      </SqModal>
    );
  }

  if (done) {
    return (
      <SqModal title="Photo added" onClose={onClose}>
        <div className="text-center">
          <p className="font-sans text-[34px] font-medium leading-none tracking-[-0.03em] text-white">
            +{points}
          </p>
          <p className="mt-2 text-[15px] text-white/70">
            {done.crossed
              ? "You're in the prize draw. Your photo may show up on the photo wall."
              : "Your photo may show up on the photo wall."}
          </p>
          <button type="button" onClick={onClose} className={`${primaryBtn} mt-7`}>
            Back to quests
          </button>
        </div>
      </SqModal>
    );
  }

  return (
    <SqModal title={title} onClose={onClose} dismissible={!uploading}>
      {/* Hidden inputs: one opens the camera, one the photo library. */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          onPick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={libraryRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          onPick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {!picked && !preparing && (
        <div className="space-y-3">
          <p className="mb-2 text-[15px] leading-[1.55] text-white/70">
            Add one photo for +{points} points.
          </p>
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className={primaryBtn}
          >
            <Camera className="h-5 w-5" strokeWidth={2} aria-hidden />
            Take a photo
          </button>
          <button
            type="button"
            onClick={() => libraryRef.current?.click()}
            className={ghostBtn}
          >
            <ImageIcon className="h-5 w-5" strokeWidth={2} aria-hidden />
            Choose from your photos
          </button>
        </div>
      )}

      {preparing && (
        <div className="flex items-center gap-3 py-8 text-white/65">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          <span className="text-[14px]">Getting your photo ready</span>
        </div>
      )}

      {picked && (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={picked.previewUrl}
            alt="Your photo, ready to upload"
            className="max-h-[46dvh] w-full rounded-2xl bg-black/40 object-contain"
          />
          {uploading && (
            <div className="mt-4" aria-live="polite">
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#e62b1e] transition-[width] duration-200"
                  style={{ width: `${Math.max(6, progress ?? 0)}%` }}
                />
              </div>
              <p className="mt-2 text-[13px] text-white/60">Uploading</p>
            </div>
          )}
          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={upload}
              disabled={uploading}
              className={primaryBtn}
            >
              {uploading ? "Uploading" : "Add this photo"}
            </button>
            <button
              type="button"
              onClick={clearPicked}
              disabled={uploading}
              className={ghostBtn}
            >
              <RotateCcw className="h-4 w-4" strokeWidth={2} aria-hidden />
              Retake
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-4 text-[14px] leading-[1.5] text-[#ffb4aa]" role="alert">
          {error}
        </p>
      )}
    </SqModal>
  );
}

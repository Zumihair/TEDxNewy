"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { Flash } from "../../ui";
import { useConfirm } from "../../ConfirmDialog";
import { addPartnerLogo, removePartnerLogo } from "../actions";

const MAX_BYTES = 8 * 1024 * 1024; // matches the cms-uploads bucket cap
const ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml";

function extOf(name: string, fallback = "png") {
  return (
    (name.split(".").pop() || fallback).toLowerCase().replace(/[^a-z0-9]/g, "") ||
    fallback
  );
}

/**
 * One open-ended grid of logo files, rather than two fixed light/dark
 * upload widgets — a two-`ImageUploadField` layout didn't fit the confirmed
 * state's column width, and partners don't always have exactly two variants
 * anyway. Upload as many as needed (light, dark, alternate lockups); each
 * saves the moment it finishes uploading, matching the socials Graphics
 * grid rather than a batch "Save" step.
 */
export default function LogoUploader({
  partnerId,
  orgName,
  logoUrls,
}: {
  partnerId: string;
  orgName: string;
  logoUrls: string[];
}) {
  const router = useRouter();
  const { confirm, dialogs } = useConfirm();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Pick an image file (PNG, JPG, WebP, etc.).");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`File too big — keep it under ${MAX_BYTES / 1024 / 1024}MB.`);
      return;
    }
    setUploading(true);
    try {
      const supabase = getBrowserSupabase();
      const slug = orgName.replace(/[^a-z0-9-]/gi, "-");
      const path = `partners/${slug}-${Date.now()}.${extOf(file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from("cms-uploads")
        .upload(path, file, {
          cacheControl: "31536000",
          upsert: false,
          contentType: file.type,
        });
      if (uploadError) throw new Error(uploadError.message);

      const { data: publicData } = supabase.storage
        .from("cms-uploads")
        .getPublicUrl(path);

      const fd = new FormData();
      fd.set("id", partnerId);
      fd.set("url", publicData.publicUrl);
      const res = await addPartnerLogo(fd);
      if (!res.ok) throw new Error(res.error);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (url: string) => {
    const ok = await confirm({
      title: "Remove this logo?",
      body: "It comes off this partner. The file stays in storage.",
      confirmLabel: "Remove",
      tone: "danger",
    });
    if (!ok) return;
    setRemoving(url);
    try {
      const fd = new FormData();
      fd.set("id", partnerId);
      fd.set("url", url);
      const res = await removePartnerLogo(fd);
      if (!res.ok) throw new Error(res.error);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove it. Try again.");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-3">
      {dialogs}
      {error && <Flash tone="error">{error}</Flash>}

      {logoUrls.length > 0 && (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {logoUrls.map((url) => (
            <li
              key={url}
              className="group relative aspect-square overflow-hidden rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-[#f4efe6]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="absolute inset-0 h-full w-full object-contain p-2" />
              <button
                type="button"
                onClick={() => handleRemove(url)}
                disabled={removing === url}
                aria-label="Remove logo"
                className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity hover:bg-[#e02214] group-hover:opacity-100 disabled:opacity-70"
              >
                {removing === url ? (
                  <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2.5} />
                ) : (
                  <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="inline-flex items-center gap-2 rounded-full bg-[rgba(20,18,16,0.06)] px-4 py-2 text-[13px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
        ) : (
          <Plus className="h-4 w-4" strokeWidth={2.25} />
        )}
        {uploading ? "Uploading…" : "Upload logo"}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT}
        hidden
        onChange={(e) => {
          handleUpload(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { PrimaryButton } from "../ui";

type BatchResponse = {
  error?: string;
  added?: { outlet: string; contact: string | null }[];
  creditsSpent?: number;
  contactError?: string | null;
  remaining?: number;
};

/**
 * Loops the media suggest endpoint until every curated outlet has a row.
 * Each outlet costs at most one Apollo credit (the email reveal).
 */
export default function BuildMediaList() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    setWarning(null);
    let credits = 0;
    let added = 0;
    try {
      for (let batch = 0; batch < 6; batch++) {
        setProgress(`Batch ${batch + 1}: asking Apollo for Newcastle journalists…`);
        const res = await fetch("/api/admin/media/suggest", { method: "POST" });
        const json = (await res.json()) as BatchResponse;
        if (!res.ok || json.error) {
          setError(json.error ?? `Request failed (${res.status}).`);
          break;
        }
        added += json.added?.length ?? 0;
        credits += json.creditsSpent ?? 0;
        if (json.contactError) setWarning(json.contactError);
        if ((json.remaining ?? 0) === 0) break;
      }
      setProgress(
        `Done: ${added} outlet${added === 1 ? "" : "s"} added, ${credits} Apollo credit${credits === 1 ? "" : "s"} spent.`,
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <PrimaryButton type="button" onClick={run} disabled={busy}>
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.25} />
        ) : (
          <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} />
        )}
        {busy ? "Finding journalists…" : "Build media list (Apollo)"}
      </PrimaryButton>
      {progress && !error && (
        <p className="text-[12px] text-[#6b6459]">{progress}</p>
      )}
      {warning && (
        <p className="max-w-[42ch] text-right text-[12px] text-[#8a5a12]">
          Apollo warning: {warning}
        </p>
      )}
      {error && (
        <p className="max-w-[42ch] text-right text-[12px] text-[#b91404]">{error}</p>
      )}
    </div>
  );
}

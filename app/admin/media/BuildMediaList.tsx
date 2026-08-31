"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { PrimaryButton } from "../ui";
import { useToast } from "../Toaster";

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
  // In-flight progress only. It says which batch is running, so it stays in
  // the page beside the button; the outcome at the end is a toast.
  const [progress, setProgress] = useState<string | null>(null);
  const toast = useToast();

  const run = async () => {
    setBusy(true);
    let credits = 0;
    let added = 0;
    // A batch that errors breaks the loop; without this the summary would go
    // out as a success right behind the failure it just reported.
    let failed = false;
    try {
      for (let batch = 0; batch < 6; batch++) {
        setProgress(`Batch ${batch + 1}: asking Apollo for Newcastle journalists…`);
        const res = await fetch("/api/admin/media/suggest", { method: "POST" });
        const json = (await res.json()) as BatchResponse;
        if (!res.ok || json.error) {
          toast.error(json.error ?? `Request failed (${res.status}).`);
          failed = true;
          break;
        }
        added += json.added?.length ?? 0;
        credits += json.creditsSpent ?? 0;
        if (json.contactError) toast.warning(`Apollo warning: ${json.contactError}`);
        if ((json.remaining ?? 0) === 0) break;
      }
      if (!failed) {
        toast.success(
          `${added} outlet${added === 1 ? "" : "s"} added, ${credits} Apollo credit${credits === 1 ? "" : "s"} spent.`,
        );
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setProgress(null);
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
      {progress && <p className="text-[12px] text-[#6b6459]">{progress}</p>}
    </div>
  );
}

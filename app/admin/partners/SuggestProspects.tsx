"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Square } from "lucide-react";
import { PrimaryButton, SecondaryButton } from "../ui";

const TARGET = 65;

type BatchResponse = {
  error?: string;
  added?: { org: string; contact: string | null }[];
  contactsFilled?: string[];
  creditsSpent?: number;
  page?: number;
  exhausted?: boolean;
  total?: number;
};

/**
 * "Build pipeline" loops the suggest endpoint batch by batch until the board
 * holds ~65 organisations or Apollo runs out of Newcastle results. Each new
 * prospect arrives with its best contact already found (and their email
 * revealed where Apollo has one, which is what spends credits). A run can be
 * stopped between batches; everything already added stays.
 */
export default function SuggestProspects({ current }: { current: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const stopRef = useRef(false);

  const run = async () => {
    setBusy(true);
    setError(null);
    stopRef.current = false;
    let page = 1;
    let total = current;
    let credits = 0;
    try {
      for (let batch = 0; batch < 14; batch++) {
        if (stopRef.current || total >= TARGET) break;
        setProgress(
          `Batch ${batch + 1}: ${total} on the board, target ${TARGET}. Asking Apollo…`,
        );
        const res = await fetch("/api/admin/partners/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ page }),
        });
        const j = (await res.json()) as BatchResponse;
        if (!res.ok) {
          setError(j.error ?? "Apollo request failed.");
          break;
        }
        total = j.total ?? total + (j.added?.length ?? 0);
        credits += j.creditsSpent ?? 0;
        page = (j.page ?? page) + 1;
        setProgress(
          `${total} organisations on the board · ${credits} email credit${credits === 1 ? "" : "s"} spent this run.`,
        );
        router.refresh();
        if (j.exhausted || (j.added?.length === 0 && j.contactsFilled?.length === 0)) {
          setProgress(
            `Apollo has no more new Newcastle organisations. ${total} on the board, ${credits} credits spent.`,
          );
          break;
        }
      }
      if (total >= TARGET) {
        setProgress(
          `Done: ${total} organisations on the board, ${credits} email credit${credits === 1 ? "" : "s"} spent.`,
        );
      }
    } catch {
      setError("The run failed part-way. Everything already added has been kept.");
    } finally {
      setBusy(false);
      router.refresh();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <PrimaryButton type="button" onClick={run} disabled={busy}>
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
          ) : (
            <Sparkles className="h-4 w-4" strokeWidth={2.25} />
          )}
          {busy ? "Building…" : `Build pipeline to ~${TARGET} (Apollo)`}
        </PrimaryButton>
        {busy && (
          <SecondaryButton type="button" onClick={() => (stopRef.current = true)}>
            <Square className="h-3.5 w-3.5" strokeWidth={2.25} />
            Stop
          </SecondaryButton>
        )}
      </div>
      {progress && !error && (
        <p className="text-[12px] leading-[1.5] text-[#2a2521]">{progress}</p>
      )}
      {error && <p className="text-[12.5px] font-medium text-[#b91404]">{error}</p>}
      <p className="text-[11px] leading-[1.5] text-[#8a8278]">
        Each new organisation arrives with its most likely sponsorship contact
        attached. Revealing a contact&rsquo;s email spends one Apollo credit;
        expect roughly one credit per organisation added.
      </p>
    </div>
  );
}

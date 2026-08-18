"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { SecondaryButton } from "../ui";

/**
 * "Suggest prospects" asks Apollo for Newcastle-area organisations we don't
 * already track and adds up to eight as new prospect rows (names, websites
 * and industries only; contacts are found per-partner).
 */
export default function SuggestProspects() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/partners/suggest", { method: "POST" });
      const j = (await res.json()) as { error?: string; added?: string[] };
      if (!res.ok) setError(j.error ?? "Suggestion failed.");
      else if (!j.added || j.added.length === 0)
        setMessage("Nothing new: everything Apollo suggested is already in the pipeline.");
      else {
        setMessage(`Added ${j.added.length}: ${j.added.join(", ")}`);
        router.refresh();
      }
    } catch {
      setError("Suggestion failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <SecondaryButton type="button" onClick={run} disabled={busy}>
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
        ) : (
          <Sparkles className="h-4 w-4" strokeWidth={2.25} />
        )}
        {busy ? "Asking Apollo…" : "Suggest prospects (Apollo)"}
      </SecondaryButton>
      {message && <p className="text-[12px] leading-[1.5] text-[#2d7a4f]">{message}</p>}
      {error && <p className="text-[12.5px] font-medium text-[#b91404]">{error}</p>}
    </div>
  );
}

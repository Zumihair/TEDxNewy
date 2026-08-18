"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Printer } from "lucide-react";
import { PrimaryButton, SecondaryButton } from "../../ui";

/**
 * "Generate prospectus" calls the POST route (Chromium -> Blob -> URL on the
 * partner row) and refreshes. "Print view" opens the same personalised
 * document as HTML for a quick look, or Save as PDF if Chromium is down.
 */
export default function GenerateProspectus({
  partnerId,
  hasProspectus,
}: {
  partnerId: string;
  hasProspectus: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/partners/${partnerId}/prospectus`, {
        method: "POST",
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(j.error ?? "Generation failed.");
      } else {
        router.refresh();
      }
    } catch {
      setError("Generation failed. Try the print view instead.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <PrimaryButton type="button" onClick={generate} disabled={busy}>
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
          ) : (
            <FileText className="h-4 w-4" strokeWidth={2.25} />
          )}
          {busy
            ? "Generating…"
            : hasProspectus
              ? "Regenerate prospectus"
              : "Generate prospectus"}
        </PrimaryButton>
        <a
          href={`/api/admin/partners/${partnerId}/prospectus?print=1`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <SecondaryButton type="button">
            <Printer className="h-4 w-4" strokeWidth={2.25} />
            Print view
          </SecondaryButton>
        </a>
      </div>
      {error && (
        <p className="text-[12.5px] font-medium text-[#b91404]">{error}</p>
      )}
    </div>
  );
}

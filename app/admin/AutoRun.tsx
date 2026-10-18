"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useCanEdit } from "./EditContext";

/**
 * Runs a refresh when the page opens (at most once every few minutes per key), then reloads the page data.
 * Replaces the manual refresh and sync buttons.
 */
export default function AutoRun({
  run,
  storageKey,
  label,
  enabled: enabledProp = true,
  everyMinutes = 10,
}: {
  run: () => Promise<unknown>;
  storageKey: string;
  label: string;
  enabled?: boolean;
  everyMinutes?: number;
}) {
  const router = useRouter();
  // A view-only sign-in cannot write, so it never runs the refresh.
  const enabled = enabledProp && useCanEdit();
  const started = useRef(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!enabled || started.current) return;
    started.current = true;
    const key = `autorun:${storageKey}`;
    try {
      const last = Number(sessionStorage.getItem(key) ?? 0);
      if (Date.now() - last < everyMinutes * 60_000) return;
      sessionStorage.setItem(key, String(Date.now()));
    } catch {}
    setBusy(true);
    run()
      .catch(() => {})
      .finally(() => {
        setBusy(false);
        router.refresh();
      });
  }, [enabled, storageKey, everyMinutes, run, router]);

  if (!busy) return null;
  return (
    <span className="adm-card__text" role="status" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.25} />
      {label}
    </span>
  );
}

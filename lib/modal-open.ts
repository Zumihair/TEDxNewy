"use client";

import { useSyncExternalStore } from "react";

/**
 * A tiny shared "is any modal open" signal.
 *
 * Full-screen overlays (the speaker modal, the season announce pop-up) lock
 * body scroll while they're up, but on mobile that lock isn't airtight, so the
 * fixed Nav's scroll-reveal can still fire and its bar shows through the
 * translucent backdrop as you drag. Each overlay bumps this counter while open;
 * the Nav reads it and stays retreated so it can't reappear behind a modal.
 *
 * A counter, not a boolean, so overlapping overlays each hold it open and the
 * last one to close releases it.
 */
let count = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function pushModalOpen() {
  count += 1;
  emit();
}

export function popModalOpen() {
  count = Math.max(0, count - 1);
  emit();
}

export function useAnyModalOpen(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => count > 0,
    () => false,
  );
}

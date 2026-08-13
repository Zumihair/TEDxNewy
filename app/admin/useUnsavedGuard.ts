"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * "Leave without saving?" guard for admin editors, shared by the newsletter
 * builder and the socials post editor.
 *
 * Two halves:
 *   - `beforeunload`, for a tab close or reload (the browser's own dialog).
 *   - a capture-phase click listener on the document, for in-app navigation.
 *     Next's <Link> has no navigation hook to cancel, so the click has to be
 *     caught before the router sees it. Only same-origin, plain left-clicks
 *     to a different page are intercepted; modified clicks, new-tab targets,
 *     hash links and links back to the current page all pass through.
 *
 * `dirty` is mirrored into a ref so the long-lived listeners always read the
 * current value instead of the one captured when they were attached.
 *
 * Returns `markSaved`-style control via the caller: pass a `dirty` that goes
 * false after a save. `release()` drops the guard for one deliberate exit
 * (a delete that navigates away, for instance).
 */
export function useUnsavedGuard({
  dirty,
  confirm,
}: {
  dirty: boolean;
  confirm: (opts: {
    title: string;
    body?: string;
    confirmLabel?: string;
    tone?: "neutral" | "danger";
  }) => Promise<boolean>;
}) {
  const router = useRouter();
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!dirtyRef.current || e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      const targetAttr = anchor.getAttribute("target");
      if (targetAttr && targetAttr !== "_self") return;
      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      void confirm({
        title: "Leave without saving?",
        body: "You have unsaved changes. Leave without saving?",
        confirmLabel: "Leave",
        tone: "danger",
      }).then((ok) => {
        if (ok) {
          dirtyRef.current = false;
          router.push(url.pathname + url.search + url.hash);
        }
      });
    };
    document.addEventListener("click", onDocClick, true);
    return () => document.removeEventListener("click", onDocClick, true);
  }, [confirm, router]);

  /** Drop the guard for one deliberate exit (delete, send, and so on). */
  return {
    release: () => {
      dirtyRef.current = false;
    },
  };
}

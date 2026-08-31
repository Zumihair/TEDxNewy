"use client";

import { Suspense, useEffect, useRef, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useToast, type ToastTone } from "./Toaster";

/**
 * The bridge between a server action's redirect and a toast.
 *
 * Nearly every admin action finishes with redirect("/admin/x?saved=1"), and the
 * page then rendered <Flash tone="ok">Saved.</Flash> at the top of its content.
 * The page still decides the copy — the codes are page-local and two pages'
 * ?error=no-key mean different things — but it now hands that copy to the
 * toaster instead of printing it inline:
 *
 *   {saved && <FlashToast tone="success" clear="saved">Saved.</FlashToast>}
 *
 * It renders nothing.
 *
 * `clear` names the query keys the message came from, and they are stripped
 * from the URL once the toast is up. That does two jobs: a refresh or a shared
 * link no longer re-announces an action that happened minutes ago, and it is
 * what makes the NEXT identical save fire again. Without the strip, saving
 * twice in a row redirects to a URL that is already current, this component
 * never remounts, and the second save looks like it did nothing.
 *
 * Only the keys named in `clear` are removed, so a page's real state
 * (?tab=, ?event=, ?q=) survives, as does the hash.
 */
export default function FlashToast(props: {
  tone?: ToastTone;
  /** Query key(s) this message came from. Omit for a message with no key. */
  clear?: string | string[];
  duration?: number;
  children: ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <FlashToastInner {...props} />
    </Suspense>
  );
}

function FlashToastInner({
  tone = "success",
  clear,
  duration,
  children,
}: {
  tone?: ToastTone;
  clear?: string | string[];
  duration?: number;
  children: ReactNode;
}) {
  const toast = useToast();
  // Changes on every navigation, which is the signal that a fresh redirect has
  // landed. The gate below is read off window.location, not this, so a stale
  // value can only ever cost a re-check, never a duplicate toast.
  const search = useSearchParams();
  const keys = typeof clear === "string" ? [clear] : clear;
  const keyList = keys?.join(",") ?? "";
  const firedWithoutKey = useRef(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const owned = keyList ? keyList.split(",") : [];

    if (owned.length === 0) {
      // No key to clear, so fire once for the life of this mount.
      if (firedWithoutKey.current) return;
      firedWithoutKey.current = true;
    } else {
      // Already announced and stripped: nothing to do.
      if (!owned.some((k) => url.searchParams.has(k))) return;
      owned.forEach((k) => url.searchParams.delete(k));
      const qs = url.searchParams.toString();
      window.history.replaceState(
        null,
        "",
        `${url.pathname}${qs ? `?${qs}` : ""}${url.hash}`,
      );
    }

    toast.show({ tone, message: children, duration });
    // `children` and `toast` are stable for a given render of the page; the
    // navigation identity and the key list are what should re-run this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, keyList, tone, duration]);

  return null;
}

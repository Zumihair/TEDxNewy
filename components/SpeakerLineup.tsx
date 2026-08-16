"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import SpeakerModal from "@/components/SpeakerModal";
import type { SpeakerWithTalk } from "@/lib/cms-content";

/**
 * Opens a speaker's bio, talk video and socials **in place**, wherever their
 * card is shown, and reflects it in the URL as `?speaker=<slug>` on the
 * current page so the view stays linkable and shareable.
 *
 * This replaces the old `/speakers` index (retired 2026-08-16). A speaker card
 * used to be a link to `/speakers/<slug>`, which only redirected to
 * `/speakers?speaker=<slug>` — so the bio lived on a separate page from the
 * event it belonged to. Now the event page is the destination.
 *
 * It works by context rather than rendering the cards itself, because the
 * three places that show a lineup all have their own card markup: the event
 * page grid, the flagship carousel, and Signal's dark teaser. Wrap any of them
 * in `<SpeakerLineup speakers={...}>` and the cards inside become buttons.
 *
 * Note the children may be server-rendered; that is fine. `SpeakerCard` is
 * itself a client component, so it sits inside this provider's client subtree
 * and picks the context up normally.
 */

type LineupCtx = {
  /** Open the modal on this speaker. No-op if they aren't in this lineup. */
  open: (slug: string) => void;
};

const Ctx = createContext<LineupCtx | null>(null);

/** Null when a card is rendered outside a lineup, so it can stay inert. */
export function useSpeakerLineup(): LineupCtx | null {
  return useContext(Ctx);
}

export default function SpeakerLineup({
  speakers,
  children,
}: {
  speakers: SpeakerWithTalk[];
  children: React.ReactNode;
}) {
  const [index, setIndex] = useState<number | null>(null);

  const open = useCallback(
    (slug: string) => {
      const i = speakers.findIndex((s) => s.slug === slug);
      if (i >= 0) setIndex(i);
    },
    [speakers],
  );

  const close = useCallback(() => setIndex(null), []);
  const prev = useCallback(
    () =>
      setIndex((i) =>
        i === null ? null : (i - 1 + speakers.length) % speakers.length,
      ),
    [speakers.length],
  );
  const next = useCallback(
    () => setIndex((i) => (i === null ? null : (i + 1) % speakers.length)),
    [speakers.length],
  );

  // Deep link: open the matching speaker if the page loads with ?speaker=<slug>.
  // Runs once on mount. An unknown slug just opens nothing.
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("speaker");
    if (slug) open(slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the URL in step with what's open, on whatever page this is. replaceState
  // rather than push, so closing the modal doesn't leave a back-button trap.
  useEffect(() => {
    const base = window.location.pathname;
    const url =
      index !== null && speakers[index]
        ? `${base}?speaker=${speakers[index].slug}`
        : base;
    window.history.replaceState(null, "", url);
  }, [index, speakers]);

  return (
    <Ctx.Provider value={{ open }}>
      {children}
      <SpeakerModal
        speakers={speakers}
        index={index}
        onClose={close}
        onPrev={prev}
        onNext={next}
      />
    </Ctx.Provider>
  );
}

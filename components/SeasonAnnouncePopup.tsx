"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import PhotoFill from "@/components/PhotoFill";
import { ArrowUpRight, Bell, CalendarDays, CheckCircle2, Mic, X } from "lucide-react";
import { ORG } from "@/lib/data";
import { trackSubscribeLead } from "@/lib/pixel-events";
import { pushModalOpen, popModalOpen } from "@/lib/modal-open";

/**
 * Site-wide "join the community" pop-up. Generic on purpose: not tied to any
 * one event, a ticket window or a sale (it used to be a Signal-specific
 * announcement; that framing was pulled 2026-09-13 so this survives past any
 * one season without editing). Centred (not full-page) on desktop.
 *
 * A split card: a tall photograph on the left (a third of the width) and the
 * words and form on the right (two thirds). On a phone the photograph becomes
 * a short strip across the top.
 *
 * On a successful signup the form is replaced by a short "you're in" state
 * with two links into the archive (past salons, past talks) rather than
 * auto-closing: someone who just joined is a good candidate to actually
 * explore the site, not just be thanked and dismissed.
 *
 * PROOFING: set this back to true only for a proofing pass. While true, the
 * pop-up ignores its stored dismissal state and shows again on every visit,
 * five seconds after load, so it can be checked on every page without
 * clearing localStorage each time. The "minimise" and "join" outcomes still
 * write to storage as normal, so the persistence behaviour itself can also
 * be tested by flipping this on, refreshing, closing or subscribing, then
 * reloading.
 */
const FORCE_SHOW_FOR_PROOFING = false;

const STORAGE_KEY = "tedxnewy-community-popup";
const SHOW_DELAY_MS = 5000;
const SOURCE = "popup-community-announce";
// /signal already carries its own email capture (the waitlist form), and
// /subscribe is a full dedicated subscribe page, so this would just compete
// with both. /admin, /thanks and /unsubscribe own their own chrome.
const EXCLUDED_PREFIXES = [
  "/admin",

  "/dev/admin-preview",
  "/subscribe",
  "/thanks",
  "/unsubscribe",
  "/signal",
];

type Stored = "minimized" | "done" | null;
type Stage = "hidden" | "open" | "minimized";
type Status = "idle" | "sending" | "done" | "error";

function isExcluded(pathname: string) {
  return EXCLUDED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function readStored(): Stored {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "minimized" || v === "done" ? v : null;
  } catch {
    return null;
  }
}

function writeStored(v: Stored) {
  try {
    if (v) window.localStorage.setItem(STORAGE_KEY, v);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage disabled: the pop-up just won't persist across visits
  }
}

export default function SeasonAnnouncePopup() {
  const pathname = usePathname();
  const [stage, setStage] = useState<Stage>("hidden");
  const [status, setStatus] = useState<Status>("idle");
  const mountedAt = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (isExcluded(pathname)) return;

    const stored = readStored();
    if (!FORCE_SHOW_FOR_PROOFING && stored === "done") return;
    if (!FORCE_SHOW_FOR_PROOFING && stored === "minimized") {
      setStage("minimized");
      return;
    }

    const timer = setTimeout(() => {
      setStage("open");
      setStatus("idle");
    }, SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (stage !== "open") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    pushModalOpen();
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      popModalOpen();
    };
  }, [stage]);

  useEffect(() => {
    if (stage !== "open") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") minimize();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  function minimize() {
    writeStored("minimized");
    setStage("minimized");
  }

  function reopen() {
    setStatus("idle");
    setStage("open");
  }

  // Somebody heading into the archive has acted on this, so retire the
  // pop-up rather than leaving it to reopen as an edge tab on the next page
  // they land on.
  function goto() {
    writeStored("done");
    setStage("hidden");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    const email = (
      e.currentTarget.elements.namedItem("email") as HTMLInputElement
    ).value.trim();
    if (!email) return;

    const elapsed = mountedAt.current ? Date.now() - mountedAt.current : 0;
    const body = new URLSearchParams({
      email,
      source: SOURCE,
      website: "",
      t: String(elapsed),
    });

    setStatus("sending");
    try {
      const res = await fetch("/api/subscribe", { method: "POST", body });
      if (res.ok && !res.url.includes("status=error")) {
        setStatus("done");
        trackSubscribeLead();
        writeStored("done");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (isExcluded(pathname)) return null;
  if (stage === "hidden") return null;

  if (stage === "minimized") {
    return <SidebarTab onOpen={reopen} />;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="season-popup-title"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 md:p-10"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={minimize}
        className="absolute inset-0 cursor-default bg-[#000000]/72 backdrop-blur-sm"
      />

      <div className="relative z-10 grid max-h-[92vh] w-full max-w-[860px] grid-rows-[auto_1fr] overflow-y-auto rounded-[var(--radius-lg)] bg-white shadow-[0_30px_120px_rgba(0,0,0,0.40)] md:grid-cols-[1fr_2fr] md:grid-rows-1 md:overflow-hidden">
        <button
          type="button"
          ref={closeRef}
          onClick={minimize}
          aria-label="Close"
          className="absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#000000] shadow-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e62b1e]/50 md:bg-transparent md:shadow-none md:text-[#6b6459] md:hover:bg-[rgba(0,0,0,0.06)] md:hover:text-[#000000]"
        >
          <X className="h-4.5 w-4.5" strokeWidth={2.5} />
        </button>

        {/* Photo: a 3:1 strip on a phone, the left third from md up. */}
        <div className="relative aspect-[3/1] bg-[#1a0604] md:aspect-auto md:min-h-[460px]">
          <PhotoFill
            src="https://ob67nrhuhoyfvgao.public.blob.vercel-storage.com/event-photos/60-second-talk-night/60-second-talk-night_004.webp"
            alt=""
            sizes="(min-width: 768px) 580px, 100vw"
            quality={90}
            hoverZoom={false}
            objectPosition="42% 50%"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: "linear-gradient(180deg, rgba(42,6,4,0) 40%, rgba(42,6,4,0.7) 100%)" }}
          />
          <Image
            src="/brand/tedxnewy-white.png"
            alt="TEDxNewy"
            width={680}
            height={170}
            className="absolute bottom-4 left-5 h-6 w-auto md:bottom-6 md:left-6 md:h-7"
          />
        </div>

        <div className="flex flex-col justify-center px-6 py-7 md:px-10 md:py-10">
          <h2
            id="season-popup-title"
            className="font-sans tracking-[-0.025em] text-[#000000] balance"
            style={{
              fontSize: "clamp(1.7rem, 3.6vw, 2.5rem)",
              lineHeight: 1.04,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            {status === "done" ? "You're in." : "Never miss an idea."}
          </h2>

          <p className="mt-3.5 text-[15.5px] leading-[1.6] text-[#2a2521]">
            {status === "done" ? (
              <>
                You&rsquo;re on the list. While you wait, have a look at
                what&rsquo;s already out there.
              </>
            ) : (
              <>
                Join the TEDxNewy community and be the first to hear about
                our events.
              </>
            )}
          </p>

          {status === "done" ? (
            <div className="mt-6 flex flex-col gap-4">
              <div className="flex items-center gap-3 rounded-2xl bg-[#f4efe6] px-5 py-4 text-[14.5px] leading-[1.5] text-[#000000]">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#e62b1e]" strokeWidth={2} />
                <span>Welcome to the community.</span>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/salons" onClick={goto} className="btn-secondary flex-1">
                  Our past salons
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                </Link>
                <Link href="/talks" onClick={goto} className="btn-secondary flex-1">
                  Watch our talks
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                </Link>
              </div>
            </div>
          ) : (
            <>
              <ul className="mt-5 space-y-3">
                {[
                  { icon: <Mic className="h-4 w-4" strokeWidth={2.25} />, text: "New talks the moment they land" },
                  { icon: <CalendarDays className="h-4 w-4" strokeWidth={2.25} />, text: "First access when events are announced" },
                  { icon: <Bell className="h-4 w-4" strokeWidth={2.25} />, text: "Behind the scenes from the crew" },
                ].map((b) => (
                  <li key={b.text} className="flex items-center gap-3 text-[14.5px] text-[#2a2521]">
                    <span
                      aria-hidden
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fbe5e3] text-[#e62b1e]"
                    >
                      {b.icon}
                    </span>
                    {b.text}
                  </li>
                ))}
              </ul>

              <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
                <label htmlFor="season-popup-email" className="sr-only">
                  Email
                </label>
                <input
                  id="season-popup-email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full rounded-2xl border border-[rgba(0,0,0,0.15)] bg-white px-5 py-3.5 text-[15px] text-[#000000] placeholder:text-[#8a8278] focus:border-[#e62b1e]/40 focus:outline-none focus:ring-2 focus:ring-[#e62b1e]/20"
                />
                <button type="submit" disabled={status === "sending"} className="btn-red w-full">
                  {status === "sending" ? "Joining…" : "Join the community"}
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
                </button>
                {status === "error" && (
                  <p className="text-[12.5px] text-[#b91404]">
                    Something went wrong. Try again, or email{" "}
                    <a href={`mailto:${ORG.email}`} className="underline">
                      {ORG.email}
                    </a>
                    .
                  </p>
                )}
                <p className="text-center text-[12px] text-[#8a8278]">
                  No spam. One-tap unsubscribe in every email.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Two different treatments by breakpoint, not one element trying to be both.
 * The vertical edge tab (rotated text, flush to `right-0`) reads fine on a
 * wide viewport, but on mobile it kept drifting partly off-screen even after
 * a `window.visualViewport`-based correction — some in-app/mobile browsers
 * size `position: fixed` against a layout viewport that doesn't match what's
 * actually visible, and no amount of measuring fully closed that gap. Rather
 * than keep chasing the exact offset, mobile gets a plain, compact pill
 * inset from the corner (`bottom-4 right-4`, not flush to an edge) with
 * normal horizontal text: even if a viewport calc is off by a few pixels,
 * there's enough margin that it never looks cut off.
 */
function SidebarTab({ onOpen }: { onOpen: () => void }) {
  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        aria-label="Reopen: join the TEDxNewy community"
        className="fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 rounded-l-xl bg-[#e62b1e] px-2.5 py-4 text-white shadow-[0_10px_30px_rgba(42,6,4,0.35)] transition-[padding] hover:px-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:block"
      >
        <span
          className="block font-ui text-[12px] font-semibold"
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
          }}
        >
          Join the club 🔔
        </span>
      </button>

      <button
        type="button"
        onClick={onOpen}
        aria-label="Reopen: join the TEDxNewy community"
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-[#e62b1e] py-3 pl-4 pr-3.5 text-white shadow-[0_10px_30px_rgba(42,6,4,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:hidden"
      >
        <span
          className="font-ui text-[12px] font-semibold"
        >
          Join the club
        </span>
        <span aria-hidden>🔔</span>
      </button>
    </>
  );
}

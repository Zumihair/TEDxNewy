"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowUpRight, CheckCircle2, X } from "lucide-react";
import { ORG } from "@/lib/data";
import { trackSubscribeLead } from "@/lib/pixel-events";

/**
 * Site-wide announcement pop-up for the October 24 signature event
 * announcement. Large and centred (not full-page) on desktop, full-page
 * on mobile. Reads the background behind it at trigger time and switches
 * between a dark and a light card so it always sits on the page rather
 * than fighting it.
 *
 * PROOFING: set this back to true only for a proofing pass. While true, the
 * pop-up ignores its stored dismissal state and shows again on every visit,
 * five seconds after load, so it can be checked on every page without
 * clearing localStorage each time. The "minimise" and "join the list"
 * outcomes still write to storage as normal, so the persistence behaviour
 * itself can also be tested by flipping this on, refreshing, closing or
 * subscribing, then reloading.
 */
const FORCE_SHOW_FOR_PROOFING = false;

const STORAGE_KEY = "season-announce-oct24";
const SHOW_DELAY_MS = 5000;
const SOURCE = "popup-oct24-announce";
const EXCLUDED_PREFIXES = ["/admin", "/subscribe", "/thanks", "/unsubscribe"];

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

/** Samples the background colour behind the centre of the viewport and
 * walks up the DOM until it finds an opaque one, so the card can match
 * whatever section the visitor is actually looking at. Falls back to the
 * site's light theme if nothing conclusive is found. */
function detectIsDarkBackground(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const x = Math.round(window.innerWidth / 2);
    const y = Math.round(window.innerHeight / 2);
    let el: Element | null = document.elementFromPoint(x, y);
    while (el) {
      const bg = window.getComputedStyle(el).backgroundColor;
      const match = bg.match(/rgba?\(([^)]+)\)/);
      if (match) {
        const parts = match[1].split(",").map((p) => parseFloat(p.trim()));
        const [r, g, b, a = 1] = parts;
        if (a > 0.4 && Number.isFinite(r)) {
          const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
          return luminance < 0.5;
        }
      }
      el = el.parentElement;
    }
  } catch {
    // fall through to the light default
  }
  return false;
}

export default function SeasonAnnouncePopup() {
  const pathname = usePathname();
  const [stage, setStage] = useState<Stage>("hidden");
  const [dark, setDark] = useState(false);
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
      setDark(detectIsDarkBackground());
      setStage("open");
      setStatus("idle");
    }, SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (stage !== "open") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
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
    setDark(detectIsDarkBackground());
    setStatus("idle");
    setStage("open");
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
        setTimeout(() => setStage("hidden"), 1800);
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

  const kickerCls = dark ? "text-[#ff9b8f]" : "text-[#b91404]";
  const bodyCls = dark ? "text-white/80" : "text-[#2a2521]";
  const footCls = dark ? "text-white/55" : "text-[#8a8278]";
  const inputCls = dark
    ? "w-full rounded-full border border-white/15 bg-white/[0.06] px-5 py-3.5 text-[15px] text-white placeholder:text-white/40 focus:border-white/35 focus:outline-none focus:ring-2 focus:ring-[#e02214]/40"
    : "w-full rounded-full border border-[rgba(20,18,16,0.15)] bg-white px-5 py-3.5 text-[15px] text-[#141210] placeholder:text-[#8a8278] focus:border-[#e02214]/40 focus:outline-none focus:ring-2 focus:ring-[#e02214]/20";
  const buttonCls = dark
    ? "inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 font-sans text-[15px] font-semibold text-[#2a0604] transition-all hover:-translate-y-0.5 hover:bg-[#ffe9e6] disabled:opacity-70 disabled:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#2a0604]"
    : "inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#e02214] px-6 py-3.5 font-sans text-[15px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404] disabled:opacity-70 disabled:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e02214]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="season-popup-title"
      className="fixed inset-0 z-[60] flex items-stretch justify-center sm:items-center sm:p-6 md:p-10"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={minimize}
        className="absolute inset-0 cursor-default bg-[#141210]/72 backdrop-blur-sm"
      />

      <div
        className={`relative z-10 flex w-full max-w-[600px] flex-col overflow-y-auto shadow-[0_30px_120px_rgba(20,18,16,0.40)] sm:max-h-[92vh] sm:rounded-[var(--radius-lg)] ${
          dark ? "bg-[#2a0604]" : "bg-[var(--color-cream)]"
        }`}
      >
        <div className="relative aspect-[16/10] w-full shrink-0">
          <Image
            src="/images/season-2026-announce.webp"
            alt="TEDxNewy"
            fill
            sizes="(max-width: 640px) 100vw, 600px"
            priority
            className="object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0"
          />
          <button
            type="button"
            ref={closeRef}
            onClick={minimize}
            aria-label="Close"
            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          >
            <X className="h-4.5 w-4.5" strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-6 py-7 md:px-8 md:py-8">
          <div
            className={`font-mono text-[10.5px] font-semibold uppercase ${kickerCls}`}
            style={{ letterSpacing: "0.24em" }}
          >
            October 24 · Season 2026
          </div>

          <h2
            id="season-popup-title"
            className={`mt-4 font-sans tracking-[-0.02em] balance ${
              dark ? "text-white" : "text-[#141210]"
            }`}
            style={{
              fontSize: "clamp(1.6rem, 3.4vw, 2.15rem)",
              lineHeight: 1.05,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            Tickets go on sale Friday.
          </h2>

          <p className={`mt-3.5 text-[15px] leading-[1.6] ${bodyCls}`}>
            Signal is TEDxNewy&rsquo;s biggest stage yet, on 24 October. Join
            the list now and we&rsquo;ll email you the moment tickets open
            this Friday, before anyone else hears.
          </p>

          {status === "done" ? (
            <div
              className={`mt-6 flex items-center gap-3 rounded-2xl px-5 py-4 text-[14.5px] leading-[1.5] ${
                dark
                  ? "bg-white/[0.08] text-white"
                  : "bg-white text-[#141210]"
              }`}
            >
              <CheckCircle2
                className={dark ? "h-5 w-5 text-[#ff9b8f]" : "h-5 w-5 text-[#e02214]"}
                strokeWidth={2}
              />
              <span>
                You&rsquo;re on the list. We&rsquo;ll email you the moment
                tickets go live.
              </span>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-6 flex flex-col gap-3"
            >
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
                className={inputCls}
              />
              <button
                type="submit"
                disabled={status === "sending"}
                className={buttonCls}
              >
                {status === "sending" ? "Joining…" : "Notify me first"}
                <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
              </button>
              {status === "error" && (
                <p className="text-[12.5px] text-[#ff8a7a]">
                  Something went wrong. Try again, or email{" "}
                  <a href={`mailto:${ORG.email}`} className="underline">
                    {ORG.email}
                  </a>
                  .
                </p>
              )}
              <p className={`mt-1 text-center text-[12px] ${footCls}`}>
                One-tap unsubscribe in every email.
              </p>
            </form>
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
        aria-label="Reopen: Season 2026 announcement, October 24"
        className="fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 rounded-l-xl bg-[#e02214] px-2.5 py-4 text-white shadow-[0_10px_30px_rgba(42,6,4,0.35)] transition-[padding] hover:px-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:block"
      >
        <span
          className="block font-mono text-[10.5px] font-semibold uppercase"
          style={{
            letterSpacing: "0.18em",
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
        aria-label="Reopen: Season 2026 announcement, October 24"
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-[#e02214] py-3 pl-4 pr-3.5 text-white shadow-[0_10px_30px_rgba(42,6,4,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:hidden"
      >
        <span
          className="font-mono text-[11px] font-semibold uppercase"
          style={{ letterSpacing: "0.1em" }}
        >
          Join the club
        </span>
        <span aria-hidden>🔔</span>
      </button>
    </>
  );
}

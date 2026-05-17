"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, X } from "lucide-react";

/**
 * Dismissible site-wide promo for Youth Futures Lab.
 *
 * Behaviour:
 * - Hidden on /youth-futures-lab itself (no value promoting on the page).
 * - Hidden on /admin/* (admin chrome should stay clean).
 * - Hidden permanently after the EOI deadline (2026-06-15) and the event
 *   date (2026-08-05).
 * - Stores dismissal timestamp in localStorage; re-appears each day so
 *   the deadline stays top-of-mind as it approaches.
 * - Renders nothing on the server (avoids hydration mismatch from
 *   localStorage); the gentle fade-in happens client-side only.
 */

const STORAGE_KEY = "yfl-promo-dismissed";
const RESHOW_AFTER_MS = 24 * 60 * 60 * 1000; // 1 day
const HARD_STOP = new Date("2026-08-05T23:59:59+10:00").getTime();
const DEADLINE = new Date("2026-06-15T23:59:59+10:00");

export default function YouthFuturesBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Date.now() > HARD_STOP) return;
    if (pathname === "/youth-futures-lab") return;
    if (pathname.startsWith("/admin")) return;

    const raw = typeof window === "undefined"
      ? null
      : window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const ts = Number(raw);
      if (Number.isFinite(ts) && Date.now() - ts < RESHOW_AFTER_MS) {
        return;
      }
    }

    // Small delay so the banner doesn't pop in the same paint as the page.
    const timer = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(timer);
  }, [pathname]);

  if (!visible) return null;

  const daysLeft = Math.max(
    0,
    Math.ceil((DEADLINE.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
  );

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // ignore — storage disabled is fine, banner just won't persist
    }
    setVisible(false);
  }

  return (
    <div
      role="region"
      aria-label="Youth Futures Lab promotion"
      className="fixed inset-x-3 bottom-3 z-40 md:inset-x-auto md:bottom-6 md:right-6 md:max-w-[380px]"
      style={{
        animation: "yfl-banner-in 320ms cubic-bezier(0.4, 0, 0.2, 1) both",
      }}
    >
      <div
        className="relative overflow-hidden rounded-2xl bg-[#e02214] text-white shadow-[0_18px_48px_rgba(42,6,4,0.45)] md:rounded-3xl"
        style={{
          boxShadow:
            "0 18px 48px rgba(42, 6, 4, 0.45), 0 2px 6px rgba(0, 0, 0, 0.18)",
        }}
      >
        {/* Faint X motif behind the content */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/[0.08]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-white/[0.05]"
        />

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute right-2.5 top-2.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white/90 transition-colors hover:bg-white/25 hover:text-white"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>

        <div className="relative px-5 pb-5 pt-6 md:px-6 md:pb-6 md:pt-7">
          <div
            className="font-mono text-[9.5px] font-semibold uppercase text-white/80"
            style={{ letterSpacing: "0.26em" }}
          >
            For schools · 5 August 2026
          </div>
          <p
            className="mt-2.5 font-sans text-white"
            style={{
              fontSize: "clamp(1.1rem, 1.4vw, 1.25rem)",
              lineHeight: 1.18,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 96',
            }}
          >
            Youth Futures Lab — register your students.
          </p>
          <p className="mt-2 text-[12.5px] leading-[1.5] text-white/85">
            {daysLeft > 0 ? (
              <>
                EOIs close <strong>15 June</strong> · {daysLeft}{" "}
                {daysLeft === 1 ? "day" : "days"} left
              </>
            ) : (
              <>EOIs close today, 15 June</>
            )}
          </p>
          <Link
            href="/youth-futures-lab"
            onClick={dismiss}
            className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-medium text-[#2a0604] transition-all hover:-translate-y-0.5 hover:bg-[#f4efe6]"
          >
            Schools Application
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.25} />
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes yfl-banner-in {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

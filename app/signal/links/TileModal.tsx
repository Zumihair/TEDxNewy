"use client";

/**
 * The one reusable modal shell every /signal/links tile opens into (Will's
 * direction: tiles open in-page content, not navigation). A bottom sheet on
 * phones (where this page actually gets used, scanned off a QR code) and a
 * centred card from `sm` up, styled for this page's dark Signal palette
 * rather than the light `SpeakerModal` card style used elsewhere on the
 * site — that one still opens on TOP of this one when a speaker is tapped
 * inside the Speakers modal, which is fine: it's `fixed` and a higher
 * z-index (100 vs this shell's 60), so it doesn't need to know it's nested.
 *
 * Motion matches the site's documented panel timing (260ms,
 * cubic-bezier(0.22, 1, 0.36, 1)) rather than the 600ms screen crossfade
 * used for the Acknowledgement-to-links transition: a modal is a much
 * smaller, faster gesture than a whole-screen change.
 */

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { pushModalOpen, popModalOpen } from "@/lib/modal-open";

const PANEL_EASE = [0.22, 1, 0.36, 1] as const;

export default function TileModal({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    pushModalOpen();
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      popModalOpen();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: PANEL_EASE }}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-[#050201]/80 backdrop-blur-sm"
          />

          <motion.div
            className="relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-[28px] border border-white/10 bg-[#150807] shadow-[0_-20px_80px_rgba(0,0,0,0.6)] sm:max-h-[80vh] sm:max-w-[520px] sm:rounded-[28px] sm:shadow-[0_30px_100px_rgba(0,0,0,0.6)]"
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.26, ease: PANEL_EASE }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 pb-4 pt-6">
              <div className="min-w-0">
                <h2
                  className="font-sans tracking-[-0.02em] text-white"
                  style={{
                    fontSize: "clamp(1.3rem, 4vw, 1.6rem)",
                    fontWeight: 500,
                    lineHeight: 1.1,
                    fontVariationSettings: '"opsz" 144',
                  }}
                >
                  {title}
                </h2>
                {subtitle && (
                  <p className="mt-1 text-[13px] text-white/55">{subtitle}</p>
                )}
              </div>
              <button
                type="button"
                ref={closeRef}
                onClick={onClose}
                aria-label="Close"
                className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/70 transition-colors hover:bg-white/[0.12] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <X className="h-4.5 w-4.5" strokeWidth={2} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

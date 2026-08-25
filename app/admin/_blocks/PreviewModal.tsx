"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, Loader2, Monitor, Smartphone, X } from "lucide-react";
import type { PreviewScheme } from "@/lib/newsletter-blocks";
import SchemeToggle, { previewChrome } from "./SchemeToggle";
import WidthBtn from "./WidthBtn";

/**
 * A Preview button that opens the rendered email in a pop-up. The parent
 * supplies an async `getHtml` (a server action running the real renderer), so
 * what shows is exactly what sends. Same iframe srcDoc approach as the Quick
 * Compose preview.
 *
 * The light/dark toggle re-renders on the server rather than doing anything to
 * the iframe: the email's dark mode is a `prefers-color-scheme` media query,
 * which follows the viewer's own OS setting and cannot be forced from outside
 * the document. Asking the renderer to pin the scheme is the only way to see
 * the other half.
 */
export default function PreviewModal({
  getHtml,
  disabled,
  variant = "pill",
}: {
  getHtml: (scheme: PreviewScheme) => Promise<string>;
  disabled?: boolean;
  /** "icon" is the compact round trigger used in list rows. */
  variant?: "pill" | "icon";
}) {
  const [open, setOpen] = useState(false);
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [width, setWidth] = useState<"full" | "mobile">("full");
  const [scheme, setScheme] = useState<PreviewScheme>("light");
  // Portal target. The modal is rendered into document.body so no ancestor
  // (e.g. the sticky bar's backdrop-blur) can trap the fixed overlay.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const load = useCallback(
    async (next: PreviewScheme) => {
      setLoading(true);
      setHtml(null);
      try {
        setHtml(await getHtml(next));
      } catch {
        setHtml(
          "<p style='font-family:sans-serif;padding:24px;color:#b91404'>Preview failed to render.</p>",
        );
      } finally {
        setLoading(false);
      }
    },
    [getHtml],
  );

  const openPreview = () => {
    setOpen(true);
    void load(scheme);
  };

  // Switching scheme costs a re-render, so it only fires on an actual change
  // while the pop-up is open, never on open (openPreview already loaded).
  const onScheme = (next: PreviewScheme) => {
    if (next === scheme) return;
    setScheme(next);
    void load(next);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={openPreview}
        title={variant === "icon" ? "Preview" : undefined}
        aria-label={variant === "icon" ? "Preview" : undefined}
        className={
          variant === "icon"
            ? "inline-flex h-9 w-9 items-center justify-center rounded-full text-[#6b6459] transition-colors hover:bg-[rgba(20,18,16,0.08)] hover:text-[#141210] disabled:cursor-not-allowed disabled:opacity-50"
            : "inline-flex items-center gap-2 rounded-full bg-[rgba(20,18,16,0.06)] px-5 py-2.5 text-[13.5px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)] disabled:cursor-not-allowed disabled:opacity-70"
        }
      >
        <Eye className="h-4 w-4" strokeWidth={2.25} />
        {variant === "icon" ? null : "Preview"}
      </button>

      {open &&
        mounted &&
        createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Email preview"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 md:p-8"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="my-auto w-full max-w-[680px] overflow-hidden rounded-[var(--radius-md)] bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[rgba(20,18,16,0.10)] px-4 py-3">
              <span
                className="font-mono text-[9.5px] font-semibold uppercase text-[#6b6459]"
                style={{ letterSpacing: "0.2em" }}
              >
                Preview
              </span>
              <div className="flex items-center gap-1">
                <SchemeToggle value={scheme} onChange={onScheme} />
                <span className="mx-1 h-4 w-px bg-[rgba(20,18,16,0.12)]" />
                <WidthBtn
                  active={width === "full"}
                  onClick={() => setWidth("full")}
                  label="Desktop width"
                >
                  <Monitor className="h-4 w-4" strokeWidth={2} />
                </WidthBtn>
                <WidthBtn
                  active={width === "mobile"}
                  onClick={() => setWidth("mobile")}
                  label="Mobile width"
                >
                  <Smartphone className="h-4 w-4" strokeWidth={2} />
                </WidthBtn>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close preview"
                  className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6b6459] transition-colors hover:bg-[rgba(20,18,16,0.06)] hover:text-[#141210]"
                >
                  <X className="h-4 w-4" strokeWidth={2.25} />
                </button>
              </div>
            </div>
            <div
              className="flex justify-center p-3 transition-colors"
              style={{ background: previewChrome(scheme) }}
            >
              {loading || html === null ? (
                <div className="flex h-[70vh] items-center justify-center">
                  <Loader2
                    className="h-6 w-6 animate-spin text-[#6b6459]"
                    strokeWidth={2}
                  />
                </div>
              ) : (
                <iframe
                  title="Email preview"
                  srcDoc={html}
                  className="h-[74vh] border-0 transition-all"
                  style={{
                    width: width === "mobile" ? "375px" : "100%",
                    background: previewChrome(scheme),
                  }}
                />
              )}
            </div>
          </div>
        </div>,
          document.body,
        )}
    </>
  );
}


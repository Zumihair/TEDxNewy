"use client";

import type { TextareaHTMLAttributes } from "react";

/** A textarea that grows with its content, no drag handle needed.
 *
 *  Pure CSS: a hidden sibling div carries the exact same classes as the
 *  textarea (so its padding/font/line-height can never drift from it) and
 *  wraps the same text. Both sit in the same CSS grid cell; the grid track
 *  sizes to the taller of the two, then `align-items: stretch` (the grid
 *  default) grows the textarea to match. Nothing here ever reads or writes
 *  `.style.height`, so there is no reflow-then-remeasure step for a browser
 *  to misjudge and scroll the page from under a mid-keystroke input. */
export default function AutoGrowTextarea({
  minRows = 3,
  maxHeightPx = 480,
  className = "",
  value,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  minRows?: number;
  maxHeightPx?: number;
}) {
  const text = typeof value === "string" ? value : "";
  const fieldCls = `${className} col-start-1 row-start-1`;

  return (
    <div
      className="grid"
      style={{ maxHeight: maxHeightPx, overflowY: "auto" }}
    >
      <textarea
        {...rest}
        value={value}
        rows={minRows}
        className={`${fieldCls} resize-none overflow-hidden`}
        style={{ minHeight: `${minRows * 1.6}em` }}
      />
      <div
        aria-hidden
        className={`${fieldCls} invisible select-none whitespace-pre-wrap break-words`}
        style={{ minHeight: `${minRows * 1.6}em` }}
      >
        {text + " "}
      </div>
    </div>
  );
}

"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Single-open accordion: opening one question closes whichever was open
 * before it, instead of letting them stack up (native <details> elements
 * each track their own open state, so this needs to be a controlled
 * client component).
 *
 * **The answer is always rendered**, and opens by growing from `0fr` to
 * `1fr` (`.faq-panel` in globals.css). It cannot be `{open && ...}`: an
 * element that does not exist yet has nothing to transition from, which is
 * why the row used to snap open. The grid-row technique is what lets it
 * animate to the content's OWN height without measuring anything in JS, so an
 * answer can be one line or five and the transition still lands.
 *
 * Two consequences of keeping the closed answer in the DOM, both handled:
 * `inert` takes it out of the tab order and the accessibility tree (answers
 * can carry links, which would otherwise be focusable while invisible), and
 * `aria-controls`/`aria-labelledby` tie the panel to its button so the state
 * is announced rather than merely looking right.
 */
export default function FaqAccordion({
  faqs,
}: {
  faqs: { q: string; a: ReactNode }[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const baseId = useId();

  return (
    <div className="mt-10 divide-y divide-white/10">
      {faqs.map(({ q, a }, i) => {
        const open = openIndex === i;
        const panelId = `${baseId}-panel-${i}`;
        const buttonId = `${baseId}-button-${i}`;
        return (
          <div key={q} className="py-5">
            <button
              type="button"
              id={buttonId}
              onClick={() => setOpenIndex(open ? null : i)}
              aria-expanded={open}
              aria-controls={panelId}
              className="flex w-full cursor-pointer items-center justify-between gap-4 text-left font-sans text-[16px] font-medium leading-[1.35] text-white"
            >
              {q}
              <ChevronDown
                className={`faq-chevron h-4 w-4 shrink-0 text-white/50 ${
                  open ? "rotate-180" : ""
                }`}
                strokeWidth={2}
              />
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              inert={!open}
              data-open={open}
              className="faq-panel"
            >
              <div>
                <p className="mt-3 text-[14.5px] leading-[1.65] text-white/70">
                  {a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Single-open accordion: opening one question closes whichever was open
 * before it, instead of letting them stack up (native <details> elements
 * each track their own open state, so this needs to be a controlled
 * client component).
 */
export default function FaqAccordion({
  faqs,
}: {
  faqs: { q: string; a: ReactNode }[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mt-10 divide-y divide-white/10">
      {faqs.map(({ q, a }, i) => {
        const open = openIndex === i;
        return (
          <div key={q} className="py-5">
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : i)}
              aria-expanded={open}
              className="flex w-full cursor-pointer items-center justify-between gap-4 text-left font-sans text-[16px] font-medium leading-[1.35] text-white"
            >
              {q}
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-white/50 transition-transform duration-300 ${
                  open ? "rotate-180" : ""
                }`}
                strokeWidth={2}
              />
            </button>
            {open && (
              <p className="mt-3 text-[14.5px] leading-[1.65] text-white/70">
                {a}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

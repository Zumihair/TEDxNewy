"use client";

import { useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "motion/react";
import {
  Route,
  Sofa,
  Wifi,
  ShieldCheck,
  PiggyBank,
  GraduationCap,
  HeartHandshake,
  UtensilsCrossed,
  Palette,
  Rocket,
} from "lucide-react";

/**
 * Icons are resolved from a key rather than passed in as component
 * references: this component is a Client Component, and a Server Component
 * page can't hand a function/component reference across that boundary as a
 * prop (React errors on serialising it). A string key is plain data.
 */
const ICONS = {
  route: Route,
  sofa: Sofa,
  wifi: Wifi,
  shield: ShieldCheck,
  piggyBank: PiggyBank,
  graduationCap: GraduationCap,
  heartHandshake: HeartHandshake,
  utensils: UtensilsCrossed,
  palette: Palette,
  rocket: Rocket,
} as const;

export type WheelIconKey = keyof typeof ICONS;

export type WheelItem = {
  icon: WheelIconKey;
  title: string;
  question: string;
};

/**
 * A ring of items that rotates as the visitor scrolls through a tall track,
 * bringing one item under a fixed pointer at a time. Built for the Youth
 * Futures Lab page's ten focus areas: scrolling through this section feels
 * like turning a dial through the questions the day explored, rather than
 * reading a static list. The wheel itself is purely decorative/rotational;
 * the active item's title and question render in a text panel beside it,
 * cross-fading as the active index changes.
 */
export default function FocusWheel({
  items,
  accents,
}: {
  items: WheelItem[];
  accents: string[];
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const n = items.length;

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  const rotate = useTransform(
    scrollYProgress,
    [0, 1],
    [0, -((n - 1) * 360) / n],
  );

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const i = Math.min(n - 1, Math.max(0, Math.round(v * (n - 1))));
    setActive((prev) => (prev === i ? prev : i));
  });

  const activeItem = items[active];
  const activeColor = accents[active % accents.length];

  return (
    <div ref={trackRef} style={{ height: `${n * 40}vh` }} className="relative">
      {/* No `overflow-hidden` anywhere on the path from the scroll root to
          this sticky element: an ancestor with `overflow: hidden` becomes the
          scroll container and silently stops `sticky` from sticking (see also
          the `overflow-x: clip` note on html in globals.css). */}
      <div className="sticky top-0 flex h-[100svh] items-center">
        <div className="mx-auto grid w-full max-w-[1180px] items-center gap-10 px-5 md:grid-cols-[auto_1fr] md:gap-16 md:px-6">
          {/* THE WHEEL */}
          <div className="relative mx-auto h-[220px] w-[220px] shrink-0 md:h-[300px] md:w-[300px]">
            {/* fixed pointer, doesn't rotate */}
            <div
              aria-hidden
              className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2"
            >
              <div
                className="h-3 w-3 rotate-45 border-2 border-[#141210] bg-[var(--color-cream-light,#f9f5ec)]"
                style={{ borderColor: activeColor }}
              />
            </div>

            <div className="absolute inset-0 rounded-full border border-[rgba(20,18,16,0.12)]" />

            <motion.div style={{ rotate }} className="absolute inset-0">
              {items.map((item, i) => {
                const angle = (i * 360) / n;
                const isActive = i === active;
                const color = accents[i % accents.length];
                const ItemIcon = ICONS[item.icon];
                return (
                  <div
                    key={item.title}
                    className="absolute left-1/2 top-1/2 h-9 w-9 md:h-11 md:w-11"
                    style={{
                      transform: `rotate(${angle}deg) translate(0, -110px) rotate(${-angle}deg) translate(-50%, -50%)`,
                    }}
                  >
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300 md:h-11 md:w-11"
                      style={{
                        background: isActive ? color : "#ffffff",
                        borderColor: isActive
                          ? color
                          : "rgba(20,18,16,0.14)",
                        color: isActive ? "#ffffff" : "#6b6459",
                        transform: isActive ? "scale(1.18)" : "scale(1)",
                      }}
                    >
                      <ItemIcon
                        className="h-4 w-4 md:h-5 md:w-5"
                        strokeWidth={1.75}
                      />
                    </div>
                  </div>
                );
              })}
            </motion.div>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="font-mono text-[10px] font-semibold uppercase text-[#8a8278]"
                style={{ letterSpacing: "0.18em" }}
              >
                Question
              </span>
              <span
                className="font-sans text-[34px] font-medium leading-none md:text-[42px]"
                style={{ color: activeColor }}
              >
                {String(active + 1).padStart(2, "0")}
              </span>
              <span className="mt-1 text-[11px] text-[#8a8278]">
                of {n}
              </span>
            </div>
          </div>

          {/* TEXT PANEL */}
          <div className="min-h-[160px] md:min-h-[200px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.32, ease: "easeOut" }}
              >
                <h3
                  className="font-sans tracking-[-0.02em] text-[#141210] balance"
                  style={{
                    fontSize: "clamp(1.6rem, 3.2vw, 2.4rem)",
                    lineHeight: 1.1,
                    fontWeight: 500,
                    fontVariationSettings: '"opsz" 144',
                  }}
                >
                  {activeItem.title}
                </h3>
                <p className="mt-4 max-w-[52ch] text-[16px] italic leading-[1.65] text-[#2a2521] md:text-[17px]">
                  {activeItem.question}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex flex-wrap gap-1.5">
              {items.map((item, i) => (
                <span
                  key={item.title}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: i === active ? "22px" : "8px",
                    background:
                      i === active
                        ? accents[i % accents.length]
                        : "rgba(20,18,16,0.14)",
                  }}
                />
              ))}
            </div>

            <p className="mt-6 text-[13px] text-[#8a8278] md:hidden">
              Keep scrolling to turn the dial.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

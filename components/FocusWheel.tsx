"use client";

import { useRef, useState } from "react";
import {
  motion,
  useScroll,
  useSpring,
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
 * bringing one item to the top of the ring at a time. Scrolling this section
 * feels like turning a dial through the questions the day explored, rather
 * than reading a static list.
 *
 * The heading and description live *inside* the sticky frame rather than
 * above the track, so the whole section holds together as one screen instead
 * of the intro scrolling away and leaving the wheel stranded.
 *
 * Two earlier attempts at keeping the copy readable while scrolling are worth
 * not repeating. Debouncing the index behind a timer deadlocked, because each
 * scroll event restarted the timer and the commit never fired mid-scroll.
 * Replacing that with a velocity-driven blur removed the deadlock but simply
 * made the copy hard to read, and left the underlying flicker in place.
 *
 * The flicker was never about masking a change: it was the index being
 * rounded off a SPRING, which rings as it settles and so flipped the index
 * back and forth across a boundary while the scroll sat still. Reading the
 * index off the raw scroll position and adding hysteresis removes the cause,
 * which means the copy needs no masking at all: it just swaps, once, quickly.
 */
export default function FocusWheel({
  items,
  accents,
  heading,
  description,
}: {
  items: WheelItem[];
  accents: string[];
  heading: string;
  description: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const n = items.length;

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  /* Smooths the RING only. Follows the scroll closely: too soft a spring and
     the ring visibly lags the finger, which reads as sticking. */
  const smooth = useSpring(scrollYProgress, {
    stiffness: 150,
    damping: 26,
    mass: 0.25,
    restDelta: 0.0005,
  });

  const rotate = useTransform(smooth, [0, 1], [0, -((n - 1) * 360) / n]);

  /* The index comes off the RAW scroll position, never the spring. A spring
     overshoots and rings as it settles, so rounding its value made the index
     flip back and forth across a boundary (3 to 4 to 3) while the scroll
     itself sat perfectly still: that was the flicker.
     STEP_THRESHOLD then adds hysteresis, so the copy only changes once the
     scroll has travelled most of the way to the next question and then stays
     put. That is what makes it flip once, decisively, at a point, instead of
     dithering wherever the reader happens to stop. */
  const STEP_THRESHOLD = 0.62;
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const exact = Math.min(n - 1, Math.max(0, v * (n - 1)));
    setActive((prev) =>
      Math.abs(exact - prev) >= STEP_THRESHOLD ? Math.round(exact) : prev,
    );
  });

  return (
    <div ref={trackRef} style={{ height: `${n * 38}vh` }} className="relative">
      {/* No `overflow-hidden` anywhere on the path from the scroll root to
          this sticky element: an ancestor with `overflow: hidden` becomes the
          scroll container and silently stops `sticky` from sticking (see also
          the `overflow-x: clip` note on html in globals.css). */}
      <div className="sticky top-0 flex h-[100svh] flex-col justify-center pb-8 pt-20 md:pb-10 md:pt-24">
        <div className="mx-auto w-full max-w-[1180px] px-5 md:px-6">
          <h2
            className="max-w-[20ch] font-sans tracking-[-0.025em] text-[#141210] balance"
            style={{
              fontSize: "clamp(1.5rem, 3.4vw, 2.6rem)",
              lineHeight: 1.05,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            {heading}
          </h2>
          <p className="mt-3 max-w-[58ch] text-[14px] leading-[1.6] text-[#2a2521] md:mt-4 md:text-[16px]">
            {description}
          </p>

          <div className="mt-8 grid items-center gap-11 md:mt-10 md:grid-cols-[auto_1fr] md:gap-14">
            {/* WHEEL + its progress dots */}
            <div className="flex flex-col items-center">
              {/* Radius travels as a CSS variable so the ring can shrink on
                  small screens without hardcoding two transforms. */}
              <div className="relative h-[168px] w-[168px] shrink-0 [--r:76px] md:h-[280px] md:w-[280px] md:[--r:126px]">
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
                        className="absolute left-1/2 top-1/2 h-8 w-8 md:h-11 md:w-11"
                        style={{
                          transform: `rotate(${angle}deg) translate(0, calc(-1 * var(--r))) rotate(${-angle}deg) translate(-50%, -50%)`,
                        }}
                      >
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300 md:h-11 md:w-11"
                          style={{
                            background: isActive ? color : "#ffffff",
                            borderColor: isActive
                              ? color
                              : "rgba(20,18,16,0.14)",
                            color: isActive ? "#ffffff" : "#6b6459",
                            transform: isActive ? "scale(1.16)" : "scale(1)",
                          }}
                        >
                          <ItemIcon
                            className="h-3.5 w-3.5 md:h-5 md:w-5"
                            strokeWidth={1.75}
                          />
                        </div>
                      </div>
                    );
                  })}
                </motion.div>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className="font-mono text-[8.5px] font-semibold uppercase text-[#8a8278] md:text-[10px]"
                    style={{ letterSpacing: "0.18em" }}
                  >
                    Question
                  </span>
                  <span
                    className="font-sans text-[26px] font-medium leading-none md:text-[40px]"
                    style={{ color: accents[active % accents.length] }}
                  >
                    {String(active + 1).padStart(2, "0")}
                  </span>
                  <span className="mt-0.5 text-[10px] text-[#8a8278] md:text-[11px]">
                    of {n}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-1.5">
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
            </div>

            {/* TEXT PANEL — the copy swaps in place, with no opacity
                animation and no remount, which is the only way it can be
                genuinely flash-free. Fading in on a `key` remount always
                shows the new text at less than full opacity for a beat, and
                that dip IS the flash: from 0 it costs a blank frame, and even
                from 0.6 it still reads as a blink. Nothing here animates, so
                there is nothing to perceive. The turning ring supplies the
                motion; the words just change, the way the number in the hub
                already does.
                Kept absolutely positioned in a fixed-height box so questions
                of different lengths can't reflow the section. */}
            <div className="relative min-h-[195px] md:min-h-[225px]">
              <div className="absolute inset-x-0 top-0">
                <h3
                  className="font-sans tracking-[-0.02em] text-[#141210] balance"
                  style={{
                    fontSize: "clamp(1.35rem, 3.2vw, 2.3rem)",
                    lineHeight: 1.1,
                    fontWeight: 500,
                    fontVariationSettings: '"opsz" 144',
                  }}
                >
                  {items[active].title}
                </h3>
                <p className="mt-3 max-w-[52ch] text-[14.5px] italic leading-[1.6] text-[#2a2521] md:mt-4 md:text-[17px]">
                  {items[active].question}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

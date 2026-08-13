"use client";

import { useRef, useState } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
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
 * bringing one item under a fixed pointer at a time. Scrolling this section
 * feels like turning a dial through the questions the day explored, rather
 * than reading a static list.
 *
 * The heading and description live *inside* the sticky frame rather than
 * above the track, so the whole section holds together as one screen instead
 * of the intro scrolling away and leaving the wheel stranded.
 *
 * Legibility while scrolling is driven by scroll VELOCITY, not by timers.
 * An earlier attempt debounced the index and flagged a `moving` state on a
 * timeout, which deadlocked: every scroll event restarted the timer, so
 * during a continuous scroll the commit never fired and the copy sat frozen
 * on one question, permanently blurred, until the user stopped completely.
 * Velocity has no such failure mode, because it is derived continuously from
 * the scroll position rather than waiting for an absence of events: the copy
 * tracks the wheel one-to-one, and blurs back in proportion to how fast the
 * dial is turning, so rapid changes are softened and a settled wheel is
 * always sharp. It also stays off the React render path entirely.
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

  /* Spring-smoothed so the ring keeps turning through the little jumps a
     touch scroll delivers, instead of snapping frame to frame. */
  /* Follows the scroll closely: too soft a spring and the ring visibly lags
     the finger, which reads as the wheel being stuck rather than smoothed. */
  const smooth = useSpring(scrollYProgress, {
    stiffness: 150,
    damping: 26,
    mass: 0.25,
    restDelta: 0.0005,
  });

  const rotate = useTransform(smooth, [0, 1], [0, -((n - 1) * 360) / n]);

  /* The active item tracks the dial immediately, so the ring, the number and
     the copy never disagree about which question is under the pointer. */
  useMotionValueEvent(smooth, "change", (v) => {
    const i = Math.min(n - 1, Math.max(0, Math.round(v * (n - 1))));
    setActive((prev) => (prev === i ? prev : i));
  });

  /* Progress-per-second. Spring-smoothed so a jittery touch scroll doesn't
     make the blur flicker, and so it eases back to sharp rather than
     snapping the instant a finger lifts. */
  const velocity = useVelocity(smooth);
  const smoothVelocity = useSpring(velocity, {
    stiffness: 220,
    damping: 40,
    mass: 0.2,
  });

  const textFilter = useTransform(smoothVelocity, (v) => {
    const blur = Math.min(4.5, Math.abs(v) * 9);
    return `blur(${blur.toFixed(2)}px)`;
  });
  const textOpacity = useTransform(smoothVelocity, (v) =>
    Math.max(0.5, 1 - Math.abs(v) * 1.1),
  );

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
                {/* fixed pointer, doesn't rotate */}
                <div
                  aria-hidden
                  className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2"
                >
                  <div
                    className="h-2.5 w-2.5 rotate-45 border-2 md:h-3 md:w-3"
                    style={{
                      borderColor: accents[active % accents.length],
                      background: "var(--color-cream)",
                    }}
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

            {/* TEXT PANEL — all items mounted and cross-faded, with the whole
                panel blurring back in proportion to how fast the dial turns.
                Both driven by motion values, so this never re-renders and
                never has a stuck state to get wedged in. */}
            <motion.div
              className="relative min-h-[150px] md:min-h-[210px]"
              style={{ filter: textFilter, opacity: textOpacity }}
            >
              {items.map((item, i) => {
                const isActive = i === active;
                return (
                  <motion.div
                    key={item.title}
                    className="absolute inset-x-0 top-0"
                    initial={false}
                    animate={{ opacity: isActive ? 1 : 0 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    style={{ pointerEvents: isActive ? "auto" : "none" }}
                    aria-hidden={!isActive}
                  >
                    <h3
                      className="font-sans tracking-[-0.02em] text-[#141210] balance"
                      style={{
                        fontSize: "clamp(1.35rem, 3.2vw, 2.3rem)",
                        lineHeight: 1.1,
                        fontWeight: 500,
                        fontVariationSettings: '"opsz" 144',
                      }}
                    >
                      {item.title}
                    </h3>
                    <p className="mt-3 max-w-[52ch] text-[14.5px] italic leading-[1.6] text-[#2a2521] md:mt-4 md:text-[17px]">
                      {item.question}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

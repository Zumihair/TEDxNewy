/**
 * Decorative "soundwave" motif for the 60-Second Talk Night recap: flowing
 * oscilloscope lines that evoke voices, sound and a minute of talking. Used
 * the way NodeNetwork is used on the 2050 page, as a subtle background layer.
 *
 * Purely presentational: aria-hidden, no interactivity, and it respects the
 * global prefers-reduced-motion rule in globals.css (which freezes the flow).
 *
 * Each wave is a sine path 2x the viewBox wide, wrapped in a group that slides
 * left by exactly one viewBox width on a loop. Because every wavelength divides
 * 1440, the slide is seamless.
 */

type Props = {
  /** "dark" draws ink lines for light backgrounds; "light" draws white for dark. */
  variant?: "dark" | "light";
  className?: string;
};

type Wave = { cy: number; amp: number; wl: number; dur: string; width: number };

// Wavelengths all divide 1440 so the leftward slide tiles seamlessly.
const WAVES: Wave[] = [
  { cy: 210, amp: 16, wl: 480, dur: "34s", width: 1.4 },
  { cy: 360, amp: 28, wl: 360, dur: "22s", width: 1.8 },
  { cy: 540, amp: 20, wl: 288, dur: "30s", width: 1.5 },
  { cy: 720, amp: 34, wl: 480, dur: "26s", width: 2 },
  { cy: 860, amp: 18, wl: 360, dur: "38s", width: 1.4 },
];

/** Sample a sine wave into an SVG path string. */
function wavePath(cy: number, amp: number, wl: number, width = 2880, step = 16) {
  let d = `M0 ${cy}`;
  for (let x = step; x <= width; x += step) {
    const y = cy + amp * Math.sin((2 * Math.PI * x) / wl);
    d += ` L${x} ${y.toFixed(1)}`;
  }
  return d;
}

export default function SoundWaves({ variant = "dark", className = "" }: Props) {
  const color = variant === "light" ? "#ffffff" : "#141210";

  return (
    <div className={className} aria-hidden>
      <svg
        viewBox="0 0 1440 1024"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
      >
        {WAVES.map((w, i) => (
          <g
            key={i}
            className="salon-wave-flow"
            style={{ animationDuration: w.dur }}
          >
            <path
              d={wavePath(w.cy, w.amp, w.wl)}
              fill="none"
              stroke={color}
              strokeOpacity={0.55}
              strokeWidth={w.width}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

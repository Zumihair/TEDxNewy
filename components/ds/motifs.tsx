import type { CSSProperties } from "react";

/**
 * Programme motifs: one ink, strokes at --motif-stroke, drawn behind content at
 * --motif-opacity. Primitives are the dot, the line and the arc.
 */
const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

export type MotifTone = "dark" | "light" | "blush";
const INK: Record<string, string> = { light: "var(--ink)", dark: "var(--white)", blush: "var(--blush)" };

/** Small deterministic PRNG so a motif renders identically on server and client. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

/** Newcastle 2050 salon: dots joined to their nearest neighbours. */
export function Network({
  tone = "dark",
  nodes = 26,
  seed = 7,
  accents = 3,
  animate = true,
  opacity,
}: {
  tone?: MotifTone;
  nodes?: number;
  seed?: number;
  accents?: number;
  animate?: boolean;
  opacity?: number;
}) {
  const rand = rng(seed);
  const pts: [number, number][] = Array.from({ length: nodes }, () => [40 + rand() * 1120, 40 + rand() * 620]);
  const edges: [number, number][] = [];
  pts.forEach((p, i) => {
    pts
      .map((q, j) => [j, (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2] as [number, number])
      .filter(([j]) => j !== i)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 2)
      .forEach(([j]) => {
        if (!edges.some(([a, b]) => a === j && b === i)) edges.push([i, j]);
      });
  });
  const ink = INK[tone] || INK.dark;
  return (
    <div
      className={cx("tx-motif", animate && "tx-motif--drift")}
      aria-hidden
      style={{ opacity: opacity ?? "var(--motif-opacity)" }}
    >
      <svg viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice">
        <g>
          {edges.map(([a, b], i) => (
            <line
              key={i}
              x1={pts[a][0]}
              y1={pts[a][1]}
              x2={pts[b][0]}
              y2={pts[b][1]}
              stroke={ink}
              style={{ strokeWidth: "var(--motif-stroke)" }}
            />
          ))}
          {pts.map(([cx0, cy], i) => (
            <circle
              key={i}
              className={animate ? "tx-motif__pulse" : undefined}
              style={{ animationDelay: `${(i % 7) * -1}s` }}
              cx={cx0}
              cy={cy}
              r={i < accents ? 6 : 3}
              fill={i < accents ? "var(--red)" : ink}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

/** 60-Second Talk Night: stacked sine lines flowing, the middle one red. */
export function Waves({
  tone = "dark",
  lines = 5,
  amplitude = 24,
  animate = true,
  opacity,
}: {
  tone?: MotifTone;
  lines?: number;
  amplitude?: number;
  animate?: boolean;
  opacity?: number;
}) {
  const ink = INK[tone] || INK.dark;
  const periods = [480, 360, 288, 480, 360, 240, 720];
  const wave = (mid: number, amp: number, period: number) => {
    let d = `M0 ${mid}`;
    for (let x = 16; x <= 1440 * 2; x += 16) d += ` L${x} ${(mid + amp * Math.sin((2 * Math.PI * x) / period)).toFixed(1)}`;
    return d;
  };
  return (
    <div className="tx-motif" aria-hidden style={{ opacity: opacity ?? "var(--motif-opacity)" }}>
      <svg viewBox="0 0 1440 700" preserveAspectRatio="xMidYMid slice">
        {Array.from({ length: lines }, (_, i) => (
          <g key={i} className={animate ? "tx-motif__flow" : undefined} style={{ animationDuration: `${22 + i * 4}s` }}>
            <path
              d={wave(((i + 1) * 700) / (lines + 1), amplitude * (0.6 + ((i * 37) % 10) / 10), periods[i % periods.length])}
              fill="none"
              stroke={i === Math.floor(lines / 2) ? "var(--red)" : ink}
              style={{ strokeWidth: "var(--motif-stroke)" }}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

const SCRIBBLES: Record<string, { vb: string; d: string[] }> = {
  underline: { vb: "0 0 128 24", d: ["M4 12c20-10 40-10 60 0s40 10 60 0"] },
  zigzag: { vb: "0 0 152 20", d: ["M4 14l16-8 16 8 16-8 16 8 16-8 16 8 16-8 16 8"] },
  spark: { vb: "0 0 64 64", d: ["M32 6l4 20 20 4-20 4-4 20-4-20-20-4 20-4z"] },
  star: { vb: "0 0 64 64", d: ["M32 8l7 16 18 2-13 12 4 18-16-9-16 9 4-18L7 26l18-2z"] },
  arrow: { vb: "0 0 64 56", d: ["M8 44c10-20 26-30 46-32", "M44 6l10 6-8 9"] },
  squiggle: { vb: "0 0 128 40", d: ["M4 30c8-22 16 22 24 0s16-22 24 0 16 22 24 0 16-22 24 0 16 22 20 0"] },
  loop: { vb: "0 0 96 64", d: ["M6 40c14 0 22-30 40-30 14 0 16 22 2 24s-14-26 8-26c18 0 26 22 34 32"] },
  circle: { vb: "0 0 120 64", d: ["M60 6C26 6 6 18 6 32s24 26 56 26 52-10 52-26S90 4 52 8"] },
};

/** Youth Futures Lab: hand-drawn marks that draw themselves in. */
export function Scribble({
  shape = "underline",
  tone = "red",
  width = 120,
  rotate = 0,
  draw = true,
  style,
}: {
  shape?: keyof typeof SCRIBBLES;
  tone?: MotifTone | "red";
  width?: number;
  rotate?: number;
  draw?: boolean;
  style?: CSSProperties;
}) {
  const s = SCRIBBLES[shape] || SCRIBBLES.underline;
  const stroke = tone === "red" ? "var(--red)" : INK[tone] || INK.dark;
  return (
    <svg
      className={draw ? "tx-motif__draw" : undefined}
      viewBox={s.vb}
      width={width}
      overflow="visible"
      aria-hidden
      style={{ transform: `rotate(${rotate}deg)`, ...style }}
    >
      {s.d.map((d, i) => (
        <path
          key={i}
          d={d}
          pathLength="1"
          fill="none"
          stroke={stroke}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ animationDelay: `${i * 200}ms` }}
        />
      ))}
    </svg>
  );
}

/**
 * Decorative "nodes and edges" network, used as a subtle background motif on
 * the Newcastle 2050 salon page to hint at the connected, planned city the
 * night was about. Purely presentational: no interactivity, aria-hidden, and
 * it respects the global prefers-reduced-motion rule in globals.css.
 *
 * Renders an SVG sized to cover its parent (slice), with a slow ambient drift
 * on the whole constellation and a gentle per-node pulse.
 */

type Props = {
  /** "dark" draws ink lines for light backgrounds; "light" draws white for dark. */
  variant?: "dark" | "light";
  className?: string;
};

// Hand-placed so the layout stays deliberate (no random => no hydration drift).
const NODES: [number, number][] = [
  [120, 140],
  [340, 90],
  [520, 220],
  [250, 320],
  [80, 470],
  [440, 430],
  [660, 120],
  [770, 340],
  [900, 220],
  [1080, 120],
  [1240, 250],
  [1180, 450],
  [980, 470],
  [1350, 130],
  [600, 620],
  [300, 600],
  [120, 730],
  [430, 800],
  [720, 780],
  [900, 680],
  [1120, 660],
  [1300, 790],
  [520, 980],
  [980, 900],
];

const EDGES: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [3, 5],
  [2, 5],
  [1, 6],
  [6, 7],
  [7, 8],
  [8, 9],
  [9, 13],
  [9, 10],
  [10, 11],
  [11, 12],
  [12, 7],
  [7, 14],
  [5, 14],
  [14, 15],
  [15, 3],
  [15, 16],
  [16, 17],
  [17, 14],
  [14, 18],
  [18, 19],
  [19, 12],
  [19, 20],
  [20, 11],
  [20, 21],
  [21, 13],
  [18, 22],
  [17, 22],
  [18, 23],
  [23, 19],
  [22, 23],
];

export default function NodeNetwork({
  variant = "dark",
  className = "",
}: Props) {
  const color = variant === "light" ? "#ffffff" : "#141210";

  return (
    <div className={className} aria-hidden>
      <svg
        viewBox="0 0 1440 1024"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
      >
        <g className="salon-net-g">
          {EDGES.map(([a, b], i) => (
            <line
              key={i}
              x1={NODES[a][0]}
              y1={NODES[a][1]}
              x2={NODES[b][0]}
              y2={NODES[b][1]}
              stroke={color}
              strokeOpacity={0.5}
              strokeWidth={1}
            />
          ))}
          {NODES.map(([x, y], i) => (
            <circle
              key={i}
              className="salon-net-node"
              cx={x}
              cy={y}
              r={i % 4 === 0 ? 4 : 2.6}
              fill={color}
              style={{ animationDelay: `${(i % 7) * 0.9}s` }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

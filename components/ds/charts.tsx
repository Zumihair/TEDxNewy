"use client";

import { useId, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from "react";

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");
const SERIES = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];
const fmt = (n: number) => n.toLocaleString("en-AU");

/** Width of a container, tracked with a ResizeObserver. */
function useWidth(initial = 640): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(initial);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(Math.max(240, el.clientWidth));
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

/** Round a maximum up to a tidy axis ceiling. */
const niceMax = (n: number) => {
  const mag = Math.pow(10, Math.floor(Math.log10(n || 1)));
  return Math.ceil(n / mag) * mag;
};

/** Monotone cubic path through points: smooth, with no overshoot between samples. */
function smoothPath(pts: [number, number][]) {
  const n = pts.length;
  if (n < 2) return "";
  if (n === 2) return `M${pts[0][0]} ${pts[0][1]} L${pts[1][0]} ${pts[1][1]}`;
  const dx: number[] = [];
  const dy: number[] = [];
  const slope: number[] = [];
  const tan: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1][0] - pts[i][0];
    dy[i] = pts[i + 1][1] - pts[i][1];
    slope[i] = dy[i] / dx[i];
  }
  tan[0] = slope[0];
  tan[n - 1] = slope[n - 2];
  for (let i = 1; i < n - 1; i++) {
    tan[i] =
      slope[i - 1] * slope[i] <= 0
        ? 0
        : (3 * (dx[i - 1] + dx[i])) /
          ((2 * dx[i] + dx[i - 1]) / slope[i - 1] + (dx[i] + 2 * dx[i - 1]) / slope[i]);
  }
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += ` C${(pts[i][0] + h).toFixed(1)} ${(pts[i][1] + h * tan[i]).toFixed(1)} ${(pts[i + 1][0] - h).toFixed(1)} ${(pts[i + 1][1] - h * tan[i + 1]).toFixed(1)} ${pts[i + 1][0].toFixed(1)} ${pts[i + 1][1].toFixed(1)}`;
  }
  return d;
}

export function Sparkline({
  values = [],
  width = 72,
  height = 22,
  tone,
}: {
  values?: number[];
  width?: number;
  height?: number;
  tone?: string;
}) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const pts: [number, number][] = values.map((v, i) => [
    (i / (values.length - 1)) * (width - 4) + 2,
    height - 2 - ((v - min) / span) * (height - 4),
  ]);
  const last = pts[pts.length - 1];
  const stroke = tone || "var(--chart-1)";
  return (
    <svg width={width} height={height} aria-hidden className="tx-spark">
      <path d={smoothPath(pts)} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {last && <circle cx={last[0]} cy={last[1]} r="3" fill={stroke} />}
    </svg>
  );
}

export type Series = { name: string; values: number[] };

export function LineChart({
  labels = [],
  series = [],
  compare,
  height = 220,
  format = fmt,
  area = true,
}: {
  labels?: string[];
  series?: Series[];
  compare?: Series;
  height?: number;
  format?: (n: number) => string;
  area?: boolean;
}) {
  const [ref, width] = useWidth();
  const left = 40;
  const right = 12;
  const top = 12;
  const bottom = 28;
  const all = [...series.flatMap((s) => s.values), ...(compare ? compare.values : [])];
  const max = niceMax(Math.max(...all, 1));
  const x = (i: number) => left + (i / Math.max(labels.length - 1, 1)) * (width - left - right);
  const y = (v: number) => top + (1 - v / max) * (height - top - bottom);
  const [hover, setHover] = useState<number | null>(null);
  const gradId = useId();
  const onMove = (e: MouseEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * width;
    setHover(Math.max(0, Math.min(labels.length - 1, Math.round(((px - left) / (width - left - right)) * (labels.length - 1)))));
  };
  const path = (vals: number[]) => smoothPath(vals.map((v, i) => [x(i), y(v)] as [number, number]));
  const ticks = [0, 0.5, 1].map((f) => max * f);
  return (
    <div className="tx-chart">
      {series.length + (compare ? 1 : 0) > 1 && (
        <div className="tx-chart__legend">
          {series.map((s, i) => (
            <span key={s.name}>
              <i style={{ background: SERIES[i] }} />
              {s.name}
            </span>
          ))}
          {compare && (
            <span>
              <i className="is-dashed" />
              {compare.name}
            </span>
          )}
        </div>
      )}
      <div className="tx-chart__plot" ref={ref}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
          role="img"
          aria-label={series.map((s) => s.name).join(", ")}
        >
          <defs>
            <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--chart-1)" stopOpacity=".16" />
              <stop offset="1" stopColor="var(--chart-1)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={left} x2={width - right} y1={y(t)} y2={y(t)} className="tx-chart__grid" />
              <text x={left - 8} y={y(t) + 4} textAnchor="end" className="tx-chart__tick">
                {format(Math.round(t))}
              </text>
            </g>
          ))}
          {labels.map(
            (l, i) =>
              (i % Math.ceil(labels.length / 7) === 0 || i === labels.length - 1) && (
                <text key={i} x={x(i)} y={height - 8} textAnchor="middle" className="tx-chart__tick">
                  {l}
                </text>
              ),
          )}
          {compare && (
            <path d={path(compare.values)} fill="none" stroke="var(--chart-other)" strokeWidth="2" strokeDasharray="4 4" />
          )}
          {area && series[0] && (
            <path
              d={`${path(series[0].values)} L${x(series[0].values.length - 1)} ${y(0)} L${x(0)} ${y(0)} Z`}
              fill={`url(#${gradId})`}
            />
          )}
          {series.map((s, i) => (
            <path key={s.name} d={path(s.values)} fill="none" stroke={SERIES[i]} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          ))}
          {hover == null &&
            series.map((s, i) => {
              const last = s.values.length - 1;
              return (
                <circle key={s.name} cx={x(last)} cy={y(s.values[last])} r="4" fill={SERIES[i]} stroke="var(--white)" strokeWidth="2" />
              );
            })}
          {hover != null && <line x1={x(hover)} x2={x(hover)} y1={top} y2={height - bottom} className="tx-chart__cross" />}
          {hover != null &&
            series.map((s, i) => (
              <circle key={s.name} cx={x(hover)} cy={y(s.values[hover])} r="4" fill={SERIES[i]} stroke="var(--white)" strokeWidth="2" />
            ))}
        </svg>
        {hover != null && (
          <div className="tx-chart__tip" style={{ left: `${(x(hover) / width) * 100}%` }}>
            <strong>{labels[hover]}</strong>
            {series.map((s, i) => (
              <span key={s.name}>
                <i style={{ background: SERIES[i] }} />
                {s.name}
                <b>{format(s.values[hover])}</b>
              </span>
            ))}
            {compare && (
              <span>
                <i className="is-dashed" />
                {compare.name}
                <b>{format(compare.values[hover])}</b>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function BarChart({
  data = [],
  highlight,
  format = fmt,
  horizontal = true,
  height = 200,
}: {
  data?: { label: string; value: number }[];
  highlight?: string;
  format?: (n: number) => string;
  horizontal?: boolean;
  height?: number;
}) {
  const max = niceMax(Math.max(...data.map((d) => d.value), 1));
  const [hover, setHover] = useState<number | null>(null);
  const [ref, width] = useWidth();
  if (horizontal) {
    return (
      <div className="tx-bars" role="list">
        {data.map((d, i) => (
          <div
            key={d.label}
            className="tx-bars__row"
            role="listitem"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="tx-bars__label">{d.label}</span>
            <span className="tx-bars__track">
              <span
                className={cx("tx-bars__bar", (highlight === d.label || (highlight == null && i === 0)) && "is-hi", hover === i && "is-hover")}
                style={{ width: `${(d.value / max) * 100}%` }}
              />
            </span>
            <span className="tx-bars__value">{format(d.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  const pad = 8;
  const foot = 26;
  const head = 18;
  const gap = 8;
  const bw = (width - pad * 2) / data.length - gap;
  return (
    <div className="tx-chart">
      <div className="tx-chart__plot" ref={ref}>
        <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img">
          <line x1={0} x2={width} y1={height - foot} y2={height - foot} className="tx-chart__grid" />
          {data.map((d, i) => {
            const h = (d.value / max) * (height - foot - head);
            const bx = pad + i * (bw + gap) + gap / 2;
            const hi = highlight === d.label;
            return (
              <g key={d.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                <rect x={bx - gap / 2} y={0} width={bw + gap} height={height} fill="transparent" />
                <path
                  d={`M${bx} ${height - foot} V${height - foot - h + 4} q0 -4 4 -4 H${bx + bw - 4} q4 0 4 4 V${height - foot} Z`}
                  fill={hi ? "var(--chart-1)" : hover === i ? "var(--charcoal)" : "var(--ink)"}
                  opacity={hi || hover === i || hover == null ? 1 : 0.85}
                />
                {(hi || hover === i) && (
                  <text x={bx + bw / 2} y={height - foot - h - 6} textAnchor="middle" className="tx-chart__val">
                    {format(d.value)}
                  </text>
                )}
                <text x={bx + bw / 2} y={height - 8} textAnchor="middle" className="tx-chart__tick">
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export function Meter({
  label,
  value,
  max = 100,
  display,
  note,
}: {
  label: string;
  value: number;
  max?: number;
  display?: string;
  note?: string;
}) {
  const pct = useMemo(() => Math.max(0, Math.min(100, (value / max) * 100)), [value, max]);
  return (
    <div className="tx-meter">
      <div className="tx-meter__head">
        <span>{label}</span>
        <strong>{display || `${Math.round(pct)}%`}</strong>
      </div>
      <div className="tx-meter__track" role="progressbar" aria-valuenow={value} aria-valuemax={max} aria-label={label}>
        <span style={{ width: `${pct}%` }} />
      </div>
      {note && <span className="tx-meter__note">{note}</span>}
    </div>
  );
}

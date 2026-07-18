import type { ReactNode } from "react";
import type {
  BooleanSummary,
  ChoiceSummary,
  QuestionSummary,
  RatingSummary,
} from "@/lib/feedback-summary";
import { isStatSummary } from "@/lib/feedback-summary";

/**
 * The "at a glance" overview: one card per question so every answer is visible
 * the moment you land on the page, not just the average rating. Pure and
 * presentational (no "use client", no server-only deps) so it renders in both
 * the server feedback page and the client imported-archive component.
 */

const ACCENT = "#b91404";

export function MetricCard({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.08)] bg-white p-4 shadow-[var(--shadow-sm)]">
      <div className="flex items-baseline justify-between gap-2">
        <div className="font-mono text-[10px] font-semibold uppercase leading-[1.4] tracking-[0.14em] text-[#8a8278]">
          {label}
        </div>
        {hint && (
          <div className="shrink-0 font-mono text-[9.5px] uppercase tracking-[0.1em] text-[#b8b1a5]">
            {hint}
          </div>
        )}
      </div>
      <div className="mt-2.5">{children}</div>
    </div>
  );
}

/** Big headline number with an optional unit and one-line caption. */
export function BigStat({
  value,
  unit,
  caption,
}: {
  value: string;
  unit?: string;
  caption?: string;
}) {
  return (
    <>
      <div className="flex items-baseline gap-1">
        <span className="font-sans text-[28px] font-medium leading-none tracking-[-0.02em] text-[#141210]">
          {value}
        </span>
        {unit && <span className="text-[13px] text-[#8a8278]">{unit}</span>}
      </div>
      {caption && (
        <div className="mt-1.5 text-[12px] text-[#6b6459]">{caption}</div>
      )}
    </>
  );
}

function RatingCard({ s }: { s: RatingSummary }) {
  const maxCount = Math.max(1, ...s.dist.map((d) => d.count));
  return (
    <MetricCard label={s.label} hint={`n=${s.count}`}>
      <BigStat
        value={s.avg == null ? "—" : s.avg.toFixed(1)}
        unit={s.avg == null ? undefined : `/ ${s.max}`}
      />
      {s.count > 0 && (
        <div className="mt-3">
          <div className="flex h-9 items-end gap-[3px]">
            {s.dist.map((d) => (
              <div
                key={d.value}
                className="flex-1 rounded-[2px]"
                style={{
                  height: `${Math.max(6, (d.count / maxCount) * 100)}%`,
                  backgroundColor: d.count > 0 ? ACCENT : "rgba(20,18,16,0.08)",
                  opacity: d.count > 0 ? 0.35 + 0.65 * (d.count / maxCount) : 1,
                }}
                title={`${d.value}: ${d.count}`}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between font-mono text-[9px] text-[#b8b1a5]">
            <span>1</span>
            <span>{s.max}</span>
          </div>
        </div>
      )}
    </MetricCard>
  );
}

function BooleanCard({ s }: { s: BooleanSummary }) {
  const pct = s.count > 0 ? Math.round((s.yes / s.count) * 100) : null;
  return (
    <MetricCard label={s.label} hint={`n=${s.count}`}>
      <BigStat
        value={pct == null ? "—" : `${pct}%`}
        caption={pct == null ? undefined : `${s.yes} yes · ${s.no} no`}
      />
      {s.count > 0 && (
        <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-[rgba(20,18,16,0.08)]">
          <div
            style={{ width: `${pct}%`, backgroundColor: ACCENT }}
            aria-hidden
          />
        </div>
      )}
    </MetricCard>
  );
}

function ChoiceCard({ s }: { s: ChoiceSummary }) {
  const maxCount = Math.max(1, ...s.options.map((o) => o.count));
  const shown = s.options.slice(0, 5);
  const rest = s.options.length - shown.length;
  return (
    <MetricCard
      label={s.label}
      hint={s.multi ? "select all" : `n=${s.count}`}
    >
      {shown.length === 0 ? (
        <div className="text-[13px] text-[#8a8278]">No answers</div>
      ) : (
        <ul className="space-y-1.5">
          {shown.map((o) => (
            <li key={o.label}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[12.5px] text-[#2a2521]" title={o.label}>
                  {o.label}
                </span>
                <span className="shrink-0 font-sans text-[12.5px] font-medium tabular-nums text-[#141210]">
                  {o.count}
                </span>
              </div>
              <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-[rgba(20,18,16,0.06)]">
                <div
                  style={{
                    width: `${(o.count / maxCount) * 100}%`,
                    backgroundColor: ACCENT,
                    opacity: 0.4 + 0.6 * (o.count / maxCount),
                  }}
                  aria-hidden
                />
              </div>
            </li>
          ))}
          {rest > 0 && (
            <li className="pt-0.5 text-[11.5px] text-[#8a8278]">
              +{rest} more option{rest === 1 ? "" : "s"}
            </li>
          )}
        </ul>
      )}
    </MetricCard>
  );
}

function StatCard({ s }: { s: RatingSummary | BooleanSummary | ChoiceSummary }) {
  if (s.kind === "rating") return <RatingCard s={s} />;
  if (s.kind === "boolean") return <BooleanCard s={s} />;
  return <ChoiceCard s={s} />;
}

/**
 * The glance grid. `leading` cards (e.g. Responses, Completion, TED score) sit
 * first, then one card per stat-like question. Free-text questions are skipped
 * here and listed in full elsewhere.
 */
export default function FeedbackOverview({
  summaries,
  leading,
}: {
  summaries: QuestionSummary[];
  leading?: ReactNode;
}) {
  const stats = summaries.filter(isStatSummary);
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {leading}
      {stats.map((s) => (
        <StatCard key={s.key} s={s} />
      ))}
    </div>
  );
}

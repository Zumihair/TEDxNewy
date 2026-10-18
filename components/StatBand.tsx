import Link from "next/link";
import type { ReactNode } from "react";

export type StatItem = {
  value: string;
  suffix?: string;
  label: ReactNode;
  sub?: string;
  /** When given, the whole tile links there rather than sitting as a plain number. */
  href?: string;
};

/**
 * The full-width red stat band used on the home page, shared so /mission,
 * /team and /talks read the same way. Three or four tiles; on a phone four
 * wrap to two rows and three stay on one.
 */
export default function StatBand({ items }: { items: StatItem[] }) {
  const cols = items.length === 3 ? "grid-cols-3 gap-x-4" : "grid-cols-2 sm:grid-cols-4";
  return (
    <section className="bg-[#e62b1e] text-white">
      <div className="mx-auto max-w-[1240px] px-5 py-16 md:px-10 md:py-24">
        <div className={`grid gap-y-12 md:gap-x-10 ${cols}`}>
          {items.map((s, i) => (
            <Stat key={i} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function Stat({ value, suffix, label, sub, href }: StatItem) {
  const body = (
    <>
      <div
        className="font-sans leading-[0.9] tracking-[-0.04em] text-white"
        style={{
          fontSize: "clamp(2.4rem, 6.5vw, 5rem)",
          fontWeight: 500,
          fontVariationSettings: '"opsz" 144',
        }}
      >
        <span className="tabular">{value}</span>
        {suffix && <span className="text-[#3d0a05]">{suffix}</span>}
      </div>
      <div
        className={`mt-5 font-sans text-[14.5px] font-medium leading-[1.3] text-white ${href ? "underline-offset-4 group-hover:underline" : ""}`}
      >
        {label}
      </div>
      {sub && <div className="mt-1.5 font-ui text-[12px] font-semibold text-white/75">{sub}</div>}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group block rounded-md transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      >
        {body}
      </Link>
    );
  }
  return <div>{body}</div>;
}

export default function PageHero({
  kicker,
  titleTop,
  titleBottom,
  intro,
  meta,
}: {
  kicker: string;
  titleTop: string;
  titleBottom?: string;
  intro?: React.ReactNode;
  meta?: React.ReactNode;
  /** Kept for backwards compatibility; no longer used. */
  accent?: "red" | "amber" | "coast";
}) {
  return (
    <section className="bg-[var(--color-cream)] pt-40 pb-20 md:pt-48 md:pb-28">
      <div className="mx-auto max-w-[1100px] px-5 md:px-6">
        <div
          className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
          style={{ letterSpacing: "0.24em" }}
        >
          {kicker}
        </div>

        <h1
          className="mt-6 font-sans tracking-[-0.025em] text-[#141210] balance"
          style={{
            fontSize: "clamp(2.5rem, 6vw, 5rem)",
            lineHeight: 0.98,
            fontWeight: 500,
            fontVariationSettings: '"opsz" 144',
          }}
        >
          {titleTop}
          {titleBottom && (
            <>
              {" "}
              {titleBottom}
            </>
          )}
        </h1>

        {intro && (
          <p className="mt-8 max-w-[60ch] text-[17px] leading-[1.65] text-[#2a2521] md:text-[18px]">
            {intro}
          </p>
        )}

        {meta && <div className="mt-8">{meta}</div>}
      </div>
    </section>
  );
}

/**
 * Bold "SOLD OUT" stamp for a hero. A deliberate graphic mark, not a status
 * pill: solid red fill, a white double ring (border plus an inset glow) and
 * a slight rotation, reading like a stamp pressed onto a sold-out poster or
 * ticket rather than a generic grey chip. Shared by the homepage hero
 * (SignalHomeHero.tsx) and /signal's own hero so both heroes carry the
 * exact same mark, and any future sold-out event can reuse it as-is.
 */
export default function SoldOutBadge({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-flex -rotate-6 items-center border-2 border-white/90 px-5 py-2 ${className}`}
      style={{
        background: "#e02214",
        boxShadow:
          "0 12px 30px -8px rgba(224,34,20,0.6), inset 0 0 0 3px rgba(255,255,255,0.25)",
      }}
    >
      <span
        className="font-mono text-[12.5px] font-extrabold uppercase text-white"
        style={{ letterSpacing: "0.28em" }}
      >
        Sold out
      </span>
    </div>
  );
}

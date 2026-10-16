/**
 * "Sold out" status pill for a hero: a frosted pill with a red dot, sentence
 * case, no rotation or stamp. Shared by the homepage hero (SignalHomeHero.tsx)
 * and /signal's own hero so both carry the same mark; any future sold-out
 * event can reuse it as-is.
 */
export default function SoldOutBadge({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-flex h-9 items-center gap-2.5 rounded-full border border-white/25 bg-white/10 px-4 backdrop-blur-md ${className}`}
    >
      <span aria-hidden className="h-2 w-2 rounded-full bg-[#e62b1e] shadow-[0_0_0_3px_rgba(230,43,30,0.28)]" />
      <span className="font-ui text-[14px] font-semibold text-white">Sold out</span>
    </div>
  );
}

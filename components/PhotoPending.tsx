import { ImageIcon } from "lucide-react";

/**
 * Stands in for an event photo that doesn't exist yet.
 *
 * Every event card panel already falls back to a flat gradient when
 * `hero_image_url` is empty, which reads as a broken or half-loaded image
 * rather than a deliberate state. This names the event and says photography
 * is coming, so a freshly announced event looks intentional on `/events`, the
 * homepage grid, and the recent-events band.
 *
 * Nothing to remove later: set the hero image in `/admin/events` and the real
 * photo takes over on its own.
 *
 * Sits inside the existing `relative` panel, so it inherits its aspect ratio
 * and gradient. Always on a dark gradient, hence the fixed white-on-dark
 * palette.
 */
export default function PhotoPending({ title }: { title: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 px-5 text-center">
      <ImageIcon
        className="h-5 w-5 shrink-0 text-white/30"
        strokeWidth={1.75}
        aria-hidden
      />
      <div className="font-sans text-[15px] font-medium leading-tight tracking-[-0.01em] text-white/80 balance">
        {title}
      </div>
      <div
        className="font-mono text-[9px] font-semibold uppercase text-white/40"
        style={{ letterSpacing: "0.22em" }}
      >
        Photos coming soon
      </div>
    </div>
  );
}

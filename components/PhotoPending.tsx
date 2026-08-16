import { ImageIcon } from "lucide-react";

/**
 * Stands in for an event photo that doesn't exist yet.
 *
 * Every event card panel falls back to a flat `imageGradient` when
 * `hero_image_url` is empty, which reads as a broken or half-loaded image
 * rather than a deliberate state. This names the event and says photography
 * is coming, so a newly announced event looks intentional on `/events`,
 * `/salons`, `/signature`, the homepage grid, and the recent-events band.
 *
 * **It is deliberately always red, whatever the event's kind.** It paints its
 * own brand gradient over the panel, so a photo-less Salon or special doesn't
 * sit under the navy or teal kind colour the card would otherwise use. Two
 * reasons: an awaiting-photos card should read as one consistent state rather
 * than three different-coloured ones, and the kind colours are tuned to sit
 * behind photography, not behind text. The gradient is the same one
 * `KIND_GRADIENT.flagship` uses in `app/events/page.tsx`, so this stays inside
 * the existing palette.
 *
 * **This is automatic for every future event.** Nothing needs adding per
 * event and nothing needs removing later: an event with no hero image gets
 * this card, and the moment a hero image is set in `/admin/events` the real
 * photo takes over. If you build a new event card component, give its photo
 * panel the same `image ? <PhotoFill …/> : <PhotoPending title={title} />`
 * fallback rather than letting it render an empty gradient.
 *
 * Sits inside the panel's existing `relative` box, so it inherits the aspect
 * ratio and rounding. White-on-dark palette is fixed, because the background
 * it paints is always dark red.
 */

/** Brand red, matching KIND_GRADIENT.flagship. Change here to change it everywhere. */
const PENDING_GRADIENT =
  "linear-gradient(135deg, #2a0604 0%, #8c0d05 55%, #b91404 100%)";

export default function PhotoPending({ title }: { title: string }) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 px-5 text-center"
      style={{ background: PENDING_GRADIENT }}
    >
      <ImageIcon
        className="h-5 w-5 shrink-0 text-white/45"
        strokeWidth={1.75}
        aria-hidden
      />
      <div className="font-sans text-[15px] font-medium leading-tight tracking-[-0.01em] text-white balance">
        {title}
      </div>
      <div
        className="font-mono text-[9px] font-semibold uppercase text-white/60"
        style={{ letterSpacing: "0.22em" }}
      >
        Photos coming soon
      </div>
    </div>
  );
}

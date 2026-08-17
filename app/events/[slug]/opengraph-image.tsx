import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-card";
import { EVENT_FALLBACK_IMAGE } from "@/lib/og-content";
import { getEventBySlug, getPhotosForEvent } from "@/lib/cms-content";

export const alt = "TEDxNewy event";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// One word, matching the static event cards. No date or venue: the card
// carries the name, and the page's own og:description underneath it carries
// the detail.
const KIND_EYEBROW: Record<string, string> = {
  flagship: "Signature",
  salon: "Salon",
  special: "Event",
};

/**
 * Event cards are built from the CMS row rather than the static catalogue, so
 * adding an event in `/admin/events` gives it a real social card with no code
 * change. Photo preference runs hero image, then the first catalogued gallery
 * photo, then the house fallback, which mirrors how the event cards on the
 * site itself degrade.
 */
export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    return renderOgCard({
      eyebrow: "TEDxNewy",
      title: "Event not found.",
      image: EVENT_FALLBACK_IMAGE,
    });
  }

  let image = event.heroImageUrl ?? null;
  if (!image) {
    const photos = await getPhotosForEvent(event.id);
    image = photos[0]?.url ?? EVENT_FALLBACK_IMAGE;
  }

  return renderOgCard({
    eyebrow: KIND_EYEBROW[event.kind] ?? "TEDxNewy",
    title: event.title,
    image,
  });
}

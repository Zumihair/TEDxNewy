import PhotoFill from "@/components/PhotoFill";

/**
 * Warm, photo-led hero for the Participate pages (speak / volunteer / partner).
 *
 * Mobile-first: the photo stacks on top, the words sit below on the cream
 * surface. From md up it becomes a two-column split, words on the left and a
 * rounded portrait on the right. A soft warm gradient over the image keeps the
 * optional caption chip readable and ties the photo to the brand.
 */
export default function ParticipateHero({
  kicker,
  title,
  intro,
  body,
  image,
  imageAlt,
  aspect = "portrait",
  priority = true,
}: {
  kicker: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  body?: React.ReactNode;
  image: string;
  imageAlt: string;
  /** Portrait suits a standing shot; landscape suits a wider candid. */
  aspect?: "portrait" | "landscape";
  priority?: boolean;
}) {
  const aspectClass = aspect === "portrait" ? "aspect-[4/5]" : "aspect-[4/3]";

  return (
    <section className="bg-[var(--color-cream)] pt-28 pb-14 md:pt-32 md:pb-20">
      <div className="mx-auto max-w-[1200px] px-5 md:px-6">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-14 lg:gap-20">
          {/* Words — second on mobile, first on desktop */}
          <div className="order-2 md:order-1">
            <div
              className="font-mono text-[10.5px] font-semibold uppercase text-[#b91404]"
              style={{ letterSpacing: "0.24em" }}
            >
              {kicker}
            </div>
            <h1
              className="mt-5 font-sans tracking-[-0.025em] text-[#141210] balance"
              style={{
                fontSize: "clamp(2.2rem, 4.6vw, 3.75rem)",
                lineHeight: 1.0,
                fontWeight: 500,
                fontVariationSettings: '"opsz" 144',
              }}
            >
              {title}
            </h1>
            {intro && (
              <p className="mt-6 text-[16.5px] leading-[1.65] text-[#2a2521] md:text-[17.5px]">
                {intro}
              </p>
            )}
            {body && (
              <p className="mt-4 text-[16.5px] leading-[1.65] text-[#2a2521] md:text-[17.5px]">
                {body}
              </p>
            )}
          </div>

          {/* Photo — first on mobile, second on desktop */}
          <div className="order-1 md:order-2">
            <div
              className={`group relative overflow-hidden rounded-[var(--radius-lg,20px)] ${aspectClass}`}
              style={{
                boxShadow: "0 30px 60px -32px rgba(42, 6, 4, 0.55)",
                border: "1px solid rgba(20,18,16,0.06)",
              }}
            >
              <PhotoFill
                src={image}
                alt={imageAlt}
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={priority}
                hoverZoom={false}
              />
              {/* Subtle warm brand wash to tie the photo to the palette */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(224,34,20,0.05) 0%, rgba(42,6,4,0) 45%, rgba(42,6,4,0.18) 100%)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

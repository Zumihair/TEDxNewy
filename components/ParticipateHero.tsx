import PhotoFill from "@/components/PhotoFill";

/**
 * Warm, photo-led hero for the Participate pages (speak / volunteer / partner).
 *
 * Mobile-first: a 3:1 landscape strip sits on top, the words below. From md up
 * it becomes a two-column split, words on the left and a 4:3 landscape photo
 * on the right. A soft warm gradient over the image keeps the
 * optional caption chip readable and ties the photo to the brand.
 */
export default function ParticipateHero({
  kicker,
  title,
  intro,
  body,
  image,
  imageAlt,
  position = "center",
  priority = true,
}: {
  /** Retired: the design system has no kickers. Accepted and ignored. */
  kicker?: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  body?: React.ReactNode;
  image: string;
  imageAlt: string;
  /** Retired: every Participate page now uses the same landscape crop. Accepted and ignored. */
  aspect?: "portrait" | "landscape";
  /** Where the crop sits on the photo (CSS object-position). */
  position?: string;
  priority?: boolean;
}) {
  return (
    <section className="bg-white pt-28 pb-14 md:pt-32 md:pb-20">
      <div className="mx-auto max-w-[1200px] px-5 md:px-6">
        <div className="grid items-center gap-8 md:grid-cols-2 md:gap-14 lg:gap-20">
          {/* Words — second on mobile, first on desktop */}
          <div className="order-2 md:order-1">
            <h1
              className="font-sans tracking-[-0.025em] text-[#000000] balance"
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
              className={`group relative overflow-hidden rounded-[var(--radius-lg,20px)] aspect-[3/1] md:aspect-[4/3]`}
              style={{
                boxShadow: "0 30px 60px -32px rgba(42, 6, 4, 0.55)",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <PhotoFill
                src={image}
                alt={imageAlt}
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={priority}
                hoverZoom={false}
                objectPosition={position}
              />
              {/* Subtle warm brand wash to tie the photo to the palette */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(230,43,30,0.05) 0%, rgba(42,6,4,0) 45%, rgba(42,6,4,0.18) 100%)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

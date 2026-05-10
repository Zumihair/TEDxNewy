import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PhotoFill from "./PhotoFill";

type Props = {
  href: string;
  external?: boolean;
  image?: string;
  imageAlt?: string;
  imageGradient?: string;
  /** Date or kicker line shown above the title (e.g. "30 April 2026"). */
  date: string;
  title: string;
  /** Optional theme/event-line shown below the title (e.g. "TEDxCooksHill"). */
  subtitle?: string;
  /** CTA label below — defaults to "View Event". */
  cta?: string;
};

/**
 * TEDxPerth-style "Past Event" card — stacked photo on top, date eyebrow,
 * white title, "View Event →" with red circle arrow at the bottom.
 * Designed for use on dark/maroon surfaces.
 */
export default function PastEventCard({
  href,
  external,
  image,
  imageAlt,
  imageGradient = "linear-gradient(135deg, #2a0604 0%, #141210 100%)",
  date,
  title,
  subtitle,
  cta = "View Event",
}: Props) {
  const linkProps = external
    ? { target: "_blank" as const, rel: "noreferrer" as const }
    : {};

  return (
    <Link
      href={href}
      {...linkProps}
      className="group block focus-visible:outline-none"
    >
      <div
        className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-lg)]"
        style={{ background: imageGradient }}
      >
        {image && (
          <PhotoFill
            src={image}
            alt={imageAlt ?? title}
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        )}
      </div>
      <div className="mt-6">
        <div className="text-[13px] text-white/70">{date}</div>
        <h3
          className="mt-2 font-sans tracking-[-0.02em] text-white balance"
          style={{
            fontSize: "clamp(1.5rem, 2.4vw, 1.85rem)",
            lineHeight: 1.1,
            fontWeight: 500,
            fontVariationSettings: '"opsz" 96',
          }}
        >
          {title}
        </h3>
        {subtitle && (
          <div className="mt-1.5 text-[13px] text-white/60">{subtitle}</div>
        )}
        <div className="mt-5 inline-flex items-center gap-3 text-[14px] font-medium text-white">
          {cta}
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e02214] text-white transition-transform duration-300 group-hover:translate-x-1 group-hover:bg-[#b91404]"
            style={{ boxShadow: "0 8px 22px rgba(224, 34, 20, 0.35)" }}
          >
            <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
          </span>
        </div>
      </div>
    </Link>
  );
}

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PhotoFill from "./PhotoFill";

export interface ParticipateCardProps {
  href: string;
  title: string;
  /** Paragraph copy for the "home" variant (the default). */
  body?: string;
  /** Short one-line description for the "panel" variant. */
  subtitle?: string | null;
  image?: string | null;
  gradient?: string | null;
  cta?: string;
  onClick?: () => void;
  /**
   * "home" (default): larger 4:5 card with a body paragraph, used on the
   * homepage and the contact page's "Apply to participate" grid.
   * "panel": compact 4:3 card with a one-line subtitle, used in the nav's
   * image-led menus.
   */
  variant?: "home" | "panel";
}

export default function ParticipateCard({
  href,
  title,
  body,
  subtitle,
  image,
  gradient,
  cta = "Learn more",
  onClick,
  variant = "home",
}: ParticipateCardProps) {
  const isPanel = variant === "panel";

  const ctaRow = (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[13.5px] font-medium text-white">{cta}</span>
      <span
        aria-hidden
        className={`flex ${isPanel ? "h-9 w-9" : "h-10 w-10"} items-center justify-center rounded-full bg-[#e02214] text-white transition-transform duration-300 group-hover:translate-x-1 group-hover:bg-[#b91404]`}
        style={{ boxShadow: "0 8px 22px rgba(224, 34, 20, 0.35)" }}
      >
        <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
      </span>
    </div>
  );

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group relative block overflow-hidden rounded-[var(--radius-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e02214]/40 ${
        isPanel ? "aspect-[4/3]" : "aspect-[4/5]"
      }`}
      style={{ background: gradient ?? undefined }}
    >
      {image && (
        <PhotoFill
          src={image}
          alt=""
          sizes="(max-width: 768px) 100vw, 33vw"
          opacity={0.65}
        />
      )}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(180deg, rgba(0,0,0,${isPanel ? 0.05 : 0.1}) 0%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.65) 100%)`,
        }}
      />
      <div
        className={`relative flex h-full flex-col justify-between ${isPanel ? "p-6" : "p-7"}`}
      >
        {isPanel ? (
          <div>
            <h3
              className="font-sans tracking-[-0.02em] text-white"
              style={{
                fontSize: "clamp(1.5rem, 2vw, 1.85rem)",
                lineHeight: 1.05,
                fontWeight: 500,
                fontVariationSettings: '"opsz" 96',
              }}
            >
              {title}
            </h3>
            {subtitle && (
              <div className="mt-1.5 text-[13px] text-white/75">
                {subtitle}
              </div>
            )}
          </div>
        ) : (
          <h3
            className="max-w-[14ch] font-sans tracking-[-0.02em] text-white balance"
            style={{
              fontSize: "clamp(1.65rem, 2.4vw, 2rem)",
              lineHeight: 1.05,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 96',
            }}
          >
            {title}
          </h3>
        )}

        {isPanel ? (
          ctaRow
        ) : (
          <div className="space-y-5">
            {body && (
              <p className="text-[14.5px] leading-[1.5] text-white/85">
                {body}
              </p>
            )}
            {ctaRow}
          </div>
        )}
      </div>
    </Link>
  );
}

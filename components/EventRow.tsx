import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PhotoFill from "./PhotoFill";

type Props = {
  href: string;
  external?: boolean;
  image?: string;
  imageAlt?: string;
  imageGradient?: string;
  label?: string;
  labelAccent?: "red" | "neutral";
  title: string;
  meta?: string;
  description?: string;
  linkLabel?: string;
};

/**
 * Minimal event row — photo left, text right. Tight vertical rhythm,
 * compact image, no card frame; rhythm comes from a hairline divider
 * supplied by the parent.
 */
export default function EventRow({
  href,
  external,
  image,
  imageAlt,
  imageGradient = "linear-gradient(135deg, #2a0604 0%, #141210 100%)",
  label,
  labelAccent = "neutral",
  title,
  meta,
  description,
  linkLabel = "Read more",
}: Props) {
  const labelColor = labelAccent === "red" ? "#e02214" : "#6b6459";
  const innerProps = external
    ? { target: "_blank" as const, rel: "noreferrer" as const }
    : {};

  return (
    <Link
      href={href}
      {...innerProps}
      className="group grid grid-cols-1 gap-5 py-7 md:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] md:gap-10 md:py-9 focus-visible:outline-none"
    >
      {/* Photo */}
      <div
        className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-md)]"
        style={{ background: imageGradient }}
      >
        {image && (
          <PhotoFill
            src={image}
            alt={imageAlt ?? title}
            sizes="(max-width: 768px) 100vw, 36vw"
            hoverZoom
          />
        )}
      </div>

      {/* Text */}
      <div className="flex flex-col justify-center gap-2.5">
        {label && (
          <div
            className="text-[10.5px] font-semibold uppercase"
            style={{ color: labelColor, letterSpacing: "0.22em" }}
          >
            {label}
          </div>
        )}
        <h3
          className="font-sans tracking-[-0.02em] text-[#141210] balance"
          style={{
            fontSize: "clamp(1.35rem, 2.2vw, 1.85rem)",
            lineHeight: 1.1,
            fontWeight: 500,
            fontVariationSettings: '"opsz" 96',
          }}
        >
          <span className="bg-gradient-to-r from-[#e02214] to-[#e02214] bg-[length:0%_1px] bg-bottom bg-no-repeat transition-[background-size] duration-500 group-hover:bg-[length:100%_1px]">
            {title}
          </span>
        </h3>
        {meta && (
          <div className="text-[14px] text-[#6b6459]">{meta}</div>
        )}
        {description && (
          <p className="max-w-[60ch] text-[14.5px] leading-[1.55] text-[#2a2521]">
            {description}
          </p>
        )}
        <div className="mt-1 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[#e02214]">
          {linkLabel}
          <ArrowUpRight
            className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            strokeWidth={2}
          />
        </div>
      </div>
    </Link>
  );
}

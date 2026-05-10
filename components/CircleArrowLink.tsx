import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  href: string;
  external?: boolean;
  children: ReactNode;
  /** Visual scale of the trailing red circle. */
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Override the surrounding text colour (e.g. "text-white" on dark bg). */
  textColor?: string;
};

/**
 * TEDxPerth-style CTA: white label text + red filled circle with a white
 * arrow inside. The whole row is the click target.
 */
export default function CircleArrowLink({
  href,
  external,
  children,
  size = "md",
  className,
  textColor = "text-white",
}: Props) {
  const linkProps = external
    ? { target: "_blank" as const, rel: "noreferrer" as const }
    : {};

  const dim =
    size === "lg" ? "h-12 w-12" : size === "sm" ? "h-9 w-9" : "h-10 w-10";
  const arrow =
    size === "lg" ? "h-5 w-5" : size === "sm" ? "h-4 w-4" : "h-4 w-4";
  const fontSize =
    size === "lg" ? "text-[16px]" : size === "sm" ? "text-[13px]" : "text-[14.5px]";

  return (
    <Link
      href={href}
      {...linkProps}
      className={`group inline-flex items-center gap-3.5 ${textColor} focus-visible:outline-none ${
        className ?? ""
      }`}
    >
      <span className={`${fontSize} font-medium`}>{children}</span>
      <span
        aria-hidden
        className={`${dim} flex items-center justify-center rounded-full bg-[#e02214] text-white transition-transform duration-300 group-hover:translate-x-1 group-hover:bg-[#b91404]`}
        style={{ boxShadow: "0 8px 26px rgba(224, 34, 20, 0.35)" }}
      >
        <ArrowRight className={arrow} strokeWidth={2.25} />
      </span>
    </Link>
  );
}

import { SOCIAL_BY_KEY } from "@/lib/social-catalogue";

/** One network's glyph from the social catalogue, drawn in the current text colour. */
export function SocialIcon({ name, size = 16, className }: { name: string; size?: number; className?: string }) {
  const def = SOCIAL_BY_KEY[name];
  if (!def) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
      fill={def.stroke ? "none" : "currentColor"}
      stroke={def.stroke ? "currentColor" : undefined}
      strokeWidth={def.stroke ? 2 : undefined}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={def.path} />
    </svg>
  );
}

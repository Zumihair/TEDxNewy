import {
  SIGNAL_LINKS_PARTNERS,
  type SignalLinksPartner,
} from "@/lib/signal-links-partners";

/**
 * The partner lockup from the `/signal/links` Partners modal, lifted out so
 * `/signal` and `/sponsors` show exactly the same arrangement: University of
 * Newcastle and Henderson side by side and larger, a divider, then the
 * supporting four in a 2x2 grid. Every dimension is the modal's own number
 * multiplied by `scale`, so the proportions between logos never drift from
 * the links page (including each partner's `heightScale`).
 *
 * `variant="dark"` is for the dark Signal pages (logos flattened to white);
 * `"light"` is for the cream `/sponsors` page (flattened to black, and Sketch
 * It Live swaps to its dark-on-white file).
 */
export default function PartnerTiers({
  variant,
  scale = 1,
}: {
  variant: "dark" | "light";
  scale?: number;
}) {
  const primary = SIGNAL_LINKS_PARTNERS.filter((p) => p.tier === "primary");
  const supporting = SIGNAL_LINKS_PARTNERS.filter((p) => p.tier === "supporting");
  const divider = variant === "dark" ? "border-white/10" : "border-black/10";

  return (
    <div>
      <div
        className="mx-auto grid grid-cols-2 items-center"
        style={{ maxWidth: 380 * scale, columnGap: 32 * scale }}
      >
        {primary.map((p) => (
          <a
            key={p.name}
            href={p.websiteUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`Visit ${p.name}`}
            className="flex items-center justify-center transition-opacity hover:opacity-100"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc(p, variant)}
              alt={p.name}
              style={{
                maxHeight: 40 * scale,
                // Henderson is width-limited by its column, so its scale-down
                // has to cap width, not height.
                maxWidth: `${(p.heightScale ?? 1) * 100}%`,
              }}
              className={`h-auto w-auto object-contain ${logoClass(p, variant)}`}
            />
          </a>
        ))}
      </div>
      <div
        className={`mx-auto border-t ${divider}`}
        style={{ maxWidth: 420 * scale, marginBlock: 32 * scale }}
      />
      <div
        className="mx-auto grid grid-cols-2 place-items-center"
        style={{ maxWidth: 360 * scale, columnGap: 40 * scale, rowGap: 32 * scale }}
      >
        {supporting.map((p) => {
          const height = 32 * scale * (p.heightScale ?? 1);
          return (
            <a
              key={p.name}
              href={p.websiteUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Visit ${p.name}`}
              className="flex max-w-full items-center justify-center transition-opacity hover:opacity-100"
            >
              <div className="flex max-w-full items-center justify-center" style={{ height }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoSrc(p, variant)}
                  alt={p.name}
                  style={{ maxWidth: `min(${height * 6.9}px, 100%)` }}
                  className={`h-full w-auto object-contain ${logoClass(p, variant)}`}
                />
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function logoSrc(p: SignalLinksPartner, variant: "dark" | "light") {
  return variant === "light" && p.lightLogo ? p.lightLogo : p.logo;
}

function logoClass(p: SignalLinksPartner, variant: "dark" | "light") {
  if (variant === "dark") {
    return `opacity-80 ${p.keepColor ? "" : "brightness-0 invert"}`;
  }
  return p.lightLogo ? "mix-blend-multiply" : "opacity-90 brightness-0";
}

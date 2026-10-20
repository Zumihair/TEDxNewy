import { Button } from "@/components/ds";

export const metadata = {
  title: "Page not found · TEDxNewy",
  robots: { index: false, follow: false },
};

const X_MASK = 'url("/brand/lockups/TEDxNewy-X-white.png")';

const LINKS = [
  { href: "/talks", label: "Talks" },
  { href: "/events", label: "Events" },
  { href: "/speak", label: "Speak" },
  { href: "/contact", label: "Contact" },
];

/**
 * The 404. White page (the header reads ink here, since it can't know which dark
 * hero a missing path would have had), the TEDx X as the one big red shape,
 * cropped by the right edge like the ghost X on our slides.
 */
export default function NotFound() {
  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-white pt-28 pb-20">
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-18%] top-1/2 aspect-[948/929] w-[min(92vw,820px)] -translate-y-1/2 opacity-[0.1] md:right-[-9%] md:opacity-100"
        style={{
          background: "var(--red)",
          WebkitMaskImage: X_MASK,
          maskImage: X_MASK,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskSize: "contain",
          maskSize: "contain",
        }}
      />

      <div className="relative mx-auto w-full max-w-[1240px] px-5 md:px-6">
        <div className="max-w-[640px]">
          <h1
            className="font-sans tracking-[-0.025em] text-[#000000] balance"
            style={{
              fontSize: "clamp(2.75rem, 7vw, 5.25rem)",
              lineHeight: 0.98,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            That idea isn&rsquo;t on this stage.
          </h1>
          <p className="mt-7 max-w-[46ch] text-[17px] leading-[1.65] text-[#2a2521] md:text-[18px]">
            The page you&rsquo;re after doesn&rsquo;t exist, or has wandered
            off to the green room. Let&rsquo;s get you back to the auditorium.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button href="/" variant="primary" icon="arrow-right" className="tx-btn--auto">
              Back to home
            </Button>
            <Button href="/talks" variant="secondary" className="tx-btn--auto">
              Watch past talks
            </Button>
          </div>

          <p className="mt-12 text-[14px] text-[#6b6459]">
            Or try:{" "}
            {LINKS.map((l, i) => (
              <span key={l.href}>
                <a
                  href={l.href}
                  className="font-medium text-[#000000] underline decoration-[rgba(0,0,0,0.25)] underline-offset-4 transition-colors hover:text-[#b91404] hover:decoration-current"
                >
                  {l.label}
                </a>
                {i < LINKS.length - 1 ? " · " : ""}
              </span>
            ))}
          </p>
          <p className="mt-2 text-[14px] text-[#6b6459]">Error 404 · Page not found</p>
        </div>
      </div>
    </section>
  );
}

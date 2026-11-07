import type { CSSProperties } from "react";
import PhotoFill from "@/components/PhotoFill";

/**
 * The "Activating partners" thank-you on /signal: the activation photos from
 * the Signal newsletter laid over each other as a collage, with every partner
 * name stacked, static and linked over the top.
 *
 * Desktop is a wide, short collage; on a phone the same photos run down a tall
 * column you scroll through, with the names spread down it. The positions are
 * CSS variables (--d* desktop, --m* mobile) so the layout is plain CSS with no
 * client JS. Nothing here animates.
 */

type Shot = {
  src: string;
  alt: string;
  /** Desktop: left, top, width as % of the collage; rotation. */
  d: [string, string, string, string];
  /** Mobile: the same, in the tall column. */
  m: [string, string, string, string];
};

const DIR = "/images/newsletter";

const SHOTS: Shot[] = [
  {
    src: `${DIR}/signal-partner-henderson.jpg`,
    alt: "Henderson merchandise on the Henderson stall at Signal",
    d: ["0%", "9%", "27%", "-4deg"],
    m: ["2%", "0%", "70%", "-3deg"],
  },
  {
    src: `${DIR}/signal-partner-ink-and-snow.jpg`,
    alt: "An Ink and Snow artist painting a live watercolour portrait",
    d: ["19%", "46%", "26%", "3deg"],
    m: ["28%", "16%", "68%", "3deg"],
  },
  {
    src: `${DIR}/signal-partner-sketch-it-live.jpg`,
    alt: "A Sketch It Live graphic recording of Signal on a desk",
    d: ["36%", "0%", "28%", "-2deg"],
    m: ["4%", "32%", "72%", "-2deg"],
  },
  {
    src: `${DIR}/signal-partner-talk2mebro.jpg`,
    alt: "Talk2MeBro merchandise on the Talk2MeBro stand",
    d: ["55%", "44%", "25%", "4deg"],
    m: ["26%", "48%", "68%", "4deg"],
  },
  {
    src: `${DIR}/signal-partner-akrue.jpg`,
    alt: "Akrue flyers and stickers on the Akrue stall",
    d: ["70%", "3%", "26%", "-3deg"],
    m: ["3%", "64%", "70%", "-3deg"],
  },
  {
    src: `${DIR}/signal-partner-inhouse-plants.jpg`,
    alt: "Guests potting plants at the InHouse Plants activation",
    d: ["82%", "50%", "18%", "2deg"],
    m: ["29%", "80%", "68%", "2deg"],
  },
];

export default function ActivatingCollage({
  partners,
}: {
  partners: { name: string; url?: string }[];
}) {
  return (
    <div className="relative mx-auto aspect-[1/3.76] w-full max-w-[1100px] overflow-hidden rounded-[var(--radius-md)] bg-[#1a0a08] md:aspect-[1100/580]">
      {SHOTS.map((s) => (
        <div
          key={s.src}
          className="absolute left-(--ml) top-(--mt) aspect-square w-(--mw) rotate-(--mr) overflow-hidden rounded-[10px] shadow-[0_14px_40px_rgba(0,0,0,0.45)] md:left-(--dl) md:top-(--dt) md:w-(--dw) md:rotate-(--dr)"
          style={
            {
              "--dl": s.d[0],
              "--dt": s.d[1],
              "--dw": s.d[2],
              "--dr": s.d[3],
              "--ml": s.m[0],
              "--mt": s.m[1],
              "--mw": s.m[2],
              "--mr": s.m[3],
            } as CSSProperties
          }
        >
          <PhotoFill
            src={s.src}
            alt={s.alt}
            sizes="(min-width: 768px) 30vw, 70vw"
            hoverZoom={false}
          />
        </div>
      ))}

      {/* Dark wash so white names read over any photo. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(20,6,4,0.62)_0%,rgba(20,6,4,0.38)_100%)]"
      />

      <ul className="absolute inset-0 flex flex-col items-center justify-evenly px-4 py-[5%] text-center md:justify-center md:gap-[0.5vw] md:py-0">
        {partners.map((p) => (
          <li key={p.name}>
            {p.url ? (
              <a
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className={`${NAME} underline-offset-[6px] hover:text-[#ffb3a8] hover:underline focus-visible:underline`}
              >
                {p.name}
              </a>
            ) : (
              <span className={NAME}>{p.name}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

const NAME =
  "font-sans font-medium tracking-[-0.02em] text-white text-[clamp(22px,7vw,30px)] leading-[1.1] md:text-[clamp(16px,3vw,36px)] [text-shadow:0_2px_18px_rgba(0,0,0,0.55)]";

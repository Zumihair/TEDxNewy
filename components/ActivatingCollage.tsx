import type { CSSProperties } from "react";
import PhotoFill from "@/components/PhotoFill";

/**
 * The "Activating partners" thank-you on /signal: one photo per partner, the
 * same pictures used in the Signal photos newsletter, laid over each other as
 * a collage, with every partner name stacked, static and linked over the top.
 *
 * Desktop is a wide collage in two staggered rows. On a phone the same photos
 * run down a tall column you scroll through, each name sitting over its own
 * photo. Positions are CSS variables (--d* desktop, --m* mobile), so this is
 * plain CSS with no client JS. Nothing here animates.
 *
 * Photos are centre-cropped squares in /public/images/signal/partners, made
 * from the gallery photos the newsletter uses. Partners are matched to photos
 * by name, in the order they are listed (SIGNAL_ACTIVATING_*).
 */

const DIR = "/images/signal/partners";

const PHOTOS: Record<string, { file: string; alt: string }> = {
  Henderson: {
    file: "henderson",
    alt: "Henderson merchandise on the Henderson stall at Signal",
  },
  "Sketch It Live": {
    file: "sketch-it-live",
    alt: "A Sketch It Live graphic recording of Signal on a desk",
  },
  "InHouse Plants": {
    file: "in-house-plants",
    alt: "The TEDxNewy stage with the plants provided by InHouse Plants",
  },
  Talk2MeBro: {
    file: "talk2mebro",
    alt: "Talk2MeBro merchandise on the Talk2MeBro stand",
  },
  "Ink and Snow": {
    file: "ink-and-snow",
    alt: "An Ink and Snow artist painting a live watercolour portrait",
  },
  "New Artists Collective": {
    file: "new-artists-collective",
    alt: "The New Artists Collective sign on their table at Signal",
  },
  Akrue: {
    file: "akrue",
    alt: "Akrue flyers and stickers on the Akrue stall",
  },
  "The Bridge Project": {
    file: "the-bridge-project",
    alt: "Two guests talking over a brochure at The Bridge Project stall",
  },
  "Lefthand Design": {
    file: "lefthand-design",
    alt: "Guests potting plants at the Lefthand Design activation",
  },
  Bandigon: {
    file: "bandigon",
    alt: "The Bandigon stall at Signal",
  },
  Cherry: {
    file: "cherry",
    alt: "A guest picking up coasters at the Cherry stall",
  },
  Meandrix: {
    file: "meandrix",
    alt: "The Meandrix sensor display at Signal",
  },
};

/** left, top, width (% of the collage) and rotation, per photo in list order. */
type Pos = [string, string, string, string];

const DESKTOP: Pos[] = [
  ["0%", "3%", "20%", "-4deg"],
  ["16%", "17%", "19%", "3deg"],
  ["32%", "1%", "20%", "-2deg"],
  ["49%", "15%", "19%", "4deg"],
  ["65%", "2%", "20%", "-3deg"],
  ["81%", "16%", "19%", "2deg"],
  ["4%", "50%", "19%", "3deg"],
  ["20%", "38%", "20%", "-3deg"],
  ["36%", "52%", "19%", "4deg"],
  ["53%", "40%", "20%", "-2deg"],
  ["69%", "53%", "19%", "3deg"],
  ["82%", "40%", "18%", "-4deg"],
];

/** One column, alternating sides, each photo overlapping the one above. */
const MOBILE: Pos[] = Array.from({ length: 12 }, (_, i) => [
  i % 2 === 0 ? "3%" : "33%",
  `${(i * 7.7).toFixed(1)}%`,
  "64%",
  `${i % 2 === 0 ? -3 : 3}deg`,
]);

export default function ActivatingCollage({
  partners,
}: {
  partners: { name: string; url?: string }[];
}) {
  const shots = partners
    .map((p, i) => ({ p, i, photo: PHOTOS[p.name] }))
    .filter((s) => s.photo);

  return (
    <div className="relative mx-auto aspect-[1/5.8] w-full max-w-[1100px] overflow-hidden rounded-[var(--radius-md)] bg-[#1a0a08] md:aspect-[1100/640]">
      {shots.map(({ p, i, photo }) => {
        const d = DESKTOP[i % DESKTOP.length];
        const m = MOBILE[i % MOBILE.length];
        return (
          <div
            key={p.name}
            className="absolute left-(--ml) top-(--mt) aspect-square w-(--mw) rotate-(--mr) overflow-hidden rounded-[10px] shadow-[0_14px_40px_rgba(0,0,0,0.45)] md:left-(--dl) md:top-(--dt) md:w-(--dw) md:rotate-(--dr)"
            style={
              {
                "--dl": d[0],
                "--dt": d[1],
                "--dw": d[2],
                "--dr": d[3],
                "--ml": m[0],
                "--mt": m[1],
                "--mw": m[2],
                "--mr": m[3],
              } as CSSProperties
            }
          >
            <PhotoFill
              src={`${DIR}/${photo.file}.jpg`}
              alt={photo.alt}
              sizes="(min-width: 768px) 22vw, 64vw"
              hoverZoom={false}
            />
          </div>
        );
      })}

      {/* Dark wash so white names read over any photo. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(20,6,4,0.62)_0%,rgba(20,6,4,0.38)_100%)]"
      />

      {/* Phone: names spread so each sits over its own photo. Desktop: one
          centred stack. */}
      <ul className="absolute inset-x-0 top-[4.7%] bottom-[8.7%] flex flex-col items-center justify-between px-4 text-center md:inset-0 md:justify-center md:gap-[0.5vw] md:px-0">
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

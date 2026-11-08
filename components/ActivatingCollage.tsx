import type { CSSProperties } from "react";
import PhotoFill from "@/components/PhotoFill";

/**
 * The "Activating partners" thank-you on /signal: one photo per partner, the
 * same pictures used in the Signal photos newsletter, laid over each other as
 * a collage. Each photo is a tile with the partner's name on it, and the whole
 * tile links to the partner's website.
 *
 * Desktop is a wide collage in two staggered rows. On a phone the same tiles
 * run down a tall column you scroll through. Later tiles sit over earlier
 * ones, so names live at the top left of a tile where nothing covers them.
 * Positions are CSS variables (--d* desktop, --m* mobile), so this is plain
 * CSS with no client JS.
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
  "In House Plants": {
    file: "in-house-plants",
    alt: "The TEDxNewy stage with the plants provided by In House Plants",
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
  ["0%", "3.4%", "20%", "-4deg"],
  ["16%", "19.4%", "19%", "3deg"],
  ["32%", "1.1%", "20%", "-2deg"],
  ["49%", "17.1%", "19%", "4deg"],
  ["65%", "2.3%", "20%", "-3deg"],
  ["81%", "18.3%", "19%", "2deg"],
  ["4%", "57.1%", "19%", "3deg"],
  ["20%", "43.4%", "20%", "-3deg"],
  ["36%", "59.4%", "19%", "4deg"],
  ["53%", "45.7%", "20%", "-2deg"],
  ["69%", "60.6%", "19%", "3deg"],
  ["82%", "45.7%", "18%", "-4deg"],
];

/** One column, alternating sides, each photo overlapping the one above. */
const MOBILE: Pos[] = Array.from({ length: 12 }, (_, i) => [
  i % 2 === 0 ? "3%" : "33%",
  `${(i * 8).toFixed(1)}%`,
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
    <div className="relative mx-auto aspect-[1/5.5] w-full max-w-[1100px] md:aspect-[1100/560]">
      {shots.map(({ p, i, photo }) => {
        const d = DESKTOP[i % DESKTOP.length];
        const m = MOBILE[i % MOBILE.length];
        const style = {
          "--dl": d[0],
          "--dt": d[1],
          "--dw": d[2],
          "--dr": d[3],
          "--ml": m[0],
          "--mt": m[1],
          "--mw": m[2],
          "--mr": m[3],
          "--z": i + 1,
        } as CSSProperties;
        const tile =
          "group absolute left-(--ml) top-(--mt) z-(--z) block aspect-square w-(--mw) rotate-(--mr) overflow-hidden rounded-[10px] bg-[#1a0a08] shadow-[0_14px_40px_rgba(0,0,0,0.4)] transition-[scale,box-shadow] duration-300 md:left-(--dl) md:top-(--dt) md:w-(--dw) md:rotate-(--dr)";
        const inner = (
          <>
            <PhotoFill
              src={`${DIR}/${photo.file}.jpg`}
              alt=""
              sizes="(min-width: 768px) 22vw, 64vw"
              hoverZoom={false}
            />
            {/* Name on the photo, top left, over a soft dark fade. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-[55%] bg-gradient-to-b from-black/70 via-black/30 to-transparent"
            />
            <span className="absolute left-3 top-3 max-w-[78%] font-sans text-[clamp(18px,5.4vw,22px)] font-medium leading-[1.1] tracking-[-0.02em] text-white [text-shadow:0_1px_12px_rgba(0,0,0,0.5)] md:left-[7%] md:top-[6%] md:text-[clamp(14px,1.75vw,22px)]">
              {p.name}
            </span>
          </>
        );
        return p.url ? (
          <a
            key={p.name}
            href={p.url}
            target="_blank"
            rel="noreferrer"
            style={style}
            className={`${tile} hover:z-50 hover:scale-[1.04] hover:shadow-[0_18px_50px_rgba(0,0,0,0.55)] focus-visible:z-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`}
          >
            {inner}
          </a>
        ) : (
          <div key={p.name} style={style} className={tile}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}

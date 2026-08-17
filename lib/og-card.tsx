import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/**
 * One social card design, shared by every `opengraph-image.tsx` on the site.
 *
 * The look: the page's own photography full bleed, darkened under a maroon
 * scrim so white type always clears it, the TEDxNewy logo in the top left, and
 * a headline block sitting on the bottom edge. A page with no photograph gets
 * the brand red gradient instead of a picture and is otherwise identical, so
 * the set reads as one family however it is assembled.
 *
 * Everything here runs server-side at request/build time, which is what lets
 * us use sharp (see `loadImage`) rather than trusting the rasteriser with
 * whatever format the source file happens to be in.
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const RED = "#e02214";
const CREAM = "#f4efe6";

export type OgCard = {
  /** Small uppercase line above the headline. */
  eyebrow?: string;
  /**
   * The headline, and the only prose on the card. There is deliberately no
   * description line: the card carries the hook, and the platform prints the
   * page's own `og:description` underneath the image anyway, so repeating it
   * inside the picture was saying everything twice.
   */
  title: string;
  /** Small details along the bottom (date, venue, counts). */
  meta?: string[];
  /**
   * Background photo: a repo path (`/images/...`), an absolute URL (Blob,
   * Supabase), or nothing for the brand gradient.
   */
  image?: string | null;
  /**
   * Which part of the photo to keep when cropping to 1200x630.
   *
   * Defaults to `top`, because the headline block sits on the bottom edge and
   * faces are usually in the upper half, so keeping the top is what stops a
   * portrait being decapitated. Set `centre` or `bottom` when the subject is
   * lower in the frame. Avoid sharp's `attention` strategy here: it picks a
   * different region per image and once cropped a crew photo down to a torso.
   */
  crop?: "top" | "centre" | "bottom";
};

/**
 * Normalises any source image to a JPEG data URI sized for the card.
 *
 * Two reasons this goes through sharp rather than handing the rasteriser a
 * URL. First, most of our imagery is WebP, which the OG rasteriser does not
 * reliably decode: passing it straight through yields a blank panel with no
 * error. Second, event photos are 2400px Blob originals, so resizing here
 * keeps the generated card small and fast.
 *
 * Returns null if the image cannot be read, and the caller falls back to the
 * gradient. A missing photo must never fail the whole card.
 */
const CROP_POSITION = {
  top: "top",
  centre: "centre",
  bottom: "bottom",
} as const;

async function loadImage(
  src: string,
  crop: NonNullable<OgCard["crop"]> = "top",
): Promise<string | null> {
  try {
    let input: Buffer;
    if (/^https?:\/\//.test(src)) {
      const res = await fetch(src);
      if (!res.ok) return null;
      input = Buffer.from(await res.arrayBuffer());
    } else {
      input = await readFile(path.join(process.cwd(), "public", src.replace(/^\//, "")));
    }
    const out = await sharp(input)
      .resize(OG_SIZE.width, OG_SIZE.height, {
        fit: "cover",
        position: CROP_POSITION[crop],
      })
      .jpeg({ quality: 78 })
      .toBuffer();
    return `data:image/jpeg;base64,${out.toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * The logo, inlined as a data URI, in the variant that can actually be read.
 *
 * `tedxnewy-white.png` keeps TEDx in brand red with a white "Newy", which
 * looks right over dark photography but goes invisible on the red gradient
 * we use when a page has no photo. The mono lockup is solid white and exists
 * for exactly that case. So: red-on-photo, white-on-red.
 */
const LOGOS = {
  photo: { file: "brand/tedxnewy-white.png", width: 218, height: 58 },
  gradient: { file: "brand/lockups/TEDxNewy-Standard-mono.png", width: 226, height: 58 },
} as const;

async function loadLogo(variant: keyof typeof LOGOS): Promise<string | null> {
  try {
    const buf = await readFile(
      path.join(process.cwd(), "public", ...LOGOS[variant].file.split("/")),
    );
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

type LoadedFont = { name: string; data: ArrayBuffer; weight: 500 | 600 | 800; style: "normal" };

/**
 * Plus Jakarta Sans, not Bricolage Grotesque, and that is deliberate.
 *
 * Bricolage is the site's display face, but the only file of it that exists
 * (`public/fonts/BricolageGrotesque.ttf`, used by the report renderer) is a
 * VARIABLE font, and the OG rasteriser cannot parse it: it throws
 * `Cannot read properties of undefined (reading '256')` from inside its font
 * parser, which looks like a bug in our code and is not. Google Fonts only
 * publishes Bricolage as that same variable file, so there is no static
 * instance to drop in. Don't retry this without a genuinely static
 * Bricolage TTF to test against.
 *
 * Plus Jakarta Sans is the right fallback rather than an arbitrary one: it is
 * already the face `lib/brandkit-canvas.ts` uses for every generated brand
 * asset, so the social cards match the rest of our generated collateral. The
 * cards it replaced used Helvetica, so this is a step towards the brand
 * either way.
 */
let fontCache: LoadedFont[] | null = null;
async function loadFonts(): Promise<LoadedFont[]> {
  if (fontCache) return fontCache;
  const wanted: [500 | 600 | 800, string][] = [
    [500, "PlusJakartaSans-Medium.ttf"],
    [600, "PlusJakartaSans-SemiBold.ttf"],
    [800, "PlusJakartaSans-ExtraBold.ttf"],
  ];
  const loaded = await Promise.all(
    wanted.map(async ([weight, file]) => {
      try {
        const buf = await readFile(path.join(process.cwd(), "public", "fonts", file));
        const data = buf.buffer.slice(
          buf.byteOffset,
          buf.byteOffset + buf.byteLength,
        ) as ArrayBuffer;
        return { name: "Jakarta", data, weight, style: "normal" } as LoadedFont;
      } catch {
        return null;
      }
    }),
  );
  fontCache = loaded.filter((f): f is LoadedFont => f !== null);
  return fontCache;
}

/**
 * Headline size steps down as the title gets longer, so a four-word title
 * fills the card and a long one still fits on three lines without being
 * clipped. Tuned against the real titles in `lib/og-content.ts`, and set
 * larger than it needs to be for legibility at thumbnail size: the headline
 * is the only prose on the card, so it can take the whole bottom third.
 */
function titleSize(title: string): number {
  if (title.length <= 18) return 112;
  if (title.length <= 32) return 96;
  if (title.length <= 52) return 78;
  return 64;
}

export async function renderOgCard(card: OgCard): Promise<ImageResponse> {
  const photo = card.image ? await loadImage(card.image, card.crop) : null;
  const logoVariant = photo ? "photo" : "gradient";
  const [logo, fonts] = await Promise.all([loadLogo(logoVariant), loadFonts()]);
  const font = fonts.length > 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: photo
            ? "#2a0604"
            : "radial-gradient(circle at 22% 12%, #ff3626 0%, #e11905 22%, #b91404 46%, #2a0604 84%)",
          fontFamily: font ? "Jakarta" : "Helvetica, Arial, sans-serif",
        }}
      >
        {photo && (
          <img
            src={photo}
            width={OG_SIZE.width}
            height={OG_SIZE.height}
            style={{ position: "absolute", top: 0, left: 0 }}
          />
        )}

        {/* Scrim. Weighted to the bottom, where the type sits, but it has to
            start darkening by the middle: with no description line the
            headline is set large enough to wrap to two lines, and the upper
            line lands around 55% where a bright photo would otherwise eat it.
            Maroon rather than black so it reads as brand, not as a dimmed
            photo. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            background: photo
              ? "linear-gradient(180deg, rgba(20,6,4,0.28) 0%, rgba(20,6,4,0.32) 30%, rgba(20,6,4,0.62) 55%, rgba(20,6,4,0.88) 78%, rgba(20,6,4,0.96) 100%)"
              : "linear-gradient(180deg, rgba(20,6,4,0.00) 55%, rgba(20,6,4,0.35) 100%)",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 64,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            {logo ? (
              <img
                src={logo}
                width={LOGOS[logoVariant].width}
                height={LOGOS[logoVariant].height}
              />
            ) : (
              <div style={{ display: "flex", fontSize: 44, fontWeight: 800, color: "#fff" }}>
                TEDxNewy
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {card.eyebrow && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    width: 44,
                    height: 5,
                    background: RED,
                    marginRight: 18,
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    fontSize: 21,
                    fontWeight: 600,
                    letterSpacing: 4,
                    textTransform: "uppercase",
                    color: CREAM,
                  }}
                >
                  {card.eyebrow}
                </div>
              </div>
            )}

            <div
              style={{
                display: "flex",
                fontSize: titleSize(card.title),
                fontWeight: 800,
                letterSpacing: -2.5,
                lineHeight: 1.02,
                color: "#ffffff",
                maxWidth: 1010,
              }}
            >
              {card.title}
            </div>

            {card.meta && card.meta.length > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginTop: 26,
                  fontSize: 21,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.82)",
                }}
              >
                {card.meta.map((m, i) => (
                  <div key={m} style={{ display: "flex", alignItems: "center" }}>
                    {i > 0 && (
                      <div
                        style={{
                          display: "flex",
                          margin: "0 14px",
                          color: "rgba(255,255,255,0.4)",
                        }}
                      >
                        ·
                      </div>
                    )}
                    <div style={{ display: "flex" }}>{m}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: fonts.length > 0 ? fonts : undefined,
    },
  );
}

import { NextResponse } from "next/server";
import sharp from "sharp";
import { CROPPABLE_SRC } from "@/lib/newsletter-blocks";

/**
 * Slack carousel card image: the whole picture, uncropped, centred on a
 * blurred, darkened copy of itself. Slack crops every card hero image to a
 * 4:3 landscape frame (no size setting exists), so a portrait post image would
 * lose its top and bottom. This makes a 4:3 canvas first so nothing is cut.
 *
 * Public on purpose (Slack fetches it). Only accepts images from our own
 * Supabase public storage or tedxnewy.com.au/images, so it is not an open
 * image proxy. On any failure it redirects to the original image.
 */
export const runtime = "nodejs";

const OWN_IMAGES = /^https:\/\/tedxnewy\.com\.au\/images\//;
const W = 1200;
const H = 900;

export async function GET(req: Request) {
  const src = new URL(req.url).searchParams.get("src") ?? "";
  if (!CROPPABLE_SRC.test(src) && !OWN_IMAGES.test(src)) {
    return new NextResponse("Bad request", { status: 400 });
  }
  try {
    const upstream = await fetch(src);
    if (!upstream.ok) return NextResponse.redirect(src, 302);
    const input = Buffer.from(await upstream.arrayBuffer());

    const background = await sharp(input)
      .rotate()
      .resize(W, H, { fit: "cover", position: "centre" })
      .blur(40)
      .modulate({ brightness: 0.65 })
      .toBuffer();
    const foreground = await sharp(input)
      .rotate()
      .resize(W, H, { fit: "inside", withoutEnlargement: false })
      .toBuffer();

    const out = await sharp(background)
      .composite([{ input: foreground, gravity: "centre" }])
      .jpeg({ quality: 84, mozjpeg: true })
      .toBuffer();
    return new NextResponse(new Uint8Array(out), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=604800, s-maxage=2592000",
      },
    });
  } catch {
    return NextResponse.redirect(src, 302);
  }
}

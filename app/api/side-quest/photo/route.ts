import { NextResponse, type NextRequest } from "next/server";
import { put } from "@vercel/blob";
import sharp from "sharp";
import { getAdminSupabase } from "@/lib/supabase-admin";
import {
  awardCompletion,
  buildMe,
  getChallenge,
  getSession,
  rateLimited,
} from "@/lib/side-quest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Sharp plus two Blob uploads on a busy night.
export const maxDuration = 30;

const NO_STORE = { "Cache-Control": "no-store" };
/** Vercel's function body limit is 4.5MB, the browser compresses well below. */
const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Upload a photo for a CAPTURE challenge. Multipart with `challengeId` and
 * `file`. The image is decoded and re-encoded by sharp (which also proves it
 * is a real image and strips location metadata), stored on Vercel Blob with a
 * thumbnail, and the challenge is awarded idempotently. One photo per
 * challenge per session. Photos are approved on upload; an admin can hide
 * them. Points are never revoked by hiding or deleting a photo.
 */
export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json(
      { error: "no_session" },
      { status: 401, headers: NO_STORE },
    );
  }
  if (!session.photo_notice_at) {
    return NextResponse.json(
      { error: "notice_required" },
      { status: 403, headers: NO_STORE },
    );
  }
  if (rateLimited(`photo:${session.id}`, 10, 60 * 1000)) {
    return NextResponse.json(
      { error: "Slow down a little." },
      { status: 429, headers: NO_STORE },
    );
  }
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Photo uploads are not available right now." },
      { status: 503, headers: NO_STORE },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "That upload did not arrive. Try again." },
      { status: 400, headers: NO_STORE },
    );
  }
  const challengeId = String(form.get("challengeId") ?? "");
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Add a photo first." },
      { status: 400, headers: NO_STORE },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "That photo is too big. Try again." },
      { status: 413, headers: NO_STORE },
    );
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Use a JPEG, PNG or WebP photo." },
      { status: 415, headers: NO_STORE },
    );
  }

  const challenge = await getChallenge(challengeId);
  if (!challenge || !challenge.active || challenge.type !== "photo") {
    return NextResponse.json(
      { error: "That quest is not available." },
      { status: 404, headers: NO_STORE },
    );
  }

  const db = getAdminSupabase();
  const { data: existing } = await db
    .from("side_quest_photos")
    .select("id")
    .eq("session_id", session.id)
    .eq("challenge_id", challenge.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: "You already added a photo for this quest." },
      { status: 409, headers: NO_STORE },
    );
  }

  let full: Buffer;
  let thumb: Buffer;
  try {
    const input = Buffer.from(await file.arrayBuffer());
    const base = sharp(input, { failOn: "error" }).rotate();
    [full, thumb] = await Promise.all([
      base
        .clone()
        .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer(),
      base
        .clone()
        .resize({ width: 480, height: 480, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 72, mozjpeg: true })
        .toBuffer(),
    ]);
  } catch {
    return NextResponse.json(
      { error: "That does not look like a photo. Try another." },
      { status: 400, headers: NO_STORE },
    );
  }

  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const dir = `side-quest/${session.id}`;
  let url: string;
  let thumbUrl: string;
  try {
    const [a, b] = await Promise.all([
      put(`${dir}/${stamp}.jpg`, full, {
        access: "public",
        addRandomSuffix: true,
        contentType: "image/jpeg",
        cacheControlMaxAge: 60 * 60 * 24 * 30,
        token,
      }),
      put(`${dir}/${stamp}-thumb.jpg`, thumb, {
        access: "public",
        addRandomSuffix: true,
        contentType: "image/jpeg",
        cacheControlMaxAge: 60 * 60 * 24 * 30,
        token,
      }),
    ]);
    url = a.url;
    thumbUrl = b.url;
  } catch (e) {
    console.error("[side-quest/photo] blob put failed", e);
    return NextResponse.json(
      { error: "The upload failed. Try again." },
      { status: 502, headers: NO_STORE },
    );
  }

  const { error: insertError } = await db.from("side_quest_photos").insert({
    session_id: session.id,
    challenge_id: challenge.id,
    url,
    thumb_url: thumbUrl,
  });
  // A unique violation means a parallel upload won the race. Treat the quest
  // as done either way, the award below is idempotent.
  if (insertError && insertError.code !== "23505") {
    console.error("[side-quest/photo] insert failed", insertError);
    return NextResponse.json(
      { error: "Something went wrong saving that. Try again." },
      { status: 500, headers: NO_STORE },
    );
  }

  const { awarded, session: fresh } = await awardCompletion(
    session,
    challenge,
  );
  return NextResponse.json(
    {
      awarded,
      points: challenge.points,
      crossedPrizeLine: awarded && fresh.prize_eligible && !session.prize_eligible,
      me: await buildMe(fresh),
    },
    { headers: NO_STORE },
  );
}

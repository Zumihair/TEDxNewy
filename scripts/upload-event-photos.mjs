// Processes a batch of raw event photos and uploads them to Vercel Blob.
//
// Usage:
//   node --env-file=.env.local scripts/upload-event-photos.mjs <event-slug>
//
// Reads every image in raw-event-photos/<event-slug>/, sorted by filename.
// For each one it writes a display-size WebP (max 2400px wide) and a grid
// thumbnail (max 640px wide), uploads both to Vercel Blob under
// event-photos/<event-slug>/, then prints a ready-to-paste SQL block that
// catalogues them in the event_photos table (also written to
// raw-event-photos/<event-slug>/catalogue.sql). Paste that block into a
// fresh Supabase SQL editor tab to publish the gallery, per this repo's
// usual hand-applied migration workflow.
//
// Safe to re-run on the same folder: uploads overwrite by pathname, so
// nothing gets duplicated on Blob. Re-running does generate a fresh SQL
// block though, so only paste it once per batch.

import { readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { put } from "@vercel/blob";

const DISPLAY_WIDTH = 2400;
const DISPLAY_QUALITY = 82;
const THUMB_WIDTH = 640;
const THUMB_QUALITY = 75;
const EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Usage: node --env-file=.env.local scripts/upload-event-photos.mjs <event-slug>");
    process.exit(1);
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error(
      "BLOB_READ_WRITE_TOKEN is not set. Run with --env-file=.env.local (it was added there when the Blob store was linked).",
    );
    process.exit(1);
  }

  const srcDir = path.join(process.cwd(), "raw-event-photos", slug);
  if (!existsSync(srcDir)) {
    console.error(`No folder at raw-event-photos/${slug}/. Drop the photos there first.`);
    process.exit(1);
  }

  const files = (await readdir(srcDir))
    .filter((f) => EXTS.has(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  if (files.length === 0) {
    console.error(`No image files found in raw-event-photos/${slug}/.`);
    process.exit(1);
  }

  console.log(`Found ${files.length} photos for "${slug}". Processing...`);

  const rows = [];

  for (let i = 0; i < files.length; i++) {
    const n = String(i + 1).padStart(3, "0");
    const srcPath = path.join(srcDir, files[i]);
    const input = await readFile(srcPath);

    const displayBuf = await sharp(input)
      .rotate() // apply EXIF orientation, then strip metadata below
      .resize({ width: DISPLAY_WIDTH, withoutEnlargement: true })
      .webp({ quality: DISPLAY_QUALITY })
      .toBuffer();
    const displayMeta = await sharp(displayBuf).metadata();

    const thumbBuf = await sharp(input)
      .rotate()
      .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
      .webp({ quality: THUMB_QUALITY })
      .toBuffer();

    const displayName = `${slug}_${n}.webp`;
    const thumbName = `${slug}_${n}_thumb.webp`;

    const [display, thumb] = await Promise.all([
      put(`event-photos/${slug}/${displayName}`, displayBuf, {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "image/webp",
        cacheControlMaxAge: 31536000,
        token,
      }),
      put(`event-photos/${slug}/${thumbName}`, thumbBuf, {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "image/webp",
        cacheControlMaxAge: 31536000,
        token,
      }),
    ]);

    rows.push({
      url: display.url,
      thumbUrl: thumb.url,
      width: displayMeta.width ?? null,
      height: displayMeta.height ?? null,
      order: i + 1,
    });

    console.log(`  [${n}/${String(files.length).padStart(3, "0")}] ${files[i]} -> ${displayName}`);
  }

  const sqlValues = rows
    .map(
      (r) =>
        `  ((select id from public.cms_events where slug = '${slug}'), '${r.url}', '${r.thumbUrl}', ${r.width ?? "null"}, ${r.height ?? "null"}, ${r.order})`,
    )
    .join(",\n");

  const sql =
    `-- event_photos for "${slug}" (${rows.length} photos). Paste into a fresh\n` +
    `-- Supabase SQL editor tab. Safe to re-run: clears this event's existing\n` +
    `-- rows first so re-uploads don't duplicate.\n` +
    `delete from public.event_photos\n` +
    `  where event_id = (select id from public.cms_events where slug = '${slug}');\n\n` +
    `insert into public.event_photos\n` +
    `  (event_id, url, thumb_url, width, height, display_order)\n` +
    `values\n${sqlValues};\n`;

  const sqlPath = path.join(srcDir, "catalogue.sql");
  await writeFile(sqlPath, sql, "utf8");

  console.log(`\nUploaded ${rows.length} photos to Vercel Blob.`);
  console.log(`SQL written to raw-event-photos/${slug}/catalogue.sql — paste it into the Supabase SQL editor:\n`);
  console.log(sql);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

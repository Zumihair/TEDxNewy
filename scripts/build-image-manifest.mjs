// Lists every image under public/images into lib/image-manifest.json for the admin image library.
// Runs before every build (npm run build); edit nothing by hand.
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = join(root, "public");
const EXT = /\.(webp|jpe?g|png|svg|avif|gif)$/i;
const out = [];
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (EXT.test(e.name)) {
      out.push({ path: "/" + relative(base, p).split("\\").join("/"), bytes: statSync(p).size });
    }
  }
})(join(base, "images"));
out.sort((a, b) => a.path.localeCompare(b.path));
writeFileSync(join(root, "lib/image-manifest.json"), JSON.stringify(out, null, 0));
console.log(`image-manifest.json: ${out.length} images`);

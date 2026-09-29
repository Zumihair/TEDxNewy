// Builds tight-cropped (zero padding) copies of the lockups used on /media
// and in the footer. Originals in public/brand/lockups are left untouched
// (/team-brand uses them). Run: node scripts/build-media-logos.cjs
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "public", "brand", "lockups");
const OUT = path.join(__dirname, "..", "public", "brand", "media");
fs.mkdirSync(OUT, { recursive: true });

const NAMES = ["Standard", "Tagline-Horizontal", "Tagline-Vertical"];
const COLOURS = ["black", "white", "mono"];

async function bbox(input, opts) {
  const { data, info } = await sharp(input, opts)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let minX = info.width, minY = info.height, maxX = -1, maxY = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

(async () => {
  for (const n of NAMES) {
    for (const c of COLOURS) {
      const base = `TEDxNewy-${n}-${c}`;
      // PNG: crop to the alpha bounding box.
      const png = path.join(SRC, base + ".png");
      const pb = await bbox(png);
      await sharp(png).extract(pb).png({ compressionLevel: 9 }).toFile(path.join(OUT, base + ".png"));

      // SVG. The Standard mono SVG is a 2 MB trace, so derive it from the
      // white SVG with every fill forced white (mono here means all-white).
      let svgSrc = path.join(SRC, base + ".svg");
      let svg = fs.readFileSync(svgSrc, "utf8");
      if (n === "Standard" && c === "mono") {
        svg = fs.readFileSync(path.join(SRC, "TEDxNewy-Standard-white.svg"), "utf8")
          .replace(/fill="#[0-9A-Fa-f]{6}"/g, 'fill="#FFFFFF"');
      }
      svg = svg.replace(/<\?xml[^>]*\?>\s*/, "").replace(/<!--[\s\S]*?-->\s*/g, "");
      const m = svg.match(/<svg[^>]*>/)[0];
      const w = +m.match(/width="([\d.]+)"/)[1];
      const h = +m.match(/height="([\d.]+)"/)[1];
      // Rasterise at 2x for a sub-unit accurate box, then map back to SVG units.
      const k = 2;
      const b = await bbox(Buffer.from(svg), { density: 72 * k });
      const x = Math.floor(b.left / k), y = Math.floor(b.top / k);
      const x2 = Math.ceil((b.left + b.width) / k), y2 = Math.ceil((b.top + b.height) / k);
      const vw = x2 - x, vh = y2 - y;
      const newTag = m
        .replace(/\s(viewBox|width|height)="[^"]*"/g, "")
        .replace("<svg", `<svg viewBox="${x} ${y} ${vw} ${vh}" width="${vw}" height="${vh}"`);
      svg = svg.replace(m, newTag);
      fs.writeFileSync(path.join(OUT, base + ".svg"), svg);
      console.log(base, `png ${pb.width}x${pb.height}`, `svg viewBox ${x} ${y} ${vw} ${vh} (was ${w}x${h})`, (svg.length / 1024).toFixed(1) + "KB");
    }
  }
})();

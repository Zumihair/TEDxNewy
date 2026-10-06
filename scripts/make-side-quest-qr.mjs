// One-off: writes the three Signal Side Quest QR codes (SVG and PNG).
//   node scripts/make-side-quest-qr.mjs [outputDir]
// Output goes OUTSIDE the repo by default (the print collateral folder).
// Each code points at the production puzzle URL /signal/links/side-quest/qr/N.
// Black on white with high error correction, so a printed or slightly
// scuffed code still scans. Needs the `qrcode` dev dependency.
import QRCode from "qrcode";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ORIGIN = "https://tedxnewy.com.au";
const DEFAULT_OUT =
  "../../2026/Collateral/Side Quest QR Codes";
const outDir = path.resolve(process.argv[2] ?? DEFAULT_OUT);

await mkdir(outDir, { recursive: true });

for (const n of [1, 2, 3]) {
  const url = `${ORIGIN}/signal/links/side-quest/qr/${n}`;
  const opts = {
    errorCorrectionLevel: "H",
    margin: 4,
    color: { dark: "#000000", light: "#ffffff" },
  };
  const svg = await QRCode.toString(url, { ...opts, type: "svg" });
  await writeFile(path.join(outDir, `side-quest-qr-${n}.svg`), svg);
  await QRCode.toFile(path.join(outDir, `side-quest-qr-${n}.png`), url, {
    ...opts,
    type: "png",
    width: 1600,
  });
  console.log(`code ${n}: ${url}`);
}
console.log(`written to ${outDir}`);

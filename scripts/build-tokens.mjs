// Generates app/tokens.css from design/tokens.json (the TEDxNewy design system).
// Run: node scripts/build-tokens.mjs   (also runs automatically before `npm run build`)
// Edit design/tokens.json, never app/tokens.css.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const t = JSON.parse(readFileSync(join(root, "design/tokens.json"), "utf8"));

const alias = (v) => String(v).replace(/\{([a-z0-9-]+)\}/g, "var(--$1)");
const vars = [];
const push = (name, value) => vars.push(`  --${name}: ${alias(value)};`);

for (const tok of t.color.tokens) push(tok.name, tok.value);
for (const fam of [
  "spacing",
  "gradient",
  "fontSize",
  "fontWeight",
  "tracking",
  "duration",
  "easing",
  "distance",
  "zIndex",
  "effect",
  "motif",
]) {
  for (const tok of t[fam]?.tokens ?? []) push(tok.name, tok.value);
}
// Tailwind owns --leading-*; the design system's line heights live under --lh-*.
for (const tok of t.lineHeight.tokens) push(tok.name.replace(/^leading-/, "lh-"), tok.value);

// next/font supplies the real family names through --font-bricolage and --font-inter.
const fontDisplay = `var(--font-bricolage), ${t.type.families.display}`;
const fontUi = `var(--font-inter), ${t.type.families.ui}`;

const colors = t.color.tokens.map((tok) => `  --color-${tok.name}: var(--${tok.name});`);
const literal = [...t.radius.tokens, ...t.shadow.tokens].map(
  (tok) => `  --${tok.name}: ${alias(tok.value)};`,
);

const css = `/* TEDxNewy tokens: generated from design/tokens.json by scripts/build-tokens.mjs. Do not edit. */
:root {
${vars.join("\n")}
}

/* Tailwind utilities: bg-maroon, text-stone, border-line, ... */
@theme inline {
${colors.join("\n")}
}

/* Literal values: rounded-*, shadow-* and font-* utilities read these, and so does the component CSS. */
@theme static {
  --font-display: ${fontDisplay};
  --font-ui: ${fontUi};
${literal.join("\n")}
}
`;
writeFileSync(join(root, "app/tokens.css"), css);
console.log(`tokens.css: ${vars.length} variables`);

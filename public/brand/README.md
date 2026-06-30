# Brand assets (`public/brand`)

Static brand files served by the site and reused by the TEDxNewy asset library.
Keep names stable: several are referenced by absolute URL (e.g. the email
signature template and JSON-LD), so renaming or removing them breaks live links.

## Logos

| File | What it is | Used by |
|---|---|---|
| `tedxnewy-black.png` | Primary TEDxNewy horizontal lockup, red + dark wordmark. For **light** backgrounds. | Nav (light routes), JSON-LD `logo`, email signature, brand portal |
| `tedxnewy-white.png` | Reversed lockup, red + white wordmark. For **dark** backgrounds. | Nav (dark routes), footer |

The full lockup set (Standard / Salon / Youth event formats, in black / white /
mono colourways, as PNG **and** SVG) lives in the separate asset library and is
mirrored under `public/brand/lockups` for the team brand portal. See that folder
for the complete set and the Logo Usage Guide.

## Social icons (`public/brand/social`)

Two colourways of the same marks, for two different backgrounds:

| File(s) | Colour | For | Used by |
|---|---|---|---|
| `instagram.png`, `linkedin.png`, `tiktok.png` | **White** | Dark backgrounds | Site footer (dark) |
| `instagram-red.png`, `linkedin-red.png` | **TED red** (`#e02214`) | Light backgrounds | **Email signature template** (asset library) and the team brand portal |

The `-red` icons were added on 2026-06-30 specifically so the TEDxNewy email
signature renders correctly on a white email background (the white icons would be
invisible there). They are ink/colour-recoloured from the white source icons.

## Rules

All TEDxNewy marks follow the official TEDx guidelines: place on white, black, or
a darkened photo only; never recolour outside red / black / white; keep clear
space; never rebuild in another font. Full rules: the Logo Usage Guide in the
asset library.

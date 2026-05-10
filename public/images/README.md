# TEDxNewy Image Assets

Drop your real photography at the exact filenames below and they'll automatically replace the gradient placeholders throughout the site.

## Required images

| File name | Where it appears | Recommended size | Suggested photo |
| --- | --- | --- | --- |
| `past-2026.jpg` | Home → Past Events (hero tile, Tides & Turbines) | 1600×1000 (16:10) | 2026 stage shot or hero creative |
| `past-2025.jpg` | Home → Past Events (2025 tile, Horizons & Hinterlands) | 1200×750 | Wide Civic Theatre shot — the "Our 2025 Partners" slide image you sent |
| `past-2024.jpg` | Home → Past Events (2024 tile, The Second Coastline) | 1200×750 | Previous year's main stage |
| `past-2023.jpg` | Home → Past Events (2023 tile) | 1600×1000 | Previous year's main stage |
| `past-2022.jpg` | Home → Past Events (smaller archive tile) | 800×1000 (4:5) | Older archive photo |
| `stage-benjie.jpg` | Home → Attend door-row | 1600×1600 | The Benjie Williams drumming photo (arms raised on the red circle) |
| `stage-welcome.jpg` | Home → Nominate door-row | 1600×1600 | Welcome to Country performer shot |
| `stage-dialogue.jpg` | Home → Volunteer door-row | 1600×1600 | The two speakers in green/blue mid-conversation shot |
| `salon-whatif.jpg` | Home → Past Events (salon tile) | 800×1000 | The "2050 · What If?" poster |
| `salon-repair.jpg` | Home → Past Events (salon tile) | 800×1000 | Placeholder until a Small Repairs creative exists |
| `salon-harbour.jpg` | Home → Past Events (salon tile) | 800×1000 | Harbour re-read visual |

## Until you drop images

Every tile has a gradient + typography fallback that's production-safe. The site will continue to render without any images — each tile simply shows its coloured gradient block until a matching `.jpg` exists.

## Notes

- JPEG preferred for photography (smaller, no alpha needed).
- Portraits (speaker cards) can go in later — use `speakers/<slug>.jpg` once we wire those up.
- Use sRGB and keep files under ~400KB each; Next.js will handle optimisation at build time if we upgrade to `next/image`.

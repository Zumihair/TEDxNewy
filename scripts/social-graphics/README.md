# Social graphics renderer (headless)

Builds the same designed 4:5 graphics as the admin's graphic designer
(`lib/creative-canvas.ts` `renderPost`) from the command line, so a batch of
social drafts can be created with SQL without anyone clicking in the admin.
Written 2026-11-05. Full workflow: the "Social drafts via SQL" section in `CLAUDE.md`.

```
npm i --no-save esbuild playwright            # in a scratch dir, not the repo
npx esbuild scripts/social-graphics/entry.ts --bundle --format=iife --outfile=bundle.js
JOBS=./my-jobs.mjs SPECOUT=specs.json node scripts/social-graphics/run.mjs [file1,file2]
```

- Run it from the folder that holds `bundle.js` (it reads `bundle.js` and writes `out/*.png`).
- It opens https://tedxnewy.com.au so fonts (`/fonts/Inter-*.ttf`) and lockups
  (`/brand/lockups/*`) load from the same origin, then evaluates the bundle in the page.
- `jobs.example.mjs` shows the job shape: `[file, photoUrl, mode, aspect, specOverrides]`.
  Modes: `cover` (normal crop, editable later in the admin), `contain` (photo whole on a
  blurred copy, for wide group shots), `art` (illustration on cream). `autoLogo: true`
  picks the black or white logo by how light the top-left corner is.
- Output is PNG. Convert to JPEG (quality 88, progressive) before committing, see CLAUDE.md.

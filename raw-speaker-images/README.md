# Raw speaker images (drop folder)

Drop **raw, un-branded** speaker portraits here. The site adds the TEDxNewy
logo + name + year overlay automatically, so these must be plain photos with
**no logo/name baked in**.

## How to name them

One file per speaker, named by **slug**. Any of `.jpg`, `.jpeg`, `.png`,
`.webp` is fine. Portrait orientation, ideally face/upper-body framed (they get
cropped to 4:5).

```
2025: brittney-saunders, cameron-lee, charanya-ramakrishnan, daniel-beard,
      ennia-jones, frank-greeff, harry-garside, kate-cashman, tristan-mclindon
2024: magdalena-hoeller, dan-ballard, trudi-boatwright, stefanie-costi, dave-nixon,
      david-sivyer, mariam-mohammed, craig-smith, declan-edwards, tim-stewart,
      heston-russell
```

e.g. `harry-garside.jpg`, `heston-russell.png`.

## What happens next

A processing script crops/pads each to 4:5, optimises it, and writes
`public/images/speakers/<slug>.png`. Then `image_url` is set for any speaker
that needs it, and the branded card renders the overlay. Files in this folder
are git-ignored (only the processed output in `public/` is committed).

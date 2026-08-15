# Raw event photos (drop folder)

Drop the full photo set for one event here, in its own subfolder named by
the event's **slug** (matching `cms_events.slug`, e.g. the same slug used
in its URL at `/events/<slug>`):

```
raw-event-photos/
  signal-2026/
    IMG_0001.jpg
    IMG_0002.jpg
    ...
  newcastle-2050-salon/
    DSC_0431.jpg
    ...
```

Any of `.jpg`, `.jpeg`, `.png`, `.webp` is fine. Photos are sorted by
filename before processing (camera exports are numbered sequentially, so
this reads chronologically), so rename a file if you need to nudge its
place in the gallery order.

## What happens next

Run `node scripts/upload-event-photos.mjs <event-slug>` from the repo root.
It resizes and renames each photo into a display size and a grid thumbnail,
uploads both to Vercel Blob, and prints a ready-to-paste SQL block that
catalogues them against the event in `event_photos`. Paste that block into
a fresh Supabase SQL editor tab to publish the gallery.

Files in this folder are git-ignored, only the processed copies on Vercel
Blob are kept long-term. Safe to delete the local originals once a batch
has uploaded successfully (the folder is just a staging area).

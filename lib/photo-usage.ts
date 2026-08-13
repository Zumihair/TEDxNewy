/**
 * "Where has this event photo been used?" for the gallery picker.
 *
 * Deliberately DERIVED, never stored: nothing writes a "used" flag onto
 * `event_photos`. Every read walks the places a photo can be referenced and
 * intersects those URLs with the catalogue. That means a mark appears the
 * moment a draft references a photo and disappears the moment that draft is
 * deleted (or the photo swapped out), with no bookkeeping to drift, no
 * migration, and no cleanup hooks on delete paths.
 *
 * Surfaces scanned:
 *   - social posts, via `social_post_media` (both the attached graphic and,
 *     for studio designs, the `source_image_url` it was built from)
 *   - newsletter campaigns, via the block JSON
 *   - welcome-flow steps, via the same block JSON
 *
 * Uses the service client because the caller can be the unauthenticated
 * /team-brand studio; the route above it decides how much detail to hand back.
 */
import "server-only";
import { getAdminSupabase } from "./supabase-admin";

export type PhotoUseKind = "social" | "newsletter" | "flow";

export type PhotoUse = {
  kind: PhotoUseKind;
  /** Omitted for non-admin callers, who get marks without draft titles. */
  id?: string;
  title?: string;
  status?: string;
};

/** Keyed by the photo's `event_photos.url`. */
export type PhotoUsage = Record<string, PhotoUse[]>;

/** Pull every http(s) string out of an arbitrary block-JSON value. */
function collectUrls(value: unknown, out: Set<string>) {
  if (typeof value === "string") {
    if (value.startsWith("http")) out.add(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const v of value) collectUrls(v, out);
    return;
  }
  if (value && typeof value === "object") {
    for (const v of Object.values(value)) collectUrls(v, out);
  }
}

export async function getPhotoUsage(): Promise<PhotoUsage> {
  const supabase = getAdminSupabase();

  const [photosRes, socialRes, newsletterRes, flowRes] = await Promise.all([
    supabase.from("event_photos").select("url"),
    supabase
      .from("social_posts")
      .select("id, title, status, social_post_media (image_url, source_image_url)"),
    supabase.from("newsletters").select("id, title, status, blocks"),
    supabase.from("subscriber_flow_steps").select("id, name, enabled, blocks"),
  ]);

  const usage: PhotoUsage = {};
  if (photosRes.error) return usage;

  // Only catalogue photos can be marked, so everything else is noise.
  const known = new Set(
    ((photosRes.data ?? []) as { url: string }[]).map((p) => p.url),
  );
  if (known.size === 0) return usage;

  const add = (url: string, use: PhotoUse) => {
    if (!known.has(url)) return;
    (usage[url] ??= []).push(use);
  };

  if (!socialRes.error) {
    const posts = (socialRes.data ?? []) as {
      id: string;
      title: string;
      status: string;
      social_post_media: { image_url: string; source_image_url: string | null }[] | null;
    }[];
    for (const post of posts) {
      const urls = new Set<string>();
      for (const m of post.social_post_media ?? []) {
        if (m.image_url) urls.add(m.image_url);
        if (m.source_image_url) urls.add(m.source_image_url);
      }
      for (const url of urls) {
        add(url, { kind: "social", id: post.id, title: post.title, status: post.status });
      }
    }
  }

  if (!newsletterRes.error) {
    const campaigns = (newsletterRes.data ?? []) as {
      id: string;
      title: string;
      status: string;
      blocks: unknown;
    }[];
    for (const c of campaigns) {
      const urls = new Set<string>();
      collectUrls(c.blocks, urls);
      for (const url of urls) {
        add(url, { kind: "newsletter", id: c.id, title: c.title, status: c.status });
      }
    }
  }

  if (!flowRes.error) {
    const steps = (flowRes.data ?? []) as {
      id: string;
      name: string;
      enabled: boolean;
      blocks: unknown;
    }[];
    for (const s of steps) {
      const urls = new Set<string>();
      collectUrls(s.blocks, urls);
      for (const url of urls) {
        add(url, {
          kind: "flow",
          id: s.id,
          title: s.name,
          status: s.enabled ? "live" : "off",
        });
      }
    }
  }

  return usage;
}

/** Marks without the draft titles, for callers with no admin session. */
export function stripUsageDetail(usage: PhotoUsage): PhotoUsage {
  const out: PhotoUsage = {};
  for (const [url, uses] of Object.entries(usage)) {
    out[url] = uses.map((u) => ({ kind: u.kind }));
  }
  return out;
}

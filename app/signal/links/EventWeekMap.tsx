"use client";

/**
 * Interactive map for the Event Week Guide's "Map" step (GuideGallery.tsx).
 * Replaces the old static `guide-map.webp` (Will's ask, 2026-09-29): the
 * Conservatorium gets a yellow star pin, every other venue gets a pin
 * coloured and iconed by its primary category (`kinds[0]`), and tapping a
 * pin opens a small popup with the venue's name, its first offer, and a
 * "View more" button that hands the venue's name back to `onViewVenue`
 * (GuideGallery then jumps straight to that venue's full detail step).
 *
 * Leaflet loaded from the CDN at runtime, same pattern as
 * `app/admin/tickets/AudienceMap.tsx` (the only other Leaflet instance in
 * this repo): admin-only there, event-week-only here, and neither wants a
 * real npm dependency's lockfile churn for a map that degrades gracefully
 * if the CDN is unreachable. Deliberately its OWN local Leaflet typings
 * rather than importing AudienceMap's: two files in one project each
 * declaring `interface Window { L?: LeafletLike }` with a different
 * `LeafletLike` shape is a real TS error ("subsequent property
 * declarations must have the same type"), hit once already building this.
 * Casting `window` at the two read sites instead of touching the global
 * `Window` interface sidesteps that without coupling the two files' types
 * together for no reason (this one needs `marker`/`divIcon`/popups,
 * AudienceMap needs `circleMarker`/tooltips: different enough shapes that
 * sharing one would just mean padding both with methods only one uses).
 *
 * Dark `mapbox/dark-v11` tiles (not AudienceMap's light-v11): this map
 * lives inside the Guide's dark panel, not a light admin page. Same public
 * `pk.` `NEXT_PUBLIC_MAPBOX_TOKEN` AudienceMap already reads client-side.
 * Popup chrome is restyled dark in `app/globals.css` under
 * `.signal-event-map`, scoped so it can never leak onto AudienceMap.
 */

import { useEffect, useRef } from "react";
import type { CategoryKey } from "./GuideGallery";

const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";

export type MapVenue = {
  name: string;
  kinds: CategoryKey[];
  lat: number;
  lng: number;
  offers?: string[];
  freeTag?: string;
};

type LeafletPopup = { getElement: () => HTMLElement | null };
type LeafletMarker = {
  addTo: (m: LeafletMap) => LeafletMarker;
  bindPopup: (html: string, opts?: Record<string, unknown>) => LeafletMarker;
};
type LeafletMap = {
  fitBounds: (b: unknown, o?: Record<string, unknown>) => void;
  setView: (c: [number, number], z: number) => void;
  remove: () => void;
  on: (evt: "popupopen", cb: (e: { popup: LeafletPopup }) => void) => void;
};
type LeafletLike = {
  map: (el: HTMLElement, opts?: Record<string, unknown>) => LeafletMap;
  tileLayer: (url: string, opts?: Record<string, unknown>) => { addTo: (m: LeafletMap) => void };
  marker: (latlng: [number, number], opts?: Record<string, unknown>) => LeafletMarker;
  divIcon: (opts: Record<string, unknown>) => unknown;
  latLngBounds: (pts: [number, number][]) => unknown;
};

let leafletLoading: Promise<void> | null = null;

function getWindowLeaflet(): LeafletLike | undefined {
  return (window as unknown as { L?: LeafletLike }).L;
}

function loadLeaflet(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (getWindowLeaflet()) return Promise.resolve();
  if (leafletLoading) return leafletLoading;
  leafletLoading = new Promise<void>((resolve, reject) => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Leaflet failed to load"));
    document.head.appendChild(script);
  });
  return leafletLoading;
}

// Every path/circle below is copied verbatim from the matching lucide-react
// icon's own source (node_modules/lucide-react/dist/esm/icons/*.js), so a
// pin glyph is pixel-identical to the same category's icon in the picker
// step and the site's other line icons: stroke=currentColor, 24x24 view box,
// round caps and joins. Leaflet's `divIcon` renders a raw HTML string, not a
// React tree, so these can't just be <Coffee /> etc.
const CATEGORY_ICON_INNER: Record<CategoryKey, string> = {
  breakfast:
    '<path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/>',
  lunch:
    '<path d="m2.37 11.223 8.372-6.777a2 2 0 0 1 2.516 0l8.371 6.777"/><path d="M21 15a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-5.25"/><path d="M3 15a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h9"/><path d="m6.67 15 6.13 4.6a2 2 0 0 0 2.8-.4l3.15-4.2"/><rect width="20" height="4" x="2" y="11" rx="1"/>',
  dinner:
    '<path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8"/><path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7"/><path d="m2.1 21.8 6.4-6.3"/><path d="m19 5-7 7"/>',
  drinks:
    '<path d="M8 22h8"/><path d="M7 10h10"/><path d="M12 15v7"/><path d="M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z"/>',
  treat:
    '<path d="m7 11 4.08 10.35a1 1 0 0 0 1.84 0L17 11"/><path d="M17 7A5 5 0 0 0 7 7"/><path d="M17 7a2 2 0 0 1 0 4H7a2 2 0 0 1 0-4"/>',
  activities:
    '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/>',
  stay:
    '<path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/><path d="M2 18h20"/>',
};

const STAR_PATH =
  '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>';

function pinDivIcon(innerSvg: string, bg: string, size: number) {
  const html = `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${bg};border:2px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center">
    <svg width="${Math.round(size * 0.52)}" height="${Math.round(size * 0.52)}" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${innerSvg}</svg>
  </div>`;
  return { html, size };
}

function conservatoriumDivIcon() {
  const size = 40;
  const html = `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:#f5c518;border:2px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center">
    <svg width="${Math.round(size * 0.5)}" height="${Math.round(size * 0.5)}" viewBox="0 0 24 24" fill="#fff" stroke="none">${STAR_PATH}</svg>
  </div>`;
  return { html, size };
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function popupHtml(v: MapVenue) {
  const offer = v.offers?.[0] ?? v.freeTag;
  const offerLine = offer
    ? `<div style="margin-top:4px;font-size:12px;font-weight:600;color:#ff9b8f">${escapeHtml(offer)}</div>`
    : "";
  const name = escapeHtml(v.name);
  return `<div style="min-width:180px">
    <div style="font-size:14px;font-weight:600;color:#fff">${name}</div>
    ${offerLine}
    <button type="button" data-view-more="${name}" style="margin-top:10px;display:inline-flex;align-items:center;gap:6px;border-radius:999px;background:#e62b1e;color:#fff;font-size:12px;font-weight:500;padding:7px 14px;border:none;cursor:pointer">View more &rarr;</button>
  </div>`;
}

export default function EventWeekMap({
  conservatorium,
  venues,
  onViewVenue,
}: {
  conservatorium: { lat: number; lng: number };
  venues: MapVenue[];
  onViewVenue: (name: string) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  // Mirrored into a ref so the mount effect (deliberately [] deps, a map
  // should not be torn down and rebuilt every time a parent re-renders)
  // always calls the latest callback rather than the one from first mount.
  const onViewVenueRef = useRef(onViewVenue);
  onViewVenueRef.current = onViewVenue;

  useEffect(() => {
    let map: LeafletMap | null = null;
    let cancelled = false;
    loadLeaflet()
      .then(() => {
        const L = getWindowLeaflet();
        const el = ref.current;
        if (!L || !el || cancelled) return;

        map = L.map(el, { attributionControl: true });

        const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (mapboxToken) {
          L.tileLayer(
            `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}{r}?access_token=${mapboxToken}`,
            {
              maxZoom: 19,
              tileSize: 512,
              zoomOffset: -1,
              attribution:
                '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            },
          ).addTo(map);
        } else {
          console.warn(
            "[EventWeekMap] NEXT_PUBLIC_MAPBOX_TOKEN is not set, map tiles skipped.",
          );
        }

        map.on("popupopen", (e) => {
          const button = e.popup.getElement()?.querySelector<HTMLButtonElement>("[data-view-more]");
          const name = button?.dataset.viewMore;
          if (button && name) {
            button.addEventListener("click", () => onViewVenueRef.current(name), { once: true });
          }
        });

        const { html: consHtml, size: consSize } = conservatoriumDivIcon();
        L.marker([conservatorium.lat, conservatorium.lng], {
          icon: L.divIcon({ html: consHtml, className: "", iconSize: [consSize, consSize], iconAnchor: [consSize / 2, consSize / 2], popupAnchor: [0, -consSize / 2] }),
        })
          .addTo(map)
          .bindPopup(
            `<div style="min-width:160px"><div style="font-size:14px;font-weight:600;color:#fff">Conservatorium of Music</div><div style="margin-top:4px;font-size:12px;color:rgba(255,255,255,.6)">Where Signal happens</div></div>`,
            { className: "signal-event-map-popup" },
          );

        const size = 34;
        for (const v of venues) {
          const inner = CATEGORY_ICON_INNER[v.kinds[0]] ?? CATEGORY_ICON_INNER.activities;
          const { html, size: iconSize } = pinDivIcon(inner, "#e62b1e", size);
          L.marker([v.lat, v.lng], {
            icon: L.divIcon({ html, className: "", iconSize: [iconSize, iconSize], iconAnchor: [iconSize / 2, iconSize / 2], popupAnchor: [0, -iconSize / 2] }),
          })
            .addTo(map)
            .bindPopup(popupHtml(v), { className: "signal-event-map-popup" });
        }

        const points: [number, number][] = [
          [conservatorium.lat, conservatorium.lng],
          ...venues.map((v): [number, number] => [v.lat, v.lng]),
        ];
        map.fitBounds(L.latLngBounds(points), { padding: [30, 30], maxZoom: 17 });
      })
      .catch(() => {
        /* the map box stays a plain dark panel if the CDN is unreachable */
      });
    return () => {
      cancelled = true;
      if (map) map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ref}
      className="signal-event-map h-full w-full"
      aria-label="Interactive map of the Conservatorium and Event Week Guide venues"
    />
  );
}

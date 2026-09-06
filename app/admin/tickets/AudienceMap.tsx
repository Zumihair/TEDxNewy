"use client";

import { useEffect, useRef } from "react";

export type MapPoint = {
  postcode: string;
  name: string;
  count: number;
  lat: number;
  lng: number;
};

/**
 * Dot map of where ticket buyers live, one circle per postcode sized by
 * count. Leaflet and its stylesheet are pulled from the CDN at runtime rather
 * than bundled: this is admin-only, and adding a dependency without a local
 * Node toolchain to regenerate the lockfile has bitten us before (see the
 * @vercel/analytics lockfile fix in git history). The map degrades to the
 * suburb table beside it if the CDN is unreachable.
 */

const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";

type LeafletMarker = {
  addTo: (m: LeafletMap) => LeafletMarker;
  bindTooltip: (s: string, o?: Record<string, unknown>) => LeafletMarker;
};
type LeafletLike = {
  map: (el: HTMLElement, opts?: Record<string, unknown>) => LeafletMap;
  tileLayer: (url: string, opts?: Record<string, unknown>) => { addTo: (m: LeafletMap) => void };
  circleMarker: (latlng: [number, number], opts?: Record<string, unknown>) => LeafletMarker;
  latLngBounds: (pts: [number, number][]) => unknown;
};
type LeafletMap = {
  fitBounds: (b: unknown, o?: Record<string, unknown>) => void;
  setView: (c: [number, number], z: number) => void;
  remove: () => void;
};

declare global {
  interface Window {
    L?: LeafletLike;
    __leafletLoading?: Promise<void>;
  }
}

function loadLeaflet(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.L) return Promise.resolve();
  if (window.__leafletLoading) return window.__leafletLoading;
  window.__leafletLoading = new Promise<void>((resolve, reject) => {
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
  return window.__leafletLoading;
}

export default function AudienceMap({ points }: { points: MapPoint[] }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let map: LeafletMap | null = null;
    let cancelled = false;
    loadLeaflet()
      .then(() => {
        const L = window.L;
        const el = ref.current;
        if (!L || !el || cancelled) return;
        map = L.map(el, { scrollWheelZoom: false, attributionControl: true });
        // CARTO's free Positron tiles (basemaps.cartocdn.com) now gate behind
        // an account/API key. This used to be a genuinely free, keyless
        // tile CDN, and started returning "API required" once CARTO changed
        // that (2026-09). Mapbox's raster tile endpoint replaces it, using
        // the public (pk.) token in NEXT_PUBLIC_MAPBOX_TOKEN: Mapbox tokens
        // with that prefix are designed for client-side use.
        const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (mapboxToken) {
          L.tileLayer(
            `https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}{r}?access_token=${mapboxToken}`,
            {
              maxZoom: 18,
              tileSize: 512,
              zoomOffset: -1,
              attribution:
                '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            },
          ).addTo(map);
        } else {
          // No silent access_token=undefined request: that 401s per-tile
          // with no useful error, indistinguishable from a real outage. The
          // dots below still render on the blank background either way.
          console.warn(
            "[AudienceMap] NEXT_PUBLIC_MAPBOX_TOKEN is not set, map tiles skipped.",
          );
        }
        const max = Math.max(1, ...points.map((p) => p.count));
        for (const p of points) {
          const r = 6 + Math.sqrt(p.count / max) * 22;
          L.circleMarker([p.lat, p.lng], {
            radius: r,
            color: "#b91404",
            weight: 1.5,
            fillColor: "#e02214",
            fillOpacity: 0.55,
          })
            .bindTooltip(`<b>${p.name}</b> · ${p.postcode}<br>${p.count} ticket${p.count === 1 ? "" : "s"}`, {
              direction: "top",
              offset: [0, -r],
            })
            .addTo(map);
        }
        if (points.length > 0) {
          map.fitBounds(
            L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number])),
            { padding: [28, 28], maxZoom: 12 },
          );
        } else {
          map.setView([-32.93, 151.75], 11);
        }
      })
      .catch(() => {
        /* the suburb table beside the map carries the data */
      });
    return () => {
      cancelled = true;
      if (map) map.remove();
    };
  }, [points]);

  return (
    <div
      ref={ref}
      className="h-[360px] w-full overflow-hidden rounded-[var(--radius-md)] bg-[#efe9dd] md:h-[420px]"
      aria-label="Map of where ticket buyers live"
    />
  );
}

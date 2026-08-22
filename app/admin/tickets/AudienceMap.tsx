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

type LeafletLike = {
  map: (el: HTMLElement, opts?: Record<string, unknown>) => LeafletMap;
  tileLayer: (url: string, opts?: Record<string, unknown>) => { addTo: (m: LeafletMap) => void };
  circleMarker: (
    latlng: [number, number],
    opts?: Record<string, unknown>,
  ) => { addTo: (m: LeafletMap) => unknown; bindTooltip: (s: string, o?: Record<string, unknown>) => unknown };
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
        L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
          maxZoom: 18,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        }).addTo(map);
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

/**
 * Approximate centroids and labels for the postcodes TEDxNewy audiences come
 * from. Used by the ticket dashboard's audience map and suburb table.
 *
 * Centroids are hand-entered to roughly the suburb centre (good enough for a
 * dot map of a region; not for navigation). Add a row when a new postcode
 * shows up unmapped in the dashboard, which lists any it can't place.
 */

export type Region =
  | "Newcastle"
  | "Lake Macquarie"
  | "Port Stephens"
  | "Maitland"
  | "Cessnock"
  | "Upper Hunter"
  | "Central Coast"
  | "Mid North Coast"
  | "Sydney"
  | "Elsewhere";

export type PostcodePlace = {
  name: string;
  region: Region;
  lat: number;
  lng: number;
};

export const HUNTER_POSTCODES: Record<string, PostcodePlace> = {
  // Newcastle LGA
  "2287": { name: "Wallsend / Elermore Vale", region: "Newcastle", lat: -32.9, lng: 151.67 },
  "2289": { name: "Adamstown / Kotara", region: "Newcastle", lat: -32.94, lng: 151.71 },
  "2291": { name: "Merewether / The Junction", region: "Newcastle", lat: -32.95, lng: 151.74 },
  "2292": { name: "Broadmeadow / Hamilton North", region: "Newcastle", lat: -32.92, lng: 151.72 },
  "2293": { name: "Wickham / Maryville", region: "Newcastle", lat: -32.92, lng: 151.75 },
  "2294": { name: "Carrington", region: "Newcastle", lat: -32.92, lng: 151.76 },
  "2295": { name: "Stockton / Fern Bay", region: "Newcastle", lat: -32.91, lng: 151.79 },
  "2296": { name: "Islington", region: "Newcastle", lat: -32.92, lng: 151.74 },
  "2297": { name: "Tighes Hill", region: "Newcastle", lat: -32.91, lng: 151.75 },
  "2298": { name: "Waratah / Georgetown", region: "Newcastle", lat: -32.91, lng: 151.73 },
  "2299": { name: "Lambton / Jesmond", region: "Newcastle", lat: -32.91, lng: 151.7 },
  "2300": { name: "Newcastle / Cooks Hill / The Hill", region: "Newcastle", lat: -32.93, lng: 151.78 },
  "2302": { name: "Newcastle West", region: "Newcastle", lat: -32.93, lng: 151.76 },
  "2303": { name: "Hamilton", region: "Newcastle", lat: -32.92, lng: 151.74 },
  "2304": { name: "Mayfield / Warabrook", region: "Newcastle", lat: -32.9, lng: 151.73 },
  "2305": { name: "New Lambton / Kotara", region: "Newcastle", lat: -32.93, lng: 151.7 },
  "2307": { name: "Shortland", region: "Newcastle", lat: -32.88, lng: 151.69 },
  "2308": { name: "Callaghan (University)", region: "Newcastle", lat: -32.89, lng: 151.7 },
  // Lake Macquarie
  "2264": { name: "Morisset", region: "Lake Macquarie", lat: -33.1, lng: 151.49 },
  "2265": { name: "Cooranbong", region: "Lake Macquarie", lat: -33.07, lng: 151.45 },
  "2267": { name: "Wangi Wangi", region: "Lake Macquarie", lat: -33.07, lng: 151.6 },
  "2278": { name: "Barnsley / Killingworth", region: "Lake Macquarie", lat: -32.93, lng: 151.55 },
  "2280": { name: "Belmont", region: "Lake Macquarie", lat: -33.03, lng: 151.66 },
  "2281": { name: "Swansea / Caves Beach", region: "Lake Macquarie", lat: -33.09, lng: 151.64 },
  "2282": { name: "Warners Bay / Eleebana", region: "Lake Macquarie", lat: -32.97, lng: 151.65 },
  "2283": { name: "Toronto / Arcadia Vale", region: "Lake Macquarie", lat: -33.01, lng: 151.6 },
  "2284": { name: "Toronto / Booragul", region: "Lake Macquarie", lat: -32.98, lng: 151.59 },
  "2285": { name: "Cardiff / Glendale", region: "Lake Macquarie", lat: -32.94, lng: 151.66 },
  "2286": { name: "West Wallsend", region: "Lake Macquarie", lat: -32.9, lng: 151.58 },
  "2290": { name: "Charlestown", region: "Lake Macquarie", lat: -32.96, lng: 151.69 },
  "2306": { name: "Windale", region: "Lake Macquarie", lat: -32.99, lng: 151.67 },
  // Port Stephens
  "2315": { name: "Nelson Bay / Shoal Bay", region: "Port Stephens", lat: -32.72, lng: 152.14 },
  "2316": { name: "Anna Bay / One Mile", region: "Port Stephens", lat: -32.78, lng: 152.08 },
  "2317": { name: "Salamander Bay", region: "Port Stephens", lat: -32.72, lng: 152.08 },
  "2318": { name: "Medowie / Williamtown", region: "Port Stephens", lat: -32.74, lng: 151.87 },
  "2319": { name: "Lemon Tree Passage", region: "Port Stephens", lat: -32.73, lng: 152.04 },
  "2324": { name: "Raymond Terrace", region: "Port Stephens", lat: -32.76, lng: 151.74 },
  // Maitland
  "2320": { name: "Maitland / Rutherford", region: "Maitland", lat: -32.73, lng: 151.56 },
  "2321": { name: "Morpeth / Woodville", region: "Maitland", lat: -32.73, lng: 151.63 },
  "2322": { name: "Beresfield / Thornton", region: "Maitland", lat: -32.79, lng: 151.63 },
  "2323": { name: "Metford / Ashtonfield", region: "Maitland", lat: -32.77, lng: 151.6 },
  // Cessnock
  "2325": { name: "Cessnock", region: "Cessnock", lat: -32.83, lng: 151.36 },
  "2326": { name: "Kurri Kurri / Abermain", region: "Cessnock", lat: -32.82, lng: 151.48 },
  "2327": { name: "Weston", region: "Cessnock", lat: -32.82, lng: 151.45 },
  "2334": { name: "Greta", region: "Cessnock", lat: -32.68, lng: 151.39 },
  "2335": { name: "Branxton", region: "Cessnock", lat: -32.66, lng: 151.35 },
  // Upper Hunter and north
  "2330": { name: "Singleton", region: "Upper Hunter", lat: -32.57, lng: 151.17 },
  "2333": { name: "Muswellbrook", region: "Upper Hunter", lat: -32.26, lng: 150.89 },
  "2337": { name: "Scone", region: "Upper Hunter", lat: -32.05, lng: 150.87 },
  "2340": { name: "Tamworth", region: "Elsewhere", lat: -31.09, lng: 150.93 },
  "2420": { name: "Dungog", region: "Upper Hunter", lat: -32.4, lng: 151.76 },
  "2421": { name: "Paterson", region: "Upper Hunter", lat: -32.6, lng: 151.62 },
  "2422": { name: "Gloucester", region: "Upper Hunter", lat: -32.01, lng: 151.96 },
  // Coast and Sydney
  "2428": { name: "Forster / Tuncurry", region: "Mid North Coast", lat: -32.18, lng: 152.52 },
  "2430": { name: "Taree", region: "Mid North Coast", lat: -31.91, lng: 152.46 },
  "2250": { name: "Gosford", region: "Central Coast", lat: -33.43, lng: 151.34 },
  "2259": { name: "Wyong", region: "Central Coast", lat: -33.28, lng: 151.42 },
  "2261": { name: "The Entrance", region: "Central Coast", lat: -33.34, lng: 151.49 },
  "2262": { name: "Budgewoi", region: "Central Coast", lat: -33.23, lng: 151.55 },
  "2000": { name: "Sydney", region: "Sydney", lat: -33.87, lng: 151.21 },
  "2060": { name: "North Sydney", region: "Sydney", lat: -33.84, lng: 151.21 },
};

/** Four digits out of whatever the form captured ("2300", " 2300 ", "NSW 2300"). */
export function normalisePostcode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const m = raw.match(/\b(\d{4})\b/);
  return m ? m[1] : null;
}

export function placeFor(postcode: string): PostcodePlace | null {
  return HUNTER_POSTCODES[postcode] ?? null;
}

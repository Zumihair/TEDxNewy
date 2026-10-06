"use client";

/**
 * Event Week Guide, inside its modal: a "what are you looking for?" picker
 * rather than a paged copy of the print guide.
 *
 * **Rebuilt 2026-09-28 as three steps, replacing the nine-page swipe
 * gallery.** Will's call: paging through the printed guide's layout on a
 * phone was the wrong shape for what people actually want from it, which is
 * "where can I get breakfast", not "what is on page five". So:
 *   1. **Pick:** a short intro (dates, how to redeem) and one button per
 *      category (`CATEGORIES`), each showing how many venues it holds, plus
 *      the map.
 *   2. **List:** the venues in that category, one compact row each (photo,
 *      name, distance, the offer), so the offers can be compared at a glance.
 *   3. **Venue:** the full card: photo, description, every offer and its
 *      fine print, how to claim, and the Book / Directions / Instagram links.
 *
 * **A venue lives in ONE list with a `kinds` array, not under one section.**
 * LOLAs is lunch, dinner and drinks; filing it under a single print-guide
 * heading is exactly what made it hard to find. A venue shows up under every
 * category its `kinds` names, so add or retag a venue here and every button
 * count, list and the desktop hub card (`GUIDE_SUMMARY`) follows.
 * **Which categories a venue sits in is our judgement from its description
 * and offer, not something the print guide states**; retag freely.
 *
 * Every link is copied from the guide's own source of truth,
 * `1. Business/TEDx/2026/Partnerships/Make the Most of Event Week Guide/
 * Web Guide/Make the Most of Event Week Guide.dc.html`: a real HTML
 * document whose `<a href>`s are live URLs, so nothing here is invented.
 * Where the guide only has a Directions link (Momo Wholefood, Monella,
 * Bathers Way) this has only that too.
 *
 * The map stays a picture (`guide-map.webp`, a Mapbox static render with the
 * pins baked in by `Web Guide/build-map.py`): nothing on it was ever
 * tappable, so there is nothing to lose by keeping it an image.
 *
 * The modal stays full height (not `fit`) on purpose: the three steps differ
 * wildly in height, and a fitted panel would jump on every tap.
 *
 * **Photos are fetched the moment the guide opens, and served as-is.**
 * Every step mounts new images, so left to itself each tap waited on its
 * own downloads (and on the image optimiser's first resize of that size).
 * Instead the category picker, which shows no photos, is used as the head
 * start: on mount it pulls every venue photo plus the map into the browser
 * (~1.4MB). Every `<Image>` here is `unoptimized` so a venue has ONE URL,
 * the static file, shared by its 76px list thumbnail and its detail photo,
 * which is what makes the warm-up land: the files are already small and
 * sized for the detail view, so resizing bought little and split each photo
 * into several URLs the warm-up could not predict. `loading="eager"` because
 * these are on screen the instant their step mounts; lazy loading only
 * added an IntersectionObserver round trip in front of a cached file.
 */

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  BedDouble,
  ChevronRight,
  Coffee,
  Compass,
  IceCreamCone,
  Map as MapIcon,
  MapPin,
  Sandwich,
  Ticket,
  UtensilsCrossed,
  Wine,
  type LucideIcon,
} from "lucide-react";
import EventWeekMap from "./EventWeekMap";

type VenueLink = { label: string; href: string; primary?: boolean };

export type CategoryKey =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "drinks"
  | "treat"
  | "activities"
  | "stay";

type Venue = {
  name: string;
  kinds: CategoryKey[];
  image: string;
  category?: string;
  freeTag?: string;
  meta?: string;
  instagramUrl?: string;
  description: string;
  offers?: string[];
  offerNote?: string;
  links: VenueLink[];
  claimSteps?: string[];
  /** For the interactive map (EventWeekMap.tsx). Rydges through Monella come
   * straight from `Web Guide/build-map.py`'s own VENUES list (OpenStreetMap,
   * verified against `map-addresses.txt`). Bathers Way, Newcastle Art
   * Gallery and Fort Scratchley aren't in that script (it only ever covered
   * the compact food-and-drink cluster), so those three were geocoded
   * separately via Nominatim on 2026-09-29: Art Gallery and Fort Scratchley
   * against their own street addresses below, Bathers Way (a path, not a
   * point) against Newcastle Ocean Baths as a representative midpoint of the
   * Nobbys-to-Merewether walk. */
  lat: number;
  lng: number;
};

const CATEGORIES: { key: CategoryKey; label: string; icon: LucideIcon; blurb: string }[] = [
  {
    key: "breakfast",
    label: "Breakfast",
    icon: Coffee,
    blurb: "Doors don't open until the afternoon on Saturday, and on Sunday you'll need a coffee. Here's where we'd send you.",
  },
  {
    key: "lunch",
    label: "Lunch",
    icon: Sandwich,
    blurb: "Grab something to eat before doors open. All close by, all with something on for TEDxNewy attendees.",
  },
  {
    key: "dinner",
    label: "Dinner",
    icon: UtensilsCrossed,
    blurb: "When the day wraps, stick around. From Darby St to the Honeysuckle waterfront.",
  },
  {
    key: "drinks",
    label: "Drinks",
    icon: Wine,
    blurb: "A spritz, a sangria or a schooner of something brewed for the week. Keep the conversation going.",
  },
  {
    key: "treat",
    label: "Treat",
    icon: IceCreamCone,
    blurb: "Something sweet to cap off an evening of big ideas.",
  },
  {
    key: "activities",
    label: "Activities",
    icon: Compass,
    blurb: "Event week is a good excuse to explore. A few starting points, all an easy trip from the city centre.",
  },
  {
    key: "stay",
    label: "Stay",
    icon: BedDouble,
    blurb: "Two easy beds, both part of the EVT Hospitality group and a short walk from the Conservatorium.",
  },
];

const IMG = "/images/event-week-guide/venues";

// Conservatorium of Music, the Signal venue itself. Same coordinate
// build-map.py's own VENUES list uses for its "venue" pin (OpenStreetMap).
const CONSERVATORIUM = { lat: -32.92906, lng: 151.77071 };

const VENUES: Venue[] = [
  {
    name: "Rydges Newcastle",
    kinds: ["stay"],
    image: `${IMG}/rydges.webp`,
    lat: -32.9252,
    lng: 151.7735,
    meta: "600m, 5 min walk from the doors",
    instagramUrl: "https://www.instagram.com/rydgesnewcastle",
    description:
      "Right in the middle of town, on the corner of Wharf Rd and Merewether St. Comfortable rooms, harbour views, and everything you need to roll out of bed and into the talks.",
    offers: ["14% off your stay"],
    offerNote: "Rates are valid between 22nd Oct and 25th Oct",
    links: [
      { label: "Book your stay", href: "https://www.rydges.com/rates/#/newcastle/", primary: true },
      {
        label: "Directions",
        href: "https://www.google.com/maps/dir/?api=1&destination=Rydges+Newcastle%2C+Wharf+Rd+%26+Merewether+St%2C+Newcastle+NSW",
      },
    ],
    claimSteps: ["Click “I have a code”", "Use BLOCK ID: 2410TEDXNE", "Click “Update”"],
  },
  {
    name: "QT Newcastle",
    kinds: ["stay"],
    image: `${IMG}/qt.webp`,
    lat: -32.92679,
    lng: 151.77912,
    meta: "10 min walk from the doors",
    instagramUrl: "https://www.instagram.com/qtnewcastle",
    description:
      "A bit of character on the waterfront, with the signature QT style and a good bar to land in after a day of big ideas. Also puts you close to the East End for the next morning.",
    offers: ["14% off your stay"],
    offerNote: "Rates are valid between 22nd Oct and 25th Oct",
    links: [
      { label: "Book your stay", href: "https://www.qthotels.com/newcastle/", primary: true },
      {
        label: "Directions",
        href: "https://www.google.com/maps/dir/?api=1&destination=QT+Newcastle%2C+185+Hunter+St%2C+Newcastle+NSW",
      },
    ],
    claimSteps: ["Click “Book” + “I Have a Code”", "Use Corporate ID: QTxTED", "Click “Check Rooms”"],
  },
  {
    name: "One Penny Black",
    kinds: ["breakfast", "lunch"],
    image: `${IMG}/one-penny-black.webp`,
    lat: -32.92658,
    lng: 151.77976,
    meta: "5 min walk from the doors",
    instagramUrl: "https://www.instagram.com/onepennyblack",
    description: "A Newcastle institution on Hunter St, serving specialty coffee, big breakfasts, lunch and alcoholic drinks.",
    offers: ["20% off your order"],
    links: [
      {
        label: "Directions",
        href: "https://www.google.com/maps/dir/?api=1&destination=One+Penny+Black%2C+196+Hunter+St%2C+Newcastle+NSW",
      },
    ],
  },
  {
    name: "East End Hub",
    kinds: ["breakfast"],
    image: `${IMG}/east-end-hub.webp`,
    lat: -32.92929,
    lng: 151.78535,
    meta: "200m from Newcastle Beach",
    instagramUrl: "https://www.instagram.com/eastendhub",
    description: "Breakfast and lunch in the East End, right next to the Novotel and a stone's throw from the sand.",
    offers: ["20% off your order"],
    links: [
      {
        label: "Directions",
        href: "https://www.google.com/maps/dir/?api=1&destination=East+End+Hub%2C+3%2F3+King+St%2C+Newcastle+NSW",
      },
    ],
  },
  {
    name: "Momo Wholefood",
    kinds: ["breakfast"],
    image: `${IMG}/momo-wholefood.webp`,
    lat: -32.9266,
    lng: 151.77766,
    meta: "11 min walk from the doors",
    instagramUrl: "https://www.instagram.com/momowholefood",
    description:
      "Fresh, seasonal wholefood in a beautiful heritage bank building on the corner of Hunter and Brown Streets. Expect colourful plates, great coffee, and plenty of vegan and vegetarian goodness. The perfect spot to fuel up before a big day of ideas.",
    offers: ["Free small coffee with any main"],
    links: [
      {
        label: "Directions",
        href: "https://www.google.com/maps/dir/?api=1&destination=Momo+Wholefood%2C+227+Hunter+St%2C+Newcastle+NSW",
      },
    ],
  },
  {
    name: "LOLAs",
    kinds: ["lunch", "dinner", "drinks"],
    image: `${IMG}/lolas.webp`,
    lat: -32.93241,
    lng: 151.77097,
    category: "Native-inspired bites",
    meta: "12 min walk from the doors",
    instagramUrl: "https://www.instagram.com/lolasdarbyst",
    description: "A Darby St favourite for lunch, dinner and a drink. Enjoy a free TEDx Spritz with any meal all week.",
    offers: ["Free TEDx Spritz with meal"],
    links: [
      { label: "Book a table", href: "https://www.sevenrooms.com/landing/lolasdarbystreetnewcastle", primary: true },
      {
        label: "Directions",
        href: "https://www.google.com/maps/dir/?api=1&destination=LOLAs%2C+171+Darby+St%2C+Cooks+Hill+NSW",
      },
    ],
  },
  {
    name: "Moor",
    kinds: ["lunch", "dinner"],
    image: `${IMG}/moor.webp`,
    lat: -32.92821,
    lng: 151.78533,
    category: "Mediterranean",
    meta: "15 min walk from the doors",
    instagramUrl: "https://www.instagram.com/moor_newcastle_east",
    description:
      "Specialty coffee by day, Mediterranean plates by night, out in Newcastle East. Worth the walk for a proper sit down meal.",
    offers: ["Free wine with meal"],
    links: [
      { label: "Book a table", href: "https://www.dishcult.com/restaurant/moornewcastleeast", primary: true },
      {
        label: "Directions",
        href: "https://www.google.com/maps/dir/?api=1&destination=Moor%2C+33+Hunter+St%2C+Newcastle+East+NSW",
      },
    ],
  },
  {
    name: "Bocados",
    kinds: ["dinner"],
    image: `${IMG}/bocados.webp`,
    lat: -32.92892,
    lng: 151.78377,
    category: "Spanish kitchen",
    meta: "15 min walk from the doors",
    instagramUrl: "https://www.instagram.com/bocados.newcastle",
    description: "Vibrant Spanish tapas in the heart of East End. Come over, bring friends and have fun!",
    offers: ["Free sangria with dinner"],
    links: [
      {
        label: "Book a table",
        href: "https://bookings.nowbookit.com/?accountid=2cb92295-f9b9-4bcf-9ccb-fdf8f6425b6e&colors=hex%2Cffa000&theme=dark&venueid=775",
        primary: true,
      },
      {
        label: "Directions",
        href: "https://www.google.com/maps/dir/?api=1&destination=Bocados+Spanish+Kitchen%2C+25+King+St%2C+Newcastle+NSW",
      },
    ],
  },
  {
    name: "The Kingfish",
    kinds: ["lunch", "dinner"],
    image: `${IMG}/kingfish.webp`,
    lat: -32.9255,
    lng: 151.76893,
    category: "Waterfront dining",
    meta: "10 min walk from the doors",
    instagramUrl: "https://www.instagram.com/thekingfishhoneysuckle",
    description: "The perfect all-nighter at Honeysuckle. Enjoy a drink, a meal, and delicious dessert, all waterfront.",
    offers: ["Free bottle of house wine with a seafood platter"],
    links: [
      {
        label: "Book a table",
        href: "https://www.sevenrooms.com/explore/thekingfish/reservations/create/search?venues=thekingfish%2Cblanca",
        primary: true,
      },
      {
        label: "Directions",
        href: "https://www.google.com/maps/dir/?api=1&destination=The+Kingfish%2C+15-17+Honeysuckle+Dr%2C+Newcastle+NSW+2300",
      },
    ],
  },
  {
    name: "Blanca",
    kinds: ["dinner"],
    image: `${IMG}/blanca.webp`,
    lat: -32.92541,
    lng: 151.76914,
    category: "Coastal Mediterranean",
    meta: "10 min walk from the doors",
    instagramUrl: "https://www.instagram.com/blancahoneysuckle",
    description:
      "Dinner inspired by the coastlines of Greece, Sicily and Turkey, right on the Honeysuckle waterfront. A fancier night out, and worth saving room for dessert.",
    offers: ["5% off your bill"],
    offerNote: "Mention TEDxNewy in booking notes to claim",
    links: [
      {
        label: "Book a table",
        href: "https://www.sevenrooms.com/explore/blanca/reservations/create/search?venues=thekingfish%2Cblanca",
        primary: true,
      },
      {
        label: "Directions",
        href: "https://www.google.com/maps/dir/?api=1&destination=Blanca+Honeysuckle%2C+2%2F11+Honeysuckle+Dr%2C+Newcastle+NSW",
      },
    ],
  },
  {
    name: "St Lucia",
    kinds: ["dinner", "drinks"],
    image: `${IMG}/st-lucia.webp`,
    lat: -32.92535,
    lng: 151.76935,
    category: "Latin American",
    meta: "10 min walk from the doors",
    instagramUrl: "https://www.instagram.com/stluciadining",
    description: "Shared plates, ceviche and signature cocktails on the Honeysuckle waterfront. Big, loud and made for a long dinner.",
    offers: ["Limited TEDxNewy Cocktail"],
    links: [
      {
        label: "Book a table",
        href: "https://www.sevenrooms.com/explore/stluciadining/reservations/create/search/",
        primary: true,
      },
      {
        label: "Directions",
        href: "https://www.google.com/maps/dir/?api=1&destination=St+Lucia%2C+1%2F11+Honeysuckle+Dr%2C+Newcastle+NSW",
      },
    ],
  },
  {
    name: "FogHorn Brewhouse",
    kinds: ["lunch", "dinner", "drinks"],
    image: `${IMG}/foghorn.webp`,
    lat: -32.92726,
    lng: 151.77523,
    category: "Brewery",
    meta: "5 min walk from the doors",
    instagramUrl: "https://www.instagram.com/foghorn_brewery",
    description:
      "House-brewed beer and solid pub food out in the East End. A reliable first stop once the crowd spills out onto the street.",
    offers: ["10% off your order"],
    links: [
      { label: "Book a table", href: "https://www.opentable.com.au/r/foghorn-brewery-newcastle", primary: true },
      {
        label: "Directions",
        href: "https://www.google.com/maps/dir/?api=1&destination=FogHorn+Brewhouse%2C+218+King+St%2C+Newcastle+NSW",
      },
    ],
  },
  {
    name: "The Grain Store",
    kinds: ["drinks"],
    image: `${IMG}/grain-store.webp`,
    lat: -32.92752,
    lng: 151.78715,
    category: "Taproom",
    meta: "15 min walk from the doors",
    instagramUrl: "https://www.instagram.com/grainstorebar",
    description: "Twenty one taps of independent beer in an old East End grain warehouse.",
    offers: ["Limited TEDx IPA, while stock lasts", "$12 → $7 schooners"],
    links: [
      { label: "Book a table", href: "https://www.grainstore.beer/online-booking/", primary: true },
      {
        label: "Directions",
        href: "https://www.google.com/maps/dir/?api=1&destination=The+Grain+Store%2C+64-66+Scott+St%2C+Newcastle+East+NSW",
      },
    ],
  },
  {
    name: "Monella",
    kinds: ["treat"],
    image: `${IMG}/monella.webp`,
    lat: -32.93192,
    lng: 151.77105,
    category: "Gelato",
    meta: "12 min walk from the doors",
    instagramUrl: "https://www.instagram.com/monellagelato",
    description: "Handcrafted gelato on Darby St. The perfect way to cap off an evening of big ideas.",
    offers: ["Free second scoop"],
    links: [
      {
        label: "Directions",
        href: "https://www.google.com/maps/dir/?api=1&destination=Monella+Gelato%2C+150+Darby+St%2C+Cooks+Hill+NSW",
      },
    ],
  },
  {
    name: "Bathers Way",
    kinds: ["activities"],
    image: `${IMG}/bathers-way.webp`,
    lat: -32.92957,
    lng: 151.79095,
    category: "Coastal walk",
    freeTag: "Free",
    meta: "Nobbys Beach to Merewether",
    description: "Newcastle's best walk, tracing the coast past the Ocean Baths, the Bogey Hole and clifftops the whole way.",
    links: [
      { label: "Directions", href: "https://www.google.com/maps/dir/?api=1&destination=Bathers+Way%2C+Newcastle+NSW" },
    ],
  },
  {
    name: "Newcastle Art Gallery",
    kinds: ["activities"],
    image: `${IMG}/art-gallery.webp`,
    lat: -32.9295,
    lng: 151.77281,
    category: "Gallery",
    freeTag: "Free entry",
    meta: "2 min walk from the doors",
    instagramUrl: "https://www.instagram.com/newcastleartgalleryaustralia",
    description: "A freshly expanded gallery with a strong collection of Australian art, right by the Conservatorium.",
    links: [
      { label: "Plan your visit", href: "https://newcastleartgallery.nsw.gov.au/plan-your-visit", primary: true },
      {
        label: "Directions",
        href: "https://www.google.com/maps/dir/?api=1&destination=Newcastle+Art+Gallery%2C+1+Laman+St%2C+Newcastle+NSW",
      },
    ],
  },
  {
    name: "Fort Scratchley",
    kinds: ["activities"],
    image: `${IMG}/fort-scratchley.webp`,
    lat: -32.92574,
    lng: 151.79058,
    category: "Historic site",
    meta: "Above the harbour, out in the East End",
    description: "A coastal fort with some of the best views in town, plus tunnel tours into the headland below.",
    links: [
      {
        label: "Book a tour",
        href: "https://newcastle.nsw.gov.au/fort-scratchley/tours-events/booking-a-tour",
        primary: true,
      },
      {
        label: "Directions",
        href: "https://www.google.com/maps/dir/?api=1&destination=Fort+Scratchley%2C+Nobbys+Rd%2C+Newcastle+East+NSW",
      },
    ],
  },
];

const venuesIn = (key: CategoryKey) => VENUES.filter((v) => v.kinds.includes(key));

/**
 * What the desktop hub card for this tile previews, derived from the data
 * above rather than written out a second time.
 *
 * Safe to import from `LinksExperience` because that file is `"use client"`
 * too. A plain-data export from a client module resolves to a client
 * reference stub if a SERVER component imports it (see the `TABS.map` note
 * in CLAUDE.md), so keep it to client callers.
 */
export const GUIDE_SUMMARY = {
  sections: CATEGORIES.filter((c) => venuesIn(c.key).length > 0).map((c) => c.label),
  venueCount: VENUES.length,
};

type Step =
  | { view: "pick" }
  | { view: "map" }
  | { view: "list"; cat: CategoryKey }
  | { view: "venue"; cat: CategoryKey; name: string };

export default function GuideGallery() {
  const [step, setStep] = useState<Step>({ view: "pick" });
  const rootRef = useRef<HTMLDivElement>(null);

  // Warm every photo while the reader is still choosing a category (see the
  // note at the top of the file). decode() gets them ready to paint too, not
  // just downloaded; a browser without it simply skips that part.
  useEffect(() => {
    const images = VENUES.map((v) => v.image).map((src) => {
      const img = new window.Image();
      img.decoding = "async";
      img.src = src;
      img.decode?.().catch(() => {});
      return img;
    });
    return () => {
      images.forEach((img) => {
        img.src = "";
      });
    };
  }, []);

  // Each step starts at the top of the modal's own scroll area, or tapping a
  // venue low in a long list would open its detail already scrolled away.
  useEffect(() => {
    let el = rootRef.current?.parentElement ?? null;
    while (el && el.scrollHeight <= el.clientHeight) el = el.parentElement;
    el?.scrollTo({ top: 0 });
  }, [step]);

  const back: Step | null =
    step.view === "venue"
      ? { view: "list", cat: step.cat }
      : step.view === "pick"
        ? null
        : { view: "pick" };

  const cat = step.view === "list" || step.view === "venue" ? CATEGORIES.find((c) => c.key === step.cat) : undefined;

  return (
    <div ref={rootRef} className="flex flex-col">
      {back && (
        <button
          type="button"
          onClick={() => setStep(back)}
          className="mb-4 inline-flex items-center gap-1.5 self-start rounded-full bg-white/[0.06] py-2 pl-3 pr-4 text-[12.5px] font-medium text-white/80 transition-colors hover:bg-white/[0.12]"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          {step.view === "venue" && cat ? cat.label : "All categories"}
        </button>
      )}

      {step.view === "pick" && <PickStep onPick={setStep} />}
      {step.view === "map" && (
        <div>
          <StepHeading title="The map" />
          <p className="mt-2 text-[13.5px] leading-[1.55] text-white/70">
            Tap a pin for the offer, or drag and pinch to look around.
          </p>
          <div className="relative mt-4 h-[420px] w-full overflow-hidden rounded-[var(--radius-md)] bg-black/40 sm:h-[480px]">
            <EventWeekMap
              conservatorium={CONSERVATORIUM}
              venues={VENUES}
              onViewVenue={(name) => {
                const venue = VENUES.find((v) => v.name === name);
                if (venue) setStep({ view: "venue", cat: venue.kinds[0], name: venue.name });
              }}
            />
          </div>
        </div>
      )}
      {step.view === "list" && cat && (
        <div>
          <StepHeading title={cat.label} />
          <p className="mt-2 text-[13.5px] leading-[1.55] text-white/70">{cat.blurb}</p>
          <ul className="mt-5 flex flex-col gap-3">
            {venuesIn(cat.key).map((v) => (
              <li key={v.name}>
                <VenueRow venue={v} onOpen={() => setStep({ view: "venue", cat: cat.key, name: v.name })} />
              </li>
            ))}
          </ul>
        </div>
      )}
      {step.view === "venue" && (
        <VenueDetail venue={VENUES.find((v) => v.name === step.name) ?? VENUES[0]} />
      )}
    </div>
  );
}

function StepHeading({ title }: { title: string }) {
  return (
    <h3
      className="font-sans tracking-[-0.02em] text-white"
      style={{ fontSize: "clamp(1.5rem, 6vw, 1.85rem)", fontWeight: 500, lineHeight: 1.05 }}
    >
      {title}
    </h3>
  );
}

/**
 * **Mobile-compact, by Will's request (2026-09-29): the intro paragraph, the
 * "What are you looking for?" heading and each tile's "X spots" line all
 * disappear below `sm`.** The `sm` and up view keeps all of it: a wide modal
 * panel has no "one screen" constraint, and the richer copy is genuinely
 * useful there. Same `hidden sm:block` / `sm:` pattern the hub tiles already
 * use for their own phone-vs-desktop split, just inline in one component
 * rather than two, since this step (unlike the hub) is shared markup at
 * every width.
 *
 * **Grid is a fixed 2 columns (2026-09-29, was 3), by Will's explicit ask**:
 * 8 tiles (7 categories plus Map, assuming every category has at least one
 * venue) land as 2x4 at every width, not just on a phone. The Map tile uses
 * the exact same solid tile style as a category button now too, not the
 * dashed/lighter one it had before — Will wanted the Map tile visually
 * identical to the rest, not marked out as a different kind of thing.
 */
function PickStep({ onPick }: { onPick: (s: Step) => void }) {
  return (
    <div>
      <p className="hidden text-[13.5px] leading-[1.6] text-white/75 sm:block">
        Our local venues are putting on something special for Signal attendees, 19 to 25 October. To redeem an
        offer, just show your ticket or email confirmation unless the venue says otherwise.
      </p>
      <h3
        className="hidden font-sans tracking-[-0.02em] text-white sm:mt-6 sm:block"
        style={{ fontSize: "clamp(1.35rem, 5.5vw, 1.6rem)", fontWeight: 500, lineHeight: 1.1 }}
      >
        What are you looking for?
      </h3>
      <div className="grid grid-cols-2 gap-2.5 sm:mt-4 sm:gap-3">
        {CATEGORIES.map((c) => {
          const count = venuesIn(c.key).length;
          if (count === 0) return null;
          const Icon = c.icon;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => onPick({ view: "list", cat: c.key })}
              className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-white/12 bg-white/[0.06] px-2.5 py-3 text-center backdrop-blur-md backdrop-saturate-150 transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.09] sm:px-3 sm:py-3.5"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-[#ff9b8f] sm:h-11 sm:w-11">
                <Icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" strokeWidth={1.8} />
              </span>
              <span className="text-[12.5px] font-medium leading-tight text-white sm:text-[14px]">{c.label}</span>
              <span className="hidden text-[11px] text-white/50 sm:block">
                {count} {count === 1 ? "spot" : "spots"}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onPick({ view: "map" })}
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-white/12 bg-white/[0.06] px-2.5 py-3 text-center backdrop-blur-md backdrop-saturate-150 transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.09] sm:px-3 sm:py-3.5"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-[#ff9b8f] sm:h-11 sm:w-11">
            <MapIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5" strokeWidth={1.8} />
          </span>
          <span className="text-[12.5px] font-medium text-white sm:text-[14px]">Map</span>
          <span className="hidden text-[11px] text-white/50 sm:block">Getting around</span>
        </button>
      </div>
    </div>
  );
}

function OfferChip({ offer }: { offer: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-[#e62b1e]/50 bg-[#e62b1e]/10 px-2.5 py-1 text-[11px] font-medium text-[#ff9b8f]">
      <Ticket className="h-3 w-3 shrink-0" strokeWidth={2} />
      {offer}
    </span>
  );
}

function VenueRow({ venue, onOpen }: { venue: Venue; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3.5 rounded-2xl border border-white/12 bg-white/[0.06] p-2.5 pr-3 text-left backdrop-blur-md backdrop-saturate-150 transition-colors hover:border-white/20 hover:bg-white/[0.09]"
    >
      <span className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-xl bg-[#1a0604]">
        <Image src={venue.image} alt="" fill unoptimized loading="eager" className="object-cover" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[15px] font-medium leading-tight text-white">{venue.name}</span>
        {(venue.category || venue.meta) && (
          <span className="mt-0.5 truncate text-[11.5px] text-white/50">
            {[venue.category, venue.meta].filter(Boolean).join(" · ")}
          </span>
        )}
        <span className="mt-1.5 flex flex-wrap gap-1.5">
          {venue.offers?.[0] ? (
            <OfferChip offer={venue.offers[0]} />
          ) : venue.freeTag ? (
            <span className="rounded-full bg-[#1f4a5c]/40 px-2.5 py-1 text-[11px] font-medium text-[#bfe0ea]">
              {venue.freeTag}
            </span>
          ) : null}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-white/40" strokeWidth={2} />
    </button>
  );
}

function VenueDetail({ venue }: { venue: Venue }) {
  return (
    <article>
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-[#1a0604]">
        <Image src={venue.image} alt={venue.name} fill unoptimized loading="eager" className="object-cover" />
      </div>
      <div className="mt-4">
        {(venue.category || venue.freeTag) && (
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {venue.category && (
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10.5px] font-medium text-white/70">
                {venue.category}
              </span>
            )}
            {venue.freeTag && (
              <span className="rounded-full bg-[#1f4a5c]/40 px-2.5 py-1 text-[10.5px] font-medium text-[#bfe0ea]">
                {venue.freeTag}
              </span>
            )}
          </div>
        )}
        <StepHeading title={venue.name} />
        {venue.meta && <p className="mt-1.5 text-[12.5px] text-white/50">{venue.meta}</p>}
        <p className="mt-3 text-[14px] leading-[1.6] text-white/80">{venue.description}</p>

        {venue.offers && venue.offers.length > 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-[#e62b1e]/45 bg-[#e62b1e]/[0.07] p-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#ff9b8f]">
              Your Signal offer
            </div>
            <ul className="mt-2 flex flex-col gap-1">
              {venue.offers.map((o) => (
                <li key={o} className="text-[16px] font-medium leading-snug text-white">
                  {o}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[12px] leading-[1.5] text-white/60">
              {venue.offerNote ?? "Show your ticket or email confirmation to redeem."}
            </p>
            {venue.claimSteps && (
              <div className="mt-3 border-t border-white/10 pt-3">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#ff9b8f]">
                  How to claim
                </div>
                <ol className="flex flex-col gap-1.5">
                  {venue.claimSteps.map((s, i) => (
                    <li key={s} className="flex items-center gap-2 text-[12.5px] text-white/75">
                      <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-[#e62b1e] text-[10px] font-bold text-white">
                        {i + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2.5">
          {venue.links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-medium ${
                l.primary ? "bg-[#e62b1e] text-white" : "bg-white/10 text-white/85"
              }`}
            >
              {l.primary ? <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} /> : <MapPin className="h-3.5 w-3.5" strokeWidth={2} />}
              {l.label}
            </a>
          ))}
          {venue.instagramUrl && (
            <a
              href={venue.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2.5 text-[13px] font-medium text-white/85"
            >
              <InstagramIcon />
              Instagram
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

// lucide-react in this project doesn't ship an Instagram glyph; reused the
// same small hand-drawn one components/SpeakerModal.tsx already uses.
function InstagramIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

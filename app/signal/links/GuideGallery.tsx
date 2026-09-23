"use client";

/**
 * Inline, paginated Event Week Guide, inside its modal.
 *
 * **Rebuilt as real HTML (2026-09-23), not PDF-page images.** The previous
 * version rendered each of the guide's 9 pages as a picture of the printed
 * PDF page. That looked right but every "Book a table" / "Directions"
 * button was flattened into pixels — nothing was actually tappable. Will
 * wants the real interactive guide, not a photo of it.
 *
 * Every real link below (Instagram, "Book a table", "Directions", hotel
 * booking pages) is copied from the guide's own source of truth,
 * `1. Business/TEDx/2026/Partnerships/Make the Most of Event Week Guide/
 * Web Guide/Make the Most of Event Week Guide.dc.html` — that file is a
 * real, live HTML document (it's how the guide's own PDF export works:
 * headless Chrome prints THAT html), so every `<a href>` in it is a real,
 * working URL already, not something invented for this rebuild. Nothing
 * here is a fabricated link: where the source guide only has a Directions
 * link and no separate booking site (Momo Wholefood, Monella, Bathers Way),
 * this rebuild has only a Directions link too.
 *
 * **One page stayed an image on purpose: the map (page 2).** It's a
 * Mapbox static render with hand-placed SVG pins baked in at build time
 * (`Web Guide/build-map.py`) — there's no interactive element on it to lose
 * by keeping it a picture, and re-implementing an interactive map inside
 * this modal would be a much bigger, riskier undertaking for a page that
 * was never clickable in the print guide either. Reused the existing
 * pre-rendered page image (`guide-map.webp`) from the prior all-image
 * build rather than re-exporting it.
 *
 * **Design decision, flag for Will:** the print guide alternates cream and
 * dark-red page backgrounds for visual rhythm. This rebuild uses ONE
 * consistent dark theme (matching this page's own Signal palette, and the
 * dark modal chrome every other tile already opens into) instead, rather
 * than nesting bright cream cards inside an already-dark modal shell. Real
 * content and every link were prioritised over reproducing that print
 * layout/decoration exactly.
 *
 * Swipe-to-change-page is still here, but now requires a clearly
 * horizontal gesture (`|dx| > 60` AND more than double `|dy|`) rather than
 * just `|dx| > 40`, since a page's content can now be tall enough to need
 * its own vertical scroll and a stray diagonal drag shouldn't be misread as
 * "next page" while someone's scrolling to reach a button.
 */

import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, Ticket } from "lucide-react";

type VenueLink = { label: string; href: string; primary?: boolean };

type Venue = {
  name: string;
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
};

type GuidePage =
  | { kind: "cover" }
  | { kind: "image"; src: string; alt: string }
  | { kind: "venues"; title: string; subtitle: string; venues: Venue[] }
  | { kind: "back" };

const IMG = "/images/event-week-guide/venues";

const PAGES: GuidePage[] = [
  { kind: "cover" },
  {
    kind: "image",
    src: "/images/event-week-guide/guide-map.webp",
    alt: "Map of central Newcastle showing the venue and nearby participating venues, with getting-here and getting-to-the-venue information",
  },
  {
    kind: "venues",
    title: "Where to stay",
    subtitle:
      "Two easy beds, both part of the EVT Hospitality group and a short walk from the Conservatorium. Perfect if you'd rather not drive home after a night of big ideas.",
    venues: [
      {
        name: "Rydges Newcastle",
        image: `${IMG}/rydges.webp`,
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
        image: `${IMG}/qt.webp`,
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
    ],
  },
  {
    kind: "venues",
    title: "Breakfast spots",
    subtitle:
      "Doors don't open until the afternoon on Saturday, and on Sunday you'll have a head full of ideas and a real need for a coffee. Here's where we'd send you.",
    venues: [
      {
        name: "One Penny Black",
        image: `${IMG}/one-penny-black.webp`,
        meta: "5 min walk from the doors",
        instagramUrl: "https://www.instagram.com/onepennyblack",
        description: "A Newcastle institution for a proper coffee and a big breakfast, right on Hunter St.",
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
        image: `${IMG}/east-end-hub.webp`,
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
        image: `${IMG}/momo-wholefood.webp`,
        meta: "11 min walk from the doors",
        instagramUrl: "https://www.instagram.com/momowholefood",
        description:
          "Fresh, seasonal wholefood in a beautiful old bank building on the corner of Hunter and Brown Streets. Vegetarian and vegan friendly, and a good one for a slower morning.",
        offers: ["Free coffee with any meal"],
        links: [
          {
            label: "Directions",
            href: "https://www.google.com/maps/dir/?api=1&destination=Momo+Wholefood%2C+227+Hunter+St%2C+Newcastle+NSW",
          },
        ],
      },
    ],
  },
  {
    kind: "venues",
    title: "Lunch and dinner",
    subtitle:
      "Grab something to eat before doors open, and when the day wraps, stick around. These spots are all close by and putting on something special for TEDxNewy attendees.",
    venues: [
      {
        name: "LOLAs",
        image: `${IMG}/lolas.webp`,
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
        image: `${IMG}/moor.webp`,
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
        image: `${IMG}/bocados.webp`,
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
    ],
  },
  {
    kind: "venues",
    title: "By the water",
    subtitle:
      "Honeysuckle is the place to be once the talks wrap. Three waterfront venues, all an easy walk from the doors, each with something on for TEDxNewy event week.",
    venues: [
      {
        name: "The Kingfish",
        image: `${IMG}/kingfish.webp`,
        category: "Waterfront dining",
        meta: "10 min walk from the doors",
        instagramUrl: "https://www.instagram.com/thekingfishhoneysuckle",
        description: "The perfect all-nighter at Honeysuckle. Enjoy a drink, a meal, and delicious dessert, all waterfront.",
        offers: ["Free bottle of house red with a seafood platter"],
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
        image: `${IMG}/blanca.webp`,
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
        image: `${IMG}/st-lucia.webp`,
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
    ],
  },
  {
    kind: "venues",
    title: "Late night?",
    subtitle:
      "Still going after the talks? These spots keep the night alive, from a pint and pub food to a scoop of gelato to finish.",
    venues: [
      {
        name: "FogHorn Brewhouse",
        image: `${IMG}/foghorn.webp`,
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
        image: `${IMG}/grain-store.webp`,
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
        image: `${IMG}/monella.webp`,
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
    ],
  },
  {
    kind: "venues",
    title: "See Newcastle",
    subtitle: "Event week is a good excuse to explore. A few starting points, all an easy trip from the city centre.",
    venues: [
      {
        name: "Bathers Way",
        image: `${IMG}/bathers-way.webp`,
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
        image: `${IMG}/art-gallery.webp`,
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
        image: `${IMG}/fort-scratchley.webp`,
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
    ],
  },
  { kind: "back" },
];

const PAGE_COUNT = PAGES.length;

/**
 * What the desktop hub card for this tile previews, derived from `PAGES`
 * above rather than written out a second time: add a venue or rename a
 * section here and the card follows on its own.
 *
 * Safe to import from `LinksExperience` because that file is `"use client"`
 * too. A plain-data export from a client module resolves to a client
 * reference stub if a SERVER component imports it, which has bitten this
 * repo before (see the `TABS.map` note in CLAUDE.md), so keep it to client
 * callers.
 */
export const GUIDE_SUMMARY = {
  sections: PAGES.flatMap((p) => (p.kind === "venues" ? [p.title] : [])),
  venueCount: PAGES.reduce(
    (n, p) => n + (p.kind === "venues" ? p.venues.length : 0),
    0,
  ),
};

export default function GuideGallery() {
  const [page, setPage] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const goTo = (next: number) => {
    setPage(Math.max(0, Math.min(PAGE_COUNT - 1, next)));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    // Require a clearly horizontal gesture: real content now scrolls
    // vertically within a page, so a mostly-vertical drag must never be
    // misread as "change page" (see file note).
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 2) return;
    if (dx < 0) goTo(page + 1);
    else goTo(page - 1);
  };

  const current = PAGES[page];

  return (
    <div className="flex flex-col" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Sticky page nav: stays visible while a tall page's venue cards
          scroll underneath it. -mx-6/-mt-6 + matching px-6/pt-6 cancel out
          TileModal's own content padding so this sits flush at the top of
          the scroll area rather than floating with a gap above it. */}
      <div className="sticky -top-6 -mx-6 -mt-6 z-10 flex items-center justify-between border-b border-white/10 bg-[#150807] px-6 pb-3 pt-6">
        <button
          type="button"
          onClick={() => goTo(page - 1)}
          disabled={page === 0}
          aria-label="Previous page"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-white/80 transition-colors hover:bg-white/[0.12] disabled:opacity-30"
        >
          <ChevronLeft className="h-4.5 w-4.5" strokeWidth={2} />
        </button>
        <div className="tabular text-[12px] font-medium uppercase tracking-[0.08em] text-white/55">
          Page {page + 1} of {PAGE_COUNT}
        </div>
        <button
          type="button"
          onClick={() => goTo(page + 1)}
          disabled={page === PAGE_COUNT - 1}
          aria-label="Next page"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-white/80 transition-colors hover:bg-white/[0.12] disabled:opacity-30"
        >
          <ChevronRight className="h-4.5 w-4.5" strokeWidth={2} />
        </button>
      </div>

      <div className="pt-5">
        {current.kind === "cover" && <CoverPage />}
        {current.kind === "image" && (
          <div className="relative aspect-[1400/1982] w-full overflow-hidden rounded-[var(--radius-md)] bg-black/40">
            <Image src={current.src} alt={current.alt} fill sizes="(min-width: 640px) 480px, 100vw" className="object-contain" />
          </div>
        )}
        {current.kind === "venues" && <VenuesPage title={current.title} subtitle={current.subtitle} venues={current.venues} />}
        {current.kind === "back" && <BackPage />}
      </div>
    </div>
  );
}

function CoverPage() {
  return (
    <div className="text-center">
      <h3
        className="font-sans tracking-[-0.02em] text-white"
        style={{ fontSize: "clamp(1.9rem, 8vw, 2.5rem)", fontWeight: 500, lineHeight: 1.05 }}
      >
        Get the most out of <span className="text-[#ff9b8f]">Event Week</span>
      </h3>
      <div className="mx-auto mt-6 max-w-[42ch] border-t border-white/15 pt-6">
        <p className="text-[14.5px] leading-[1.65] text-white/80">
          Thank you to all of our local and participating venues.
        </p>
        <p className="mt-3 text-[13.5px] leading-[1.6] text-white/70">
          The people behind our cafes, bars and restaurants give a city its heart, and we&rsquo;re so lucky to have such a
          diverse and delicious range of venues for you to enjoy across our event week.
        </p>
        <p className="mt-3 text-[13.5px] leading-[1.6] text-white/70">
          To redeem any of the offers below, simply present your ticket/email confirmation unless otherwise mentioned.
        </p>
        <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#e02214] px-5 py-2.5 text-[13.5px] font-semibold text-white">
          Participating dates: 19th to 25th October
        </span>
      </div>
      <p className="mt-8 text-[12px] text-white/50">Newcastle Conservatorium of Music &middot; Awabakal and Worimi Country</p>
    </div>
  );
}

function BackPage() {
  return (
    <div className="text-center">
      <h3
        className="font-sans tracking-[-0.02em] text-white"
        style={{ fontSize: "clamp(1.8rem, 7vw, 2.25rem)", fontWeight: 500, lineHeight: 1.05 }}
      >
        Ideas change everything.
      </h3>
      <div className="mt-7 flex justify-center gap-3">
        {[
          { label: "Instagram", href: "https://www.instagram.com/tedxnewy", Icon: InstagramIcon },
          { label: "Facebook", href: "https://www.facebook.com/tedxnewy", Icon: FacebookIcon },
          { label: "LinkedIn", href: "https://www.linkedin.com/company/tedxnewy", Icon: LinkedInIcon },
        ].map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noreferrer"
            aria-label={`TEDxNewy on ${s.label}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:border-white/50"
          >
            <s.Icon />
          </a>
        ))}
      </div>
      <a
        href="https://www.tedxnewy.com.au"
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-block text-[14px] text-white/75 underline-offset-4 hover:underline"
      >
        tedxnewy.com.au
      </a>
      <p className="mx-auto mt-8 max-w-[48ch] border-t border-white/15 pt-6 text-[12px] leading-[1.6] text-white/55">
        TEDxNewy is staged on the land of the Awabakal and Worimi people. We pay our respects to Elders past, present
        and emerging, and acknowledge their continuing connection to land, waters and culture.
      </p>
    </div>
  );
}

function VenuesPage({ title, subtitle, venues }: { title: string; subtitle: string; venues: Venue[] }) {
  return (
    <div>
      <h3
        className="font-sans tracking-[-0.02em] text-white"
        style={{ fontSize: "clamp(1.5rem, 6vw, 1.85rem)", fontWeight: 500, lineHeight: 1.05 }}
      >
        {title}
      </h3>
      <p className="mt-2.5 text-[13.5px] leading-[1.55] text-white/70">{subtitle}</p>
      <div className="mt-6 flex flex-col gap-5">
        {venues.map((v) => (
          <VenueCard key={v.name} venue={v} />
        ))}
      </div>
    </div>
  );
}

function VenueCard({ venue }: { venue: Venue }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#1a0604]">
        <Image src={venue.image} alt={venue.name} fill sizes="480px" className="object-cover" />
      </div>
      <div className="p-4">
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
        <div className="flex items-center gap-2">
          <h4 className="text-[17px] font-medium tracking-[-0.01em] text-white">{venue.name}</h4>
          {venue.instagramUrl && (
            <a
              href={venue.instagramUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`${venue.name} on Instagram`}
              className="inline-flex shrink-0 items-center justify-center text-[#ff9b8f]"
            >
              <InstagramIcon />
            </a>
          )}
        </div>
        {venue.meta && <p className="mt-0.5 text-[12px] text-white/50">{venue.meta}</p>}
        <p className="mt-2 text-[13.5px] leading-[1.5] text-white/75">{venue.description}</p>

        {venue.offers && venue.offers.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {venue.offers.map((o) => (
              <span
                key={o}
                className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-[#e02214]/50 bg-[#e02214]/10 px-2.5 py-1 text-[11px] font-medium text-[#ff9b8f]"
              >
                <Ticket className="h-3 w-3" strokeWidth={2} />
                {o}
              </span>
            ))}
          </div>
        )}
        {venue.offerNote && <p className="mt-1.5 text-[11px] leading-[1.4] text-white/45">{venue.offerNote}</p>}

        <div className="mt-3.5 flex flex-wrap gap-2.5">
          {venue.links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-medium ${
                l.primary ? "bg-[#e02214] text-white" : "bg-white/10 text-white/85"
              }`}
            >
              {!l.primary && <MapPin className="h-3.5 w-3.5" strokeWidth={2} />}
              {l.label}
            </a>
          ))}
        </div>

        {venue.claimSteps && (
          <div className="mt-3.5 border-t border-white/10 pt-3">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#ff9b8f]">
              How to claim
            </div>
            <ol className="flex flex-col gap-1.5">
              {venue.claimSteps.map((step, i) => (
                <li key={step} className="flex items-center gap-2 text-[12px] text-white/70">
                  <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-[#e02214] text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </article>
  );
}

// lucide-react in this project doesn't ship an Instagram glyph; reused the
// same small hand-drawn one components/SpeakerModal.tsx already uses for
// this exact icon elsewhere on the site.
function InstagramIcon() {
  return (
    <svg
      width="15"
      height="15"
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

// Same reasoning as InstagramIcon above: this exact LinkedIn path is
// already used in components/Footer.tsx and components/SpeakerModal.tsx,
// reused here rather than a second hand-drawn version.
function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

// No Facebook glyph exists anywhere else in this codebase (the site
// footer's own SOCIALS list has Instagram/TikTok/LinkedIn, not Facebook),
// so this one is a plain, standard "f" mark rather than a reuse.
function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12a10 10 0 1 0-11.5 9.9v-7H7.9V12h2.6V9.8c0-2.6 1.5-4 3.9-4 1.1 0 2.3.2 2.3.2v2.5h-1.3c-1.3 0-1.7.8-1.7 1.6V12h2.9l-.5 2.9h-2.4v7A10 10 0 0 0 22 12z" />
    </svg>
  );
}

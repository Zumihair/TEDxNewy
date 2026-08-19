/**
 * Partner prospectus renderer.
 *
 * Renders the Signal 2026 partnership prospectus (8 pages, A4) as a
 * self-contained HTML document, personalised for one prospective partner:
 * their name on the cover, their suggested tier highlighted on the packages
 * page, and their contact folded into the close. Pure string templating,
 * same reasoning as lib/report-render.ts: the output feeds both a print view
 * and the headless-Chromium PDF route.
 *
 * Content mirrors the approved hand-built prospectus (Aug 2026). Numbers are
 * frozen here on purpose: a prospectus a partner has been sent should not
 * quietly change under them. Update the constants when the story changes.
 *
 * All assets are absolute URLs (event photos on Vercel Blob, brand assets on
 * the site itself via `origin`), so the server-side renderer can fetch them.
 */

export type ProspectusTier =
  | "presenting"
  | "platinum"
  | "gold"
  | "community"
  | "in_kind";

export type ProspectusPartner = {
  orgName: string;
  contactName: string | null;
  targetTier: ProspectusTier | null;
};

const BLOB = "https://ob67nrhuhoyfvgao.public.blob.vercel-storage.com/event-photos";
const STORAGE =
  "https://gurlrjlesdbiqxhavwil.supabase.co/storage/v1/object/public/cms-uploads/sponsors";

const PHOTOS = {
  cover: `${BLOB}/reframe-2025/reframe-2025_090.webp`,
  audience: `${BLOB}/reframe-2025/reframe-2025_060.webp`,
  salon: "/images/salon-2050/community-event.webp",
  talkNight: `${BLOB}/60-second-talk-night/60-second-talk-night_019.webp`,
  yfl: `${BLOB}/youth-futures-lab/youth-futures-lab_027.webp`,
};

const LOGOS: { src: string; alt: string; h?: number }[] = [
  { src: "/images/partners/university-of-newcastle.png", alt: "University of Newcastle" },
  { src: `${STORAGE}/Henderson-1786449388951.png`, alt: "Henderson Advocacy", h: 20 },
  { src: "/images/partners/newy-digital.png", alt: "Newy Digital", h: 8 },
  { src: `${STORAGE}/Frekl-1786449558300.png`, alt: "Frekl", h: 14 },
  { src: "/images/partners/the-base.png", alt: "The Base", h: 16 },
  { src: `${STORAGE}/Super-Radio-Network-1786449797798.png`, alt: "Super Radio Network" },
  { src: `${STORAGE}/Elqo-1786449609282.png`, alt: "Elqo" },
];

export const TIERS: {
  id: ProspectusTier;
  name: string;
  price: string;
  slots: string;
  includes: string[];
}[] = [
  // Tier ids are stable (they live in cms_partners.target_tier); names and
  // prices are the Aug-2026 rework: activation-centred, $2k entry, $8k top
  // with presenting rights to a 2027 salon as the flagship differentiator.
  {
    id: "presenting",
    name: "Champion partner",
    price: "$8,000",
    slots: "One only. Signal, plus presenting rights to a 2027 salon.",
    includes: [
      "Present a 2027 salon as its naming partner: “presented with” on a Youth Futures Lab, citizen salon or talk night, with its own impact report",
      "Premium activation space at Signal, intermission and drinks hour",
      "Eight hosted seats, reserved front section, plus goodie bags",
      "Logo on the stage screen, website, ticketing and all Signal collateral",
      "Opening acknowledgment from the host",
      "Feature in the pre-event newsletter and a dedicated post on every channel",
      "First right of renewal for 2027",
    ],
  },
  {
    id: "platinum",
    name: "Major partner",
    price: "$5,000",
    slots: "Limited to three.",
    includes: [
      "Activation space in the foyer at Signal",
      "Six hosted seats plus goodie bags",
      "Logo on the stage screen, website, ticketing and event signage",
      "Verbal acknowledgment from the host",
      "Newsletter and social inclusion in the lead-up",
      "Named in the impact report",
    ],
  },
  {
    id: "gold",
    name: "Activation partner",
    price: "$3,000",
    slots: "Limited to four.",
    includes: [
      "Activation table in the foyer",
      "Four hosted seats plus goodie bags",
      "Logo on the website, event signage and the partner slide",
      "Item or offer in the goodie bag",
      "Social thank-you and a mention in the newsletter",
      "Named in the impact report",
    ],
  },
  {
    id: "community",
    name: "Community partner",
    price: "$2,000",
    slots: "Open. In-kind at equivalent value welcome.",
    includes: [
      "Logo on the website and partner slide",
      "Two hosted seats",
      "Item or offer in the goodie bag",
      "Social thank-you",
      "In kind: venue, media, catering, print, production, prizes, expertise",
    ],
  },
];

export const TIER_LABELS: Record<ProspectusTier, string> = {
  presenting: "Champion · $8,000",
  platinum: "Major · $5,000",
  gold: "Activation · $3,000",
  community: "Community · $2,000",
  in_kind: "In-kind",
};

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function css(origin: string): string {
  return `
@font-face {
  font-family: "Bricolage";
  src: url("${origin}/fonts/BricolageGrotesque.ttf") format("truetype");
  font-weight: 200 800;
  font-stretch: 75% 100%;
}
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #f4efe6; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-family: "Bricolage", system-ui, sans-serif; color: #141210; -webkit-font-smoothing: antialiased; }
.page { position: relative; width: 210mm; height: 297mm; overflow: hidden; page-break-after: always; break-after: page; background: #f4efe6; padding: 18mm 18mm 26mm; display: flex; flex-direction: column; }
.page:last-of-type { page-break-after: auto; }
.page.dark { background: #141210; color: #fff; }
.page.tint { background: #8c0d05; color: #fff; }
.grow { flex: 1; }
.rel { position: relative; z-index: 1; }
.kick { font-size: 10pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.24em; line-height: 1.3; color: #b91404; }
.kick.on-dark { color: rgba(255,255,255,0.7); }
.disp { font-variation-settings: "opsz" 144; font-weight: 500; letter-spacing: -0.03em; line-height: 0.98; text-wrap: balance; }
.h-xxl { font-size: 52pt; }
.h-xl { font-size: 40pt; }
.h-l { font-size: 32pt; line-height: 1.04; letter-spacing: -0.025em; }
.h-s { font-size: 15pt; line-height: 1.2; letter-spacing: -0.015em; font-weight: 500; font-variation-settings: "opsz" 144; }
.lead { font-size: 14pt; line-height: 1.5; color: #2a2521; text-wrap: pretty; }
.body { font-size: 11.5pt; line-height: 1.55; color: #2a2521; text-wrap: pretty; }
.small { font-size: 10pt; line-height: 1.5; color: #6b6459; }
.dark .lead, .tint .lead { color: rgba(255,255,255,0.86); }
.dark .body, .tint .body { color: rgba(255,255,255,0.8); }
.dark .small, .tint .small { color: rgba(255,255,255,0.55); }
.photo { overflow: hidden; border-radius: 12px; background: #e9e2d5; }
.photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.bleed { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.shade { position: absolute; inset: 0; background: linear-gradient(to top, rgba(10,9,8,0.96) 0%, rgba(10,9,8,0.78) 40%, rgba(10,9,8,0.28) 72%, rgba(10,9,8,0.1) 100%); }
.glow { position: absolute; border-radius: 50%; pointer-events: none; }
.rule { border: 0; border-top: 1px solid rgba(20,18,16,0.12); }
.dark .rule, .tint .rule { border-color: rgba(255,255,255,0.18); }
.mark { position: absolute; left: 18mm; right: 18mm; bottom: 10mm; display: flex; justify-content: space-between; align-items: center; font-size: 8.5pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.2em; color: #6b6459; }
.dark .mark, .tint .mark { color: rgba(255,255,255,0.5); }
.mark .dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #e02214; margin-right: 9px; vertical-align: 1px; }
.stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10mm 8mm; }
.stat .n { font-variation-settings: "opsz" 144; font-weight: 500; font-size: 40pt; letter-spacing: -0.035em; line-height: 0.95; }
.stat .l { margin-top: 2.5mm; font-size: 10.5pt; line-height: 1.4; color: rgba(255,255,255,0.65); }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; }
.grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6mm; }
.card { border: 1px solid rgba(20,18,16,0.10); border-radius: 12px; background: #fff; padding: 5.5mm; }
.card h5 { font-variation-settings: "opsz" 144; font-weight: 500; font-size: 13.5pt; letter-spacing: -0.015em; line-height: 1.15; }
.card p { font-size: 9.8pt; line-height: 1.5; color: #4a453d; margin-top: 2mm; text-wrap: pretty; }
.voice .q { font-variation-settings: "opsz" 144; font-weight: 500; font-size: 17pt; line-height: 1.22; letter-spacing: -0.02em; text-wrap: balance; }
.voice .src { margin-top: 2mm; font-size: 9pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.18em; color: rgba(255,255,255,0.55); }
.talkrow { display: grid; grid-template-columns: 1fr 26mm; gap: 6mm; align-items: baseline; padding: 2.8mm 0; border-top: 1px solid rgba(20,18,16,0.10); }
.talkrow .tt { font-size: 11pt; font-weight: 500; letter-spacing: -0.01em; line-height: 1.25; }
.talkrow .sp { font-size: 9pt; color: #6b6459; margin-top: 0.5mm; }
.talkrow .vw { font-variation-settings: "opsz" 144; font-weight: 500; font-size: 14pt; letter-spacing: -0.02em; text-align: right; }
.pk { border: 1px solid rgba(20,18,16,0.12); border-radius: 12px; padding: 5mm; background: #fff; display: flex; flex-direction: column; position: relative; }
.pk.hero { background: #141210; color: #fff; border-color: #141210; }
.pk.suggested { border: 2px solid #e02214; }
.pk .flag { position: absolute; top: -4mm; left: 5mm; background: #e02214; color: #fff; border-radius: 999px; padding: 1.2mm 3.5mm; font-size: 7.5pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.18em; }
.pk .tier { font-size: 8.5pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.22em; color: #b91404; }
.pk.hero .tier { color: #ff9b8f; }
.pk .price { font-variation-settings: "opsz" 144; font-weight: 500; font-size: 24pt; letter-spacing: -0.03em; line-height: 1; margin-top: 2mm; }
.pk .price small { font-size: 9pt; letter-spacing: 0; color: #6b6459; font-weight: 500; margin-left: 2mm; }
.pk.hero .price small { color: rgba(255,255,255,0.6); }
.pk .slots { font-size: 8.8pt; color: #6b6459; margin-top: 1.5mm; }
.pk.hero .slots { color: rgba(255,255,255,0.6); }
.pk ul { list-style: none; margin-top: 3.5mm; }
.pk li { position: relative; padding-left: 5mm; font-size: 9pt; line-height: 1.35; margin-bottom: 1.3mm; color: #2a2521; }
.pk li::before { content: ""; position: absolute; left: 0; top: 6px; width: 5px; height: 5px; border-radius: 50%; background: #e02214; }
.pk.hero li { color: rgba(255,255,255,0.85); }
.pk.hero li::before { background: #ff9b8f; }
.logos { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4mm; align-items: center; }
.logos .l { border: 1px solid rgba(20,18,16,0.10); border-radius: 12px; background: #fff; height: 22mm; display: flex; align-items: center; justify-content: center; padding: 4mm; }
.logos img { max-width: 82%; max-height: 12mm; object-fit: contain; }
.agenda { border-top: 1px solid rgba(255,255,255,0.18); }
.agenda .r { display: grid; grid-template-columns: 30mm 1fr; gap: 4mm; padding: 2.6mm 0; border-bottom: 1px solid rgba(255,255,255,0.14); }
.agenda .t { font-size: 8.2pt; font-weight: 600; letter-spacing: 0.08em; color: #ff9b8f; text-transform: uppercase; padding-top: 2px; }
.agenda .n { font-size: 11.5pt; font-weight: 500; letter-spacing: -0.01em; color: #fff; }
`;
}

function coverPage(p: ProspectusPartner, origin: string): string {
  const prepared = `Prepared for ${esc(p.orgName)}`;
  return `
<section class="page" style="padding:0;">
  <img class="bleed" src="${PHOTOS.cover}" alt="" style="object-position:50% 40%;">
  <div class="shade"></div>
  <div class="glow" style="left:-40mm;bottom:-50mm;width:190mm;height:190mm;background:radial-gradient(circle, rgba(224,34,20,0.7) 0%, rgba(224,34,20,0.25) 40%, rgba(224,34,20,0) 70%);"></div>
  <img src="${origin}/brand/lockups/TEDxNewy-Standard-white.png" alt="TEDxNewy" style="position:absolute;left:18mm;top:18mm;height:12mm;">
  <div style="position:absolute;right:18mm;top:19mm;text-align:right;" class="kick on-dark">Partnership prospectus<br>Signal · 24 October 2026</div>
  <div class="rel" style="position:absolute;left:18mm;right:18mm;bottom:24mm;color:#fff;">
    <div class="kick" style="color:#ff9b8f;">${prepared}</div>
    <h1 class="disp h-xxl" style="margin-top:5mm;color:#fff;">Ideas worth spreading, from Newcastle.</h1>
    <p class="lead" style="margin-top:7mm;max-width:155mm;color:rgba(255,255,255,0.86);">4.2 million video views. Three sold-out events in 2026. TEDxNewy is volunteer-run and not-for-profit: every partner dollar goes back into the room, the schools program and the stage. This is the invitation to stand behind it.</p>
  </div>
</section>`;
}

function numbersPage(): string {
  return `
<section class="page dark">
  <div class="glow" style="right:-70mm;top:-70mm;width:220mm;height:220mm;background:radial-gradient(circle, rgba(224,34,20,0.45) 0%, rgba(224,34,20,0) 70%);"></div>
  <div class="rel">
    <div class="kick on-dark">TEDxNewy in numbers</div>
    <div style="margin-top:8mm;">
      <div class="disp" style="font-size:80pt;color:#fff;letter-spacing:-0.04em;line-height:0.9;">4.2m</div>
      <p class="lead" style="margin-top:4mm;max-width:150mm;">views across our published talks and videos, filmed in Newcastle and watched around the world.</p>
    </div>
    <hr class="rule" style="margin:8mm 0 7mm;">
    <div class="stats" style="grid-template-columns:1fr 1fr 1fr;gap:9mm 8mm;">
      <div class="stat"><div class="n" style="font-size:30pt;">251</div><div class="l">people in the room across three 2026 events, all three sold out</div></div>
      <div class="stat"><div class="n" style="font-size:30pt;">75</div><div class="l">high schoolers from seven Hunter schools at Youth Futures Lab</div></div>
      <div class="stat"><div class="n" style="font-size:30pt;">781</div><div class="l">subscribers on the mailing list</div></div>
      <div class="stat"><div class="n" style="font-size:30pt;">4.7<span style="font-size:17pt;color:rgba(255,255,255,0.55);">/5</span></div><div class="l">average attendee rating, post-event surveys</div></div>
      <div class="stat"><div class="n" style="font-size:30pt;">96%</div><div class="l">met someone new and left with new ideas</div></div>
      <div class="stat"><div class="n" style="font-size:30pt;">100%</div><div class="l">volunteer-run, not-for-profit: every dollar goes back in</div></div>
    </div>
  </div>
  <div class="grow"></div>
  <p class="rel small">Video views across all published talks and video channels, August 2026. Attendance from event registrations; ratings from post-event surveys.</p>
  <div class="mark"><span><span class="dot"></span>TEDxNewy · Signal 2026 partnership prospectus</span><span>02</span></div>
</section>`;
}

function seasonPage(origin: string): string {
  return `
<section class="page">
  <div class="kick">The 2026 season</div>
  <h2 class="disp h-xl" style="margin-top:4mm;">Three events staged, three sold out. One to go.</h2>
  <p class="body" style="margin-top:5mm;max-width:165mm;">We began as TEDxCooksHill, staging Beyond Boundaries at The Playhouse in 2024 and Reframe at the Conservatorium in 2025. In 2026 we became TEDxNewy and grew from one night a year into a season, on Awabakal and Worimi Country.</p>
  <div class="grid3" style="margin-top:7mm;gap:5mm;">
    <div class="card" style="padding:0;overflow:hidden;">
      <div class="photo" style="aspect-ratio:16/9;border-radius:0;"><img src="${origin}${PHOTOS.salon}" alt=""></div>
      <div style="padding:4.5mm;"><div class="kick" style="font-size:8pt;color:#17607a;">30 April · 122 people</div><h5 class="h-s" style="margin-top:2mm;">Newcastle 2050: What&nbsp;If?</h5><p style="font-size:9.8pt;line-height:1.5;color:#4a453d;margin-top:2mm;">Three rooms, one question each. 297 post-its, written up as a white paper with the University of Newcastle.</p></div>
    </div>
    <div class="card" style="padding:0;overflow:hidden;">
      <div class="photo" style="aspect-ratio:16/9;border-radius:0;"><img src="${PHOTOS.talkNight}" alt=""></div>
      <div style="padding:4.5mm;"><div class="kick" style="font-size:8pt;">16 July · 54 people</div><h5 class="h-s" style="margin-top:2mm;">60-Second Talk Night</h5><p style="font-size:9.8pt;line-height:1.5;color:#4a453d;margin-top:2mm;">Seventeen first-time TEDx speakers, one minute each. Rated 4.7 out of 5 by the room.</p></div>
    </div>
    <div class="card" style="padding:0;overflow:hidden;">
      <div class="photo" style="aspect-ratio:16/9;border-radius:0;"><img src="${PHOTOS.yfl}" alt=""></div>
      <div style="padding:4.5mm;"><div class="kick" style="font-size:8pt;color:#c8541a;">7 August · 75 students</div><h5 class="h-s" style="margin-top:2mm;">Youth Futures Lab</h5><p style="font-size:9.8pt;line-height:1.5;color:#4a453d;margin-top:2mm;">Seven Hunter schools, a day at NUspace. Presented with the University of Newcastle.</p></div>
    </div>
  </div>
  <div class="card" style="margin-top:5mm;background:#141210;color:#fff;border-color:#141210;display:grid;grid-template-columns:1fr auto;gap:8mm;align-items:center;">
    <div><div class="kick" style="color:#ff9b8f;font-size:8pt;">Signature event · Conservatorium of Music</div><h5 class="h-s" style="margin-top:2mm;color:#fff;font-size:19pt;">Signal.</h5><p style="font-size:9.8pt;line-height:1.5;color:rgba(255,255,255,0.8);margin-top:2mm;">A full day: talks under 18 minutes, live performance, a secret showcase, an activation space and a drinks hour. On the same stage as Reframe, whose talks are already past 6,000 views.</p></div>
    <div class="disp" style="font-size:40pt;color:#fff;line-height:1;text-align:center;">24<span style="font-size:12pt;display:block;letter-spacing:0.2em;text-transform:uppercase;font-weight:600;color:#ff9b8f;margin-top:2mm;">Oct</span></div>
  </div>
  <div class="grow"></div>
  <div class="grid2" style="align-items:start;gap:8mm;">
    <div><div class="kick" style="font-size:8.5pt;color:#6b6459;">The day</div><p class="small" style="margin-top:2mm;color:#2a2521;">1:30pm doors · 2:00pm session one · 3:30pm intermission and activation space · 4:00pm session two, with a secret showcase · 5:30pm drinks hour in the foyer.</p></div>
    <div><div class="kick" style="font-size:8.5pt;color:#6b6459;">Tickets</div><p class="small" style="margin-top:2mm;color:#2a2521;">Concession $59.99 · Standard $99.99 · Angel $159.99, which pays for a second seat for someone who needs it. Ticket revenue alone doesn't cover the day; partners are what make it possible.</p></div>
  </div>
  <div class="mark"><span><span class="dot"></span>TEDxNewy · Signal 2026 partnership prospectus</span><span>03</span></div>
</section>`;
}

/** Full-bleed schools & community impact page: the heart of the NFP story. */
function impactPage(): string {
  return `
<section class="page" style="padding:0;">
  <img class="bleed" src="${PHOTOS.yfl}" alt="" style="object-position:35% 60%;">
  <div style="position:absolute;inset:0;background:rgba(10,9,8,0.32);"></div>
  <div style="position:absolute;inset:0;background:linear-gradient(to top, rgba(10,9,8,0.97) 0%, rgba(10,9,8,0.92) 40%, rgba(10,9,8,0.55) 72%, rgba(10,9,8,0.12) 100%);"></div>
  <div class="rel" style="position:absolute;left:18mm;right:18mm;bottom:24mm;color:#fff;">
    <div class="kick" style="color:#ff9b8f;">Where the impact lands</div>
    <h2 class="disp h-xl" style="margin-top:4mm;color:#fff;max-width:170mm;">Schools, students and a city thinking about itself.</h2>
    <div class="grid3" style="margin-top:7mm;gap:6mm;">
      <div><div class="h-s" style="color:#fff;">Youth Futures Lab</div><p class="small" style="margin-top:1.5mm;color:rgba(255,255,255,0.75);">75 students, seven Hunter schools, a day of building ideas for a smarter, kinder Newcastle. Led entirely by the students.</p></div>
      <div><div class="h-s" style="color:#fff;">Student Speaker Competition</div><p class="small" style="margin-top:1.5mm;color:rgba(255,255,255,0.75);">A Hunter high schooler wins a place on the Signal main stage, coached to deliver a real TEDx talk.</p></div>
      <div><div class="h-s" style="color:#fff;">Newcastle 2050 white paper</div><p class="small" style="margin-top:1.5mm;color:rgba(255,255,255,0.75);">297 citizen ideas for the city's future, captured at our salon and published with the University of Newcastle.</p></div>
    </div>
    <p class="lead" style="margin-top:7mm;max-width:165mm;color:rgba(255,255,255,0.85);">This is what partner dollars fund. TEDxNewy has no salaries and no shareholders: a volunteer crew puts students on stage and citizen ideas into print.</p>
  </div>
  <div class="mark" style="color:rgba(255,255,255,0.5);"><span><span class="dot"></span>TEDxNewy · Signal 2026 partnership prospectus</span><span>04</span></div>
</section>`;
}

function roomPage(): string {
  return `
<section class="page tint">
  <div class="kick on-dark">Who is in the room</div>
  <h2 class="disp h-xl" style="margin-top:4mm;color:#fff;">Founders, students, educators, creatives, researchers, clinicians, community leaders.</h2>
  <p class="lead" style="margin-top:6mm;max-width:160mm;">What connects them is curiosity. People who show up on a Saturday to think, stay for the drinks hour, and tell us the conversations between sessions were as memorable as the talks.</p>
  <div class="grow" style="display:flex;flex-direction:column;justify-content:center;gap:7mm;margin-top:6mm;">
    <div class="voice"><div class="q" style="color:#fff;">&ldquo;Newy has a lot to say. One only has to look at the confidence of a room full of strangers who volunteered to stand up and share their ideas on a cold winter night.&rdquo;</div><div class="src">Attendee, 60-Second Talk Night</div></div>
    <div class="voice"><div class="q" style="color:#fff;">&ldquo;What a brilliant showcase of the creativity and diversity of our Newcastle community.&rdquo;</div><div class="src">Attendee</div></div>
    <div class="voice"><div class="q" style="color:#fff;">&ldquo;It&rsquo;s a vibe. An opportunity to listen, learn and mingle. I&rsquo;ll be back.&rdquo;</div><div class="src">Attendee</div></div>
  </div>
  <hr class="rule">
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:5mm;margin-top:6mm;">
    <div><div class="disp" style="font-size:24pt;color:#fff;">88%</div><div class="small" style="margin-top:1mm;">very likely to return</div></div>
    <div><div class="disp" style="font-size:24pt;color:#fff;">79%</div><div class="small" style="margin-top:1mm;">first-time attendees</div></div>
    <div><div class="disp" style="font-size:24pt;color:#fff;">17</div><div class="small" style="margin-top:1mm;">first-time speakers</div></div>
    <div><div class="disp" style="font-size:24pt;color:#fff;">297</div><div class="small" style="margin-top:1mm;">citizen ideas captured</div></div>
  </div>
  <div class="mark"><span><span class="dot"></span>TEDxNewy · Signal 2026 partnership prospectus</span><span>05</span></div>
</section>`;
}

function whyPage(): string {
  return `
<section class="page">
  <div class="kick">Why partner</div>
  <h2 class="disp h-xl" style="margin-top:4mm;">Reach, association, access, and proof it worked.</h2>
  <div class="grid2" style="margin-top:7mm;">
    <div class="card"><div class="kick" style="font-size:8pt;">01 · Reach</div><h5 style="margin-top:2mm;">A room, a list, and a channel that keeps going.</h5><p>A full house at the Conservatorium; 781 subscribers; four social channels; and talks on the TEDx YouTube channel that keep collecting views for years.</p></div>
    <div class="card"><div class="kick" style="font-size:8pt;">02 · Association</div><h5 style="margin-top:2mm;">The TEDx name, locally earned.</h5><p>Standing beside TEDx in Newcastle says your organisation backs thinking, talent and the region&rsquo;s future, in front of exactly the people who notice.</p></div>
    <div class="card"><div class="kick" style="font-size:8pt;">03 · Access</div><h5 style="margin-top:2mm;">Not just a logo. A presence.</h5><p>The activation space in the intermission and drinks hour, the goodie bag, hosted seats for your team or clients, and a place in the youth program at higher tiers.</p></div>
    <div class="card"><div class="kick" style="font-size:8pt;">04 · Proof</div><h5 style="margin-top:2mm;">We report back.</h5><p>Every event ends with a published impact report: attendance, feedback, what the room said, where your logo appeared. Something for the board, not a photo of a banner.</p></div>
  </div>
  <div class="photo" style="margin-top:6mm;height:70mm;flex:none;"><img src="${PHOTOS.audience}" alt="" style="object-position:50% 35%;"></div>
  <div class="grow"></div>
  <div class="card" style="background:#f9f5ec;">
    <h5>What it does not buy: the stage.</h5>
    <p>TEDx rules keep the program independent. Partners do not choose speakers, do not speak from the stage, and talks are never sales pitches. That independence is exactly what makes the association worth having.</p>
  </div>
  <div class="mark"><span><span class="dot"></span>TEDxNewy · Signal 2026 partnership prospectus</span><span>06</span></div>
</section>`;
}

function packagesPage(p: ProspectusPartner): string {
  const cards = TIERS.map((t) => {
    // In-kind isn't one of the four priced packages here, so it points at
    // Community instead: that's the tier whose card already spells out
    // "or in kind" and lists the in-kind contributions we take.
    const suggested =
      p.targetTier === t.id ||
      (p.targetTier === "in_kind" && t.id === "community");
    const hero = t.id === "presenting";
    const flag = suggested
      ? `<div class="flag">Our suggestion for ${esc(p.orgName)}</div>`
      : "";
    const inKind = t.id === "community" ? "ex GST, or in kind" : "ex GST";
    return `
    <div class="pk${hero ? " hero" : ""}${suggested && !hero ? " suggested" : ""}">
      ${flag}
      <div class="tier">${esc(t.name)}${t.id === "presenting" ? " · one only" : ""}</div>
      <div class="price">${t.price}<small>${inKind}</small></div>
      <div class="slots">${esc(t.slots)}</div>
      <ul>${t.includes.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
    </div>`;
  }).join("");
  return `
<section class="page">
  <div class="kick">Partnership packages · Signal 2026</div>
  <h2 class="disp h-l" style="margin-top:4mm;">Four levels, from $2,000. The top one names a salon.</h2>
  <p class="small" style="margin-top:3mm;">All prices ex GST. Confirm by Friday 12 September to make print and the stage screen. Packages can be tailored, and every dollar goes back into the event.</p>
  <div class="grow" style="display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:6mm;">${cards}</div>
  <div class="grid3" style="margin-top:5mm;gap:5mm;">
    <div><div class="h-s" style="font-size:11.5pt;">Angel seats · $160 each</div><p class="small" style="margin-top:1mm;">Fund seats for students or community groups.</p></div>
    <div><div class="h-s" style="font-size:11.5pt;">Multi-year</div><p class="small" style="margin-top:1mm;">Sign for 2027 too and take 15% off year two.</p></div>
    <div><div class="h-s" style="font-size:11.5pt;">Talk to us</div><p class="small" style="margin-top:1mm;">If the fit is right and the number is not, say so.</p></div>
  </div>
  <div class="mark"><span><span class="dot"></span>TEDxNewy · Signal 2026 partnership prospectus</span><span>07</span></div>
</section>`;
}

function closePage(p: ProspectusPartner, origin: string): string {
  const hello = p.contactName
    ? `${esc(p.contactName.split(" ")[0])}, a coffee or a call is all it takes.`
    : "A coffee or a call is all it takes.";
  const logos = LOGOS.map((l) => {
    const src = l.src.startsWith("http") ? l.src : `${origin}${l.src}`;
    const h = l.h ? `style="max-height:${l.h}mm;"` : "";
    return `<div class="l"><img src="${src}" alt="${esc(l.alt)}" ${h}></div>`;
  }).join("");
  return `
<section class="page dark">
  <div class="glow" style="left:-50mm;bottom:-60mm;width:200mm;height:200mm;background:radial-gradient(circle, rgba(224,34,20,0.5) 0%, rgba(224,34,20,0) 70%);"></div>
  <div class="rel">
    <div class="kick on-dark">In good company</div>
    <h2 class="disp h-l" style="margin-top:4mm;color:#fff;">The partners behind 2026 so far.</h2>
    <div class="logos" style="margin-top:6mm;">
      ${logos}
      <div class="l" style="border-style:dashed;background:transparent;border-color:rgba(255,255,255,0.35);"><span class="kick" style="font-size:8.5pt;color:#ff9b8f;">${esc(p.orgName)}?</span></div>
    </div>
  </div>
  <div class="rel" style="margin-top:9mm;">
    <div class="kick on-dark">Next steps</div>
    <h2 class="disp h-xl" style="margin-top:4mm;color:#fff;">Ten weeks out. Let&rsquo;s talk this week.</h2>
    <p class="lead" style="margin-top:5mm;max-width:160mm;">${hello} Tell us what matters to ${esc(p.orgName)} and we will come back within days with a tailored proposal.</p>
    <div style="margin-top:6mm;display:grid;grid-template-columns:1fr 1fr;gap:6mm;">
      <div><div class="kick on-dark" style="font-size:8.5pt;">Email</div><p class="body" style="margin-top:2mm;color:#fff;font-size:13pt;">hello@tedxnewy.com.au</p></div>
      <div><div class="kick on-dark" style="font-size:8.5pt;">Online</div><p class="body" style="margin-top:2mm;color:#fff;font-size:13pt;">tedxnewy.com.au/partner</p></div>
    </div>
    <div class="agenda" style="margin-top:6mm;">
      <div class="r"><div class="t">12 September</div><div><div class="n">Partner confirmations, so logos make print and the stage screen</div></div></div>
      <div class="r"><div class="t">24 October</div><div><div class="n">Signal, Conservatorium of Music</div></div></div>
      <div class="r"><div class="t">November</div><div><div class="n">Impact report delivered to every partner</div></div></div>
    </div>
  </div>
  <div class="grow"></div>
  <div class="rel" style="display:grid;grid-template-columns:1fr auto;gap:8mm;align-items:end;">
    <p class="small">TEDxNewy is operated by Newcastle Ideas Network Limited under a free licence from TED. Staged on the land of the Awabakal and Worimi people; we pay our respects to Elders past, present and emerging. Sovereignty was never ceded.</p>
    <img src="${origin}/brand/lockups/TEDxNewy-Standard-white.png" alt="TEDxNewy" style="height:10mm;">
  </div>
  <div class="mark"><span><span class="dot"></span>TEDxNewy · Signal 2026 partnership prospectus</span><span>08</span></div>
</section>`;
}

export function renderProspectusHtml(
  partner: ProspectusPartner,
  opts: { origin: string; autoPrint?: boolean },
): string {
  const pages = [
    coverPage(partner, opts.origin),
    numbersPage(),
    seasonPage(opts.origin),
    impactPage(),
    roomPage(),
    whyPage(),
    packagesPage(partner),
    closePage(partner, opts.origin),
  ].join("\n");
  const print = opts.autoPrint
    ? `<script>window.addEventListener("load",()=>setTimeout(()=>window.print(),600));</script>`
    : "";
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>TEDxNewy · Signal 2026 · Partnership prospectus · ${esc(partner.orgName)}</title><style>${css(opts.origin)}</style></head><body>${pages}${print}</body></html>`;
}

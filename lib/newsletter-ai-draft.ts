/**
 * "AI draft" for newsletters: builds a copy-and-paste prompt for any chat
 * model (Claude, ChatGPT, Copilot, ...) and turns the JSON it sends back into
 * a clean draft. No model is called from the site: the admin pastes the prompt
 * into whatever they use and pastes (or uploads) the answer back.
 *
 * Pure and client-safe (no server-only imports), so the modal can build the
 * prompt and pre-check an answer in the browser. The server action re-parses
 * the same text with `parseAiDraft` before anything is saved, and the blocks
 * still go through `validateBlocks`, so a model's output is never trusted.
 */

import {
  CROPPABLE_SRC,
  validateBlocks,
  type NewsletterBlock,
} from "./newsletter-blocks";
import {
  asNewsletterSegment,
  NEWSLETTER_SEGMENT_LABELS,
  type NewsletterSegment,
} from "./newsletter-segment-types";

export const AI_DRAFT_FORMAT = "tedxnewy-newsletter@1";

/** Site facts handed to the model so it links and dates things correctly. */
export type AiDraftContext = {
  site: string;
  events: {
    title: string;
    status: string;
    dateLabel: string | null;
    venue: string | null;
    url: string | null;
    ticketUrl: string | null;
    galleryUrl: string | null;
    photos: { url: string; orientation: "landscape" | "portrait" | "square" | "unknown" }[];
  }[];
};

export type AiDraftBrief = {
  about: string;
  audience: NewsletterSegment;
  usePhotos: boolean;
};

/** Main public pages a button can point at. Paths only; SITE is prefixed. */
const SITE_PAGES: [string, string][] = [
  ["/", "Home page"],
  ["/signal", "Signal, our signature event (2026)"],
  ["/signature", "All signature events"],
  ["/salons", "Salons (smaller themed evenings)"],
  ["/talks", "Talks from past events"],
  ["/volunteer", "Volunteer with us"],
  ["/speak", "Apply or nominate a speaker"],
  ["/partner", "Partner or sponsor with us"],
  ["/sponsors", "Our partners"],
  ["/team", "The team"],
  ["/mission", "Our mission"],
  ["/contact", "Contact us"],
  ["/subscribe", "Subscribe to the newsletter"],
];

export function buildAiPrompt(brief: AiDraftBrief, ctx: AiDraftContext): string {
  const about = brief.about.trim() || "(not given: ask me what the email is about before you write it)";
  const audienceLabel = NEWSLETTER_SEGMENT_LABELS[brief.audience];

  const pages = SITE_PAGES.map(([p, label]) => `- ${ctx.site}${p === "/" ? "" : p}  (${label})`).join("\n");

  const events = ctx.events
    .map((e) => {
      const bits = [
        `- ${e.title}`,
        e.status === "past" ? "past event" : `status: ${e.status}`,
        e.dateLabel,
        e.venue,
      ].filter(Boolean);
      const links = [
        e.url ? `page ${e.url}` : null,
        e.ticketUrl && e.status !== "past" ? `tickets ${e.ticketUrl}` : null,
        e.galleryUrl ? `photo gallery ${e.galleryUrl}` : null,
      ].filter(Boolean);
      return bits.join(", ") + (links.length ? `\n    ${links.join("\n    ")}` : "");
    })
    .join("\n");

  const withPhotos = ctx.events.filter((e) => e.photos.length);
  const photoSection =
    brief.usePhotos && withPhotos.length
      ? `## Photos you can use

These are real photos from our event galleries. You cannot see them, so pick by
event and orientation, and write alt text that describes the moment generally
("The audience at Signal 2026"), never specific people or details you cannot
know. Use the URL exactly as given. ALWAYS give a gallery photo a "ratio"
(landscape photos: "16:9", "4:3" or "banner"; portrait: "portrait" or
"square"), because that is what converts it into an email-safe JPEG.

${withPhotos
  .map(
    (e) =>
      `${e.title}:\n${e.photos.map((p) => `- ${p.url}  (${p.orientation})`).join("\n")}`,
  )
  .join("\n\n")}

If none of these suit a spot, use a placeholder instead (see below).`
      : `## Photos

Do not use any image URLs. Wherever a photo would help, add a placeholder
image block with "src": "" and alt text describing the photo that should go
there (for example "Photo: speakers on stage at Signal"). We swap in a real
photo from our gallery afterwards.`;

  return `You are writing an email newsletter for TEDxNewy, the independently
organised TEDx community in Newcastle (Newy), NSW, Australia. Our admin
builds emails from blocks, so your answer must be ONE JSON object in the exact
format below. I will upload it straight into our editor, so do not add any
other text before or after it apart from the single \`\`\`json code block.

## What this email is about

${about}

Audience: ${audienceLabel} (audience value "${brief.audience}").

If something essential is missing (a date, a link, a price), do not invent it.
Write around it, or put [square brackets] in the text for me to fill in, and
keep going. Never make up times, prices, venues, names, quotes or offers.

## Voice and house rules

- Warm, plain, local and human. Contractions are fine. Lead with the point.
- Short paragraphs: 1 to 3 sentences each. Skimmable.
- Sentence case for headings (only the first word and names capitalised).
- NEVER use em dashes or en dashes. Use commas, colons or full stops, and
  "to" for ranges (for example "1pm to 5pm").
- Australian spelling (organise, colour, centre).
- One clear main action, as one solid red button. Any extra links are
  "ink" outline buttons or text links.
- Sign off at the end with a text block: "Will and the TEDxNewy team".
- Do NOT add a logo, footer, unsubscribe link or address: those are added
  automatically.
- Aim for roughly 150 to 350 words of body copy unless the brief says otherwise.

## Output format

\`\`\`json
{
  "format": "${AI_DRAFT_FORMAT}",
  "title": "Internal name for the draft, a few words",
  "subject": "Inbox subject line, under 60 characters",
  "preheader": "Preview text after the subject, under 100 characters",
  "audience": "${brief.audience}",
  "blocks": [ ...blocks, top to bottom... ]
}
\`\`\`

## Blocks

Every block is an object with a "type". Use only these:

1. Header
   {"type":"header","text":"Plain text heading","size":"lg"}
   size: "lg" (use once, as the first block) or "md" (section headings).
   Optional "align": "center". Optional "bg" (see below).

2. Text
   {"type":"text","html":"<p>Paragraph one.</p><p>Paragraph two.</p>"}
   Allowed HTML only: <p>, <strong>, <em>, <a href="https://...">, <ul><li>, <br>.
   Links must be full https URLs. Optional "bg".

3. Image
   {"type":"image","src":"https://...","alt":"What the photo shows","widthPct":"full","ratio":"16:9"}
   widthPct: "full" (edge to edge), 100, 80, 60 or 40.
   ratio (crop): "square", "5:4", "4:3", "16:9", "banner" (3:1), "strip" (5:1), "portrait" (4:5).
   Optional "href" to make the image a link. Placeholder: "src": "".

4. Button
   {"type":"button","label":"Short action, 2 to 4 words","href":"https://...","align":"center","theme":"red","variant":"solid"}
   align: "center" or "left". theme: "red" (main action), "ink" (black),
   "redDeep", "gradient". variant: "solid" or "outline".

5. Columns (side by side on desktop, stacked on phones)
   {"type":"columns","ratio":"50-50","valign":"middle","mobileOrder":"imageFirst","cols":[
     [ {"kind":"image","src":"","alt":"Photo: ...","widthPct":100,"ratio":"4:3"} ],
     [ {"kind":"text","html":"<p><strong>Title</strong></p><p>Copy.</p>"},
       {"kind":"button","label":"Find out more","href":"https://...","align":"left","theme":"ink","variant":"outline"} ]
   ]}
   2 columns: ratio "50-50", "40-60", "60-40", "33-66" or "66-33".
   3 columns: "33-33-33", "25-50-25", "50-25-25" or "25-25-50".
   valign: "top", "middle" or "bottom". Each column is a list of children,
   and children use "kind" (not "type"): "text", "image" or "button", with
   the same fields as the blocks above. Use "mobileOrder":"imageFirst" when
   alternating image and text rows. Great for features, people and partners.

6. Divider
   {"type":"divider","style":"thin","colour":"soft"}
   style: "thin", "short", "accent" or "x". colour: "soft", "ink" or "red".

Optional "bg" on header, text, image, button and columns gives a tinted box:
"cream", "sand", "blush" (soft red) or "stone". Use sparingly, for one
standout section at most.

Leave out "id" fields: we add them.

## A good shape for most emails

header (lg) -> image (full, or a placeholder) -> text intro -> button (red,
solid) -> divider -> one or two sections (header md + text, or columns) ->
text sign off.

${photoSection}

## Links you can use

Our website is ${ctx.site}. Main pages:
${pages}

Events:
${events || "- (none listed)"}

Only link to these URLs or to a URL I gave you in the brief. If the right link
does not exist, use ${ctx.site} and tell me in a [square bracket] note in the text.

Now write the email and reply with only the JSON code block.`;
}

// -- parsing ----------------------------------------------------------------

export type ParsedAiDraft = {
  title: string;
  subject: string;
  preheader: string;
  audience: NewsletterSegment;
  blocks: NewsletterBlock[];
  /** Counts for the confirmation line in the modal. */
  placeholders: number;
};

export type ParseResult = { ok: true; draft: ParsedAiDraft } | { ok: false; error: string };

/** Pull the JSON object out of whatever the model replied with: a fenced code
 *  block, bare JSON, or JSON with chatter around it. */
function extractJson(text: string): unknown {
  const t = text.replace(/^﻿/, "").trim();
  const fence = t.match(/```(?:json|JSON)?\s*([\s\S]*?)```/);
  const candidates = [fence?.[1], t];
  for (const c of candidates) {
    if (!c) continue;
    const s = c.trim();
    try {
      return JSON.parse(s);
    } catch {
      // fall through to the brace scan
    }
    const first = s.indexOf("{");
    const last = s.lastIndexOf("}");
    if (first !== -1 && last > first) {
      try {
        return JSON.parse(s.slice(first, last + 1));
      } catch {
        // try the next candidate
      }
    }
    const a1 = s.indexOf("[");
    const a2 = s.lastIndexOf("]");
    if (a1 !== -1 && a2 > a1) {
      try {
        return JSON.parse(s.slice(a1, a2 + 1));
      } catch {
        // try the next candidate
      }
    }
  }
  return undefined;
}

/** House rule: no em or en dashes. Models love them, so fix them on the way
 *  in rather than rejecting the whole draft: an unspaced dash between two
 *  words or numbers is a range ("1pm–5pm", "Mon–Fri") and becomes "to", a
 *  dash between numbers becomes "to" too, any other becomes a comma. */
export function stripDashes(s: string): string {
  return s
    .replace(/([0-9A-Za-z])[–—]([0-9A-Za-z])/g, "$1 to $2")
    .replace(/(\d)\s*[–—]\s*(\d)/g, "$1 to $2")
    .replace(/\s*[–—]\s*/g, ", ")
    .replace(/,\s*,/g, ",");
}

/** Walk the raw JSON: drop every id (models repeat them, and the editor keys
 *  on them), clean dashes from every string, and give gallery photos a crop
 *  when the model forgot one, since only a cropped one is re-encoded to JPEG. */
function scrub(v: unknown): unknown {
  if (typeof v === "string") return stripDashes(v);
  if (Array.isArray(v)) return v.map(scrub);
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (k === "id") continue;
      // URLs are left exactly as given.
      out[k] = k === "src" || k === "href" ? val : scrub(val);
    }
    if (
      (out.type === "image" || out.kind === "image") &&
      typeof out.src === "string" &&
      CROPPABLE_SRC.test(out.src) &&
      (!out.ratio || out.ratio === "original")
    ) {
      out.ratio = "4:3";
    }
    return out;
  }
  return v;
}

export function parseAiDraft(text: string): ParseResult {
  if (!text.trim()) return { ok: false, error: "Paste the AI's answer first." };
  const raw = extractJson(text);
  if (raw === undefined) {
    return {
      ok: false,
      error:
        "That doesn't look like JSON. Copy the whole code block the AI gave you, from the first { to the last }.",
    };
  }
  const obj = scrub(raw);
  const root = (Array.isArray(obj) ? { blocks: obj } : obj) as Record<string, unknown>;
  if (!root || typeof root !== "object") {
    return { ok: false, error: "The JSON needs to be an object with a blocks list." };
  }
  // Drop GIFs (a model cannot make one) and any settings marker.
  const rawBlocks = Array.isArray(root.blocks)
    ? (root.blocks as unknown[]).filter(
        (b) => !(b && typeof b === "object" && ["gif", "logo", "video"].includes((b as { type?: string }).type ?? "")),
      )
    : [];
  const blocks = validateBlocks(rawBlocks);
  if (blocks.length === 0) {
    return {
      ok: false,
      error: "No usable blocks found. Ask the AI to answer again using the exact block format in the prompt.",
    };
  }
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  let placeholders = 0;
  for (const b of blocks) {
    if (b.type === "image" && !b.src) placeholders++;
    if (b.type === "columns")
      for (const col of b.cols) for (const c of col) if (c.kind === "image" && !c.src) placeholders++;
  }
  return {
    ok: true,
    draft: {
      title: str(root.title, 120) || "AI draft",
      subject: str(root.subject, 200),
      preheader: str(root.preheader, 300),
      audience: asNewsletterSegment(root.audience),
      blocks,
      placeholders,
    },
  };
}

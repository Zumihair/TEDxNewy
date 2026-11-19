/**
 * Posts ONE clearly labelled TEST carousel message to the social Slack webhook.
 *
 * Run:  node --env-file=.env.local scripts/slack-carousel-test.mts
 * (needs SLACK_SOCIAL_WEBHOOK_URL; pull it with
 *  `npx vercel env pull .env.local --environment=production --scope claused`).
 * Add --dry to only print the payload JSON (paste it into Slack's Block Kit Builder).
 * Never prints the webhook URL.
 */
import { buildSlackPostMessage } from "../lib/social-slack-message.ts";

const BASE = "https://tedxnewy.com.au/images/social";
const imageUrls = [
  "buzz-foyer-1.jpg",
  "buzz-foyer-2.jpg",
  "buzz-hands-1.jpg",
  "buzz-room-1.jpg",
  "buzz-smiles-1.jpg",
  "buzz-room-2.jpg",
].map((f) => `${BASE}/${f}`);

const payload = buildSlackPostMessage({
  title: ":test_tube: TEST ONLY, ignore",
  caption: "This is a layout test of the new image carousel. No post went out. Please ignore.",
  adminUrl: "https://tedxnewy.com.au/admin/socials",
  outcomes: [
    { channel: "instagram", label: "Instagram", state: "live", link: "https://tedxnewy.com.au" },
    { channel: "linkedin", label: "LinkedIn", state: "live", link: "https://tedxnewy.com.au" },
  ],
  imageUrls,
}, {
  cardImage: (u) => `https://tedxnewy.com.au/api/slack-card?src=${encodeURIComponent(u)}`,
});

console.log(JSON.stringify(payload, null, 2));

if (process.argv.includes("--dry")) process.exit(0);

const url = process.env.SLACK_SOCIAL_WEBHOOK_URL;
if (!url) {
  console.error("SLACK_SOCIAL_WEBHOOK_URL is not set");
  process.exit(1);
}
const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ...payload, unfurl_links: false, unfurl_media: false }),
});
console.log("Slack answered:", res.status, await res.text());

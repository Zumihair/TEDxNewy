import {
  img, header, text, image, button, divider,
  type Draft,
} from "../dsl.mts";

// Hey Zomi feature and Share the Dignity donation (Signal, 24 October 2026).
// [X] is a placeholder for the number of discs donated: Will fills it in the admin.
// The Black Friday section is a first pass: Mika (Hey Zomi) offered to reword it so it
// does not read as a sales pitch.

const REEL = "https://www.instagram.com/p/DeYw-tFTHJf/";
const BLOG = "https://www.heyzomi.com/blogs/learn/a-signal-worth-sharing-why-hey-zomi-partnered-with-tedxnewy";
const SITE_HZ = "https://www.heyzomi.com";

const draft: Draft = {
  slug: "hey-zomi-share-the-dignity",
  title: "Signal: Hey Zomi and Share the Dignity",
  subject: "A signal worth sharing 🔴",
  preheader: "How a room full of Signal guests helped get [X] reusable menstrual discs to people who need them.",
  audience: "subscribers",
  blocks: (n) => [
    header(n(), "A signal worth sharing."),
    image(n(), img("hey-zomi-reel-phone.jpg"), "Watch the Hey Zomi and TEDxNewy reel: Mika holding a Hey Zomi reusable menstrual disc", { width: 80, href: REEL }),
    text(
      n(),
      "<p>At Signal, our partner Hey Zomi gave every guest one of their reusable menstrual discs.</p><p>If it wasn't for you, you were invited to donate it instead. And so many of you did.</p><p>Together, we've donated <strong>[X] reusable menstrual discs</strong> to Share the Dignity, getting period care to people who need it most.</p><p>Thank you to everyone who passed one on.</p>",
    ),
    divider(n()),
    header(n(), "Two sisters, sending a signal from Newy", { size: "md" }),
    image(n(), img("hey-zomi-sisters.jpg"), "Hey Zomi founders Mika and Zoe, smiling and holding Hey Zomi menstrual disc boxes", { width: 100, href: SITE_HZ }),
    text(
      n(),
      "<p>Hey Zomi was started by sisters Mika and Zoe, right here in Newcastle, to make period care more comfortable, more sustainable and more accessible.</p><p>They already partner with Share the Dignity, and they brought that same generosity to Signal. We're proud they're from Newy, and we're proud of the signal they're putting out into the world.</p><p>Mika shared why they partnered with us in a short video and blog post.</p>",
    ),
    button(n(), "Watch the reel", REEL, { theme: "ink", variant: "outline" }),
    button(n(), "Read the blog post", BLOG, { theme: "ink", variant: "outline" }),
    divider(n()),
    header(n(), "Curious to try one?", { size: "md" }),
    image(n(), img("hey-zomi-woolworths.jpg"), "A Hey Zomi billboard reading 92% of us leak, the rest of us use Hey Zomi, available at Woolworths", { width: 100, href: SITE_HZ }),
    text(
      n(),
      "<p>If Signal got you thinking about switching to reusable period care, now is a good time to look. Hey Zomi's sitewide Black Friday sale has <strong>30% off</strong> their menstrual discs and reusable period care.</p><p>You'll also find them at Woolworths.</p>",
    ),
    button(n(), "Discover Hey Zomi", SITE_HZ),
    text(
      n(),
      "<p>Thank you, Mika and Zoe, and thank you to everyone who gave.</p><p>Will and the TEDxNewy team</p>",
    ),
  ],
};
export default draft;

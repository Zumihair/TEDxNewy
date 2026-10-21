import {
  SITE, img, header, text, image, button, divider,
  type Draft,
} from "../dsl.mts";

// TODO(Will): replace with the real feedback form link, then re-run the build.
const FEEDBACK = `${SITE}/feedback`;

const draft: Draft = {
  slug: "feedback-day-after",
  title: "Signal: thank you and feedback",
  subject: "Thank you for being part of Signal",
  preheader: "Tell us how the day was. Every piece of feedback shapes what we do next.",
  audience: "ticket-purchasers",
  blocks: (n) => [
    image(n(), img("community.jpg"), "Attendees at a TEDxNewy event applauding", { width: "full" }),
    header(n(), "Thank you for being part of Signal."),
    text(
      n(),
      "<p>Yesterday, a room full of Novocastrians came together to share ideas, and you were one of them. Thank you for being there.</p><p>We hope it was a day filled with ideas that challenged you, inspired you and sparked new thinking.</p><p>A signal only matters when someone receives it. Every idea shared yesterday now travels on with you, and the ripple starts with what you do next.</p>",
    ),
    image(n(), img("artwork-authenticity.jpg"), "Authenticity, an artwork by Jenni Jean: rows of red fingerprints with a single gold one", { width: 80 }),
    divider(n()),
    header(n(), "Tell us how we did", { size: "md" }),
    text(
      n(),
      "<p>Feedback is how we keep improving the events we deliver. Our team reads every response and takes each piece of it seriously.</p><p>It takes a couple of minutes, and it makes a real difference to what we do next.</p>",
    ),
    button(n(), "Share your feedback", FEEDBACK),
    divider(n()),
    image(n(), img("signal-hero.jpg"), "A packed audience at a TEDxNewy event", { width: 100 }),
    header(n(), "Come aboard the team", { size: "md" }),
    text(
      n(),
      "<p>TEDxNewy is run entirely by volunteers. If yesterday made you want to be part of making it happen, we'd love to hear from you.</p>",
    ),
    button(n(), "Apply to volunteer", `${SITE}/volunteer`, { theme: "ink", variant: "outline" }),
    text(n(), "<p>Thank you again.</p><p>Will and the TEDxNewy team</p>"),
  ],
};
export default draft;

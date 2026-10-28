import {
  img, header, text, image, button, divider,
  type Draft,
} from "../dsl.mts";

const WILLIAM = img("illustration-william.jpg");
const CHLOE = img("illustration-chloe.jpg");

// TODO(Will): no gallery page exists yet. Until one does, this button opens the
// first illustration full size. Swap for a gallery link, then re-run the build.
const VIEW_ALL = WILLIAM;

const draft: Draft = {
  slug: "signal-illustrations-2",
  title: "Signal illustrations 2: William and Chloe",
  subject: "🔴 Set two: our student speakers, drawn live",
  preheader: "William Krause and Chloe McGovern, captured in real time with no chance to redo it.",
  audience: "subscribers",
  blocks: (n) => [
    image(n(), WILLIAM, "Live illustration of William Krause's talk: virtue signalling, from doing good to looking good", { width: "full", href: WILLIAM }),
    header(n(), "Our student speakers, drawn live."),
    text(
      n(),
      "<p>We know you've been eagerly waiting for the second set of live illustrations from the weekend, and this email contains our amazing and unreal student speakers!</p>",
    ),
    header(n(), "William Krause", { size: "md" }),
    text(n(), "<p>On virtue signalling.</p>"),
    image(n(), CHLOE, "Live illustration of Chloe McGovern's talk: shame should be for the perpetrators", { width: "full", href: CHLOE }),
    header(n(), "Chloe McGovern", { size: "md" }),
    text(n(), "<p>On how we speak about sexual assault with young people.</p>"),
    button(n(), "Click to view illustrations here", VIEW_ALL),
    divider(n()),
    header(n(), "Drawing a talk while it's being spoken", { size: "md" }),
    text(
      n(),
      "<p>Capturing a talk as a drawing while it's being spoken is a real skill. It means listening closely, deciding what matters, and turning ideas into images in real time, with no chance to redo it.</p><p>That's the work of our Official Graphic Recorder for TEDxNewy 2026: <strong>Alex Wegner of Sketch it Live</strong>. Since 2017 she has sketched, animated, illustrated and graphic recorded for businesses, government departments and not-for-profits, in meetings, strategic workshops, conferences and festivals.</p><p>We're grateful she brought that to our student speakers, and gave her time in-kind to do it.</p>",
    ),
    button(n(), "Check out more of Alex's work here", "https://sketchitlive.com.au", { theme: "ink", variant: "outline" }),
    divider(n()),
    text(
      n(),
      "<p>More to come, with our final two talks coming soon.</p><p>~TEDxNewy Team</p>",
    ),
  ],
};
export default draft;

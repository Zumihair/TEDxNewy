import {
  img, header, text, image, button, divider,
  type Draft,
} from "../dsl.mts";

const WILLIAM = img("illustration-william.jpg");
const CHLOE = img("illustration-chloe.jpg");
const MEL = img("illustration-mel.jpg");
const SAM = img("illustration-sam.jpg");

// TODO(Will): no gallery page exists yet. Until one does, this button opens the
// first illustration full size. Swap for a gallery link, then re-run the build.
const VIEW_ALL = WILLIAM;

const draft: Draft = {
  slug: "signal-illustrations-2",
  title: "Signal illustrations 2: William, Chloe, Melissa and Sam",
  subject: "🔴 The rest of Signal, drawn live (and a thank you)",
  preheader: "William, Chloe, Melissa and Sam, captured in real time, plus a thank you to the artist behind it all.",
  audience: "subscribers",
  blocks: (n) => [
    header(n(), "The rest of Signal, drawn live."),
    text(
      n(),
      "<p>This is the second and final set of live illustrations from Signal: our two student speakers, and the two talks that closed the day.</p>",
    ),
    divider(n()),
    header(n(), "William Krause", { size: "md" }),
    text(n(), "<p>On virtue signalling.</p>"),
    image(n(), WILLIAM, "Live illustration of William Krause's talk: virtue signalling, from doing good to looking good", { width: "full", href: WILLIAM }),
    divider(n()),
    header(n(), "Chloe McGovern", { size: "md" }),
    text(n(), "<p>On how we speak about sexual assault with young people.</p>"),
    image(n(), CHLOE, "Live illustration of Chloe McGovern's talk: shame should be for the perpetrators", { width: "full", href: CHLOE }),
    divider(n()),
    header(n(), "Melissa Histon", { size: "md" }),
    text(n(), "<p>On seeing our past as research for where we are today.</p>"),
    image(n(), MEL, "Live illustration of Melissa Histon's talk: who are you ready to become next?", { width: "full", href: MEL }),
    divider(n()),
    header(n(), "Sam Watson", { size: "md" }),
    text(n(), "<p>Who closed us with motivation, asking: where is it pointing?</p>"),
    image(n(), SAM, "Live illustration of Sam Watson's talk: where is your motivation pointing?", { width: "full", href: SAM }),
    button(n(), "Click to view illustrations here", VIEW_ALL),
    divider(n()),
    header(n(), "Thank you, Alex", { size: "md" }),
    image(n(), img("alex-crowd.jpg"), "Alex Wegner chatting with guests in the foyer at TEDxNewy Signal", { width: 100 }),
    text(
      n(),
      "<p>Capturing a talk as a drawing while it's being spoken is a real skill. It means listening closely, deciding what matters, and turning ideas into images in real time, with no chance to redo it.</p><p>That's the work of our Official Graphic Recorder for TEDxNewy 2026: <strong>Alex Wegner of Sketch it Live</strong>. Through her illustrations, Alex gave our audience, and now you, a way to take the ideas home before the videos are out. She gave her time in-kind to do it, and we are incredibly grateful.</p>",
    ),
    divider(n()),
    header(n(), "Work with Sketch it Live", { size: "md" }),
    text(
      n(),
      "<p>If you've been moved by her work, there's a good chance your own team, event or organisation could benefit from it too.</p><p>Sketch it Live works with small and large businesses, government departments, local government, not-for-profits, universities, schools, and event organisers, producing one-of-a-kind visual artefacts through illustration, graphic recording and animation.</p>",
    ),
    button(n(), "Alex's website", "https://sketchitlive.com.au", { theme: "ink", variant: "outline" }),
    divider(n()),
    text(
      n(),
      "<p>Thank you, Alex.</p><p>~TEDxNewy Team</p>",
    ),
  ],
};
export default draft;

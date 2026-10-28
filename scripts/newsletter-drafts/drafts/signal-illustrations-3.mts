import {
  img, header, text, image, button, divider,
  type Draft,
} from "../dsl.mts";

const MEL = img("illustration-mel.jpg");
const SAM = img("illustration-sam.jpg");

// TODO(Will): no gallery page exists yet. Until one does, this button opens the
// first illustration full size. Swap for a gallery link, then re-run the build.
const VIEW_ALL = MEL;

const draft: Draft = {
  slug: "signal-illustrations-3",
  title: "Signal illustrations 3: Melissa and Sam",
  subject: "❤️ The final two, drawn live (and a thank you)",
  preheader: "Melissa Histon and Sam Watson closed Signal. Here's how Alex drew them.",
  audience: "subscribers",
  blocks: (n) => [
    image(n(), MEL, "Live illustration of Melissa Histon's talk: who are you ready to become next?", { width: "full", href: MEL }),
    header(n(), "The talks that closed the day."),
    text(
      n(),
      "<p>This is the last set of illustrations from the weekend, and it's of the two talks that closed the day.</p>",
    ),
    header(n(), "Melissa Histon", { size: "md" }),
    text(n(), "<p>On seeing our past as research for where we are today.</p>"),
    image(n(), SAM, "Live illustration of Sam Watson's talk: where is your motivation pointing?", { width: "full", href: SAM }),
    header(n(), "Sam Watson", { size: "md" }),
    text(n(), "<p>Who closed us with motivation, asking: where is it pointing?</p>"),
    button(n(), "Click to view illustrations here", VIEW_ALL),
    divider(n()),
    header(n(), "Thank you, Alex", { size: "md" }),
    image(n(), img("alex-crowd.jpg"), "Alex Wegner chatting with guests in the foyer at TEDxNewy Signal", { width: 100 }),
    text(
      n(),
      "<p>Across three emails, you've now seen every talk through Alex Wegner's eyes. We'd like to finish by saying a proper thank you.</p><p>Through her illustrations, Alex gave our audience, and now you, a way to take the ideas home before the videos are out. That's a real contribution to our event and something we are incredibly grateful for.</p>",
    ),
    divider(n()),
    header(n(), "Work with Sketch it Live", { size: "md" }),
    text(
      n(),
      "<p>If you've been moved by her work, there's a good chance your own team, event or organisation could benefit from it too.</p><p>Sketch it Live works with small and large businesses, government departments, local government, not-for-profits, universities, schools, and event organisers, producing one-of-a-kind visual artefacts through illustration, graphic recording and animation.</p><p>You can find Alex's website here to get in touch.</p>",
    ),
    button(n(), "Alex's website", "https://sketchitlive.com.au", { theme: "ink", variant: "outline" }),
    divider(n()),
    text(n(), "<p>Thank you, Alex.</p><p>~TEDxNewy Team</p>"),
  ],
};
export default draft;

import {
  SITE, img, header, text, image, button, divider, columns, cText, cImage,
  type Draft,
} from "../dsl.mts";

const draft: Draft = {
  slug: "artist-and-shirt",
  title: "Signal: our artist and the 2026 shirt",
  subject: "Meet the artist behind Signal",
  preheader: "Jenni Jean won our artist call-out. Her artwork will be with us all day.",
  audience: "subscribers",
  blocks: (n) => [
    image(n(), img("artwork-authenticity.jpg"), "Authenticity, an artwork by Jenni Jean: rows of red fingerprints with a single gold one", { width: "full" }),
    header(n(), "Meet the artist behind Signal."),
    text(
      n(),
      "<p>When we put out a call for artists to shape the look of Signal, the response from Newcastle's creative community was incredible.</p><p>One piece stopped us. It's called <strong>Authenticity</strong>, and it's by <strong>Jenni Jean</strong>, our winning artist.</p><p>Thank you, Jenni, for trusting us with your work. It will be with us throughout the day, and we can't wait for everyone to see it in the room.</p>",
    ),
    button(n(), "See more of Jenni's work", "https://jennijeanart.com.au", { theme: "ink", variant: "outline" }),
    divider(n()),
    header(n(), "Wearing the artwork", { size: "md" }),
    text(
      n(),
      "<p>Jenni's artwork also lands on this year's Signal shirt: the event details on the front, and the full piece on the back.</p>",
    ),
    columns(
      n(),
      [
        [cImage(n(), img("shirt-front.jpg"), "The front of the 2026 Signal shirt"), cText(n(), "<p>Front</p>")],
        [cImage(n(), img("shirt-back.jpg"), "The back of the 2026 Signal shirt, showing Jenni Jean's artwork"), cText(n(), "<p>Back</p>")],
      ],
      { ratio: "50-50" },
    ),
    divider(n()),
    header(n(), "See it in person", { size: "md" }),
    text(
      n(),
      "<p>Signal is on Saturday 24 October at the Conservatorium of Music, with Jenni's artwork on show all day.</p>",
    ),
    button(n(), "Get your ticket", `${SITE}/signal`),
    text(n(), "<p>Will and the TEDxNewy team</p>"),
  ],
};
export default draft;

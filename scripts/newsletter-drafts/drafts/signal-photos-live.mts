import {
  img, SITE, header, text, image, button,
  type Draft,
} from "../dsl.mts";

const draft: Draft = {
  slug: "signal-photos-live",
  title: "Signal photos are live",
  subject: "📸 The Signal photos are here",
  preheader: "320 photos from the afternoon, ready to browse and download.",
  audience: "subscribers",
  blocks: (n) => [
    header(n(), "The Signal photos are here."),
    image(
      n(),
      img("signal-photos-collage.jpg"),
      "Four photos from Signal: a speaker on the red circle, an applauding audience, two friends sharing a laugh and a guest in a blue suit",
      { width: "full", href: `${SITE}/signal` },
    ),
    text(
      n(),
      "<p>320 photos from Signal are now live on our website, captured on the day by our media partner Newy Digital.</p><p>Find yourself, your friends or your favourite moment from the afternoon, then browse and download the full set.</p>",
    ),
    button(n(), "See the Signal photos", `${SITE}/signal`, {
      theme: "red",
      variant: "solid",
      align: "center",
    }),
    text(
      n(),
      "<p>The talks are next. We'll add each video to the same page as it goes live, so keep an eye on it.</p><p>Thank you for being part of Signal.</p><p>Will and the TEDxNewy team</p>",
    ),
  ],
};

export default draft;

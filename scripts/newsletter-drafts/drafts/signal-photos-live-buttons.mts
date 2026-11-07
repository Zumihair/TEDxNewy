import {
  img, SITE, header, text, image, button, divider, columns, cButton, cImage,
  type Draft,
} from "../dsl.mts";

// Partner photos are pre-cropped squares in public/images/newsletter/.
// Leave `photo` empty to get a blank image slot to fill in the editor.
const PARTNERS: {
  name: string;
  url: string;
  photo: string;
  alt: string;
  line: string;
}[] = [
  {
    name: "Henderson",
    url: "https://henderson.com.au",
    photo: "signal-partner-henderson.jpg",
    alt: "Henderson merchandise on the Henderson stall at Signal",
    line: "Thank you for bringing your stall to Activation Alley.",
  },
  {
    name: "Sketch It Live",
    url: "http://sketchitlive.com.au",
    photo: "signal-partner-sketch-it-live.jpg",
    alt: "A Sketch It Live graphic recording of Signal on a desk",
    line: "Thank you for capturing the day in live graphic recordings.",
  },
  {
    name: "Ink and Snow",
    url: "https://www.inkandsnow.com",
    photo: "signal-partner-ink-and-snow.jpg",
    alt: "An Ink and Snow artist painting a live watercolour portrait",
    line: "Thank you for painting live watercolour portraits for guests in the foyer.",
  },
  {
    name: "Talk2MeBro",
    url: "https://www.talk2mebro.org.au",
    photo: "signal-partner-talk2mebro.jpg",
    alt: "Talk2MeBro merchandise on the Talk2MeBro stand",
    line: "Thank you for bringing your merch and information stand to Activation Alley.",
  },
  {
    name: "New Artists Collective",
    url: "https://www.newartistscollective.com",
    photo: "",
    alt: "New Artists Collective at Signal",
    line: "Thank you for bringing a mini-gallery of artwork to the foyer.",
  },
  {
    name: "Akrue",
    url: "https://akrue.com.au",
    photo: "signal-partner-akrue.jpg",
    alt: "Akrue flyers and stickers on the Akrue stall",
    line: "Thank you for joining us in Activation Alley.",
  },
  {
    name: "InHouse Plants",
    url: "https://www.inhouseplants.com.au",
    photo: "signal-partner-inhouse-plants.jpg",
    alt: "Guests potting plants at the InHouse Plants activation",
    line: "Thank you for joining us in Activation Alley.",
  },
  {
    name: "The Bridge Project",
    url: "https://www.thebridgeproject.com.au",
    photo: "",
    alt: "The Bridge Project at Signal",
    line: "Thank you for joining us in Activation Alley.",
  },
  {
    name: "Lefthand Design",
    url: "https://left-handesign.com",
    photo: "",
    alt: "Lefthand Design at Signal",
    line: "Thank you for joining us in Activation Alley.",
  },
  {
    name: "Bandigon",
    url: "https://bandigon.com",
    photo: "",
    alt: "Bandigon at Signal",
    line: "Thank you for joining us in Activation Alley.",
  },
  {
    name: "Cherry",
    url: "https://www.cherrypi.io/about",
    photo: "",
    alt: "Cherry at Signal",
    line: "Thank you for joining us in Activation Alley.",
  },
  {
    name: "Meandrix",
    url: "https://www.meandrix.com",
    photo: "",
    alt: "Meandrix at Signal",
    line: "Thank you for joining us in Activation Alley.",
  },
];

const draft: Draft = {
  slug: "signal-photos-live-buttons",
  title: "Signal photos + all partners (buttons)",
  subject: "📸 The Signal photos are here",
  preheader: "320 photos from the afternoon, ready to browse and download.",
  audience: "subscribers",
  blocks: (n) => [
    header(n(), "The Signal photos are here."),
    image(
      n(),
      img("signal-photos-collage.jpg"),
      "A collage of photos from Signal: the TEDxNewy stage, a guest celebrating, an applauding audience and two friends on the balcony",
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
      "<p>The talks are next. We'll add each video to the same page as it goes live, so keep an eye on it.</p>",
    ),
    divider(n(), "short", "soft"),
    header(n(), "Thank you to our activating partners", { size: "md" }),
    text(
      n(),
      "<p>Activation Alley was a big part of what made Signal feel alive, and that was down to these partners. Thank you for giving your time, your ideas and your energy to the day.</p>",
    ),
    ...PARTNERS.flatMap((p, i) => {
      const imgCol = [cImage(n(), p.photo ? img(p.photo) : "", p.alt)];
      const txtCol = [cButton(n(), `Learn more about ${p.name}`, p.url, { theme: "red", variant: "solid" })];
      const imageLeft = i % 2 === 0;
      return [
        header(n(), p.name, { size: "md" }),
        columns(n(), imageLeft ? [imgCol, txtCol] : [txtCol, imgCol], {
          ratio: imageLeft ? "40-60" : "60-40",
          valign: "middle",
          mobileOrder: "imageFirst",
        }),
      ];
    }),
    divider(n(), "short", "soft"),
    text(
      n(),
      "<p>Thank you for being part of Signal.</p><p>Will and the TEDxNewy team</p>",
    ),
  ],
};

export default draft;

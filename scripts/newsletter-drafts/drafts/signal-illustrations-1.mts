import {
  SITE, img, header, text, image, button, divider, columns, cText, cImage,
  type Draft,
} from "../dsl.mts";

const BETH = img("illustration-beth.jpg");
const JACOB = img("illustration-jacob.jpg");
const KELVIN = img("illustration-kelvin.jpg");

// TODO(Will): no gallery page exists yet. Until one does, this button opens the
// first illustration full size. Swap for a gallery link, then re-run the build.
const VIEW_ALL = BETH;

const draft: Draft = {
  slug: "signal-illustrations-1",
  title: "Signal illustrations 1: Beth, Jacob and Kelvin",
  subject: "🖍️ Signal, as it was drawn live",
  preheader: "Before the talk videos are released, see Beth, Jacob and Kelvin's talks sketched in real time.",
  audience: "subscribers",
  blocks: (n) => [
    image(n(), img("alex-desk-tedx.jpg"), "Alex Wegner's graphic recording desk at TEDxNewy Signal, covered in red and black marker artwork", { width: "full" }),
    header(n(), "Signal, as it was drawn live."),
    text(
      n(),
      "<p>Before talk videos from Signal are released, we wanted to share something a little different: the talks as they were drawn live on the day.</p><p>Over the next week we'll send you the illustrations from each session.</p>",
    ),
    divider(n()),
    columns(
      n(),
      [
        [cImage(n(), img("alex-portrait.jpg"), "Alex Wegner drawing on a tablet during Signal")],
        [
          cText(
            n(),
            "<p>Every one of these illustrations was created live at the event by our Official Graphic Recorder for TEDxNewy 2026: <strong>Alex Wegner of Sketch it Live</strong>.</p><p>Alex brought her talents to TEDxNewy for the first time this year. Her work means you can get a real feel for what each talk explored before the videos are released.</p>",
          ),
        ],
      ],
      { ratio: "40-60", valign: "middle" },
    ),
    text(
      n(),
      "<p>Alex founded <a href=\"https://sketchitlive.com.au\">Sketch it Live</a> in 2017, drawing on more than 20 years as a graphic designer, illustrator and UX designer in London, Sydney, Melbourne and Canberra. Her idea is simple: visual language is universal, and it makes information easier to take in and more engaging.</p>",
    ),
    divider(n()),
    header(n(), "The first three talks", { size: "md" }),
    image(n(), BETH, "Live illustration of Beth Gwalter's talk: regret and grief, the unlived life, sliding doors", { width: "full", href: BETH }),
    text(n(), "<p><strong>Beth Gwalter</strong> on grieving and mourning the decisions we didn't make.</p>"),
    image(n(), JACOB, "Live illustration of Jacob Ure's talk: place, short form video and bringing history into community", { width: "full", href: JACOB }),
    text(n(), "<p><strong>Jacob Ure</strong> on digital storytelling and bringing history into community.</p>"),
    image(n(), KELVIN, "Live illustration of Professor Kelvin Kong's talk: hearing loss, muku and the sound of silence", { width: "full", href: KELVIN }),
    text(n(), "<p><strong>Professor Kelvin Kong AM</strong> on otitis media, culture and healthcare equity.</p>"),
    button(n(), "Click to view illustrations here", VIEW_ALL),
    divider(n()),
    text(
      n(),
      "<p>Keep an eye out for the next set later this week.</p><p>~TEDxNewy Team</p>",
    ),
  ],
};
export default draft;

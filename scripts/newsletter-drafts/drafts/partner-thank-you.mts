import {
  SITE, img, header, text, image, button, divider,
  type Draft,
} from "../dsl.mts";

const draft: Draft = {
  slug: "partner-thank-you",
  title: "Signal: thank you to our partners",
  subject: "Thank you, Newy",
  preheader: "Signal only happens because of the people and businesses who back it.",
  audience: "subscribers",
  blocks: (n) => [
    image(n(), img("community.jpg"), "Attendees at a TEDxNewy event applauding", { width: "full" }),
    header(n(), "Thank you, Newy."),
    text(
      n(),
      "<p>Watching this city get behind the Knights in the NRL grand final was something special. A whole community pulling in the same direction.</p><p>Our event is a dwarf in comparison, but the feeling is the same. TEDxNewy has grown every year, and that has never happened without the support of our community.</p><p>As Signal gets closer, we want to say thank you.</p>",
    ),
    image(n(), img("partners-lockup.jpg"), "Our partners: University of Newcastle, Henderson, Hey Zomi, Frekl, Newy Digital and Sketch It Live", { width: 100 }),
    text(
      n(),
      "<p>To the University of Newcastle, Henderson, Hey Zomi, Frekl, Newy Digital and Sketch It Live: thank you for backing a volunteer-run event and for believing in what we're building.</p>",
    ),
    button(n(), "Meet our partners", `${SITE}/sponsors`, { theme: "ink", variant: "outline" }),
    divider(n()),
    header(n(), "What your support makes possible", { size: "md" }),
    text(
      n(),
      "<p><strong>A drinks hour for everyone.</strong> Local partners have made it possible to end the day together, with a drink in hand and the conversations still going.</p><p><strong>Offers across event week.</strong> Cafes, restaurants, bars and hotels around Newcastle have put together exclusive offers, so the event spills out into the whole city.</p><p><strong>Schools in the room.</strong> Our school partnerships bring young Novocastrians into the conversation, and their ideas onto the walls.</p><p><strong>Angel tickets.</strong> Every Angel ticket pays for a seat for someone who might not otherwise be there. Thank you to everyone who has paid it forward.</p><p><strong>Local makers.</strong> Local vendors have helped us produce the shirts, banners and materials you'll see on the day, and we're proud to keep that work in Newcastle.</p>",
    ),
    button(n(), "See what's on during event week", `${SITE}/downloads/make-the-most-of-event-week-guide.pdf`),
    divider(n()),
    text(
      n(),
      "<p>If you've bought a ticket, shared the event with a friend, or just cheered us on, that's part of this too.</p><p>See you on Saturday 24 October.</p><p>Will and the TEDxNewy team</p>",
    ),
    button(n(), "Get your ticket", `${SITE}/signal`, { theme: "ink" }),
  ],
};
export default draft;

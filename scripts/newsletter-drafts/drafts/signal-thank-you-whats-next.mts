import {
  SITE, img, header, text, image, button, divider,
  type Draft,
} from "../dsl.mts";

const draft: Draft = {
  slug: "signal-thank-you-whats-next",
  title: "Signal: thank you and what's next",
  subject: "You were the signal ❤️ Thank you, Newy",
  preheader: "Thank you for Signal. Keep an eye on your inbox this week: we've got something good coming.",
  audience: "subscribers",
  blocks: (n) => [
    image(n(), img("signal-hero.jpg"), "A packed audience at a TEDxNewy event", { width: "full" }),
    header(n(), "You were the signal."),
    text(
      n(),
      "<p>Thank you for being part of Signal on Saturday.</p><p>A room full of Novocastrians came together to share ideas, and that only works because people show up. You did.</p><p>We're still catching our breath, and we're very grateful.</p>",
    ),
    divider(n()),
    header(n(), "Thank you to our partners", { size: "md" }),
    image(n(), img("partners-lockup.jpg"), "Our partners: University of Newcastle, Henderson, Hey Zomi, Frekl, Newy Digital and Sketch It Live", { width: 100, href: `${SITE}/sponsors` }),
    text(
      n(),
      "<p>TEDxNewy is volunteer-run, and days like Saturday happen because local businesses and organisations back us.</p><p>Thank you to the <a href=\"https://www.newcastle.edu.au\">University of Newcastle</a>, <a href=\"https://henderson.com.au\">Henderson</a>, <a href=\"https://www.heyzomi.com\">Hey Zomi</a>, <a href=\"https://www.frekl.com.au\">Frekl</a> and <a href=\"https://www.newydigital.com\">Newy Digital</a>.</p><p>And to <a href=\"https://sketchitlive.com.au\">Sketch it Live</a>, whose Alex Wegner drew every talk live on the day. You'll be seeing a lot of her work this week.</p><p>If you're looking for someone to work with, please consider backing the people who backed us.</p>",
    ),
    button(n(), "Meet our partners", `${SITE}/sponsors`, { theme: "ink", variant: "outline" }),
    divider(n()),
    header(n(), "Keep an eye on your inbox", { size: "md" }),
    text(
      n(),
      "<p>Over the coming days we'll be sharing content from event day, a little at a time.</p><p>First up: the talks as they were drawn live on the day, before the videos are released.</p><p>Watch closely. We'd hate for you to miss it.</p>",
    ),
    divider(n()),
    header(n(), "Want to be part of what's next?", { size: "md" }),
    text(
      n(),
      "<p>Saturday didn't happen by itself. A crew of volunteers made it happen.</p><p>If you spent the day thinking <em>I could help with that</em>, we'd love to hear from you. No pressure. (Okay, a tiny bit of pressure.)</p>",
    ),
    button(n(), "Volunteer with us", `${SITE}/volunteer`),
    text(
      n(),
      "<p>Thank you again.</p><p>Will and the TEDxNewy team</p>",
    ),
  ],
};
export default draft;

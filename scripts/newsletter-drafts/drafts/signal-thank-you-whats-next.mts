import {
  SITE, img, header, text, image, button, divider,
  type Draft,
} from "../dsl.mts";

const draft: Draft = {
  slug: "signal-thank-you-whats-next",
  title: "Signal: thank you and what's next",
  subject: "You were the signal ❤️ Thank you, Newy",
  preheader: "Thank you for Signal. Photos are on the way, the talks are coming, and there's a ginger beer discount inside.",
  audience: "subscribers",
  blocks: (n) => [
    image(n(), img("signal-hero.jpg"), "A packed audience at a TEDxNewy event", { width: "full" }),
    header(n(), "You were the signal."),
    text(
      n(),
      "<p>Thank you for being part of Signal.</p><p>We came together to share ideas, and that only works because people like you show up.</p><p>We're still catching our breath, and we're very grateful.</p>",
    ),
    divider(n()),
    header(n(), "Thank you to everyone who made it happen", { size: "md" }),
    text(
      n(),
      "<p>To our speakers, <strong>Beth Gwalter</strong>, <strong>Jacob Ure</strong>, <strong>Professor Kelvin Kong AM</strong>, <strong>William Krause</strong>, <strong>Chloe McGovern</strong>, <strong>Melissa Histon</strong> and <strong>Sam Watson</strong>. Thank you for trusting us with your ideas and for the work behind every talk.</p><p>To our volunteers. TEDxNewy is volunteer-run, and the day only works because of the people who gave their time to make it feel effortless.</p><p>To <a href=\"https://sketchitlive.com.au\">Sketch it Live</a>, whose Alex Wegner drew every talk live on the day. You'll see her work in the next two emails.</p><p>And to everyone in the room. You made it what it was.</p>",
    ),
    divider(n()),
    header(n(), "Thank you to our partners", { size: "md" }),
    image(n(), img("partners-lockup.jpg"), "Our partners: University of Newcastle, Henderson, Hey Zomi, Frekl, Newy Digital and Sketch It Live", { width: 100, href: `${SITE}/sponsors` }),
    text(
      n(),
      "<p>Days like this happen because local businesses and organisations back us.</p><p>Thank you to the <a href=\"https://www.newcastle.edu.au\">University of Newcastle</a>, <a href=\"https://henderson.com.au\">Henderson</a>, <a href=\"https://www.heyzomi.com\">Hey Zomi</a>, <a href=\"https://www.frekl.com.au\">Frekl</a>, <a href=\"https://www.newydigital.com\">Newy Digital</a> and <a href=\"https://sketchitlive.com.au\">Sketch it Live</a>.</p><p>If you're looking for someone to work with, please consider backing the people who backed us.</p>",
    ),
    button(n(), "Meet our partners", `${SITE}/sponsors`, { theme: "ink", variant: "outline" }),
    divider(n()),
    header(n(), "What's coming", { size: "md" }),
    text(
      n(),
      "<p><strong>Photos are coming.</strong> We'll share the photos from the day soon.</p><p><strong>The talks will be uploaded for replay later in the year.</strong> We'll let you know the moment they're live.</p><p><strong>Live illustrations, in the next two emails.</strong> Before the videos are released, you'll see the talks as they were drawn on the day.</p>",
    ),
    divider(n()),
    header(n(), "Enjoy Ginger Beer?", { size: "md" }),
    image(n(), img("frekl-collage.jpg"), "Frekl ginger beer cans, and Frekl founder Hazel Kitson", { width: 100, href: "https://frekl.com.au/" }),
    text(
      n(),
      "<p>You might have tried Frekl while you were at TEDx this year...</p><p>Good time, guilt-free ginger beer. Ginger beer stayed the same for decades while the people drinking it moved on, so Newy local Hazel Kitson made a better one. Real Aussie ginger, zero sugar, and four flavours bringing a whole new crowd to the fridge.</p><p>In just 18 months Frekl has gone national, with 380+ stockists, and HQ is now back in Newy at Studio 97 on Bolton St.</p><p>This summer they're focusing on Newcastle, and they'd love your help getting on the radar of local cafes and restaurants. Know a spot that should be serving Frekl? Reply to this email with its name and we'll pass it on to Hazel.</p><p>As a thank you for being part of our community, Frekl is giving you <strong>15% off your order</strong>. Enter the code <strong>TEDX15</strong> at checkout.</p>",
    ),
    button(n(), "Shop Frekl with code TEDX15", "https://frekl.com.au/"),
    divider(n()),
    header(n(), "Want to be part of what's next?", { size: "md" }),
    text(
      n(),
      "<p>Signal didn't happen by itself. A crew of volunteers made it happen.</p><p>If you spent the day thinking <em>I could help with that</em>, we'd love to hear from you. No pressure. (Okay, a tiny bit of pressure.)</p>",
    ),
    button(n(), "Volunteer with us", `${SITE}/volunteer`, { theme: "ink", variant: "outline" }),
    text(
      n(),
      "<p>Thank you again.</p><p>Will and the TEDxNewy team</p>",
    ),
  ],
};
export default draft;

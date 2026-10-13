import {
  SITE, img, header, text, image, button, divider, columns, cText,
  type Draft,
} from "../dsl.mts";

const MAPS = "https://www.google.com/maps/search/?api=1&query=Newcastle+Conservatorium+of+Music";
const GUIDE = `${SITE}/downloads/make-the-most-of-event-week-guide.pdf`;

const row = (id: string, time: string, title: string, body: string) =>
  columns(
    id,
    [
      [cText(`${id}-t`, `<p><strong>${time}</strong></p>`)],
      [cText(`${id}-b`, `<p><strong>${title}</strong><br>${body}</p>`)],
    ],
    { ratio: "33-66" },
  );

const draft: Draft = {
  slug: "ticket-holder-event-details",
  title: "Signal: ticket holder event details",
  subject: "Signal is this Saturday: everything you need to know",
  preheader: "Doors, session times, the drinks hour and what to expect on the day.",
  audience: "ticket-purchasers",
  blocks: (n) => [
    image(n(), img("signal-hero.jpg"), "A packed audience at a TEDxNewy event", { width: "full" }),
    header(n(), "See you on Saturday."),
    text(
      n(),
      "<p>Signal is almost here, and we can't wait to share the day with you.</p><p>Here is everything you need to know before you arrive.</p>",
    ),
    header(n(), "Where and when", { size: "md" }),
    text(
      n(),
      "<p><strong>Saturday 24 October 2026</strong><br>Doors open at 1:30pm<br>Conservatorium of Music, corner Laman Street and Auckland Street, Newcastle NSW 2300</p>",
    ),
    button(n(), "Get directions", MAPS, { theme: "ink", variant: "outline" }),
    divider(n()),
    header(n(), "Your day", { size: "md" }),
    row(n(), "1:30pm to 2:00pm", "Arrival and registration", "Doors open. Check in, grab your name badge and find your seat."),
    row(n(), "2:00pm to 3:30pm", "Session 1", "We open the event, followed by talks and performances."),
    row(n(), "3:30pm to 4:00pm", "Intermission", "Out in the foyer. Grab a coffee, stretch your legs and meet someone new."),
    row(n(), "4:00pm to 5:30pm", "Session 2", "A secret showcase, then the second round of talks."),
    row(n(), "5:30pm to 6:30pm", "Drinks hour", "Join us in the foyer to unpack the afternoon, with a drink and canapes, and keep the conversations going."),
    divider(n()),
    header(n(), "What to expect", { size: "md" }),
    text(
      n(),
      "<ul><li>Talks and performances from Novocastrians, with every talk under 18 minutes</li><li>Activation spaces to explore, plus the Signal Side Quest, a phone game that runs through the day</li><li>A goody bag to take home</li><li>Artwork by our event artist, Jenni Jean, on display throughout the venue</li><li>The talks are recorded, with the aim of publishing on the TEDx YouTube channel afterwards</li></ul>",
    ),
    divider(n()),
    header(n(), "Make a day of it", { size: "md" }),
    text(
      n(),
      "<p>We don't provide a meal, so it's the perfect excuse to head out for lunch before the doors open, and dinner afterwards.</p><p>Local cafes, restaurants, bars and hotels have put together offers for ticket holders across event week. Just show your ticket or email confirmation.</p>",
    ),
    button(n(), "Download the Event Week Guide", GUIDE),
    divider(n()),
    header(n(), "Good to know", { size: "md" }),
    text(
      n(),
      "<ul><li>Smart casual is a great choice. Come comfortable, and feel like you're at something special.</li><li>Angel ticket holders have early access to the event as a thank you. Look out for your arrival details from us.</li><li>Need anything on the day, or have an access requirement? Reply to this email or write to <a href=\"mailto:event@tedxnewy.com.au\">event@tedxnewy.com.au</a>.</li></ul>",
    ),
    text(n(), "<p>See you there.</p><p>Will and the TEDxNewy team</p>"),
  ],
};
export default draft;

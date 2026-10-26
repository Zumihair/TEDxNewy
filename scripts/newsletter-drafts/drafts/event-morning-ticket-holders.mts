import {
  SITE, img, header, text, image, button, divider, columns, cText,
  type Draft,
} from "../dsl.mts";

const MAPS = "https://www.google.com/maps/search/?api=1&query=Newcastle+Conservatorium+of+Music";
const TRIP = "https://transportnsw.info/trip";

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
  slug: "event-morning-ticket-holders",
  title: "Signal: event morning",
  subject: "Today's the day: Signal starts at 2pm",
  preheader: "Doors open at 1:30pm. How to get here, how check-in works and what the day looks like.",
  audience: "ticket-purchasers",
  blocks: (n) => [
    image(n(), img("signal-hero.jpg"), "A packed audience at a TEDxNewy event", { width: "full" }),
    header(n(), "Today's the day."),
    text(
      n(),
      "<p>Signal is today, and we can't wait to see you.</p><p><strong>Check-in is easy.</strong> Come with your name, your email or your ticket. However you arrive, we'll work out who you are.</p>",
    ),
    header(n(), "Where and when", { size: "md" }),
    text(
      n(),
      "<p><strong>Saturday 24 October 2026</strong><br>Doors open at 1:30pm, event starts at 2:00pm<br>Conservatorium of Music, corner Laman Street and Auckland Street, Newcastle NSW 2300</p>",
    ),
    button(n(), "Get directions", MAPS, { theme: "ink", variant: "outline" }),
    divider(n()),
    header(n(), "Catch the light rail", { size: "md" }),
    text(
      n(),
      "<p>Parking in the city can be busy on a Saturday, so we'd love you to leave the car at home and catch the light rail in.</p><p>Hop off at <strong>Civic</strong>, head towards King St, and walk up the hill on the right of Civic Park. The Conservatorium is up the hill, at the corner of Laman and Auckland Streets.</p><p>Plan your trip with the Transport for NSW trip planner.</p>",
    ),
    button(n(), "Plan your trip", TRIP),
    divider(n()),
    header(n(), "Your day", { size: "md" }),
    row(n(), "1:30pm to 2:00pm", "Arrival and registration", "Doors open. Check in, grab your name badge and find your seat."),
    row(n(), "2:00pm to 3:30pm", "Session 1", "We open the event, followed by talks and performances."),
    row(n(), "3:30pm to 4:00pm", "Intermission", "Out in the foyer. Visit Activation Alley, play the Signal Side Quest and meet someone new."),
    row(n(), "4:00pm to 5:30pm", "Session 2", "A secret showcase, then the second round of talks."),
    row(n(), "5:30pm to 6:30pm", "Drinks hour", "Join us in the foyer to unpack the afternoon, and keep the conversations going."),
    text(n(), "<p>Your event day program, including the Signal Side Quest, is one tap away on your phone.</p>"),
    button(n(), "Open the event day program", `${SITE}/signal/links`),
    divider(n()),
    header(n(), "Be kind to our team", { size: "md" }),
    text(
      n(),
      "<p>Everyone on the TEDxNewy team is a volunteer, giving their time because they love this city and these ideas. We ask that you're kind and respectful to them, and to each other, at all times.</p><p>If you need help or support on the day, look for someone in a <strong>red shirt</strong>.</p>",
    ),
    divider(n()),
    image(n(), img("partners-lockup.jpg"), "Our partners: University of Newcastle, Henderson, Hey Zomi, Frekl, Newy Digital and Sketch It Live", { width: 100 }),
    header(n(), "Thank you to our partners", { size: "md" }),
    text(
      n(),
      "<p>Signal only happens because of the people and businesses who back it. Thank you to the University of Newcastle, Henderson, Hey Zomi, Frekl, Newy Digital, Sketch It Live and Hungerford Hill, to the venues offering event week deals, and to everyone who has helped make today a success.</p><p>See you this afternoon.</p><p>Will and the TEDxNewy team</p>",
    ),
  ],
};
export default draft;

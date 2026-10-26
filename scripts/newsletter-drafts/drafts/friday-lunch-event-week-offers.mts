import {
  SITE, img, header, text, image, button, divider, columns, cText, cImage, cButton,
  type Draft,
} from "../dsl.mts";

const GUIDE = `${SITE}/downloads/make-the-most-of-event-week-guide.pdf`;

const venue = (
  id: string,
  file: string,
  alt: string,
  name: string,
  body: string,
  offer: string,
  btn: { label: string; href: string; primary?: boolean },
) =>
  columns(
    id,
    [
      [cImage(`${id}-i`, img(file), alt, { ratio: "4:3" })],
      [
        cText(`${id}-t`, `<p><strong>${name}</strong><br>${body}</p><p><strong>${offer}</strong></p>`),
        cButton(`${id}-b`, btn.label, btn.href, btn.primary ? {} : { theme: "ink", variant: "outline" }),
      ],
    ],
    { ratio: "40-60", valign: "middle" },
  );

const draft: Draft = {
  slug: "friday-lunch-event-week-offers",
  title: "Signal: Friday event week offers",
  subject: "Dinner tonight? Breakfast tomorrow?",
  preheader: "It's not too late to enjoy our event week offers at venues around Newcastle.",
  audience: "ticket-purchasers",
  blocks: (n) => [
    image(n(), img("signal-hero.jpg"), "A packed audience at a TEDxNewy event", { width: "full" }),
    header(n(), "Thinking about dinner tonight?"),
    text(
      n(),
      "<p>Or breakfast tomorrow?</p><p>It's not too late to enjoy our event week offers. Local venues around Newcastle have put together something special for ticket holders, and a few of them are waiting for you tonight and tomorrow morning.</p><p>Just show your ticket or email confirmation.</p>",
    ),
    header(n(), "Dinner and drinks tonight", { size: "md" }),
    venue(
      n(), "venue-lolas.jpg", "A table at LOLAs on Darby Street", "LOLAs",
      "A Darby St favourite for lunch, dinner and a drink.",
      "Free TEDx Spritz with your meal.",
      { label: "Book a table", href: "https://www.sevenrooms.com/landing/lolasdarbystreetnewcastle", primary: true },
    ),
    divider(n(), "thin"),
    venue(
      n(), "venue-kingfish.jpg", "The Kingfish at Honeysuckle", "The Kingfish",
      "Waterfront dining at Honeysuckle. A drink, a meal and dessert by the water.",
      "Free bottle of house wine with a seafood platter.",
      { label: "Book a table", href: "https://www.sevenrooms.com/explore/thekingfish/reservations/create/search?venues=thekingfish%2Cblanca", primary: true },
    ),
    divider(n(), "thin"),
    venue(
      n(), "venue-grain-store.jpg", "The Grain Store taproom in East End", "The Grain Store",
      "Twenty one taps of independent beer in an old East End grain warehouse.",
      "Limited TEDx IPA while stock lasts, and $7 schooners (usually $12).",
      { label: "Book a table", href: "https://www.grainstore.beer/online-booking/", primary: true },
    ),
    divider(n()),
    header(n(), "Breakfast tomorrow", { size: "md" }),
    text(n(), "<p>Doors open at 1:30pm tomorrow, so there's plenty of time for a slow morning.</p>"),
    venue(
      n(), "venue-one-penny-black.jpg", "One Penny Black on Hunter Street", "One Penny Black",
      "A Newcastle institution on Hunter St, with specialty coffee, big breakfasts and lunch.",
      "20% off your order.",
      { label: "Get directions", href: "https://www.google.com/maps/dir/?api=1&destination=One+Penny+Black%2C+196+Hunter+St%2C+Newcastle+NSW" },
    ),
    divider(n(), "thin"),
    venue(
      n(), "venue-momo-wholefood.jpg", "Momo Wholefood in the heritage bank building on Hunter Street", "Momo Wholefood",
      "Fresh, seasonal wholefood in a heritage bank building on the corner of Hunter and Brown Streets. Plenty of vegan and vegetarian options.",
      "Free small coffee with any main.",
      { label: "Get directions", href: "https://www.google.com/maps/dir/?api=1&destination=Momo+Wholefood%2C+227+Hunter+St%2C+Newcastle+NSW" },
    ),
    divider(n()),
    header(n(), "See you tomorrow", { size: "md" }),
    text(
      n(),
      "<p><strong>Saturday 24 October 2026</strong><br>Doors open at 1:30pm<br>Conservatorium of Music, corner Laman Street and Auckland Street, Newcastle</p><p>There are more offers across Newcastle in the Event Week Guide, if you'd like to see what else is on.</p>",
    ),
    button(n(), "See all event week offers", GUIDE, { theme: "ink", variant: "outline" }),
    text(n(), "<p>Will and the TEDxNewy team</p>"),
  ],
};
export default draft;

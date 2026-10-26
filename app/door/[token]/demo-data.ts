import type { DoorParty, DoorRoster, DoorTicket } from "@/lib/door-types";

/** Made-up guests for /door/demo. Nothing here is a real person. */
const t = (
  id: string,
  name: string,
  ticketType: string,
  extra: Partial<DoorTicket> = {},
): DoorTicket => ({
  id,
  name,
  ticketType,
  supporter: false,
  shirt: null,
  codes: [id],
  hxChecked: false,
  ...extra,
});

const party = (
  orderId: string,
  buyer: string,
  phone: string,
  tickets: DoorTicket[],
): DoorParty => ({
  orderId,
  buyer,
  email: `${buyer.toLowerCase().replace(/ /g, ".")}@example.com`,
  phone,
  tickets,
});

const parties: DoorParty[] = [
  party("o1", "Alex Morgan", "0400 111 222", [
    t("a1", "Alex Morgan", "Standard"),
    t("a2", "Jordan Lee", "Standard"),
    t("a3", "Sam Rivera", "Standard"),
  ]),
  party("o2", "Priya Nair", "0411 222 333", [
    t("b1", "Priya Nair", "Angel", { supporter: true, shirt: "M" }),
    t("b2", "Dev Nair", "Angel", { supporter: true, shirt: "L" }),
  ]),
  party("o3", "Casey Brown", "0422 333 444", [t("c1", "Casey Brown", "Concession")]),
  party("o4", "Mia Thompson", "0433 444 555", [
    t("d1", "Mia Thompson", "Standard", { shirt: "S" }),
    t("d2", "Liam Thompson", "Standard", { shirt: "XL" }),
  ]),
  party("o5", "Noah Williams", "0444 555 666", [
    t("e1", "Noah Williams", "Complementary", { supporter: true }),
  ]),
  party("o6", "Isla Chen", "0455 666 777", [
    t("f1", "Isla Chen", "Standard"),
    t("f2", "Oscar Chen", "Standard"),
    t("f3", "Ruby Chen", "Standard"),
    t("f4", "Leo Chen", "Standard"),
  ]),
  party("o7", "Harper Singh", "0466 777 888", [
    t("g1", "Harper Singh", "Angel", { supporter: true, shirt: "S" }),
  ]),
  party("o8", "Ethan Walker", "0477 888 999", [
    t("h1", "Ethan Walker", "Standard"),
    t("h2", "Zoe Walker", "Standard"),
  ]),
];

export const DEMO_ROSTER: DoorRoster = {
  eventId: "demo",
  eventName: "TEDxNewy Signal (demo)",
  startDate: null,
  parties,
  fetchedAt: new Date().toISOString(),
  diag: [],
};

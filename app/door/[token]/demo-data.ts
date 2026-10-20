import type { DoorParty, DoorRoster } from "@/lib/door-types";

/** Made-up guests for /door/demo. Nothing here is a real person. */
const t = (
  id: string,
  name: string,
  ticketType: string,
  extra: Partial<DoorParty["tickets"][number]> = {},
): DoorParty["tickets"][number] => ({
  id,
  name,
  ticketType,
  shirt: null,
  perks: [],
  answers: [],
  codes: [id],
  hxChecked: false,
  ...extra,
});

const parties: DoorParty[] = [
  {
    orderId: "o1",
    buyer: "Alex Morgan",
    email: "alex.morgan@example.com",
    phone: "0400 111 222",
    orderAnswers: [{ q: "Postcode", a: "2300" }],
    tickets: [
      t("a1", "Alex Morgan", "Standard ticket"),
      t("a2", "Jordan Lee", "Standard ticket"),
      t("a3", "Sam Rivera", "Standard ticket"),
    ],
  },
  {
    orderId: "o2",
    buyer: "Priya Nair",
    email: "priya.nair@example.com",
    phone: "0411 222 333",
    orderAnswers: [{ q: "Postcode", a: "2304" }],
    tickets: [
      t("b1", "Priya Nair", "Supporter ticket", {
        shirt: "M",
        perks: ["Supporter gift", "T-shirt M"],
        answers: [{ q: "Dietary requirements", a: "Vegetarian" }],
      }),
      t("b2", "Dev Nair", "Supporter ticket", {
        shirt: "L",
        perks: ["Supporter gift", "T-shirt L"],
      }),
    ],
  },
  {
    orderId: "o3",
    buyer: "Casey Brown",
    email: "casey.brown@example.com",
    phone: "0422 333 444",
    orderAnswers: [],
    tickets: [t("c1", "Casey Brown", "Concession ticket")],
  },
  {
    orderId: "o4",
    buyer: "Mia Thompson",
    email: "mia.thompson@example.com",
    phone: "0433 444 555",
    orderAnswers: [],
    tickets: [
      t("d1", "Mia Thompson", "Standard ticket + T-shirt", { shirt: "S", perks: ["T-shirt S"] }),
      t("d2", "Liam Thompson", "Standard ticket + T-shirt", { shirt: "XL", perks: ["T-shirt XL"] }),
    ],
  },
  {
    orderId: "o5",
    buyer: "Noah Williams",
    email: "noah.williams@example.com",
    phone: "0444 555 666",
    orderAnswers: [],
    tickets: [t("e1", "Noah Williams", "Standard ticket")],
  },
  {
    orderId: "o6",
    buyer: "Isla Chen",
    email: "isla.chen@example.com",
    phone: "0455 666 777",
    orderAnswers: [],
    tickets: [
      t("f1", "Isla Chen", "Standard ticket"),
      t("f2", "Oscar Chen", "Standard ticket"),
      t("f3", "Ruby Chen", "Standard ticket"),
      t("f4", "Leo Chen", "Standard ticket"),
    ],
  },
  {
    orderId: "o7",
    buyer: "Harper Singh",
    email: "harper.singh@example.com",
    phone: "0466 777 888",
    orderAnswers: [],
    tickets: [
      t("g1", "Harper Singh", "Supporter ticket", { shirt: "S", perks: ["Supporter gift", "T-shirt S"] }),
    ],
  },
  {
    orderId: "o8",
    buyer: "Ethan Walker",
    email: "ethan.walker@example.com",
    phone: "0477 888 999",
    orderAnswers: [],
    tickets: [t("h1", "Ethan Walker", "Standard ticket"), t("h2", "Zoe Walker", "Standard ticket")],
  },
];

export const DEMO_ROSTER: DoorRoster = {
  eventId: "demo",
  eventName: "TEDxNewy Signal (demo)",
  startDate: null,
  parties,
  fetchedAt: new Date().toISOString(),
  diag: [],
};

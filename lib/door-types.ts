/** Shapes shared by the door check-in API and its client. No server imports. */

export type DoorAnswer = { q: string; a: string };

export type DoorTicket = {
  id: string;
  name: string;
  ticketType: string;
  /** T-shirt size when the checkout asked for one. */
  shirt: string | null;
  /** Short callouts for the volunteer: "Supporter gift", "T-shirt L". */
  perks: string[];
  answers: DoorAnswer[];
  /** Everything a ticket QR code might encode (ids, barcodes, numbers). */
  codes: string[];
  /** Already scanned in at Humanitix. */
  hxChecked: boolean;
};

export type DoorParty = {
  orderId: string;
  buyer: string;
  email: string;
  phone: string;
  tickets: DoorTicket[];
  orderAnswers: DoorAnswer[];
};

export type DoorRoster = {
  eventId: string;
  eventName: string;
  startDate: string | null;
  parties: DoorParty[];
  fetchedAt: string;
  /** Field names only (never values), to debug an unexpected Humanitix shape. */
  diag: string[];
};

export type DoorCheckin = { at: string; by: string | null };

export type DoorState = {
  checkins: Record<string, DoorCheckin>;
  /** The door_checkins table has not been created yet. */
  needsSetup?: boolean;
};

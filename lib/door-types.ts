/** Shapes shared by the door check-in API and its client. No server imports. */

export type DoorTicket = {
  id: string;
  name: string;
  ticketType: string;
  /** Angel and complimentary tickets. An admin can switch it off per ticket. */
  supporter: boolean;
  /** T-shirt size, unisex: "M", "XL". */
  shirt: string | null;
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
  /** Ticket ids an admin has taken the supporter tag off. */
  noSupporter: string[];
};

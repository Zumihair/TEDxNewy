/**
 * Creates a Google Calendar event on the TEDxNewy organiser's calendar and
 * emails invites to the attendees. Uses an OAuth refresh token for that
 * account (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN).
 * Never throws; returns null on failure and logs without secrets.
 */
import "server-only";

export function googleCalendarConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN,
  );
}

async function accessToken(): Promise<string | null> {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN ?? "",
        grant_type: "refresh_token",
      }),
      signal: AbortSignal.timeout(8000),
    });
    const json = (await res.json()) as { access_token?: string; error?: string };
    if (!json.access_token) console.error(`[google] token refresh failed: ${json.error}`);
    return json.access_token ?? null;
  } catch {
    return null;
  }
}

export type CreatedEvent = { id: string; url: string };

export async function createCalendarEvent(input: {
  summary: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  attendees: string[];
}): Promise<CreatedEvent | null> {
  const token = await accessToken();
  if (!token) return null;
  try {
    const res = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: input.summary,
          description: input.description,
          location: input.location,
          start: { dateTime: input.startsAt, timeZone: "Australia/Sydney" },
          end: { dateTime: input.endsAt, timeZone: "Australia/Sydney" },
          attendees: input.attendees.map((email) => ({ email })),
          guestsCanModify: false,
          reminders: { useDefault: true },
        }),
        signal: AbortSignal.timeout(15000),
      },
    );
    const json = (await res.json()) as { id?: string; htmlLink?: string; error?: { message?: string } };
    if (!res.ok || !json.id) {
      console.error(`[google] event create failed: HTTP ${res.status} ${json.error?.message ?? ""}`);
      return null;
    }
    return { id: json.id, url: json.htmlLink ?? "" };
  } catch {
    return null;
  }
}

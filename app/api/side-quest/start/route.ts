import { NextResponse, type NextRequest } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import {
  SESSION_COOKIE,
  cleanFirstName,
  cleanLastName,
  clientIp,
  hashToken,
  isNotSetUp,
  nameKey,
  namesReady,
  newToken,
  rateLimited,
  sessionCookieOptions,
} from "@/lib/side-quest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * Start a Side Quest. Anonymous: a first name in, a random token out.
 * Only a hash of the token is stored. The token goes back to the browser in
 * the body (kept in localStorage) AND in an httpOnly cookie, so a refresh or
 * a QR scan that opens a fresh tab still finds the same session.
 */
export async function POST(req: NextRequest) {
  // Generous: a foyer of phones can share one carrier or wifi address.
  if (rateLimited(`start:${clientIp(req)}`, 300, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many people starting at once. Try again in a moment." },
      { status: 429, headers: NO_STORE },
    );
  }

  let body: { firstName?: unknown; lastName?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // fall through to validation
  }
  const firstName = cleanFirstName(body.firstName);
  if (!firstName) {
    return NextResponse.json(
      { error: "Add your first name to start." },
      { status: 400, headers: NO_STORE },
    );
  }
  const lastName = cleanLastName(body.lastName);
  if (!lastName) {
    return NextResponse.json(
      { error: "Add your last name to start." },
      { status: 400, headers: NO_STORE },
    );
  }

  const token = newToken();
  const ready = await namesReady();
  // Before the names migration is applied, keep the full name in the one
  // first_name column so winners are still identifiable. There is no
  // duplicate guard until the migration runs.
  const row: Record<string, string> = ready
    ? {
        token_hash: hashToken(token),
        first_name: firstName,
        last_name: lastName,
        name_key: nameKey(firstName, lastName),
      }
    : {
        token_hash: hashToken(token),
        first_name: `${firstName} ${lastName}`.slice(0, 60),
      };
  const { error } = await getAdminSupabase()
    .from("side_quest_sessions")
    .insert(row);
  if (error) {
    // The unique index on name_key is the real guard. Catching its violation
    // (rather than only pre-checking) handles two people racing for one name.
    if (error.code === "23505" && ready) {
      return NextResponse.json(
        {
          error: `Someone is already playing as ${firstName} ${lastName}. Add a middle initial or a nickname and try again.`,
          code: "name_taken",
        },
        { status: 409, headers: NO_STORE },
      );
    }
    if (isNotSetUp(error)) {
      return NextResponse.json(
        { error: "Side Quest is not open yet." },
        { status: 503, headers: NO_STORE },
      );
    }
    console.error("[side-quest/start]", error);
    return NextResponse.json(
      { error: "Something went wrong. Try again." },
      { status: 500, headers: NO_STORE },
    );
  }

  const res = NextResponse.json({ token }, { headers: NO_STORE });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}

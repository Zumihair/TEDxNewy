import "server-only";
import { createHash, randomBytes } from "crypto";
import type { NextRequest } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";

/**
 * Signal Side Quest: server-side logic for the intermission phone game
 * (app/signal/links/side-quest, app/api/side-quest/*, app/admin/side-quest).
 *
 * Everything here runs with the service key against RLS-locked tables
 * (migration 20261006_side_quest.sql has RLS on and NO policies). That is
 * deliberate: the repo is public and puzzle answers live in the database,
 * so they must never be reachable by an anon client. Nothing in this file
 * ever returns `puzzle_answer` to a caller, and no caller can set a score:
 * the score is always recomputed here from completions.
 */

/** 10 or more points = one entry into the prize draw. No tiers. */
export const PRIZE_THRESHOLD = 10;
export const MAX_NAME_LENGTH = 24;
export const MAX_LAST_NAME_LENGTH = 32;
export const SESSION_COOKIE = "sq_session";
export const SESSION_HEADER = "x-side-quest-token";
const SESSION_MAX_AGE_S = 60 * 60 * 24 * 3;

export type Category = "connect" | "capture" | "discover";
export type ChallengeType = "social" | "photo" | "qr";

export type ChallengeRow = {
  id: string;
  title: string;
  description: string;
  category: Category;
  type: ChallengeType;
  points: number;
  sort: number;
  active: boolean;
  qr_number: number | null;
  puzzle_prompt: string | null;
  puzzle_answer: string | null;
};

export type SessionRow = {
  id: string;
  first_name: string;
  score: number;
  prize_eligible: boolean;
  eligible_at: string | null;
  photo_notice_at: string | null;
};

/** What the browser is allowed to see about a challenge. No answers. */
export type PublicChallenge = {
  id: string;
  title: string;
  description: string;
  category: Category;
  type: ChallengeType;
  points: number;
  done: boolean;
};

export type MeResponse = {
  firstName: string;
  score: number;
  maxScore: number;
  prizeEligible: boolean;
  photoNoticeAck: boolean;
  challenges: PublicChallenge[];
};

const SESSION_COLS =
  "id, first_name, score, prize_eligible, eligible_at, photo_notice_at";

/** Migration not applied yet (table missing). */
export function isNotSetUp(error: { code?: string } | null | undefined) {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

// ---------------------------------------------------------------- tokens

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_S,
  };
}

function readToken(req: NextRequest): string | null {
  const header = req.headers.get(SESSION_HEADER);
  const raw = header || req.cookies.get(SESSION_COOKIE)?.value || "";
  // Tokens are 43 chars of base64url. Anything else is junk.
  return /^[A-Za-z0-9_-]{20,80}$/.test(raw) ? raw : null;
}

/** Resolve the caller's session from the header or the cookie. */
export async function getSession(
  req: NextRequest,
): Promise<SessionRow | null> {
  const token = readToken(req);
  if (!token) return null;
  const db = getAdminSupabase();
  const { data } = await db
    .from("side_quest_sessions")
    .select(SESSION_COLS)
    .eq("token_hash", hashToken(token))
    .maybeSingle();
  if (!data) return null;
  // Fire and forget: freshness is only used for admin stats.
  void db
    .from("side_quest_sessions")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", data.id)
    .then(() => undefined);
  return data as SessionRow;
}

// ------------------------------------------------------------ rate limit

/**
 * Light, best-effort limiter. State is per serverless instance, so it is a
 * speed bump and not a hard wall. The QR answer route adds a durable check
 * against side_quest_qr_attempts, which is what really stops brute force.
 */
const hits = new Map<string, number[]>();

export function rateLimited(
  key: string,
  max: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (!v.some((t) => now - t < windowMs)) hits.delete(k);
    }
  }
  return false;
}

export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  return fwd.split(",")[0]?.trim() || "unknown";
}

// -------------------------------------------------------------- answers

/** Lowercase and drop everything except letters and digits. */
export function normaliseAnswer(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]/g, "");
}

/** Stored answers may list alternatives separated by a pipe. */
export function answerMatches(given: string, stored: string | null): boolean {
  const g = normaliseAnswer(given);
  if (!g || !stored) return false;
  return stored
    .split("|")
    .map(normaliseAnswer)
    .filter(Boolean)
    .includes(g);
}

/**
 * Tidy a name part: collapse spaces, cap the length, and allow only letters
 * (any script), marks, spaces, hyphens, apostrophes and full stops (for a
 * middle initial). Returns null when nothing usable is left.
 */
export function cleanNamePart(raw: unknown, max: number): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.replace(/\s+/g, " ").trim().slice(0, max).trim();
  if (!name || !/^[\p{L}\p{M}][\p{L}\p{M} '\u2019.-]*$/u.test(name)) {
    return null;
  }
  return name;
}

export function cleanFirstName(raw: unknown): string | null {
  return cleanNamePart(raw, MAX_NAME_LENGTH);
}

export function cleanLastName(raw: unknown): string | null {
  return cleanNamePart(raw, MAX_LAST_NAME_LENGTH);
}

/**
 * The duplicate-guard key for a full name: case, spacing, punctuation and
 * accents all ignored, so "Sam  Lee", "sam lee" and "Sam Lee" with accents
 * are one person. Stored in `side_quest_sessions.name_key` behind a unique
 * index.
 */
export function nameKey(first: string, last: string): string {
  const norm = (s: string) =>
    s
      .normalize("NFKD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]/gu, "");
  return `${norm(first)}|${norm(last)}`;
}

let namesKnownReady = false;
let namesCheckedAt = 0;

/**
 * Whether migration 20261008_side_quest_names.sql has been applied (the
 * last_name and name_key columns exist). The game works either way: without
 * it, the first and last name are stored joined in the one first_name column
 * and there is no duplicate guard. A positive answer is cached for good, a
 * negative one is re-checked every 20 seconds so applying the SQL takes
 * effect without a redeploy.
 */
export async function namesReady(): Promise<boolean> {
  if (namesKnownReady) return true;
  if (Date.now() - namesCheckedAt < 20_000) return false;
  namesCheckedAt = Date.now();
  const { error } = await getAdminSupabase()
    .from("side_quest_sessions")
    .select("last_name, name_key")
    .limit(1);
  if (!error) {
    namesKnownReady = true;
    return true;
  }
  return false;
}

// ------------------------------------------------------------ challenges

export async function getChallenge(
  id: string,
): Promise<ChallengeRow | null> {
  const { data } = await getAdminSupabase()
    .from("side_quest_challenges")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as ChallengeRow | null) ?? null;
}

export async function getChallengeByQr(
  n: number,
): Promise<ChallengeRow | null> {
  const { data } = await getAdminSupabase()
    .from("side_quest_challenges")
    .select("*")
    .eq("qr_number", n)
    .eq("active", true)
    .maybeSingle();
  return (data as ChallengeRow | null) ?? null;
}

async function recomputeScore(sessionId: string): Promise<SessionRow | null> {
  const db = getAdminSupabase();
  const { data: rows } = await db
    .from("side_quest_completions")
    .select("points")
    .eq("session_id", sessionId);
  const score = (rows ?? []).reduce(
    (sum, r) => sum + (r.points as number),
    0,
  );
  const { data: current } = await db
    .from("side_quest_sessions")
    .select("eligible_at")
    .eq("id", sessionId)
    .maybeSingle();
  const eligible = score >= PRIZE_THRESHOLD;
  const patch: Record<string, unknown> = {
    score,
    prize_eligible: eligible,
  };
  // Stamp the moment they first crossed the line, once.
  if (eligible && !current?.eligible_at) {
    patch.eligible_at = new Date().toISOString();
  }
  const { data } = await db
    .from("side_quest_sessions")
    .update(patch)
    .eq("id", sessionId)
    .select(SESSION_COLS)
    .maybeSingle();
  return (data as SessionRow | null) ?? null;
}

/**
 * Award a challenge to a session, at most once. The unique
 * (session_id, challenge_id) constraint is the real guard, so two taps or two
 * tabs racing each other still score once. Returns whether THIS call awarded.
 */
export async function awardCompletion(
  session: SessionRow,
  challenge: ChallengeRow,
): Promise<{ awarded: boolean; session: SessionRow }> {
  const db = getAdminSupabase();
  const { data: inserted } = await db
    .from("side_quest_completions")
    .upsert(
      {
        session_id: session.id,
        challenge_id: challenge.id,
        points: challenge.points,
      },
      { onConflict: "session_id,challenge_id", ignoreDuplicates: true },
    )
    .select("id");
  const awarded = (inserted?.length ?? 0) > 0;
  const fresh = (await recomputeScore(session.id)) ?? session;
  return { awarded, session: fresh };
}

export async function buildMe(session: SessionRow): Promise<MeResponse> {
  const db = getAdminSupabase();
  const [{ data: challenges }, { data: done }] = await Promise.all([
    db
      .from("side_quest_challenges")
      .select("id, title, description, category, type, points, sort")
      .eq("active", true)
      .order("sort", { ascending: true }),
    db
      .from("side_quest_completions")
      .select("challenge_id")
      .eq("session_id", session.id),
  ]);
  const doneIds = new Set((done ?? []).map((d) => d.challenge_id as string));
  const list = (challenges ?? []).map((c) => ({
    id: c.id as string,
    title: c.title as string,
    description: c.description as string,
    category: c.category as Category,
    type: c.type as ChallengeType,
    points: c.points as number,
    done: doneIds.has(c.id as string),
  }));
  return {
    firstName: session.first_name,
    score: session.score,
    maxScore: list.reduce((s, c) => s + c.points, 0),
    prizeEligible: session.prize_eligible,
    photoNoticeAck: !!session.photo_notice_at,
    challenges: list,
  };
}

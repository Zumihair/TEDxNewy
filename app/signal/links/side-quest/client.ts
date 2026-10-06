"use client";

/**
 * Browser-side helpers for Signal Side Quest. The session token is kept in
 * localStorage (every access wrapped in try/catch, since private windows and
 * blocked site data can throw) and ALSO lives in an httpOnly cookie set by
 * the server, so a fresh tab opened by a QR scan still resolves the session
 * even if localStorage is empty.
 */

import type { MeResponse } from "@/lib/side-quest";

const TOKEN_KEY = "sq_token";
export const SIDE_QUEST_HOME = "/signal/links/side-quest";

export function readToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function saveToken(token: string) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // The cookie still carries the session.
  }
}

export function clearToken() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string };

/** fetch wrapper that sends the token header and never throws. */
export async function sqFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiResult<T>> {
  const headers = new Headers(init.headers);
  const token = readToken();
  if (token) headers.set("x-side-quest-token", token);
  if (init.body && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  try {
    const res = await fetch(path, { ...init, headers, cache: "no-store" });
    let json: unknown = null;
    try {
      json = await res.json();
    } catch {
      // empty body
    }
    if (!res.ok) {
      const err =
        (json as { error?: string } | null)?.error ??
        "Something went wrong. Try again.";
      return { ok: false, status: res.status, error: err };
    }
    return { ok: true, status: res.status, data: json as T };
  } catch {
    return {
      ok: false,
      status: 0,
      error: "No connection. Check your signal and try again.",
    };
  }
}

export type CompleteResponse = {
  awarded: boolean;
  crossedPrizeLine: boolean;
  me: MeResponse;
};

export type QrPrompt = {
  title: string;
  prompt: string;
  points: number;
  alreadyDone: boolean;
};

export type QrAnswerResponse = {
  correct: boolean;
  awarded?: boolean;
  points?: number;
  crossedPrizeLine?: boolean;
  me?: MeResponse;
};

export type PhotoResponse = {
  awarded: boolean;
  points: number;
  crossedPrizeLine: boolean;
  me: MeResponse;
};

export const PHOTO_NOTICE =
  "Photos you submit may appear on the TEDxNewy photo wall and be used by TEDxNewy in event content. Only photograph people who are happy to be in it.";

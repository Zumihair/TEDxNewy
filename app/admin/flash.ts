/**
 * Shared bits for the ?flash= style of redirect, used by server actions that
 * hand a free-text message back to the page they came from.
 *
 * No "use client" here on purpose: both server actions and client components
 * import it, and a value exported from a client module resolves to a client
 * reference stub when a server component imports it back (the TABS.map bug in
 * CLAUDE.md).
 */

export type ToastTone = "success" | "error" | "warning";

const TONES: ToastTone[] = ["success", "error", "warning"];

/** Reads a ?tone= param. Anything unrecognised (or absent) reads as success,
 *  which is what every one of these messages meant before tones existed. */
export function asTone(value: string | undefined): ToastTone {
  return TONES.includes(value as ToastTone) ? (value as ToastTone) : "success";
}

/** Builds `path?flash=…&tone=…`, preserving any query already on `path`. */
export function flashUrl(
  path: string,
  message: string,
  tone: ToastTone = "success",
): string {
  const join = path.includes("?") ? "&" : "?";
  const t = tone === "success" ? "" : `&tone=${tone}`;
  return `${path}${join}flash=${encodeURIComponent(message)}${t}`;
}

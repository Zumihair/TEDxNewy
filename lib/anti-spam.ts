/**
 * Lightweight, no-infra bot filtering shared by the public form routes
 * (/api/volunteer, /api/subscribe). Four cheap, invisible layers:
 *
 *   1. Honeypot   — a hidden "website" field only a bot fills in.
 *   2. Same-origin — browsers send `Origin` on form POSTs; drop cross-site.
 *   3. Timing     — JS stamps render time in `t`; near-instant submits are bots.
 *   4. Link trap  — URLs/markup in fields that should never contain them.
 *
 * Any hit means "drop silently": the caller pretends success (redirects to the
 * normal thanks page) but skips the insert and the emails, so a scripted bot
 * gets no signal to iterate against. Every layer tolerates its own absence
 * (no Origin header, no JS timestamp) so real visitors are never blocked; a
 * genuine submission has to trip nothing.
 *
 * The honeypot + timestamp fields are injected by components/SubmitLockForm.
 */

const ALLOWED_HOST_SUFFIXES = ["tedxnewy.com.au"];
const MIN_FILL_MS = 800; // faster than this = not a human filling a form

export type SpamCheck = { spam: boolean; reason?: string };

export function checkSubmission(
  req: Request,
  data: Record<string, string>,
  opts: { textFields?: string[] } = {},
): SpamCheck {
  // 1. Honeypot — no human sees or fills this off-screen field.
  if ((data.website ?? "").trim() !== "") {
    return { spam: true, reason: "honeypot" };
  }

  // 2. Same-origin — modern browsers attach Origin to state-changing form
  //    POSTs. A present-but-foreign Origin is a bot hitting the API directly.
  //    An absent Origin is tolerated (some privacy setups strip it).
  const origin = req.headers.get("origin");
  if (origin) {
    try {
      const host = new URL(origin).hostname;
      const ok =
        ALLOWED_HOST_SUFFIXES.some((s) => host === s || host.endsWith(`.${s}`)) ||
        host === "localhost" ||
        host.endsWith(".vercel.app");
      if (!ok) return { spam: true, reason: "origin" };
    } catch {
      return { spam: true, reason: "origin-parse" };
    }
  }

  // 3. Timing — `t` is the elapsed ms the form measured between becoming
  //    interactive and being submitted, read from a single (client) clock, so
  //    device clock skew can't affect it. Implausibly fast = bot. There is no
  //    upper bound: a tab left open for hours is a real person. Absent = a
  //    no-JS visitor (nothing measured it), which we allow.
  const raw = (data.t ?? "").trim();
  if (raw) {
    const elapsed = Number(raw);
    if (!Number.isFinite(elapsed)) return { spam: true, reason: "ts-nan" };
    if (elapsed < MIN_FILL_MS) return { spam: true, reason: "timing" };
  }

  // 4. Link trap — a URL or anchor markup in a name field is always spam.
  //    (Deliberately not applied to free-text notes: a volunteer may paste a
  //    genuine portfolio link there.)
  const linkish = /https?:\/\/|www\.|\[url|<a\s|\bhref=/i;
  for (const f of opts.textFields ?? []) {
    if (linkish.test(data[f] ?? "")) return { spam: true, reason: `link:${f}` };
  }

  return { spam: false };
}

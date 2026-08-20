/**
 * Minimal Apollo.io client for the partnerships portal.
 *
 * Two jobs only:
 *  - find people (name, title, LinkedIn) at a prospect's company domain, and
 *    reveal a picked person's work email (this is the call that spends
 *    Apollo credits);
 *  - suggest Newcastle-area organisations to top up the pipeline.
 *
 * Server-only: the key comes from APOLLO_API_KEY and must never reach the
 * client. Every function returns a soft failure ({ ok: false, error }) so
 * the admin UI can show what happened rather than 500ing; Apollo's error
 * bodies are passed through because "out of credits" and "plan doesn't
 * include this endpoint" need to be readable by the person clicking.
 */

const BASE = "https://api.apollo.io/api/v1";

export function apolloConfigured(): boolean {
  return Boolean(process.env.APOLLO_API_KEY);
}

type ApolloResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function apollo<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<ApolloResult<T>> {
  const key = process.env.APOLLO_API_KEY;
  if (!key) return { ok: false, error: "APOLLO_API_KEY is not set on this environment." };
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": key,
      },
      body: JSON.stringify(body),
      // Apollo can be slow on cold searches; don't let Next cache any of it.
      cache: "no-store",
    });
    const json = (await res.json().catch(() => null)) as unknown;
    if (!res.ok) {
      const pick = (key: string): string | null => {
        if (json && typeof json === "object" && key in json) {
          const v = (json as Record<string, unknown>)[key];
          if (typeof v === "string" && v.length > 0) return v;
        }
        return null;
      };
      const msg =
        pick("error") ?? pick("message") ?? `Apollo returned ${res.status}.`;
      return { ok: false, error: msg };
    }
    return { ok: true, data: json as T };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Apollo request failed.",
    };
  }
}

export type ApolloPerson = {
  id: string;
  name: string;
  title: string | null;
  linkedinUrl: string | null;
  /** "verified" | "guessed" | "unavailable" | ... whatever Apollo reports. */
  emailStatus: string | null;
  /** Only present after a reveal (people/match). */
  email: string | null;
  city: string | null;
};

type Row = Record<string, unknown>;
const s = (r: Row, k: string): string | null =>
  typeof r[k] === "string" && (r[k] as string).length > 0 ? (r[k] as string) : null;

function toPerson(r: Row): ApolloPerson {
  return {
    id: s(r, "id") ?? "",
    name: s(r, "name") ?? [s(r, "first_name"), s(r, "last_name")].filter(Boolean).join(" "),
    title: s(r, "title"),
    linkedinUrl: s(r, "linkedin_url"),
    emailStatus: s(r, "email_status"),
    email: (() => {
      const e = s(r, "email");
      // Apollo masks unrevealed emails as "email_not_unlocked@domain.com".
      return e && !e.startsWith("email_not_unlocked") ? e : null;
    })(),
    city: s(r, "city"),
  };
}

/** Decision-maker titles worth surfacing for sponsorship outreach. */
const TITLES = [
  "marketing",
  "brand",
  "communications",
  "community",
  "sponsorship",
  "partnerships",
  "engagement",
  "managing director",
  "general manager",
  "chief executive",
  "founder",
  "owner",
];

/**
 * People at `domain` likely to own a sponsorship decision, best first.
 * Search results don't include emails (that costs nothing); revealing one
 * specific person's email is a separate, credit-spending call.
 */
export async function findPeopleAtDomain(
  domain: string,
): Promise<ApolloResult<ApolloPerson[]>> {
  // /mixed_people/search is deprecated for API callers; api_search is the
  // replacement, and it takes the domain filter ONLY as
  // q_organization_domains_list. Sending the old q_organization_domains
  // alongside it is rejected outright ("cannot be used together"), so no
  // belt-and-braces here.
  const res = await apollo<{ people?: Row[]; contacts?: Row[] }>(
    "/mixed_people/api_search",
    {
      q_organization_domains_list: [domain],
      person_titles: TITLES,
      page: 1,
      per_page: 10,
    },
  );
  if (!res.ok) return res;
  const rows = [
    ...(Array.isArray(res.data.people) ? res.data.people : []),
    ...(Array.isArray(res.data.contacts) ? res.data.contacts : []),
  ];
  const people = rows.map(toPerson).filter((p) => p.id && p.name);
  // De-dupe by id (a person can appear in both lists).
  const seen = new Set<string>();
  return {
    ok: true,
    data: people.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true))),
  };
}

/**
 * Reveal one person's work email. THIS SPENDS AN APOLLO CREDIT, so it only
 * runs when an admin explicitly picks that person in the UI.
 */
export async function revealPerson(
  personId: string,
): Promise<ApolloResult<ApolloPerson>> {
  const res = await apollo<{ person?: Row }>("/people/match", {
    id: personId,
    reveal_personal_emails: false,
  });
  if (!res.ok) return res;
  if (!res.data.person) return { ok: false, error: "Apollo returned no person." };
  return { ok: true, data: toPerson(res.data.person) };
}

/** Score a title for "owns the sponsorship decision", higher is better. */
export function titleScore(title: string | null): number {
  if (!title) return 0;
  const t = title.toLowerCase();
  if (/sponsor|partnership/.test(t)) return 5;
  if (/marketing|brand|communication|community|engagement/.test(t)) return 4;
  if (/chief executive|\bceo\b|managing director|founder|owner/.test(t)) return 3;
  if (/general manager|director/.test(t)) return 2;
  return 1;
}

/**
 * The single best contact at a domain, email revealed: people search (free),
 * rank by title, then reveal only the top candidate. AT MOST ONE credit per
 * call. Returns null when nobody plausible is found; a person without an
 * email still comes back (name and title are worth keeping).
 */
export async function bestContactAtDomain(
  domain: string,
): Promise<ApolloResult<ApolloPerson | null>> {
  const found = await findPeopleAtDomain(domain);
  if (!found.ok) return found;
  const ranked = [...found.data].sort(
    (a, b) => titleScore(b.title) - titleScore(a.title),
  );
  const top = ranked[0];
  if (!top) return { ok: true, data: null };
  const revealed = await revealPerson(top.id);
  // A failed reveal (credits, plan) still yields the unrevealed person.
  return { ok: true, data: revealed.ok ? revealed.data : top };
}

// ---------------------------------------------------------------- media

const JOURNALIST_TITLES = [
  "journalist",
  "reporter",
  "editor",
  "news director",
  "news editor",
  "chief of staff",
  "producer",
  "presenter",
  "content director",
];

/** Score a title for "can get Signal covered", higher is better. */
function journalistScore(title: string | null): number {
  if (!title) return 0;
  const t = title.toLowerCase();
  if (/news editor|news director|chief of staff|editor/.test(t)) return 5;
  if (/journalist|reporter/.test(t)) return 4;
  if (/producer|content/.test(t)) return 3;
  if (/presenter|host/.test(t)) return 2;
  return 1;
}

/**
 * The best journalist contact at an outlet's domain, email revealed. Same
 * one-credit budget as bestContactAtDomain. For national outlets (ABC, the
 * radio networks) pass requireNewcastle so we get the local newsroom rather
 * than a Sydney desk.
 */
export async function bestJournalistAtDomain(
  domain: string,
  requireNewcastle: boolean,
): Promise<ApolloResult<ApolloPerson | null>> {
  const body: Record<string, unknown> = {
    q_organization_domains_list: [domain],
    person_titles: JOURNALIST_TITLES,
    page: 1,
    per_page: 10,
  };
  if (requireNewcastle) {
    body.person_locations = ["Newcastle, New South Wales, Australia"];
  }
  const res = await apollo<{ people?: Row[]; contacts?: Row[] }>(
    "/mixed_people/api_search",
    body,
  );
  if (!res.ok) return res;
  const rows = [
    ...(Array.isArray(res.data.people) ? res.data.people : []),
    ...(Array.isArray(res.data.contacts) ? res.data.contacts : []),
  ];
  const ranked = rows
    .map(toPerson)
    .filter((p) => p.id && p.name)
    .sort((a, b) => journalistScore(b.title) - journalistScore(a.title));
  const top = ranked[0];
  if (!top) return { ok: true, data: null };
  const revealed = await revealPerson(top.id);
  return { ok: true, data: revealed.ok ? revealed.data : top };
}

export type ApolloOrg = {
  name: string;
  domain: string | null;
  website: string | null;
  industry: string | null;
  employees: number | null;
  linkedinUrl: string | null;
};

/**
 * Organisations around Newcastle NSW worth a sponsorship conversation,
 * larger employers first. Used by "Suggest prospects".
 */
export async function suggestOrganisations(
  page = 1,
): Promise<ApolloResult<ApolloOrg[]>> {
  const res = await apollo<{ organizations?: Row[] }>(
    "/mixed_companies/search",
    {
      organization_locations: ["Newcastle, New South Wales, Australia"],
      organization_num_employees_ranges: ["11,20", "21,100", "101,500", "501,10000"],
      page,
      per_page: 20,
    },
  );
  if (!res.ok) return res;
  const orgs = (Array.isArray(res.data.organizations) ? res.data.organizations : [])
    .map((r): ApolloOrg => {
      const employees = r["estimated_num_employees"];
      return {
        name: s(r, "name") ?? "",
        domain: s(r, "primary_domain"),
        website: s(r, "website_url"),
        industry: s(r, "industry"),
        employees: typeof employees === "number" ? employees : null,
        linkedinUrl: s(r, "linkedin_url"),
      };
    })
    .filter((o) => o.name);
  return { ok: true, data: orgs };
}

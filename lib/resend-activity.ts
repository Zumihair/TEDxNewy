/**
 * Read-side companion to lib/email-notify.ts. Pulls the account's recent
 * emails straight from Resend (GET /emails) using the site's own key, so the
 * admin can see delivery history, including sends from before we started
 * logging locally, without access to the Resend dashboard.
 *
 * Needs a full-access RESEND_API_KEY; a send-only key returns 401/403, which
 * we surface rather than swallow.
 */

export type ResendActivityEmail = {
  id: string;
  to: string[];
  from: string;
  subject: string;
  created_at: string;
  /** Latest delivery event: delivered, bounced, complained, queued, etc. */
  last_event: string | null;
};

export type ResendActivity = {
  ok: boolean;
  configured: boolean;
  emails: ResendActivityEmail[];
  error?: string;
};

export async function listRecentResendEmails(
  limit = 100,
): Promise<ResendActivity> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, configured: false, emails: [], error: "RESEND_API_KEY is not set" };
  }
  const capped = Math.min(Math.max(limit, 1), 100);
  try {
    const res = await fetch(`https://api.resend.com/emails?limit=${capped}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return {
        ok: false,
        configured: true,
        emails: [],
        error: `${res.status}: ${txt}`.slice(0, 300),
      };
    }
    const json = (await res.json().catch(() => null)) as {
      data?: Array<{
        id?: string;
        to?: string[] | string;
        from?: string;
        subject?: string;
        created_at?: string;
        last_event?: string | null;
      }>;
    } | null;
    const data = Array.isArray(json?.data) ? json.data : [];
    const emails: ResendActivityEmail[] = data.map((e) => ({
      id: String(e.id ?? ""),
      to: Array.isArray(e.to) ? e.to : e.to ? [String(e.to)] : [],
      from: String(e.from ?? ""),
      subject: String(e.subject ?? ""),
      created_at: String(e.created_at ?? ""),
      last_event: e.last_event ?? null,
    }));
    return { ok: true, configured: true, emails };
  } catch (err) {
    return { ok: false, configured: true, emails: [], error: String(err).slice(0, 300) };
  }
}

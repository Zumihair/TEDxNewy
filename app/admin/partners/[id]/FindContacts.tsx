"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Loader2, Search, UserPlus } from "lucide-react";
import { SecondaryButton } from "../../ui";

type Candidate = {
  id: string;
  name: string;
  title: string | null;
  linkedinUrl: string | null;
  emailStatus: string | null;
  city: string | null;
};

/**
 * Apollo contact discovery. "Find contacts" lists likely decision-makers at
 * the partner's domain (free); "Use" reveals that one person's email (spends
 * an Apollo credit) and saves them onto the partner row.
 */
export default function FindContacts({ partnerId }: { partnerId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [revealing, setRevealing] = useState<string | null>(null);
  const [people, setPeople] = useState<Candidate[] | null>(null);
  const [domain, setDomain] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/partners/${partnerId}/contacts`);
      const j = (await res.json()) as {
        error?: string;
        domain?: string;
        people?: Candidate[];
      };
      if (!res.ok) setError(j.error ?? "Search failed.");
      else {
        setPeople(j.people ?? []);
        setDomain(j.domain ?? null);
      }
    } catch {
      setError("Search failed.");
    } finally {
      setBusy(false);
    }
  };

  const use = async (personId: string) => {
    setRevealing(personId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/partners/${partnerId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) setError(j.error ?? "Could not save that contact.");
      else router.refresh();
    } catch {
      setError("Could not save that contact.");
    } finally {
      setRevealing(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <SecondaryButton type="button" onClick={search} disabled={busy}>
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
          ) : (
            <Search className="h-4 w-4" strokeWidth={2.25} />
          )}
          {busy ? "Searching…" : "Find contacts (Apollo)"}
        </SecondaryButton>
      </div>
      {error && <p className="text-[12.5px] font-medium text-[#b91404]">{error}</p>}
      {people && (
        <div className="rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-[#f9f5ec] p-3">
          <div
            className="font-mono text-[9.5px] font-semibold uppercase text-[#6b6459]"
            style={{ letterSpacing: "0.2em" }}
          >
            {people.length === 0
              ? `No likely contacts found at ${domain ?? "that domain"}`
              : `Likely contacts at ${domain ?? "their domain"}`}
          </div>
          <ul className="mt-2 space-y-2">
            {people.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-white px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#141210]">
                    <span className="truncate">{p.name}</span>
                    {p.linkedinUrl && (
                      <a
                        href={p.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${p.name} on LinkedIn`}
                        className="text-[#6b6459] hover:text-[#141210]"
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.25} />
                      </a>
                    )}
                  </div>
                  <div className="truncate text-[11.5px] text-[#6b6459]">
                    {[p.title, p.city, p.emailStatus === "verified" ? "email verified" : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => use(p.id)}
                  disabled={revealing !== null}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#141210] px-3 py-1.5 text-[12px] font-medium text-[#f4efe6] transition-colors hover:bg-[#2a2521] disabled:opacity-60"
                >
                  {revealing === p.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.25} />
                  ) : (
                    <UserPlus className="h-3.5 w-3.5" strokeWidth={2.25} />
                  )}
                  Use
                </button>
              </li>
            ))}
          </ul>
          {people.length > 0 && (
            <p className="mt-2 text-[11px] leading-[1.5] text-[#8a8278]">
              &ldquo;Use&rdquo; reveals that person&rsquo;s work email through
              Apollo (spends one credit) and saves them as the contact.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

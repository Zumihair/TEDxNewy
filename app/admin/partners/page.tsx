import Link from "next/link";
import { Check, FileText, Handshake, Mail, Plus, Search } from "lucide-react";
import { requireFullAdmin } from "@/lib/cms-auth";
import { listPartners, STATUSES, type Partner, type PartnerStatus } from "@/lib/partners";
import { TIER_LABELS, type ProspectusTier } from "@/lib/prospectus-render";
import {
  Card,
  Field,
  Flash,
  NotSetUp,
  PageHeader,
  PrimaryButton,
  SectionLabel,
  inputCls,
} from "../ui";
import { Modal } from "../Modal";
import { addPartner } from "./actions";
import SuggestProspects from "./SuggestProspects";
import { apolloConfigured } from "@/lib/apollo";

export const metadata = {
  title: "Partners · Admin · TEDxNewy",
};

const STALE_DAYS = 7;

const ERR_COPY: Record<string, string> = {
  missing: "The organisation name is required.",
  failed: "Something went wrong. Try again.",
};

/**
 * Chip colours per pipeline status. Stepped in intensity along the happy
 * path — prospect quietest, confirmed boldest — so the stage a partner is
 * at reads at a glance rather than every chip looking like the same grey
 * pill with different text. Confirmed is a solid fill, not a tint: it's a
 * different KIND of state (closed, not "in progress"), and it's the number
 * that matters most on this page.
 */
const STATUS_CHIP: Record<PartnerStatus, string> = {
  prospect: "bg-[rgba(20,18,16,0.06)] text-[#6b6459]",
  contacted: "bg-[#dbeef4] text-[#17607a]",
  in_discussion: "bg-[#f7e6c9] text-[#8a5a13]",
  confirmed: "bg-[#2f6b41] text-white",
  declined: "bg-[rgba(224,34,20,0.08)] text-[#b91404]",
  dormant: "bg-[#f1ede4] text-[#8a8278]",
};

/** Accent hex per status, for card top borders and the stat band. */
const STATUS_INK: Record<PartnerStatus, string> = {
  prospect: "#6b6459",
  contacted: "#17607a",
  in_discussion: "#a66a1d",
  confirmed: "#2f6b41",
  declined: "#b91404",
  dormant: "#8a8278",
};

// In-kind has no fixed cash figure, so it's left out of the $ pipeline
// totals below rather than guessed at.
const TIER_VALUE: Record<ProspectusTier, number> = {
  presenting: 8000,
  platinum: 5000,
  gold: 3000,
  community: 2000,
  in_kind: 0,
};

const dateFmt = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  timeZone: "Australia/Sydney",
});

const money = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `$${n}`;

/** Days since an ISO timestamp, floored. */
function daysSince(iso: string): number {
  return Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
}

/** In active conversation, but nobody's touched it in a week: the thing
 *  worth surfacing on a board that's otherwise sorted by status alone. */
function staleDays(p: Partner): number | null {
  if (p.status !== "contacted" && p.status !== "in_discussion") return null;
  const d = daysSince(p.updatedAt);
  return d >= STALE_DAYS ? d : null;
}

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; removed?: string; status?: string; q?: string }>;
}) {
  await requireFullAdmin();
  const { error, removed, status: statusFilter, q } = await searchParams;
  const partners = await listPartners();

  if (partners === null) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="Partnerships" title="Partners" />
        <NotSetUp title="Partners isn't set up yet">
          The database update for the partnerships portal
          (20260818b_partners.sql) hasn&rsquo;t been applied yet. Run it, then
          reload this page.
        </NotSetUp>
      </div>
    );
  }

  const counts = new Map<string, number>();
  for (const p of partners) counts.set(p.status, (counts.get(p.status) ?? 0) + 1);
  const needle = (q ?? "").trim().toLowerCase();
  const filtered = partners
    .filter((p) => (statusFilter && STATUSES.some((s) => s.id === statusFilter) ? p.status === statusFilter : true))
    .filter((p) =>
      needle
        ? p.orgName.toLowerCase().includes(needle) ||
          (p.contactName ?? "").toLowerCase().includes(needle) ||
          (p.category ?? "").toLowerCase().includes(needle)
        : true,
    );
  // Stale conversations first, so the board leads with what needs a nudge.
  const sorted = [...filtered].sort((a, b) => {
    const sa = staleDays(a) ?? -1;
    const sb = staleDays(b) ?? -1;
    return sb - sa;
  });

  // The two numbers that matter ten weeks out: what's signed, and what the
  // open conversations are worth if they land.
  const confirmedValue = partners
    .filter((p) => p.status === "confirmed" && p.targetTier)
    .reduce((acc, p) => acc + TIER_VALUE[p.targetTier as ProspectusTier], 0);
  const openValue = partners
    .filter(
      (p) =>
        (p.status === "prospect" || p.status === "contacted" || p.status === "in_discussion") &&
        p.targetTier,
    )
    .reduce((acc, p) => acc + TIER_VALUE[p.targetTier as ProspectusTier], 0);
  const inPlay = partners.filter(
    (p) => p.status === "contacted" || p.status === "in_discussion",
  ).length;
  const staleCount = partners.filter((p) => staleDays(p) !== null).length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Partnerships"
        title="The partner pipeline"
        description="Who we've identified, who we're talking to, and what it's worth. Open a partner to find a contact, send the outreach email or read their prospectus."
      />

      {removed && <Flash tone="ok">Partner removed.</Flash>}
      {error && <Flash tone="error">{ERR_COPY[error] ?? "Something went wrong."}</Flash>}

      {/* Stat band — dark, site-style display numbers */}
      <section className="rounded-[var(--radius-md)] bg-[#141210] px-6 py-6 text-white md:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
          <BandStat value={String(partners.length)} label="organisations on the board" />
          <BandStat value={String(inPlay)} label="conversations in play" />
          <BandStat
            value={money(confirmedValue)}
            label="confirmed partner value"
            tone={confirmedValue > 0 ? "good" : undefined}
          />
          <BandStat value={money(openValue)} label="open pipeline, at suggested tiers" />
        </div>
      </section>

      {/* Search + stage filter + Add prospect, all in one bar so the board
          below gets the full width. */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <form action="/admin/partners" className="relative">
            {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8a8278]" strokeWidth={2.25} />
            <input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search partners…"
              className="w-48 rounded-full border border-[rgba(20,18,16,0.12)] bg-white py-1.5 pl-9 pr-3.5 text-[13px] text-[#141210] focus:border-[#e02214]/40 focus:outline-none focus:ring-2 focus:ring-[#e02214]/20 sm:w-60"
            />
          </form>
          <FilterChip href={filterHref("", q)} active={!statusFilter}>
            All · {partners.length}
          </FilterChip>
          {STATUSES.map((s) => (
            <FilterChip
              key={s.id}
              href={filterHref(s.id, q)}
              active={statusFilter === s.id}
              title={s.hint}
              passive={STATUS_CHIP[s.id]}
            >
              {s.label} · {counts.get(s.id) ?? 0}
            </FilterChip>
          ))}
        </div>
      </div>

      {staleCount > 0 && (
        <p className="text-[12.5px] leading-[1.5] text-[#b91404]">
          {staleCount} conversation{staleCount === 1 ? "" : "s"} with no update in {STALE_DAYS}+ days, surfaced first below.
        </p>
      )}

      {/* Add prospect — a modal so the board underneath stays full width. */}
      <Modal
        title="Add a prospect"
        wide
        trigger={
          <PrimaryButton type="button">
            <Plus className="h-4 w-4" strokeWidth={2.25} />
            Add a prospect
          </PrimaryButton>
        }
      >
        <form action={addPartner} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Organisation">
              <input name="org_name" required placeholder="e.g. Greater Bank" className={inputCls} />
            </Field>
            <Field label="Contact name">
              <input name="contact_name" placeholder="Optional" className={inputCls} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email">
              <input name="email" type="email" placeholder="Optional" className={inputCls} />
            </Field>
            <Field label="Website">
              <input name="website" placeholder="Optional" className={inputCls} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category">
              <input name="category" placeholder="e.g. Banking" className={inputCls} />
            </Field>
            <Field label="Suggested tier">
              <select name="target_tier" className={inputCls} defaultValue="">
                <option value="">Not sure yet</option>
                <option value="presenting">Champion · $8k</option>
                <option value="platinum">Major · $5k</option>
                <option value="gold">Activation · $3k</option>
                <option value="community">Community · $2k</option>
                <option value="in_kind">In-kind</option>
              </select>
            </Field>
          </div>
          <div className="flex">
            <PrimaryButton type="submit">
              <Plus className="h-4 w-4" strokeWidth={2.25} />
              Add prospect
            </PrimaryButton>
          </div>
        </form>
        {apolloConfigured() && (
          <div className="mt-6 border-t border-[rgba(20,18,16,0.08)] pt-5">
            <SectionLabel>Or find more with Apollo</SectionLabel>
            <div className="mt-3">
              <SuggestProspects current={partners.length} />
            </div>
          </div>
        )}
      </Modal>

      {/* Partner cards — full width now that Add prospect is a toggle */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((p) => (
          <PartnerCard key={p.id} p={p} stale={staleDays(p)} />
        ))}
        {sorted.length === 0 && (
          <Card className="sm:col-span-2 lg:col-span-3">
            <p className="px-5 py-14 text-center text-[14px] text-[#6b6459]">
              {partners.length === 0
                ? "No partners yet. Add the first prospect above."
                : "Nothing matches."}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

function filterHref(status: string, q: string | undefined): string {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (q) params.set("q", q);
  const qs = params.toString();
  return qs ? `/admin/partners?${qs}` : "/admin/partners";
}

function BandStat({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone?: "good";
}) {
  return (
    <div>
      <div
        className={`font-sans text-[clamp(1.9rem,3.4vw,2.6rem)] font-medium leading-none tracking-[-0.03em] tabular-nums ${
          tone === "good" ? "text-[#8fd0a2]" : "text-white"
        }`}
        style={{ fontVariationSettings: '"opsz" 144' }}
      >
        {value}
      </div>
      <div className="mt-2 text-[12.5px] leading-[1.45] text-[rgba(255,255,255,0.62)]">
        {label}
      </div>
    </div>
  );
}

function FilterChip({
  href,
  active,
  passive,
  title,
  children,
}: {
  href: string;
  active: boolean;
  passive?: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      title={title}
      className={
        "rounded-full px-3.5 py-1.5 font-mono text-[10.5px] font-semibold uppercase transition-all hover:-translate-y-0.5 " +
        (active
          ? "bg-[#141210] text-[#f4efe6]"
          : passive ?? "border border-[rgba(20,18,16,0.12)] bg-white text-[#6b6459] hover:text-[#141210]")
      }
      style={{ letterSpacing: "0.16em" }}
    >
      {children}
    </Link>
  );
}

function PartnerCard({ p, stale }: { p: Partner; stale: number | null }) {
  const st = STATUSES.find((s) => s.id === p.status);
  return (
    <Link
      href={`/admin/partners/${p.id}`}
      className="group relative flex flex-col overflow-hidden rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white p-4 shadow-[var(--shadow-sm)] transition-all hover:-translate-y-1 hover:border-[rgba(20,18,16,0.2)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)]"
    >
      {/* Status accent along the top, like the site's room accents */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ backgroundColor: STATUS_INK[p.status] }}
      />
      <div className="flex items-start justify-between gap-3">
        <div
          className="font-sans text-[16.5px] font-medium leading-[1.15] tracking-[-0.02em] text-[#141210] [text-wrap:balance]"
          style={{ fontVariationSettings: '"opsz" 144' }}
        >
          {p.orgName}
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[8.5px] font-semibold uppercase ${STATUS_CHIP[p.status]}`}
          style={{ letterSpacing: "0.14em" }}
        >
          {p.status === "confirmed" && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
          {st?.label ?? p.status}
        </span>
      </div>
      <div className="mt-1 text-[12px] text-[#6b6459]">
        {[p.category, p.targetTier ? TIER_LABELS[p.targetTier] : null]
          .filter(Boolean)
          .join(" · ") || " "}
      </div>
      {stale !== null && (
        <div className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-[rgba(224,34,20,0.08)] px-2 py-0.5 font-mono text-[8.5px] font-semibold uppercase tracking-[0.12em] text-[#b91404]">
          No update · {stale}d
        </div>
      )}
      <div className="mt-3 flex items-center justify-between border-t border-[rgba(20,18,16,0.08)] pt-2.5 text-[11.5px] text-[#6b6459]">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <Handshake className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          <span className="truncate">
            {p.contactName ?? p.email ?? "No contact yet"}
          </span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-2.5">
          {p.prospectusUrl && (
            <span className="inline-flex items-center gap-1" title="Prospectus generated">
              <FileText className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
          )}
          {p.lastContactedAt && (
            <span className="inline-flex items-center gap-1" title="Last contacted">
              <Mail className="h-3.5 w-3.5" strokeWidth={2} />
              {dateFmt.format(new Date(p.lastContactedAt))}
            </span>
          )}
        </span>
      </div>
    </Link>
  );
}

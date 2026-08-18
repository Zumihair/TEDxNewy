import Link from "next/link";
import { FileText, Handshake, Mail, Plus } from "lucide-react";
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
import { addPartner } from "./actions";
import SuggestProspects from "./SuggestProspects";
import { apolloConfigured } from "@/lib/apollo";

export const metadata = {
  title: "Partners · Admin · TEDxNewy",
};

const ERR_COPY: Record<string, string> = {
  missing: "The organisation name is required.",
  failed: "Something went wrong. Try again.",
};

/** Chip colours per pipeline status, tuned to the site palette. */
const STATUS_CHIP: Record<PartnerStatus, string> = {
  prospect: "bg-[#f1ede4] text-[#6b6459]",
  contacted: "bg-[rgba(23,96,122,0.10)] text-[#17607a]",
  in_discussion: "bg-[rgba(166,106,29,0.12)] text-[#a66a1d]",
  confirmed: "bg-[rgba(47,107,65,0.12)] text-[#2f6b41]",
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

const TIER_VALUE: Record<ProspectusTier, number> = {
  presenting: 10000,
  platinum: 5000,
  gold: 2500,
  community: 1000,
};

const dateFmt = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  timeZone: "Australia/Sydney",
});

const money = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `$${n}`;

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; removed?: string; status?: string }>;
}) {
  await requireFullAdmin();
  const { error, removed, status: statusFilter } = await searchParams;
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
  const filtered =
    statusFilter && STATUSES.some((s) => s.id === statusFilter)
      ? partners.filter((p) => p.status === statusFilter)
      : partners;

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

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Partnerships"
        title="The partner pipeline"
        description="Who we've identified, who we're talking to, and what it's worth. Open a partner to find a contact, send the outreach email or generate their personalised prospectus."
      />

      {removed && <Flash tone="ok">Partner removed.</Flash>}
      {error && <Flash tone="error">{ERR_COPY[error] ?? "Something went wrong."}</Flash>}

      {/* Stat band — dark, site-style display numbers */}
      <section className="relative overflow-hidden rounded-[var(--radius-md)] bg-[#141210] px-6 py-6 text-white md:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(224,34,20,0.5) 0%, rgba(224,34,20,0) 70%)",
          }}
        />
        <div className="relative grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
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

      {/* Stage filter — chips with live counts */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip href="/admin/partners" active={!statusFilter}>
          All · {partners.length}
        </FilterChip>
        {STATUSES.map((s) => (
          <FilterChip
            key={s.id}
            href={`/admin/partners?status=${s.id}`}
            active={statusFilter === s.id}
            title={s.hint}
            passive={STATUS_CHIP[s.id]}
          >
            {s.label} · {counts.get(s.id) ?? 0}
          </FilterChip>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Partner cards */}
        <div className="grid content-start gap-4 sm:grid-cols-2">
          {filtered.map((p) => (
            <PartnerCard key={p.id} p={p} />
          ))}
          {filtered.length === 0 && (
            <Card className="sm:col-span-2">
              <p className="px-5 py-14 text-center text-[14px] text-[#6b6459]">
                {partners.length === 0
                  ? "No partners yet. Add the first prospect on the right."
                  : "Nothing in this stage."}
              </p>
            </Card>
          )}
        </div>

        <aside className="md:sticky md:top-8 md:self-start">
          <SectionLabel>Add a prospect</SectionLabel>
          <Card className="mt-3 p-5">
            <form action={addPartner} className="space-y-4">
              <Field label="Organisation">
                <input name="org_name" required placeholder="e.g. Greater Bank" className={inputCls} />
              </Field>
              <Field label="Contact name">
                <input name="contact_name" placeholder="Optional" className={inputCls} />
              </Field>
              <Field label="Email">
                <input name="email" type="email" placeholder="Optional" className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Category">
                  <input name="category" placeholder="e.g. Banking" className={inputCls} />
                </Field>
                <Field label="Suggested tier">
                  <select name="target_tier" className={inputCls} defaultValue="">
                    <option value="">Not sure yet</option>
                    <option value="presenting">Presenting · $10k</option>
                    <option value="platinum">Platinum · $5k</option>
                    <option value="gold">Gold · $2.5k</option>
                    <option value="community">Community · $1k / in kind</option>
                  </select>
                </Field>
              </div>
              <Field label="Website">
                <input name="website" placeholder="Optional" className={inputCls} />
              </Field>
              <div className="flex">
                <PrimaryButton type="submit">
                  <Plus className="h-4 w-4" strokeWidth={2.25} />
                  Add prospect
                </PrimaryButton>
              </div>
            </form>
          </Card>
          {apolloConfigured() && (
            <div className="mt-4">
              <SuggestProspects current={partners.length} />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
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

function PartnerCard({ p }: { p: Partner }) {
  const st = STATUSES.find((s) => s.id === p.status);
  return (
    <Link
      href={`/admin/partners/${p.id}`}
      className="group relative flex flex-col overflow-hidden rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white p-5 shadow-[var(--shadow-sm)] transition-all hover:-translate-y-1 hover:border-[rgba(20,18,16,0.2)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)]"
    >
      {/* Status accent along the top, like the site's room accents */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ backgroundColor: STATUS_INK[p.status] }}
      />
      <div className="flex items-start justify-between gap-3">
        <div
          className="font-sans text-[19px] font-medium leading-[1.15] tracking-[-0.02em] text-[#141210] [text-wrap:balance]"
          style={{ fontVariationSettings: '"opsz" 144' }}
        >
          {p.orgName}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[9px] font-semibold uppercase ${STATUS_CHIP[p.status]}`}
          style={{ letterSpacing: "0.16em" }}
        >
          {st?.label ?? p.status}
        </span>
      </div>
      <div className="mt-1.5 text-[12.5px] text-[#6b6459]">
        {[p.category, p.targetTier ? TIER_LABELS[p.targetTier] : null]
          .filter(Boolean)
          .join(" · ") || " "}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-[rgba(20,18,16,0.08)] pt-3 text-[12px] text-[#6b6459]">
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
              PDF
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

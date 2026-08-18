import Link from "next/link";
import { FileText, Handshake, Mail, Plus } from "lucide-react";
import { requireFullAdmin } from "@/lib/cms-auth";
import { listPartners, STATUSES, type Partner, type PartnerStatus } from "@/lib/partners";
import { TIER_LABELS } from "@/lib/prospectus-render";
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
import { THEMES } from "../section-theme";
import { addPartner } from "./actions";

export const metadata = {
  title: "Partners · Admin · TEDxNewy",
};

const coast = THEMES.coast;

const ERR_COPY: Record<string, string> = {
  missing: "The organisation name is required.",
  failed: "Something went wrong. Try again.",
};

/** Chip colours per pipeline status. */
const STATUS_CHIP: Record<PartnerStatus, string> = {
  prospect: "bg-[#f1ede4] text-[#6b6459]",
  contacted: "bg-[#e4eef4] text-[#17607a]",
  in_discussion: "bg-[#faf0e2] text-[#a66a1d]",
  confirmed: "bg-[#e5f2e9] text-[#2d7a4f]",
  declined: "bg-[rgba(224,34,20,0.08)] text-[#b91404]",
  dormant: "bg-[#f1ede4] text-[#8a8278]",
};

const dateFmt = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  timeZone: "Australia/Sydney",
});

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

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Partnerships"
        title="Partner pipeline"
        description="Prospects for Signal and the season: who we've identified, who we've contacted, and where each conversation is up to. Open a partner to email them or generate their personalised prospectus."
      />

      {removed && <Flash tone="ok">Partner removed.</Flash>}
      {error && <Flash tone="error">{ERR_COPY[error] ?? "Something went wrong."}</Flash>}

      {/* Pipeline filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/admin/partners"
          className={
            "rounded-full px-3.5 py-1.5 font-mono text-[10.5px] font-semibold uppercase transition-colors " +
            (!statusFilter
              ? "bg-[#141210] text-[#f4efe6]"
              : "bg-white text-[#6b6459] hover:text-[#141210] border border-[rgba(20,18,16,0.12)]")
          }
          style={{ letterSpacing: "0.16em" }}
        >
          All · {partners.length}
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s.id}
            href={`/admin/partners?status=${s.id}`}
            title={s.hint}
            className={
              "rounded-full px-3.5 py-1.5 font-mono text-[10.5px] font-semibold uppercase transition-colors " +
              (statusFilter === s.id
                ? "bg-[#141210] text-[#f4efe6]"
                : `${STATUS_CHIP[s.id]} hover:opacity-80`)
            }
            style={{ letterSpacing: "0.16em" }}
          >
            {s.label} · {counts.get(s.id) ?? 0}
          </Link>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_320px]">
        <Card>
          <ul className="divide-y divide-[rgba(20,18,16,0.08)]">
            {filtered.map((p) => (
              <PartnerRow key={p.id} p={p} />
            ))}
            {filtered.length === 0 && (
              <li className="px-5 py-12 text-center text-[14px] text-[#6b6459]">
                {partners.length === 0
                  ? "No partners yet. Add the first prospect on the right."
                  : "Nothing in this stage."}
              </li>
            )}
          </ul>
        </Card>

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
        </aside>
      </div>
    </div>
  );
}

function PartnerRow({ p }: { p: Partner }) {
  const st = STATUSES.find((s) => s.id === p.status);
  return (
    <li>
      <Link
        href={`/admin/partners/${p.id}`}
        className="grid grid-cols-[40px_1fr_auto] items-center gap-4 px-4 py-4 transition-colors hover:bg-[#f9f5ec] md:px-5"
      >
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: coast.chipBg, color: coast.chipFg }}
          aria-hidden
        >
          <Handshake className="h-[18px] w-[18px]" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-sans text-[14.5px] font-medium text-[#141210]">
              {p.orgName}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 font-mono text-[9.5px] font-semibold uppercase ${STATUS_CHIP[p.status]}`}
              style={{ letterSpacing: "0.16em" }}
            >
              {st?.label ?? p.status}
            </span>
            {p.targetTier && (
              <span className="text-[11.5px] text-[#6b6459]">
                {TIER_LABELS[p.targetTier]}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-[#6b6459]">
            {p.contactName && <span>{p.contactName}</span>}
            {p.email && <span>{p.email}</span>}
            {p.category && <span>{p.category}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11.5px] text-[#6b6459]">
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
        </div>
      </Link>
    </li>
  );
}

"use client";

import { useMemo, useOptimistic, useTransition } from "react";
import Link from "next/link";
import { Pencil, Trash2, Building2 } from "lucide-react";
import { Badge, Card, DangerButton } from "../ui";
import { useConfirm } from "../ConfirmDialog";
import { deleteSponsor } from "./actions";

export type SponsorRow = {
  id: string;
  name: string;
  tier: string;
  partner_type: string | null;
  logo_url: string | null;
  display_order: number;
};

export default function SponsorsList({ sponsors }: { sponsors: SponsorRow[] }) {
  const { confirm, dialogs } = useConfirm();
  const [, startTransition] = useTransition();
  const [rows, removeSponsor] = useOptimistic(sponsors, (state, id: string) =>
    state.filter((s) => s.id !== id),
  );

  const onDelete = async (s: SponsorRow) => {
    const ok = await confirm({
      title: "Delete this sponsor?",
      body: `Delete "${s.name}"? This can't be undone.`,
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    startTransition(async () => {
      removeSponsor(s.id);
      const fd = new FormData();
      fd.set("id", s.id);
      await deleteSponsor(fd);
    });
  };

  const byTier = useMemo(() => {
    const acc: Record<string, SponsorRow[]> = {};
    for (const s of rows) {
      (acc[s.tier] ||= []).push(s);
    }
    return acc;
  }, [rows]);
  const tierOrder = ["Presenting", "Platinum", "Gold", "Community"];
  const tiers = tierOrder.filter((t) => byTier[t]?.length);

  if (rows.length === 0) {
    return (
      <>
        {dialogs}
        <div className="rounded-[var(--radius-md)] border border-dashed border-[rgba(20,18,16,0.15)] bg-[#f9f5ec] px-6 py-16 text-center">
          <p className="text-[15px] text-[#2a2521]">
            No sponsors yet. Hit Add sponsor to start the roster.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      {dialogs}
      <div className="space-y-10">
        {tiers.map((tier) => (
          <section key={tier}>
            <div
              className="mb-4 flex items-center gap-3 font-mono text-[10.5px] font-semibold uppercase text-[#6b6459]"
              style={{ letterSpacing: "0.24em" }}
            >
              <span>
                {tier} · {byTier[tier]!.length} sponsor
                {byTier[tier]!.length === 1 ? "" : "s"}
              </span>
              <span className="h-px flex-1 bg-[rgba(20,18,16,0.08)]" />
            </div>
            <Card>
              <ul className="divide-y divide-[rgba(20,18,16,0.08)]">
                {byTier[tier]!.map((s) => (
                  <li
                    key={s.id}
                    className="grid grid-cols-[48px_1fr_auto] items-center gap-4 px-4 py-3.5 md:gap-5 md:px-5"
                  >
                    <Link
                      href={`/admin/sponsors/${s.id}`}
                      className="relative flex aspect-square w-12 items-center justify-center overflow-hidden rounded bg-white ring-1 ring-inset ring-[rgba(20,18,16,0.08)]"
                      aria-label={`Edit ${s.name}`}
                    >
                      {s.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={s.logo_url}
                          alt=""
                          className="max-h-full max-w-full object-contain p-1"
                        />
                      ) : (
                        <Building2
                          className="h-4 w-4 text-[#6b6459]/50"
                          strokeWidth={2}
                        />
                      )}
                    </Link>
                    <div className="min-w-0">
                      <Link
                        href={`/admin/sponsors/${s.id}`}
                        className="font-sans text-[15px] font-medium tracking-[-0.005em] text-[#141210] hover:text-[#1f4a5c]"
                      >
                        {s.name}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#6b6459]">
                        {s.partner_type && (
                          <span className="line-clamp-1">{s.partner_type}</span>
                        )}
                        {!s.logo_url && <Badge tone="draft">no logo</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/sponsors/${s.id}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-3 py-1.5 text-[12px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={2.25} />
                        Edit
                      </Link>
                      <DangerButton type="button" onClick={() => onDelete(s)}>
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                        Delete
                      </DangerButton>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        ))}
      </div>
    </>
  );
}

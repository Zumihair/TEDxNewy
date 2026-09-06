"use client";

import { useMemo } from "react";
import { Trash2, Building2 } from "lucide-react";
import { Badge, Card, IconButton } from "../ui";
import { Modal } from "../Modal";
import { useOptimisticDelete } from "../useOptimisticDelete";
import { deleteSponsor, updateSponsor } from "./actions";
import SponsorForm from "./SponsorForm";

export type SponsorRow = {
  id: string;
  name: string;
  tier: string;
  partner_type: string | null;
  logo_url: string | null;
  website_url: string | null;
  display_order: number;
};

export default function SponsorsList({ sponsors }: { sponsors: SponsorRow[] }) {
  const { items: rows, onDelete, dialogs } = useOptimisticDelete({
    items: sponsors,
    getKey: (s) => s.id,
    fieldName: "id",
    confirmTitle: () => "Delete this sponsor?",
    confirmBody: (s) => `Delete "${s.name}"? This can't be undone.`,
    deleteAction: deleteSponsor,
  });

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
                    <Modal
                      title={`Edit ${s.name}`}
                      size="xl"
                      trigger={
                        <div className="col-span-2 grid cursor-pointer grid-cols-[48px_1fr] items-center gap-4 md:gap-5">
                          <div className="relative flex aspect-square w-12 items-center justify-center overflow-hidden rounded bg-white ring-1 ring-inset ring-[rgba(20,18,16,0.08)]">
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
                          </div>
                          <div className="min-w-0">
                            <span className="font-sans text-[15px] font-medium tracking-[-0.005em] text-[#141210] hover:text-[#1f4a5c]">
                              {s.name}
                            </span>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#6b6459]">
                              {s.partner_type && (
                                <span className="line-clamp-1">{s.partner_type}</span>
                              )}
                              {!s.logo_url && <Badge tone="draft">no logo</Badge>}
                            </div>
                          </div>
                        </div>
                      }
                    >
                      <SponsorForm mode="edit" initial={s} action={updateSponsor} />
                    </Modal>
                    <div className="flex items-center">
                      <IconButton
                        tone="danger"
                        ariaLabel={`Delete ${s.name}`}
                        title="Delete"
                        onClick={() => onDelete(s)}
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2.25} />
                      </IconButton>
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

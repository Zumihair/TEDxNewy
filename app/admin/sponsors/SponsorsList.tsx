"use client";

import { useMemo, useState } from "react";
import { FolderOpen, Pencil, Trash2 } from "lucide-react";
import { Badge, IconButton } from "../ui";
import { Modal } from "../Modal";
import { useOptimisticDelete } from "../useOptimisticDelete";
import { deleteSponsor, updateSponsor } from "./actions";
import SponsorForm from "./SponsorForm";
import LogoTile from "./LogoTile";
import SponsorFiles, { type SponsorFile } from "./SponsorFiles";

export type SponsorRow = {
  id: string;
  name: string;
  tier: string;
  partner_type: string | null;
  logo_url: string | null;
  website_url: string | null;
  display_order: number;
  is_current?: boolean | null;
};

const TIER_ORDER = ["Presenting", "Platinum", "Gold", "Community"];

export default function SponsorsList({
  sponsors,
  files,
  filesReady,
}: {
  sponsors: SponsorRow[];
  files: SponsorFile[];
  filesReady: boolean;
}) {
  const [view, setView] = useState<"current" | "past">("current");
  const { items: rows, onDelete, dialogs } = useOptimisticDelete({
    items: sponsors,
    getKey: (s) => s.id,
    fieldName: "id",
    confirmTitle: () => "Delete this sponsor?",
    confirmBody: (s) => `Delete "${s.name}" and its files? This can't be undone. To keep them, mark the sponsor as not current instead.`,
    deleteAction: deleteSponsor,
  });

  const isCurrent = (s: SponsorRow) => s.is_current !== false;
  const current = rows.filter(isCurrent);
  const past = rows.filter((s) => !isCurrent(s));
  const shown = view === "current" ? current : past;
  const filesFor = useMemo(() => {
    const m = new Map<string, SponsorFile[]>();
    for (const f of files) (m.get(f.sponsor_id) ?? m.set(f.sponsor_id, []).get(f.sponsor_id)!).push(f);
    return m;
  }, [files]);

  const groups = useMemo(() => {
    if (view === "past") return [{ label: "", rows: shown }];
    return TIER_ORDER.map((t) => ({ label: t, rows: shown.filter((s) => s.tier === t) })).filter((g) => g.rows.length);
  }, [shown, view]);

  return (
    <>
      {dialogs}
      <div className="adm-pills" role="tablist" aria-label="Partners">
        {(
          [
            { key: "current", label: "Current", n: current.length },
            { key: "past", label: "Past", n: past.length },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={view === t.key}
            onClick={() => setView(t.key)}
            className={"adm-pill" + (view === t.key ? " is-active" : "")}
          >
            {t.label}
            <span className="adm-pill__n">{t.n}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="adm-empty">
          {view === "current" ? "No current partners yet. Use Add sponsor to start the roster." : "No past partners. When a partner steps away, untick Current on them and they move here."}
        </p>
      ) : (
        <div className="adm-stack adm-stack--tight">
          {groups.map((g) => (
            <section key={g.label || "all"} className="adm-section">
              {g.label && (
                <h2 className="adm-section__title">
                  {g.label} <span className="adm-pill__n">{g.rows.length}</span>
                </h2>
              )}
              <ul className="adm-alist">
                {g.rows.map((s) => {
                  const mine = filesFor.get(s.id) ?? [];
                  return (
                    <li key={s.id} className="adm-crow">
                      <LogoTile src={s.logo_url} />
                      <div className="adm-crow__main" style={{ cursor: "default" }}>
                        <span className="adm-crow__title">{s.name}</span>
                        <span className="adm-crow__meta">
                          {s.partner_type || `${s.tier} Partner`}
                          {!s.logo_url && " · no logo"}
                          {mine.length > 0 && ` · ${mine.length} file${mine.length === 1 ? "" : "s"}`}
                        </span>
                      </div>
                      {!isCurrent(s) && <Badge tone="draft">Past</Badge>}
                      <div className="adm-crow__tools">
                        <Modal
                          title={`${s.name}: files`}
                          trigger={
                            <IconButton ariaLabel={`Files for ${s.name}`} title="Files">
                              <FolderOpen className="h-4 w-4" strokeWidth={2.25} />
                            </IconButton>
                          }
                        >
                          <SponsorFiles sponsorId={s.id} files={mine} ready={filesReady} />
                        </Modal>
                        <Modal
                          title={`Edit ${s.name}`}
                          size="xl"
                          trigger={
                            <IconButton ariaLabel={`Edit ${s.name}`} title="Edit">
                              <Pencil className="h-4 w-4" strokeWidth={2.25} />
                            </IconButton>
                          }
                        >
                          <SponsorForm mode="edit" initial={s} action={updateSponsor} />
                        </Modal>
                        <IconButton tone="danger" ariaLabel={`Delete ${s.name}`} title="Delete" onClick={() => onDelete(s)}>
                          <Trash2 className="h-4 w-4" strokeWidth={2.25} />
                        </IconButton>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Badge, IconButton } from "../ui";
import { Modal } from "../Modal";
import { useOptimisticDelete } from "../useOptimisticDelete";
import type { VolunteerRoleRow } from "@/lib/volunteer-roles";
import { deleteRole, updateRole } from "./actions";
import RoleForm from "./RoleForm";

type Status = VolunteerRoleRow["status"];

const TABS: { key: Status; label: string; empty: string }[] = [
  { key: "open", label: "Open", empty: "No roles open. Use Add role to post one, or reopen a closed one." },
  { key: "draft", label: "Drafts", empty: "No drafts. A new role starts here until you set it to Open." },
  { key: "closed", label: "Closed", empty: "Nothing closed. Close a role once it's filled and it waits here for next time." },
];

const TONE: Record<Status, "live" | "draft" | "neutral"> = { open: "live", draft: "draft", closed: "neutral" };

export default function RolesList({
  roles,
  applications,
}: {
  roles: VolunteerRoleRow[];
  /** Application count per role title. */
  applications: Record<string, number>;
}) {
  const [tab, setTab] = useState<Status>("open");
  const { items, onDelete, dialogs } = useOptimisticDelete({
    items: roles,
    getKey: (r) => r.id,
    fieldName: "id",
    confirmTitle: () => "Delete this role?",
    confirmBody: (r) =>
      `Delete "${r.title}"? This can't be undone. Applications already made for it are kept. To keep the role for next time, set it to Closed instead.`,
    deleteAction: deleteRole,
  });
  const shown = items.filter((r) => r.status === tab);
  const current = TABS.find((t) => t.key === tab)!;

  return (
    <>
      {dialogs}
      <div className="adm-pills" role="tablist" aria-label="Roles">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={"adm-pill" + (tab === t.key ? " is-active" : "")}
          >
            {t.label}
            <span className="adm-pill__n">{items.filter((r) => r.status === t.key).length}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="adm-empty">{current.empty}</p>
      ) : (
        <ul className="adm-alist">
          {shown.map((r) => {
            const n = applications[r.title] ?? 0;
            return (
              <li key={r.id} className="adm-crow">
                <div className="adm-crow__main" style={{ cursor: "default" }}>
                  <span className="adm-crow__title">{r.title}</span>
                  <span className="adm-crow__meta">
                    {[r.crew, r.time_commitment, r.location].filter(Boolean).join(" · ")}
                    {` · ${n} application${n === 1 ? "" : "s"}`}
                  </span>
                </div>
                <Badge tone={TONE[r.status]}>{r.status === "open" ? "Live" : r.status === "draft" ? "Draft" : "Closed"}</Badge>
                <div className="adm-crow__tools">
                  {r.status === "open" && (
                    <a
                      href={`/volunteer/roles/${r.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#6b6459] transition-colors hover:bg-[rgba(0,0,0,0.08)] hover:text-[#000000]"
                      aria-label={`View ${r.title} on the site`}
                      title="View on the site (also the link to share)"
                    >
                      <ExternalLink className="h-4 w-4" strokeWidth={2.25} />
                    </a>
                  )}
                  <Modal
                    title={`Edit ${r.title}`}
                    size="xl"
                    trigger={
                      <IconButton ariaLabel={`Edit ${r.title}`} title="Edit">
                        <Pencil className="h-4 w-4" strokeWidth={2.25} />
                      </IconButton>
                    }
                  >
                    <RoleForm mode="edit" initial={r} action={updateRole} />
                  </Modal>
                  <IconButton tone="danger" ariaLabel={`Delete ${r.title}`} title="Delete" onClick={() => onDelete(r)}>
                    <Trash2 className="h-4 w-4" strokeWidth={2.25} />
                  </IconButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

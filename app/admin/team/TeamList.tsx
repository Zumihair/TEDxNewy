"use client";

import { EyeOff, Trash2, User } from "lucide-react";
import { Badge, Card, IconButton } from "../ui";
import { Modal } from "../Modal";
import { useOptimisticDelete } from "../useOptimisticDelete";
import { deleteTeamMember, updateTeamMember } from "./actions";
import TeamMemberForm from "./TeamMemberForm";

export type TeamRow = {
  slug: string;
  name: string;
  role: string | null;
  bio: string | null;
  image_url: string | null;
  email: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  display_order: number;
  is_active: boolean;
};

export default function TeamList({ members }: { members: TeamRow[] }) {
  const { items: rows, onDelete, dialogs } = useOptimisticDelete({
    items: members,
    getKey: (m) => m.slug,
    fieldName: "slug",
    confirmTitle: () => "Delete this team member?",
    confirmBody: (m) => `Delete "${m.name}"? This can't be undone.`,
    deleteAction: deleteTeamMember,
  });

  if (rows.length === 0) {
    return (
      <>
        {dialogs}
        <div className="rounded-[var(--radius-md)] border border-dashed border-[rgba(20,18,16,0.15)] bg-[#f9f5ec] px-6 py-16 text-center">
          <p className="text-[15px] text-[#2a2521]">
            No team members yet. Hit Add team member to introduce your first.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      {dialogs}
      <Card>
        <ul className="divide-y divide-[rgba(20,18,16,0.08)]">
          {rows.map((m) => (
            <li
              key={m.slug}
              className="grid grid-cols-[56px_1fr_auto] items-center gap-4 px-4 py-3.5 md:gap-5 md:px-5"
            >
              <Modal
                title={`Edit ${m.name}`}
                size="xl"
                trigger={
                  <div className="col-span-2 grid cursor-pointer grid-cols-[56px_1fr] items-center gap-4 md:gap-5">
                    <div className="relative block aspect-[4/5] w-14 overflow-hidden rounded bg-[#1a1714]">
                      {m.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.image_url}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-white/40">
                          <User className="h-4 w-4" strokeWidth={2} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-sans text-[15px] font-medium tracking-[-0.005em] text-[#141210] hover:text-[#1f4a5c]">
                          {m.name}
                        </span>
                        {!m.is_active && (
                          <Badge tone="neutral">
                            <EyeOff className="mr-1 h-3 w-3" strokeWidth={2.25} />
                            Hidden
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#6b6459]">
                        {m.role && <span>{m.role}</span>}
                        <span className="font-mono text-[10.5px] text-[#6b6459]/70">
                          {m.slug}
                        </span>
                      </div>
                    </div>
                  </div>
                }
              >
                <TeamMemberForm mode="edit" initial={m} action={updateTeamMember} />
              </Modal>
              <div className="flex items-center">
                <IconButton
                  tone="danger"
                  ariaLabel={`Delete ${m.name}`}
                  title="Delete"
                  onClick={() => onDelete(m)}
                >
                  <Trash2 className="h-4 w-4" strokeWidth={2.25} />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

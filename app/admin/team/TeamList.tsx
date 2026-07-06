"use client";

import { useOptimistic, useTransition } from "react";
import Link from "next/link";
import { EyeOff, Pencil, Trash2, User } from "lucide-react";
import { Badge, Card, DangerButton } from "../ui";
import { useConfirm } from "../ConfirmDialog";
import { deleteTeamMember } from "./actions";

export type TeamRow = {
  slug: string;
  name: string;
  role: string | null;
  image_url: string | null;
  is_active: boolean;
};

export default function TeamList({ members }: { members: TeamRow[] }) {
  const { confirm, dialogs } = useConfirm();
  const [, startTransition] = useTransition();
  const [rows, removeMember] = useOptimistic(members, (state, slug: string) =>
    state.filter((m) => m.slug !== slug),
  );

  const onDelete = async (m: TeamRow) => {
    const ok = await confirm({
      title: "Delete this team member?",
      body: `Delete "${m.name}"? This can't be undone.`,
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    startTransition(async () => {
      removeMember(m.slug);
      const fd = new FormData();
      fd.set("slug", m.slug);
      await deleteTeamMember(fd);
    });
  };

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
              <Link
                href={`/admin/team/${encodeURIComponent(m.slug)}`}
                className="relative block aspect-[4/5] w-14 overflow-hidden rounded bg-[#1a1714]"
                aria-label={`Edit ${m.name}`}
              >
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
              </Link>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/team/${encodeURIComponent(m.slug)}`}
                    className="font-sans text-[15px] font-medium tracking-[-0.005em] text-[#141210] hover:text-[#1f4a5c]"
                  >
                    {m.name}
                  </Link>
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
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/team/${encodeURIComponent(m.slug)}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-3 py-1.5 text-[12px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
                >
                  <Pencil className="h-3.5 w-3.5" strokeWidth={2.25} />
                  Edit
                </Link>
                <DangerButton type="button" onClick={() => onDelete(m)}>
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                  Delete
                </DangerButton>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

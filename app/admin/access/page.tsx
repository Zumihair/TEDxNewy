import { Pencil, Plus, Trash2 } from "lucide-react";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { Badge, Card, DangerButton, PageHeader, PrimaryButton } from "../ui";
import { Modal } from "../Modal";
import FlashToast from "../FlashToast";
import AccessForm from "./AccessForm";
import { createAccess, deleteAccess, updateAccess } from "./actions";
import { MODULES, modulesFrom } from "../access";

const SAVED_COPY: Record<string, string> = {
  created: "Access created. Share the password with the person who needs it.",
  updated: "Access updated.",
  deleted: "Access removed.",
};

type Row = {
  email: string;
  label: string | null;
  access_level: string | null;
  can_edit?: boolean | null;
  is_admin?: boolean | null;
  module_access?: unknown;
  team_slug?: string | null;
  shared?: boolean;
};

export default async function AdminAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { email: me } = await requireFullAdmin({ readOnly: true });
  const { saved, error } = await searchParams;
  const supabase = await getServerSupabase();
  const [{ data, error: queryError }, { data: teamData }] = await Promise.all([
    supabase.from("cms_admins").select("*").order("label"),
    supabase.from("cms_team_members").select("slug, name").order("display_order"),
  ]);
  const all = (data ?? []) as Row[];
  const migrated = !queryError && all.some((r) => "is_admin" in r);
  const rows = migrated ? all.filter((r) => r.shared) : all.filter((r) => r.email.endsWith("@admin.tedxnewy.com.au"));
  const team = (teamData ?? []) as { slug: string; name: string }[];
  const teamName = new Map(team.map((t) => [t.slug, t.name]));
  const linked = new Set(rows.map((r) => r.team_slug).filter(Boolean));
  const unlinked = team.filter((t) => !linked.has(t.slug));

  return (
    <div className="adm-stack">
      <PageHeader
        title="Access"
        description="Everyone signed in can see every page except Settings. Each person gets read or write for each module, and admins also open Settings. The password alone signs someone in."
        actions={
          migrated ? (
            <Modal
              title="New access"
              trigger={
                <PrimaryButton type="button">
                  <Plus className="h-4 w-4" strokeWidth={2.25} />
                  New access
                </PrimaryButton>
              }
            >
              <AccessForm action={createAccess} team={unlinked} />
            </Modal>
          ) : undefined
        }
      />

      {saved && SAVED_COPY[saved] && <FlashToast clear="saved">{SAVED_COPY[saved]}</FlashToast>}
      {error && (
        <FlashToast tone="error" clear="error">
          {error}
        </FlashToast>
      )}

      {!migrated && (
        <Card className="p-6">
          <span className="adm-card__title">One database step is needed first</span>
          <p className="adm-card__text" style={{ marginTop: 8 }}>
            Run <code>supabase/migrations/20261019_access_permissions.sql</code> and <code>20261020_module_access.sql</code> in the Supabase SQL editor, then
            reload this page. Until then the current sign-ins keep working as they were.
          </p>
        </Card>
      )}

      <ul className="adm-eventlist">
        {rows.map((r) => {
          const isMe = r.email.toLowerCase() === me.toLowerCase();
          const admin = typeof r.is_admin === "boolean" ? r.is_admin : r.access_level !== "community";
          const legacyEdit = admin || (typeof r.can_edit === "boolean" ? r.can_edit : true);
          const modules = modulesFrom(r.module_access, legacyEdit);
          const writes = MODULES.filter((m) => admin || modules[m.key]).map((m) => m.label);
          const person = r.team_slug ? teamName.get(r.team_slug) : null;
          return (
            <li key={r.email} className="adm-access">
              <div className="adm-access__main">
                <div className="adm-card__top" style={{ justifyContent: "flex-start", gap: 8 }}>
                  <span className="adm-card__title">{r.label ?? r.email}</span>
                  {admin ? <Badge tone="red">Admin</Badge> : writes.length ? <Badge tone="neutral">Can edit</Badge> : <Badge tone="neutral">View only</Badge>}
                  {isMe && <Badge tone="live">You</Badge>}
                </div>
                <span className="adm-card__text">
                  {admin ? "Everything, including Settings" : writes.length ? `Can edit: ${writes.join(", ")}` : "Read only everywhere"}
                  {" · "}
                  {person ? `Team member: ${person}` : "Not linked to a team member"}
                </span>
              </div>
              {migrated && (
                <div className="adm-access__actions">
                  <Modal
                    title={`Edit ${r.label ?? r.email}`}
                    trigger={
                      <button type="button" className="tx-btn tx-btn--secondary tx-btn--sm tx-btn--auto adm-write">
                        <Pencil className="h-3.5 w-3.5" strokeWidth={2.25} />
                        Edit
                      </button>
                    }
                  >
                    <AccessForm action={updateAccess} initial={{ email: r.email, label: r.label ?? "", admin, modules }} />
                  </Modal>
                  {!isMe && (
                    <form action={deleteAccess}>
                      <input type="hidden" name="email" value={r.email} />
                      <DangerButton type="submit">
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                        Remove
                      </DangerButton>
                    </form>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {migrated && unlinked.length > 0 && (
        <p className="adm-card__text">
          No sign-in yet: {unlinked.map((t) => t.name).join(", ")}. Give them one from the Team page, or use New access and link them here.
        </p>
      )}
    </div>
  );
}

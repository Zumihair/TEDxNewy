import { Pencil, Plus, Trash2 } from "lucide-react";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { ALL_WORKSPACES, DEFAULT_WORKSPACES, WORKSPACE_OPTIONS } from "../access";
import { Badge, Card, DangerButton, PageHeader, PrimaryButton } from "../ui";
import { Modal } from "../Modal";
import FlashToast from "../FlashToast";
import AccessForm from "./AccessForm";
import { createAccess, deleteAccess, updateAccess } from "./actions";

const SAVED_COPY: Record<string, string> = {
  created: "Access created. Share the password with the people who need it.",
  updated: "Access updated.",
  deleted: "Access removed.",
};

type Row = { email: string; label: string | null; access_level: string | null; workspaces: string[] | null };

export default async function AdminAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { email: me } = await requireFullAdmin();
  const { saved, error } = await searchParams;
  const supabase = await getServerSupabase();
  const { data, error: queryError } = await supabase.from("cms_admins").select("*").order("email");
  const all = (data ?? []) as (Row & { shared?: boolean })[];
  const migrated = !queryError && all.some((r) => "shared" in r);
  // Before the migration only the two first accounts exist, recognised by address.
  const rows = migrated ? all.filter((r) => r.shared) : all.filter((r) => r.email.endsWith("@admin.tedxnewy.com.au"));

  const workspacesOf = (r: Row) =>
    r.workspaces ?? (r.access_level === "community" ? DEFAULT_WORKSPACES.community : ALL_WORKSPACES);

  return (
    <div className="adm-stack">
      <PageHeader
        title="Access"
        description="Each password signs in with its own set of workspaces. Create one per group, and change or remove it any time."
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
              <AccessForm action={createAccess} />
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
            Run <code>supabase/migrations/20261017_admin_access_workspaces.sql</code> in the Supabase SQL
            editor, then reload this page. Until then the two sign-ins from the first migration keep working.
          </p>
        </Card>
      )}

      <ul className="adm-eventlist">
        {rows.map((r) => {
          const ws = workspacesOf(r);
          const isMe = r.email.toLowerCase() === me.toLowerCase();
          const full = ALL_WORKSPACES.every((w) => ws.includes(w));
          return (
            <li key={r.email} className="adm-access">
              <div className="adm-access__main">
                <div className="adm-card__top" style={{ justifyContent: "flex-start", gap: 8 }}>
                  <span className="adm-card__title">{r.label ?? r.email}</span>
                  {full && <Badge tone="red">Everything</Badge>}
                  {isMe && <Badge tone="live">You</Badge>}
                </div>
                <div className="adm-access__chips">
                  {full ? (
                    <span className="adm-card__text">Every workspace, including this page.</span>
                  ) : (
                    WORKSPACE_OPTIONS.filter((w) => ws.includes(w.key)).map((w) => (
                      <Badge key={w.key} tone="neutral">
                        {w.label}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
              {migrated && !isMe && (
                <div className="adm-access__actions">
                  <Modal
                    title={`Edit ${r.label ?? r.email}`}
                    trigger={
                      <button type="button" className="tx-btn tx-btn--secondary tx-btn--sm tx-btn--auto">
                        <Pencil className="h-3.5 w-3.5" strokeWidth={2.25} />
                        Edit
                      </button>
                    }
                  >
                    <AccessForm
                      action={updateAccess}
                      initial={{ email: r.email, label: r.label ?? "", workspaces: ws }}
                    />
                  </Modal>
                  <form action={deleteAccess}>
                    <input type="hidden" name="email" value={r.email} />
                    <DangerButton type="submit">
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                      Remove
                    </DangerButton>
                  </form>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

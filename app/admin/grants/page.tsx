import { Plus } from "lucide-react";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { NotSetUp, PageHeader, PrimaryButton } from "../ui";
import { Modal } from "../Modal";
import FlashToast from "../FlashToast";
import GrantForm from "./GrantForm";
import GrantsView from "./GrantsView";
import { saveGrant } from "./actions";
import { asStage, sydneyToday, type Grant } from "./shared";

export const metadata = { title: "Grants · Admin · TEDxNewy", robots: { index: false, follow: false } };

export default async function GrantsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string; error?: string }>;
}) {
  await requireFullAdmin();
  const sp = await searchParams;
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.from("grant_applications").select("*");

  if (error?.code === "42P01" || error?.code === "PGRST205") {
    return (
      <div className="adm-stack">
        <PageHeader title="Grants" description="Every grant we're watching, writing, waiting on or have heard back from." />
        <NotSetUp title="The grant pipeline isn't set up yet">
          Run <code>supabase/migrations/20261026_grant_pipeline.sql</code> in the Supabase SQL editor, then reload.
        </NotSetUp>
      </div>
    );
  }

  const n = (v: unknown) => (v == null || v === "" ? null : Number(v));
  const grants: Grant[] = (data ?? []).map((r: Record<string, unknown>) => ({
    ...(r as unknown as Grant),
    stage: asStage(r.stage),
    amount_min: n(r.amount_min),
    amount_max: n(r.amount_max),
    amount_requested: n(r.amount_requested),
    amount_awarded: n(r.amount_awarded),
  }));

  return (
    <div className="adm-stack">
      <PageHeader
        title="Grants"
        description="Every grant we're watching, writing, waiting on or have heard back from."
        actions={
          <Modal
            title="Add a grant"
            size="wide"
            trigger={
              <PrimaryButton type="button">
                <Plus className="h-4 w-4" strokeWidth={2.25} />
                Add grant
              </PrimaryButton>
            }
          >
            <GrantForm action={saveGrant} />
          </Modal>
        }
      />

      {sp.saved && <FlashToast clear="saved">Saved.</FlashToast>}
      {sp.deleted && <FlashToast clear="deleted">Removed.</FlashToast>}
      {sp.error && (
        <FlashToast tone="error" clear="error">
          {sp.error === "name"
            ? "Give the grant a name."
            : sp.error === "delete"
              ? "Could not remove that grant."
              : "Could not save that. Try again."}
        </FlashToast>
      )}

      <GrantsView grants={grants} today={sydneyToday()} />
    </div>
  );
}

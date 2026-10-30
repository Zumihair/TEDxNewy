import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { NotSetUp, PageHeader, PrimaryButton } from "../ui";
import { Modal } from "../Modal";
import FlashToast from "../FlashToast";
import GrantForm from "./GrantForm";
import GrantsView, { type LetterStats } from "./GrantsView";
import { fileAlerts, isOpenStage } from "./library/shared";
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
  const [{ data, error }, letters, letterLinks, files, fileLinks] = await Promise.all([
    supabase.from("grant_applications").select("*"),
    supabase.from("grant_letters").select("id, status"),
    supabase.from("grant_letter_links").select("grant_id, letter_id"),
    supabase.from("grant_files").select("id, title, expires_on"),
    supabase.from("grant_file_links").select("grant_id, file_id"),
  ]);

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

  // Letters and files are optional: until their migration runs these come back empty.
  const today = sydneyToday();
  const received = new Set(
    ((letters.data ?? []) as { id: string; status: string }[]).filter((l) => l.status === "received").map((l) => l.id),
  );
  const letterStats: LetterStats = {};
  for (const l of (letterLinks.data ?? []) as { grant_id: string; letter_id: string }[]) {
    const s = (letterStats[l.grant_id] ??= { received: 0, total: 0 });
    s.total += 1;
    if (received.has(l.letter_id)) s.received += 1;
  }
  const grantIdsByFile = new Map<string, string[]>();
  for (const l of (fileLinks.data ?? []) as { grant_id: string; file_id: string }[]) {
    grantIdsByFile.set(l.file_id, [...(grantIdsByFile.get(l.file_id) ?? []), l.grant_id]);
  }
  const alerts = fileAlerts(
    (files.data ?? []) as { id: string; title: string; expires_on: string | null }[],
    grantIdsByFile,
    new Set(grants.filter((g) => isOpenStage(g.stage)).map((g) => g.id)),
    today,
  );

  return (
    <div className="adm-stack">
      <PageHeader
        title="Grants"
        description="Every grant we're watching, writing, waiting on or have heard back from."
        actions={
          <>
          <Link href="/admin/grants/library" className="tx-btn tx-btn--secondary">
            <FileText className="h-4 w-4" strokeWidth={2.25} />
            Letters and files
          </Link>
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
          </>
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

      <GrantsView grants={grants} today={today} letterStats={letterStats} alerts={alerts} />
    </div>
  );
}

import { notFound } from "next/navigation";
import { ExternalLink, Pencil } from "lucide-react";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { NotSetUp, PageHeader, SecondaryButton } from "../../ui";
import { Modal } from "../../Modal";
import FlashToast from "../../FlashToast";
import GrantForm from "../GrantForm";
import { saveGrant } from "../actions";
import { asStage, sydneyToday, type Grant, type GrantItem, type ItemKind } from "../shared";
import Bench from "./Bench";
import LettersAndFiles from "./LettersAndFiles";
import {
  asFileKind,
  asLetterStatus,
  asLetterType,
  type GrantFile,
  type GrantLetter,
} from "../library/shared";

export const metadata = { title: "Grant · Admin · TEDxNewy", robots: { index: false, follow: false } };

const missing = (code?: string) => code === "42P01" || code === "PGRST205";
const n = (v: unknown) => (v == null || v === "" ? null : Number(v));

export default async function GrantBenchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  await requireFullAdmin();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const supabase = await getServerSupabase();
  const [grantRes, itemsRes, lettersRes, filesRes, letterLinks, fileLinks] = await Promise.all([
    supabase.from("grant_applications").select("*").eq("id", id).maybeSingle(),
    supabase.from("grant_items").select("*").eq("grant_id", id),
    supabase.from("grant_letters").select("*"),
    supabase.from("grant_files").select("*"),
    supabase.from("grant_letter_links").select("letter_id").eq("grant_id", id),
    supabase.from("grant_file_links").select("file_id").eq("grant_id", id),
  ]);
  if (!grantRes.data) notFound();

  const r = grantRes.data as Record<string, unknown>;
  const grant: Grant = {
    ...(r as unknown as Grant),
    stage: asStage(r.stage),
    amount_min: n(r.amount_min),
    amount_max: n(r.amount_max),
    amount_requested: n(r.amount_requested),
    amount_awarded: n(r.amount_awarded),
  };
  const items: GrantItem[] = ((itemsRes.data ?? []) as Record<string, unknown>[]).map((i) => ({
    ...(i as unknown as GrantItem),
    kind: i.kind as ItemKind,
    amount: n(i.amount),
    word_limit: n(i.word_limit),
    done: Boolean(i.done),
  }));

  // Letters and files live in the library; this grant just points at some of them.
  // If that migration has not run yet the card is left out, nothing else changes.
  const libraryReady = !missing(lettersRes.error?.code) && !missing(filesRes.error?.code);
  const allLetters: GrantLetter[] = ((lettersRes.data ?? []) as Record<string, unknown>[]).map((r) => ({
    ...(r as unknown as GrantLetter),
    letter_type: asLetterType(r.letter_type),
    status: asLetterStatus(r.status),
  }));
  const allFiles: GrantFile[] = ((filesRes.data ?? []) as Record<string, unknown>[]).map((r) => ({
    ...(r as unknown as GrantFile),
    kind: asFileKind(r.kind),
  }));
  const letterIds = new Set(((letterLinks.data ?? []) as { letter_id: string }[]).map((r) => r.letter_id));
  const fileIds = new Set(((fileLinks.data ?? []) as { file_id: string }[]).map((r) => r.file_id));

  const here = `/admin/grants/${id}`;
  const description = [grant.funder, grant.project ? `for ${grant.project}` : null, grant.owner ? `led by ${grant.owner}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="adm-stack">
      <PageHeader
        title={grant.name}
        description={description || undefined}
        backHref="/admin/grants"
        actions={
          <div className="adm-bench__head-actions">
            {grant.url && (
              <a href={grant.url} target="_blank" rel="noreferrer" className="tx-btn tx-btn--secondary">
                Guidelines
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.25} />
              </a>
            )}
            <Modal
              title={`Edit ${grant.name}`}
              size="wide"
              trigger={
                <SecondaryButton write type="button">
                  <Pencil className="h-3.5 w-3.5" strokeWidth={2.25} />
                  Edit details
                </SecondaryButton>
              }
            >
              <GrantForm action={saveGrant} initial={grant} returnTo={here} />
            </Modal>
          </div>
        }
      />

      {sp.saved && <FlashToast clear="saved">Saved.</FlashToast>}
      {sp.error && (
        <FlashToast tone="error" clear="error">
          Could not save that. Try again.
        </FlashToast>
      )}

      {missing(itemsRes.error?.code) ? (
        <NotSetUp title="The grant bench isn't set up yet">
          Run <code>supabase/migrations/20261026b_grant_bench.sql</code> in the Supabase SQL editor, then reload.
        </NotSetUp>
      ) : (
        <Bench
          grant={grant}
          items={items}
          today={sydneyToday()}
          sideTop={
            libraryReady ? (
              <LettersAndFiles
                grantId={id}
                letters={allLetters.filter((l) => letterIds.has(l.id))}
                files={allFiles.filter((f) => fileIds.has(f.id))}
                spareLetters={allLetters.filter((l) => !letterIds.has(l.id))}
                spareFiles={allFiles.filter((f) => !fileIds.has(f.id))}
                today={sydneyToday()}
              />
            ) : undefined
          }
        />
      )}
    </div>
  );
}

import { FilePlus2, Plus } from "lucide-react";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { NotSetUp, PageHeader, PrimaryButton, SecondaryButton } from "../../ui";
import { Modal } from "../../Modal";
import FlashToast from "../../FlashToast";
import { sydneyToday } from "../shared";
import FileForm from "./FileForm";
import LetterForm from "./LetterForm";
import LibraryView, { type LibraryFile, type LibraryLetter } from "./LibraryView";
import { saveFile, saveLetter } from "./actions";
import { asFileKind, asLetterStatus, asLetterType, type GrantFile, type GrantLetter, type GrantOption } from "./shared";

export const metadata = { title: "Letters and files · Grants · Admin · TEDxNewy", robots: { index: false, follow: false } };

const missing = (code?: string) => code === "42P01" || code === "PGRST205";

export default async function GrantLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string; error?: string }>;
}) {
  await requireFullAdmin();
  const sp = await searchParams;
  const supabase = await getServerSupabase();

  const [lettersRes, filesRes, letterLinks, fileLinks, grantsRes] = await Promise.all([
    supabase.from("grant_letters").select("*"),
    supabase.from("grant_files").select("*"),
    supabase.from("grant_letter_links").select("grant_id, letter_id"),
    supabase.from("grant_file_links").select("grant_id, file_id"),
    supabase.from("grant_applications").select("id, name, stage"),
  ]);

  if (missing(lettersRes.error?.code) || missing(filesRes.error?.code)) {
    return (
      <div className="adm-stack">
        <PageHeader title="Letters and files" description="Reference letters and the files every application asks for." backHref="/admin/grants" />
        <NotSetUp title="Letters and files aren't set up yet">
          Run <code>supabase/migrations/20261030_grant_letters_files.sql</code> in the Supabase SQL editor, then reload.
        </NotSetUp>
      </div>
    );
  }

  const grants: GrantOption[] = ((grantsRes.data ?? []) as GrantOption[]).map((g) => ({
    id: g.id,
    name: g.name,
    stage: g.stage,
  }));

  const idsFor = (rows: Record<string, unknown>[] | null, key: string) => {
    const map = new Map<string, string[]>();
    for (const r of rows ?? []) {
      const k = r[key] as string;
      map.set(k, [...(map.get(k) ?? []), r.grant_id as string]);
    }
    return map;
  };
  const byLetter = idsFor(letterLinks.data as Record<string, unknown>[] | null, "letter_id");
  const byFile = idsFor(fileLinks.data as Record<string, unknown>[] | null, "file_id");

  const letters: LibraryLetter[] = ((lettersRes.data ?? []) as Record<string, unknown>[]).map((r) => ({
    ...(r as unknown as GrantLetter),
    letter_type: asLetterType(r.letter_type),
    status: asLetterStatus(r.status),
    grantIds: byLetter.get(r.id as string) ?? [],
  }));
  const files: LibraryFile[] = ((filesRes.data ?? []) as Record<string, unknown>[]).map((r) => ({
    ...(r as unknown as GrantFile),
    kind: asFileKind(r.kind),
    grantIds: byFile.get(r.id as string) ?? [],
  }));

  return (
    <div className="adm-stack">
      <PageHeader
        title="Letters and files"
        description="Everything a funder asks us to prove or vouch for. Add it once, attach it to the grants that need it, and we warn you before it goes out of date."
        backHref="/admin/grants"
        actions={
          <>
            <Modal
              title="Add a file"
              size="wide"
              trigger={
                <SecondaryButton write type="button">
                  <FilePlus2 className="h-4 w-4" strokeWidth={2.25} />
                  Add file
                </SecondaryButton>
              }
            >
              <FileForm action={saveFile} grants={grants} />
            </Modal>
            <Modal
              title="Add a letter"
              size="wide"
              trigger={
                <PrimaryButton type="button">
                  <Plus className="h-4 w-4" strokeWidth={2.25} />
                  Add letter
                </PrimaryButton>
              }
            >
              <LetterForm action={saveLetter} grants={grants} />
            </Modal>
          </>
        }
      />

      {sp.saved && <FlashToast clear="saved">Saved.</FlashToast>}
      {sp.deleted && <FlashToast clear="deleted">Deleted.</FlashToast>}
      {sp.error && (
        <FlashToast tone="error" clear="error">
          {sp.error === "name"
            ? "Give it a name first."
            : sp.error === "delete"
              ? "Could not delete that."
              : "Could not save that. Try again."}
        </FlashToast>
      )}

      <LibraryView letters={letters} files={files} grants={grants} today={sydneyToday()} />
    </div>
  );
}

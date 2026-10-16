import Link from "next/link";
import { Download, Plus, Search, Trash2 } from "lucide-react";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { Card, NotSetUp, PageHeader, PrimaryButton } from "../ui";
import { PendingIconButton } from "../PendingButtons";
import { Modal } from "../Modal";
import DocumentUploader from "./DocumentUploader";
import CopyLinkButton from "./CopyLinkButton";
import { formatBytes } from "./format";
import { removeDocument } from "./actions";
import FlashToast from "../FlashToast";

const ERR_COPY: Record<string, string> = {
  missing: "A title and an uploaded file are both needed.",
  failed: "Something went wrong. Try again.",
};

type DocRow = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_url: string;
  file_name: string | null;
  size_bytes: number | null;
  mime_type: string | null;
  created_at: string;
  created_by: string | null;
};

const dateFmt = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Australia/Sydney",
});

/** Short label for the file type tile. */
function kindOf(d: DocRow): string {
  const ext = (d.file_name ?? d.file_url).split(".").pop()?.toLowerCase() ?? "";
  if (ext.length >= 2 && ext.length <= 4) return ext.toUpperCase();
  return "FILE";
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ added?: string; removed?: string; error?: string; q?: string; cat?: string }>;
}) {
  await requireFullAdmin();
  const { added, removed, error, q, cat } = await searchParams;
  const supabase = await getServerSupabase();

  const { data, error: loadError } = await supabase
    .from("cms_documents")
    .select(
      "id, title, description, category, file_url, file_name, size_bytes, mime_type, created_at, created_by",
    )
    .order("created_at", { ascending: false });

  // Table missing = migration not applied yet.
  const notSetUp = loadError?.code === "42P01";
  const allDocs = (data ?? []) as DocRow[];
  const categories = Array.from(new Set(allDocs.map((d) => d.category))).sort((a, b) => {
    if (a === "Impact reports") return -1;
    if (b === "Impact reports") return 1;
    return a.localeCompare(b);
  });
  const needle = (q ?? "").trim().toLowerCase();
  const docs = allDocs.filter(
    (d) =>
      (!cat || d.category === cat) &&
      (!needle ||
        d.title.toLowerCase().includes(needle) ||
        (d.description ?? "").toLowerCase().includes(needle) ||
        d.category.toLowerCase().includes(needle)),
  );
  const href = (c: string) => `/admin/documents${c ? `?cat=${encodeURIComponent(c)}` : ""}`;

  return (
    <div className="adm-stack">
      <PageHeader
        title="Documents"
        description="Files with a public link. Copy the link into an email or a post."
        actions={
          <Modal
            title="Upload a document"
            trigger={
              <PrimaryButton type="button">
                <Plus className="h-4 w-4" strokeWidth={2.25} />
                Upload
              </PrimaryButton>
            }
          >
            <DocumentUploader categories={categories} />
          </Modal>
        }
      />

      {added && <FlashToast clear="added">Document added.</FlashToast>}
      {removed && <FlashToast clear="removed">Document removed.</FlashToast>}
      {error && (
        <FlashToast tone="error" clear="error">
          {ERR_COPY[error] ?? "Something went wrong."}
        </FlashToast>
      )}

      {notSetUp ? (
        <NotSetUp title="Documents isn't set up yet">
          The database update for the documents library (20260818_documents.sql) hasn&rsquo;t been
          applied. Ask Will to run it, then reload this page.
        </NotSetUp>
      ) : (
        <>
          <div className="adm-imgbar">
            <form action="/admin/documents" className="adm-searchform">
              <Search className="adm-searchform__icon" strokeWidth={2.25} />
              {cat && <input type="hidden" name="cat" value={cat} />}
              <input type="search" name="q" defaultValue={q ?? ""} placeholder="Search documents" />
            </form>
            {categories.length > 1 && (
              <div className="adm-pills" role="tablist" aria-label="Category">
                <Link href={href("")} role="tab" aria-selected={!cat} className={"adm-pill" + (!cat ? " is-active" : "")}>
                  All
                </Link>
                {categories.map((c) => (
                  <Link
                    key={c}
                    href={href(c)}
                    role="tab"
                    aria-selected={cat === c}
                    className={"adm-pill" + (cat === c ? " is-active" : "")}
                  >
                    {c}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {docs.length === 0 ? (
            <Card>
              <div className="px-5 py-12 text-center text-[14px] text-[var(--stone)]">
                {allDocs.length === 0 ? "No documents yet. Upload the first one." : "Nothing matches that search."}
              </div>
            </Card>
          ) : (
            <ul className="adm-eventlist">
              {docs.map((d) => (
                <li key={d.id} className="adm-doc">
                  <span className="adm-filetile" aria-hidden>
                    {kindOf(d)}
                  </span>
                  <div className="adm-doc__main">
                    <span className="adm-card__title">{d.title}</span>
                    {d.description && <span className="adm-card__text">{d.description}</span>}
                    <span className="adm-sub-line">
                      {[
                        categories.length > 1 ? d.category : null,
                        formatBytes(d.size_bytes),
                        dateFmt.format(new Date(d.created_at)),
                        d.created_by ? `by ${d.created_by}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                  <div className="adm-doc__actions">
                    <CopyLinkButton url={d.file_url} />
                    <a
                      href={d.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={d.file_name ?? undefined}
                      className="tx-btn tx-btn--primary tx-btn--sm tx-btn--auto"
                    >
                      <Download className="h-3.5 w-3.5" strokeWidth={2.25} />
                      Download
                    </a>
                    <form action={removeDocument}>
                      <input type="hidden" name="id" value={d.id} />
                      <PendingIconButton tone="danger" ariaLabel={`Remove ${d.title}`} title="Remove">
                        <Trash2 className="h-4 w-4" strokeWidth={2.25} />
                      </PendingIconButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

import { ChevronDown, Download, FileText, Plus, Search, Trash2 } from "lucide-react";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { Card, DangerButton, NotSetUp, PageHeader, PrimaryButton, SectionLabel } from "../ui";
import { THEMES } from "../section-theme";
import { Modal } from "../Modal";
import DocumentUploader from "./DocumentUploader";
import { formatBytes } from "./format";
import { removeDocument } from "./actions";
import FlashToast from "../FlashToast";

const coast = THEMES.coast; // Documents is a Management (coast) page.

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

/** Short label for the file type chip. */
function kindOf(d: DocRow): string {
  const ext = (d.file_name ?? d.file_url).split(".").pop()?.toLowerCase() ?? "";
  if (ext.length >= 2 && ext.length <= 5) return ext.toUpperCase();
  return "FILE";
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ added?: string; removed?: string; error?: string; q?: string }>;
}) {
  await requireFullAdmin();
  const { added, removed, error, q } = await searchParams;
  const supabase = await getServerSupabase();

  const { data, error: loadError } = await supabase
    .from("cms_documents")
    .select(
      "id, title, description, category, file_url, file_name, size_bytes, mime_type, created_at, created_by",
    )
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  // Table missing = migration not applied yet.
  const notSetUp = loadError?.code === "42P01";
  const allDocs = (data ?? []) as DocRow[];
  const needle = (q ?? "").trim().toLowerCase();
  const docs = needle
    ? allDocs.filter(
        (d) =>
          d.title.toLowerCase().includes(needle) ||
          (d.description ?? "").toLowerCase().includes(needle) ||
          d.category.toLowerCase().includes(needle),
      )
    : allDocs;

  // Group by category, keeping "Impact reports" first when present.
  const groups = new Map<string, DocRow[]>();
  for (const d of docs) {
    const list = groups.get(d.category) ?? [];
    list.push(d);
    groups.set(d.category, list);
  }
  const categoryOrder = Array.from(groups.keys()).sort((a, b) => {
    if (a === "Impact reports") return -1;
    if (b === "Impact reports") return 1;
    return a.localeCompare(b);
  });
  // Suggestions for the uploader come from the full set, not the filtered one.
  const allCategories = Array.from(new Set(allDocs.map((d) => d.category))).sort((a, b) => {
    if (a === "Impact reports") return -1;
    if (b === "Impact reports") return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Documents"
        title="Files to download and share"
        description="Impact reports, decks and other PDFs, kept in one place. Every file has a public link, so copy it into an email or a LinkedIn post."
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
          The database update for the documents library
          (20260818_documents.sql) hasn&rsquo;t been applied. Ask Will to run
          it, then reload this page.
        </NotSetUp>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <form action="/admin/documents" className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8a8278]" strokeWidth={2.25} />
              <input
                type="search"
                name="q"
                defaultValue={q ?? ""}
                placeholder="Search documents…"
                className="w-56 rounded-full border border-[rgba(20,18,16,0.12)] bg-white py-1.5 pl-9 pr-3.5 text-[13px] text-[#141210] focus:border-[#e02214]/40 focus:outline-none focus:ring-2 focus:ring-[#e02214]/20 sm:w-72"
              />
            </form>
            <Modal
              title="Upload a document"
              trigger={
                <PrimaryButton type="button">
                  <Plus className="h-4 w-4" strokeWidth={2.25} />
                  Upload a document
                </PrimaryButton>
              }
            >
              <DocumentUploader categories={allCategories} />
            </Modal>
          </div>

          {categoryOrder.length === 0 && (
            <Card>
              <div className="px-5 py-12 text-center text-[14px] text-[#6b6459]">
                {allDocs.length === 0
                  ? "No documents yet. Upload the first one above."
                  : "Nothing matches that search."}
              </div>
            </Card>
          )}

          <div className="space-y-4">
            {categoryOrder.map((cat) => (
              <details key={cat} open className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-1 [&::-webkit-details-marker]:hidden [&::marker]:hidden">
                  <SectionLabel>
                    {cat} · {(groups.get(cat) ?? []).length}
                  </SectionLabel>
                  <ChevronDown
                    className="h-4 w-4 text-[#8a8278] transition-transform group-open:rotate-180"
                    strokeWidth={2.25}
                  />
                </summary>
                <Card className="mt-3">
                  <ul className="divide-y divide-[rgba(20,18,16,0.08)]">
                    {(groups.get(cat) ?? []).map((d) => (
                      <li
                        key={d.id}
                        className="grid grid-cols-[40px_1fr_auto] items-center gap-4 px-4 py-4 md:px-5"
                      >
                        <span
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                          style={{ backgroundColor: coast.chipBg, color: coast.chipFg }}
                          aria-hidden
                        >
                          <FileText className="h-[18px] w-[18px]" strokeWidth={2} />
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-sans text-[14.5px] font-medium text-[#141210]">
                              {d.title}
                            </span>
                            <span
                              className="rounded-full px-2 py-0.5 font-mono text-[9.5px] font-semibold uppercase"
                              style={{
                                letterSpacing: "0.18em",
                                backgroundColor: coast.chipBg,
                                color: coast.chipFg,
                              }}
                            >
                              {kindOf(d)}
                            </span>
                          </div>
                          {d.description && (
                            <div className="mt-0.5 text-[13px] leading-[1.5] text-[#4a453d]">
                              {d.description}
                            </div>
                          )}
                          <div className="mt-1 text-[12px] text-[#6b6459]">
                            {[
                              formatBytes(d.size_bytes),
                              dateFmt.format(new Date(d.created_at)),
                              d.created_by ? `by ${d.created_by}` : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={d.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={d.file_name ?? undefined}
                            className="inline-flex items-center gap-1.5 rounded-full bg-[#141210] px-3.5 py-1.5 text-[12.5px] font-medium text-[#f4efe6] transition-all hover:-translate-y-0.5 hover:bg-[#2a2521]"
                          >
                            <Download className="h-3.5 w-3.5" strokeWidth={2.25} />
                            Download
                          </a>
                          <form action={removeDocument}>
                            <input type="hidden" name="id" value={d.id} />
                            <DangerButton type="submit">
                              <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                              Remove
                            </DangerButton>
                          </form>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

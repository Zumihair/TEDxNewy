import { Download, FileText, FolderOpen, Trash2 } from "lucide-react";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { Card, DangerButton, Flash, NotSetUp, PageHeader, SectionLabel } from "../ui";
import { THEMES } from "../section-theme";
import DocumentUploader from "./DocumentUploader";
import { formatBytes } from "./format";
import { removeDocument } from "./actions";

const coast = THEMES.coast; // Documents is a Content (coast) page.

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
  searchParams: Promise<{ added?: string; removed?: string; error?: string }>;
}) {
  await requireFullAdmin();
  const { added, removed, error } = await searchParams;
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
  const docs = (data ?? []) as DocRow[];

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
  const categories =
    categoryOrder.length > 0 ? categoryOrder : ["Impact reports"];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Documents"
        title="Files to download and share"
        description="Impact reports, decks and other PDFs, kept in one place. Every file has a public link, so copy it into an email or a LinkedIn post."
      />

      {added && <Flash tone="ok">Document added.</Flash>}
      {removed && <Flash tone="ok">Document removed.</Flash>}
      {error && (
        <Flash tone="error">{ERR_COPY[error] ?? "Something went wrong."}</Flash>
      )}

      {notSetUp ? (
        <NotSetUp title="Documents isn't set up yet">
          The database update for the documents library
          (20260818_documents.sql) hasn&rsquo;t been applied. Ask Will to run
          it, then reload this page.
        </NotSetUp>
      ) : (
        <div className="grid gap-8 md:grid-cols-[1fr_340px]">
          <div className="space-y-8">
            {categoryOrder.length === 0 && (
              <Card>
                <div className="px-5 py-12 text-center text-[14px] text-[#6b6459]">
                  No documents yet. Upload the first one on the right.
                </div>
              </Card>
            )}
            {categoryOrder.map((cat) => (
              <section key={cat}>
                <SectionLabel>{cat}</SectionLabel>
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
              </section>
            ))}
          </div>

          <aside className="md:sticky md:top-8 md:self-start">
            <SectionLabel>Upload a document</SectionLabel>
            <Card className="mt-3 p-5">
              <DocumentUploader categories={categories} />
            </Card>
            <div className="mt-4 rounded-[var(--radius-sm)] bg-[#f9f5ec] p-3 text-[12px] leading-[1.55] text-[#6b6459]">
              <div className="inline-flex items-center gap-1.5 text-[#141210]">
                <FolderOpen className="h-3.5 w-3.5" strokeWidth={2.25} />
                <span
                  className="font-mono text-[10.5px] font-semibold uppercase"
                  style={{ letterSpacing: "0.22em" }}
                >
                  Heads-up
                </span>
              </div>
              <p className="mt-1.5">
                Download links are public: anyone with the link can open the
                file, which is what makes them easy to share. Keep anything
                confidential out of here.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

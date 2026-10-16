import Link from "next/link";
import { requireFullAdmin } from "@/lib/cms-auth";
import manifest from "@/lib/image-manifest.json";
import { PageHeader } from "../ui";

export const metadata = { title: "Images · Admin · TEDxNewy", robots: { index: false, follow: false } };

type Img = { path: string; bytes: number };
const PER_PAGE = 96;

/** The folder an image sits in, under /images (the first path segment). */
const folderOf = (p: string) => p.replace(/^\/images\//, "").split("/").slice(0, -1)[0] ?? "other";
const nameOf = (p: string) => p.split("/").pop() ?? p;
const kb = (n: number) => (n > 1_000_000 ? `${(n / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1000))} KB`);

export default async function ImagesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; folder?: string; page?: string }>;
}) {
  await requireFullAdmin();
  const { q = "", folder = "", page = "1" } = await searchParams;
  const all = manifest as Img[];

  const folders = [...new Set(all.map((i) => folderOf(i.path)))].sort();
  const count = (f: string) => all.filter((i) => folderOf(i.path) === f).length;

  const needle = q.trim().toLowerCase();
  const filtered = all.filter(
    (i) => (!folder || folderOf(i.path) === folder) && (!needle || i.path.toLowerCase().includes(needle)),
  );
  const pageNo = Math.max(1, Number(page) || 1);
  const shown = filtered.slice((pageNo - 1) * PER_PAGE, pageNo * PER_PAGE);
  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));

  const href = (o: { folder?: string; page?: number; q?: string }) => {
    const sp = new URLSearchParams();
    const f = o.folder ?? folder;
    const qq = o.q ?? q;
    if (f) sp.set("folder", f);
    if (qq) sp.set("q", qq);
    if (o.page && o.page > 1) sp.set("page", String(o.page));
    const s = sp.toString();
    return `/admin/images${s ? `?${s}` : ""}`;
  };

  return (
    <div className="adm-stack">
      <PageHeader
        title="Images"
        description={`${all.length} images used across the site. Open one to copy its address. Event galleries live on each event's gallery page.`}
      />

      <form action="/admin/images" className="adm-imgbar">
        {folder && <input type="hidden" name="folder" value={folder} />}
        <input name="q" defaultValue={q} placeholder="Search by name" className="tx-input" style={{ maxWidth: 320 }} />
        <button type="submit" className="tx-btn tx-btn--secondary tx-btn--auto">
          Search
        </button>
      </form>

      <div className="adm-imgbar">
        <Link href={href({ folder: "", page: 1 })} className={"adm-tab" + (!folder ? " is-active" : "")}>
          All
        </Link>
        {folders.map((f) => (
          <Link key={f} href={href({ folder: f, page: 1 })} className={"adm-tab" + (folder === f ? " is-active" : "")}>
            {f} ({count(f)})
          </Link>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="adm-card__text">No images match.</p>
      ) : (
        <div className="adm-imggrid">
          {shown.map((i) => (
            <a key={i.path} href={i.path} target="_blank" rel="noreferrer" className="adm-img" title={`${i.path} · ${kb(i.bytes)}`}>
              <span className="adm-img__frame">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={i.path} alt="" loading="lazy" />
              </span>
              <span className="adm-img__name">{nameOf(i.path)}</span>
            </a>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="adm-imgbar">
          {pageNo > 1 && (
            <Link href={href({ page: pageNo - 1 })} className="tx-btn tx-btn--secondary tx-btn--auto">
              Previous
            </Link>
          )}
          <span className="adm-card__text">
            Page {pageNo} of {pages}
          </span>
          {pageNo < pages && (
            <Link href={href({ page: pageNo + 1 })} className="tx-btn tx-btn--secondary tx-btn--auto">
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { deleteTalk } from "./actions";

export default async function AdminTalksPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string }>;
}) {
  await requireAdmin();
  const { saved, deleted } = await searchParams;
  const supabase = await getServerSupabase();

  const { data: talks } = await supabase
    .from("cms_talks")
    .select("*")
    .order("year", { ascending: false })
    .order("display_order", { ascending: true });

  const flash = saved
    ? "Saved — changes are live within a minute."
    : deleted
      ? "Deleted."
      : null;

  const byYear = (talks ?? []).reduce<
    Record<string, typeof talks>
  >((acc, t) => {
    const key = String(t.year);
    (acc[key] ||= []).push(t);
    return acc;
  }, {});
  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div
            className="font-mono text-[10.5px] font-semibold uppercase text-[#e02214]"
            style={{ letterSpacing: "0.24em" }}
          >
            Talks
          </div>
          <h1
            className="mt-3 font-sans tracking-[-0.025em] text-[#141210] balance"
            style={{
              fontSize: "clamp(1.85rem, 3.6vw, 2.5rem)",
              lineHeight: 1.04,
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            The talk archive
          </h1>
          <p className="mt-3 max-w-[58ch] text-[14.5px] leading-[1.6] text-[#6b6459]">
            {talks?.length ?? 0} talks live on /watch. Edits propagate within
            ~60 seconds of saving.
          </p>
        </div>
        <Link
          href="/admin/talks/new"
          className="inline-flex items-center gap-2 rounded-full bg-[#e02214] px-5 py-2.5 text-[13.5px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b91404]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.25} />
          Add talk
        </Link>
      </div>

      {flash && (
        <div
          className="mt-6 rounded-[var(--radius-md)] border border-[#22c55e]/30 bg-[#22c55e]/10 px-4 py-3 text-[13.5px] text-[#155724]"
          role="status"
        >
          {flash}
        </div>
      )}

      <div className="mt-10 space-y-12">
        {years.map((y) => (
          <section key={y}>
            <div
              className="mb-5 font-mono text-[10.5px] font-semibold uppercase text-[#6b6459]"
              style={{ letterSpacing: "0.24em" }}
            >
              {y} · {byYear[y]!.length} talk
              {byYear[y]!.length === 1 ? "" : "s"}
            </div>
            <ul className="divide-y divide-[rgba(20,18,16,0.08)] overflow-hidden rounded-[var(--radius-md)] border border-[rgba(20,18,16,0.10)] bg-white">
              {byYear[y]!.map((t) => (
                <li
                  key={t.id}
                  className="grid grid-cols-1 gap-3 px-5 py-4 md:grid-cols-[64px_1fr_auto] md:items-center md:gap-5"
                >
                  {/* Thumbnail */}
                  <Link
                    href={`/admin/talks/${encodeURIComponent(t.id)}`}
                    className="relative block aspect-video w-16 overflow-hidden rounded bg-[#1a1714]"
                    aria-label={`Edit ${t.title}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://i.ytimg.com/vi/${t.youtube_id}/default.jpg`}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </Link>
                  <div className="min-w-0">
                    <Link
                      href={`/admin/talks/${encodeURIComponent(t.id)}`}
                      className="font-sans text-[15.5px] font-medium tracking-[-0.005em] text-[#141210] hover:text-[#e02214]"
                    >
                      {t.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-[#6b6459]">
                      <span className="font-medium text-[#141210]">
                        {t.speaker}
                      </span>
                      <span className="text-[#6b6459]/60">·</span>
                      <span>{t.event}</span>
                      <span className="text-[#6b6459]/60">·</span>
                      <a
                        href={`https://www.youtube.com/watch?v=${t.youtube_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-[11px] text-[#6b6459] hover:text-[#e02214]"
                      >
                        {t.youtube_id}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/talks/${encodeURIComponent(t.id)}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-3 py-1.5 text-[12.5px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
                    >
                      <Pencil className="h-3.5 w-3.5" strokeWidth={2.25} />
                      Edit
                    </Link>
                    <form action={deleteTalk}>
                      <input type="hidden" name="id" value={t.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(224,34,20,0.08)] px-3 py-1.5 text-[12.5px] font-medium text-[#b91404] transition-colors hover:bg-[rgba(224,34,20,0.15)]"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                        Delete
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {(talks?.length ?? 0) === 0 && (
          <div className="rounded-[var(--radius-md)] border border-dashed border-[rgba(20,18,16,0.15)] bg-[#f9f5ec] px-6 py-16 text-center">
            <p className="text-[15px] text-[#2a2521]">
              No talks yet. Hit <strong>Add talk</strong> to embed your first.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

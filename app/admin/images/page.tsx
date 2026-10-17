import Link from "next/link";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { PageHeader } from "../ui";
import ImageTile from "./ImageTile";

export const metadata = { title: "Images · Resources · Admin · TEDxNewy", robots: { index: false, follow: false } };

const PER_PAGE = 60;

type Ev = { id: string; title: string; starts_at: string | null };
type Photo = { id: string; event_id: string; url: string; thumb_url: string | null; display_order: number | null };

const when = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("en-AU", { month: "short", year: "numeric", timeZone: "Australia/Sydney" }).format(new Date(iso)) : "";

/** The event photo library: every gallery photo we have, by event, ready to open, download or link. */
export default async function ImagesPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string; page?: string }>;
}) {
  await requireFullAdmin();
  const { event = "", page = "1" } = await searchParams;
  const supabase = await getServerSupabase();

  const [{ data: evRows }, { data: idRows }] = await Promise.all([
    supabase.from("cms_events").select("id, title, starts_at").order("starts_at", { ascending: false, nullsFirst: false }),
    supabase.from("event_photos").select("event_id").range(0, 19999),
  ]);

  const counts = new Map<string, number>();
  for (const r of (idRows ?? []) as { event_id: string }[]) counts.set(r.event_id, (counts.get(r.event_id) ?? 0) + 1);
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  const events = ((evRows ?? []) as Ev[]).filter((e) => (counts.get(e.id) ?? 0) > 0);

  const active = events.find((e) => e.id === event);
  const pageNo = Math.max(1, Number(page) || 1);
  const matching = active ? (counts.get(active.id) ?? 0) : total;
  const pages = Math.max(1, Math.ceil(matching / PER_PAGE));

  let q = supabase
    .from("event_photos")
    .select("id, event_id, url, thumb_url, display_order")
    .order("display_order", { ascending: true })
    .range((pageNo - 1) * PER_PAGE, pageNo * PER_PAGE - 1);
  if (active) q = q.eq("event_id", active.id);
  const { data: photoRows } = await q;
  const photos = (photoRows ?? []) as Photo[];
  const eventName = new Map(events.map((e) => [e.id, e.title]));

  const href = (o: { event?: string; page?: number }) => {
    const sp = new URLSearchParams();
    const e = o.event ?? event;
    if (e) sp.set("event", e);
    if (o.page && o.page > 1) sp.set("page", String(o.page));
    const s = sp.toString();
    return `/admin/images${s ? `?${s}` : ""}`;
  };

  return (
    <div className="adm-stack">
      <PageHeader title="Images" description={`${total.toLocaleString("en-AU")} photos from ${events.length} event${events.length === 1 ? "" : "s"}.`} />

      {events.length === 0 ? (
        <p className="adm-empty">No event photos yet. Galleries appear here once they are published.</p>
      ) : (
        <>
          <div className="adm-pills adm-pills--scroll" role="tablist" aria-label="Event">
            <Link href={href({ event: "", page: 1 })} className={"adm-pill" + (!active ? " is-active" : "")}>
              All<span className="adm-pill__n">{total}</span>
            </Link>
            {events.map((e) => (
              <Link key={e.id} href={href({ event: e.id, page: 1 })} className={"adm-pill" + (active?.id === e.id ? " is-active" : "")}>
                {e.title}
                <span className="adm-pill__n">{counts.get(e.id)}</span>
              </Link>
            ))}
          </div>

          <div className="adm-tilegrid">
            {photos.map((p) => (
              <ImageTile key={p.id} url={p.url} thumb={p.thumb_url || p.url} label={eventName.get(p.event_id) ?? ""} />
            ))}
          </div>

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
        </>
      )}
      <p className="adm-card__text">{events.length > 0 && `Latest: ${when(events[0].starts_at)}. `}Photos open full size in a new tab.</p>
    </div>
  );
}

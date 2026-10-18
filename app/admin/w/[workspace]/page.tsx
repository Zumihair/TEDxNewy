import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { subscriberGrowth } from "@/lib/admin-stats";
import { NAV_GROUPS } from "../../nav-config";
import { canAccessPath } from "../../access";
import { CommsView, HubView, type UpcomingItem } from "../../views";
import Link from "next/link";
import ResourcesTiles from "../../ResourcesTiles";
import { Icon } from "@/components/ds";
import NewsletterPreview from "../../newsletter/RowPreviewButton";
import PostPreviewButton from "../../socials/RowPreviewButton";
import { isVideoPost, mediaUrls, type ChannelId } from "../../socials/shared";
import { TEMPLATES } from "@/components/team-brand/templates-data";

export const metadata = { title: "Admin · TEDxNewy", robots: { index: false, follow: false } };

const when = (iso: string) =>
  new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Australia/Sydney",
  }).format(new Date(iso));

/** Whole calendar days from today to a moment, in Sydney time. */
const daysUntil = (iso: string) => {
  const day = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Sydney" }).format(d);
  return Math.round((Date.parse(day(new Date(iso))) - Date.parse(day(new Date()))) / 86400_000);
};

export default async function WorkspacePage({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params;
  const admin = await requireAdmin();
  if (workspace === "library") redirect("/admin/w/resources");
  const group = NAV_GROUPS.find((g) => (g.key === workspace || (workspace === "resources" && g.key === "library")) && g.key !== "home");
  if (!group) notFound();
  // Workspaces without an overview page of their own land straight on a real page.
  if (!group.overview) redirect(group.href);
  if (!canAccessPath(group.href, admin)) redirect("/admin?denied=1");

  if (group.key === "comms") {
    const supabase = await getServerSupabase();
    const nowIso = new Date().toISOString();
    const [growth, nl, posts, nlDrafts, postDrafts] = await Promise.all([
      subscriberGrowth(supabase, 52),
      supabase.from("newsletters").select("*").eq("status", "scheduled").gte("scheduled_at", nowIso).order("scheduled_at").limit(6),
      supabase.from("social_posts").select("*, social_post_media(image_url, display_order, media_type)").eq("status", "scheduled").gte("publish_at", nowIso).order("publish_at").limit(6),
      supabase.from("newsletters").select("*", { count: "exact", head: true }).eq("status", "draft"),
      supabase.from("social_posts").select("*", { count: "exact", head: true }).eq("status", "draft"),
    ]);
    const upcoming: UpcomingItem[] = [
      ...((nl.data ?? []) as Record<string, string>[]).map((r) => ({
        id: `n${r.id}`,
        title: r.title || r.subject || "Untitled newsletter",
        kind: "Newsletter" as const,
        when: when(r.scheduled_at),
        at: r.scheduled_at,
        href: `/admin/newsletter/${r.id}`,
        preview: (
          <NewsletterPreview
            subject={r.subject ?? ""}
            preheader={(r as Record<string, string>).preheader ?? ""}
            blocks={(r as unknown as { blocks: unknown }).blocks}
            scheduledAt={r.scheduled_at}
          />
        ),
      })),
      ...((posts.data ?? []) as Record<string, string>[]).map((r) => ({
        id: `p${r.id}`,
        title: r.title || (r.caption ? String(r.caption).slice(0, 60) : "Untitled post"),
        kind: "Social post" as const,
        when: when(r.publish_at),
        at: r.publish_at,
        href: `/admin/socials/${r.id}`,
        preview: (
          <PostPreviewButton
            channels={((r as unknown as { channels?: ChannelId[] }).channels ?? []) as ChannelId[]}
            caption={String(r.caption ?? "")}
            channelCaptions={((r as unknown as { channel_captions?: Partial<Record<ChannelId, string>> }).channel_captions ?? {})}
            media={mediaUrls(r as never)}
            isVideo={isVideoPost(r as never)}
          />
        ),
      })),
    ]
      .sort((a, b) => a.at.localeCompare(b.at))
      .slice(0, 6)
      .map((u) => ({ id: u.id, title: u.title, kind: u.kind, when: u.when, href: u.href, days: daysUntil(u.at), preview: u.preview }));
    return (
      <CommsView
        group={group}
        growth={growth}
        upcoming={upcoming}
        drafts={{ newsletters: nlDrafts.count ?? 0, posts: postDrafts.count ?? 0 }}
        stats={[
          { href: "/admin/subscribers", label: "Subscribers", value: growth.total.toLocaleString("en-AU"), foot: "on the list" },
          { href: "/admin/subscribers", label: "New this week", value: `+${growth.last7}`, foot: "joined in 7 days" },
          { href: "/admin/calendar", label: "Scheduled", value: String(upcoming.length), foot: "going out soon" },
          {
            href: "/admin/newsletter",
            label: "Drafts",
            value: String((nlDrafts.count ?? 0) + (postDrafts.count ?? 0)),
            foot: "in progress",
          },
        ]}
      />
    );
  }

  if (group.key === "library") {
    const supabase = await getServerSupabase();
    const [{ count: docCount }, { data: photoRows }, { data: latestDocs }, { data: latestPhotos }] = await Promise.all([
      supabase.from("cms_documents").select("*", { count: "exact", head: true }),
      supabase.from("event_photos").select("event_id").range(0, 19999),
      supabase.from("cms_documents").select("id, title, category, file_url, created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("event_photos").select("id, url, thumb_url").order("created_at", { ascending: false }).limit(12),
    ]);
    const photos = (photoRows ?? []) as { event_id: string }[];
    const galleries = new Set(photos.map((p) => p.event_id)).size;
    const docs = (latestDocs ?? []) as { id: string; title: string; category: string | null; file_url: string }[];
    const recent = (latestPhotos ?? []) as { id: string; url: string; thumb_url: string | null }[];
    return (
      <div className="adm-stack">
        <header className="adm-head">
          <div>
            <h1 className="adm-head__title">Resources</h1>
            <p className="adm-head__desc">{group.blurb}</p>
          </div>
        </header>
        <section className="adm-statrow" style={{ ["--n" as string]: 3 }}>
          <Link href="/admin/images" className="adm-stat2">
            <span className="adm-stat2__label">Images</span>
            <span className="adm-stat2__value">{photos.length.toLocaleString("en-AU")}</span>
            <span className="adm-stat2__foot">from {galleries} event galleries</span>
          </Link>
          <Link href="/admin/documents" className="adm-stat2">
            <span className="adm-stat2__label">Documents</span>
            <span className="adm-stat2__value">{docCount ?? 0}</span>
            <span className="adm-stat2__foot">with a public link</span>
          </Link>
          <Link href="/admin/brand/templates" className="adm-stat2">
            <span className="adm-stat2__label">Templates</span>
            <span className="adm-stat2__value">{TEMPLATES.length}</span>
            <span className="adm-stat2__foot">ready to use</span>
          </Link>
        </section>

        <ResourcesTiles docs={docs} recent={recent} />
      </div>
    );
  }

  return <HubView group={group} />;
}

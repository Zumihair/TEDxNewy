import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { mailchimpConfigured } from "@/lib/mailchimp";
import { Card, Flash, PageHeader, TabBar } from "../../ui";
import { PendingButton } from "../../PendingButtons";
import { createNewsletter } from "../actions";
import CampaignsList from "./CampaignsList";
import { TABS, type NewsletterListRow, type Tab } from "./shared";

export const metadata = {
  title: "Campaigns · Newsletter · Admin · TEDxNewy",
};

export default async function AdminNewsletterCampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdmin();
  const { tab: tabParam } = await searchParams;
  const tab: Tab =
    tabParam === "scheduled" || tabParam === "sent" ? tabParam : "drafts";

  const supabase = await getServerSupabase();

  // select("*") on purpose: `stage` only exists once migration
  // 20260814_draft_stages.sql has been applied, and naming a column that
  // isn't there yet would fail the whole query and empty the list.
  let query = supabase.from("newsletters").select("*");

  if (tab === "drafts") {
    query = query.eq("status", "draft").order("updated_at", { ascending: false });
  } else if (tab === "scheduled") {
    query = query
      .in("status", ["scheduled", "sending"])
      .order("scheduled_at", { ascending: true });
  } else {
    query = query.eq("status", "sent").order("sent_at", { ascending: false });
  }

  const { data } = await query;
  const rows = (data ?? []) as NewsletterListRow[];

  // Whether opens/clicks can be fetched at all. The fetch itself (a live
  // Mailchimp API call) happens client-side in CampaignsList, not here: it
  // used to be awaited on this page before anything could render, which
  // made switching to the Sent tab look hung rather than loading.
  const mcOn = mailchimpConfigured();

  // A send that has been stuck in "sending" for more than 15 minutes did not
  // finish cleanly. The automatic retry picks these up; this is just a heads-up.
  const { data: sendingData } = await supabase
    .from("newsletters")
    .select("updated_at")
    .eq("status", "sending");
  const stuckSend = ((sendingData ?? []) as { updated_at: string | null }[]).some(
    (r) =>
      r.updated_at &&
      Date.now() - new Date(r.updated_at).getTime() > 15 * 60 * 1000,
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Community · Newsletter"
        title="Campaigns"
        backHref="/admin/newsletter"
        description="Every newsletter, from drafts through scheduled sends to the archive."
        actions={
          <form action={createNewsletter}>
            <PendingButton icon={<Plus className="h-4 w-4" strokeWidth={2.25} />}>
              New newsletter
            </PendingButton>
          </form>
        }
      />

      <TabBar
        tabs={TABS}
        active={tab}
        hrefFor={(key) => `/admin/newsletter/campaigns?tab=${key}`}
      />

      {stuckSend && (
        <Flash tone="info">
          A send did not finish. It will retry automatically within a few
          minutes.
        </Flash>
      )}

      {tab === "sent" && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-[12.5px] text-[#6b6459]">
          <span>
            {mcOn
              ? "Opens and clicks come from Mailchimp and update as people open the email."
              : "Mailchimp isn't connected on this environment, so opens and clicks aren't available here."}
          </span>
          <Link
            href="/admin/emails/history"
            className="inline-flex items-center gap-1 font-medium text-[#b91404] hover:underline"
          >
            Full report, bounces and subscriber activity
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.25} />
          </Link>
        </div>
      )}

      {rows.length === 0 ? (
        <Card>
          <p className="px-5 py-14 text-center text-[14px] text-[#6b6459]">
            {tab === "drafts"
              ? "No drafts yet. Start one with New newsletter."
              : tab === "scheduled"
                ? "Nothing scheduled right now."
                : "No newsletters have been sent yet."}
          </p>
        </Card>
      ) : (
        <CampaignsList rows={rows} tab={tab} mcOn={mcOn} />
      )}
    </div>
  );
}

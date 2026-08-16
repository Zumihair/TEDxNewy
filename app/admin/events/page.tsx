import Link from "next/link";
import { Plus } from "lucide-react";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { Flash, NotSetUp, PageHeader, PrimaryButton } from "../ui";
import EventsTable, { type EventRow } from "./EventsTable";

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string }>;
}) {
  await requireFullAdmin();
  const { saved, deleted } = await searchParams;
  const supabase = await getServerSupabase();

  const { data: events, error } = await supabase
    .from("cms_events")
    .select("*")
    .order("starts_at", { ascending: false, nullsFirst: false })
    .order("display_order", { ascending: true });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Events"
        title="Events"
        description="The season, from the flagship main stage to salons and special nights. Announced events show in the header menu and on /events. Past events power the home page. Edits go live within a minute."
        actions={
          !error && (
            <Link href="/admin/events/new">
              <PrimaryButton type="button">
                <Plus className="h-4 w-4" strokeWidth={2.25} />
                Add event
              </PrimaryButton>
            </Link>
          )
        }
      />

      {saved && <Flash tone="ok">Saved — changes are live within a minute.</Flash>}
      {deleted && <Flash tone="ok">Deleted.</Flash>}

      {error ? (
        <NotSetUp title="Events aren't set up yet">
          The events database update hasn&rsquo;t been applied yet. Ask Will to
          run the database update, then reload this page.
        </NotSetUp>
      ) : (
        <EventsTable events={(events ?? []) as EventRow[]} />
      )}
    </div>
  );
}

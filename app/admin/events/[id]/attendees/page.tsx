import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { getEventAttendees } from "@/lib/event-feedback";
import { PageHeader } from "../../../ui";
import AttendeesContent from "./AttendeesContent";
import FlashToast from "../../../FlashToast";
import { asTone } from "../../../flash";

export const metadata = {
  title: "Attendees · Events · Admin · TEDxNewy",
};

export default async function EventAttendeesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ flash?: string; tone?: string }>;
}) {
  await requireFullAdmin();
  const { id } = await params;
  const { flash, tone } = await searchParams;

  const supabase = await getServerSupabase();
  const { data: event } = await supabase
    .from("cms_events")
    .select("id, slug, title")
    .eq("id", id)
    .single();
  if (!event) notFound();

  const attendees = await getEventAttendees(id);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6b6459] hover:text-[#141210]"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.25} />
          Back to events
        </Link>
      </div>

      <PageHeader
        eyebrow="Events"
        title={`Attendees · ${event.title}`}
        description="Import the list, export it, email everyone, or send the feedback request."
      />

      {flash && (
        <FlashToast tone={asTone(tone)} clear={["flash", "tone"]}>
          {flash}
        </FlashToast>
      )}

      <AttendeesContent
        event={event}
        attendees={attendees}
        returnTo={`/admin/events/${encodeURIComponent(id)}/attendees`}
      />
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Send, Upload } from "lucide-react";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { getEventAttendees } from "@/lib/event-feedback";
import { Card, Flash, PageHeader, inputCls } from "../../../ui";
import { PendingButton, PendingSecondaryButton } from "../../../PendingButtons";
import AttendeesTable from "./AttendeesTable";
import {
  importCsvAction,
  importTalkNightAction,
  sendFeedbackRequestsAction,
} from "./actions";

export const metadata = {
  title: "Attendees · Events · Admin · TEDxNewy",
};

export default async function EventAttendeesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ flash?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { flash } = await searchParams;

  const supabase = await getServerSupabase();
  const { data: event } = await supabase
    .from("cms_events")
    .select("id, slug, title")
    .eq("id", id)
    .single();
  if (!event) notFound();

  const attendees = await getEventAttendees(id);
  const isTalkNight = event.slug === "60-second-talk-night";
  const emails = attendees.map((a) => a.email);
  const requested = attendees.filter((a) => a.feedbackRequestedAt).length;
  const composeHref = `/admin/emails?to=${encodeURIComponent(
    emails.join(","),
  )}#compose`;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/admin/events/${encodeURIComponent(id)}`}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6b6459] hover:text-[#141210]"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.25} />
          Back to event
        </Link>
      </div>

      <PageHeader
        eyebrow="Events"
        title={`Attendees · ${event.title}`}
        description={`${attendees.length} on the list${
          requested ? ` · ${requested} asked for feedback` : ""
        }. Import the list, export it, email everyone, or send the feedback request.`}
      />

      {flash && <Flash tone="ok">{flash}</Flash>}

      {/* Actions */}
      <Card>
        <div className="flex flex-wrap items-center gap-3 px-4 py-4 md:px-5">
          {isTalkNight && (
            <form action={importTalkNightAction}>
              <input type="hidden" name="eventId" value={id} />
              <PendingSecondaryButton
                icon={<Upload className="h-4 w-4" strokeWidth={2.25} />}
              >
                Import Talk Night registrations
              </PendingSecondaryButton>
            </form>
          )}

          {emails.length > 0 && (
            <Link
              href={composeHref}
              className="inline-flex items-center gap-2 rounded-full bg-[rgba(20,18,16,0.06)] px-5 py-2.5 text-[13.5px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
            >
              <Mail className="h-4 w-4" strokeWidth={2.25} />
              Email everyone
            </Link>
          )}

          {emails.length > 0 && (
            <form action={sendFeedbackRequestsAction}>
              <input type="hidden" name="eventId" value={id} />
              <PendingButton
                icon={<Send className="h-4 w-4" strokeWidth={2.25} />}
              >
                Send feedback request
              </PendingButton>
            </form>
          )}
        </div>
        <p className="border-t border-[rgba(20,18,16,0.08)] px-4 py-3 text-[12.5px] text-[#6b6459] md:px-5">
          &ldquo;Send feedback request&rdquo; emails everyone who has not been
          asked yet, each with their own link. A single reminder goes to
          non-responders after 3 days, automatically.
        </p>
      </Card>

      {/* CSV import (for events without their own registration table) */}
      <Card>
        <form action={importCsvAction} className="space-y-3 px-4 py-4 md:px-5">
          <input type="hidden" name="eventId" value={id} />
          <div className="text-[13.5px] font-medium text-[#141210]">
            Import from CSV
          </div>
          <p className="text-[12.5px] text-[#6b6459]">
            One row per person. Columns:{" "}
            <code>full_name, email, role</code> (role optional, defaults to
            attendee). A header row is fine. Existing emails are skipped.
          </p>
          <textarea
            name="csv"
            rows={4}
            placeholder={"full_name,email,role\nJane Doe,jane@example.com,attendee"}
            className={`${inputCls} font-mono text-[12.5px]`}
          />
          <PendingSecondaryButton
            icon={<Upload className="h-4 w-4" strokeWidth={2.25} />}
          >
            Import CSV
          </PendingSecondaryButton>
        </form>
      </Card>

      <AttendeesTable attendees={attendees} eventTitle={event.title} />
    </div>
  );
}

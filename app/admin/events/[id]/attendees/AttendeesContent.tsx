import { Card } from "../../../ui";
import type { EventAttendee } from "@/lib/event-feedback";
import AttendeesTable from "./AttendeesTable";

/**
 * The Attendees page's actual content: the list. Importing, emailing everyone and the feedback request
 * live under Feedback now; lists are attached by hand (give Claude the file) rather than from the admin.
 */
export default function AttendeesContent({
  event,
  attendees,
}: {
  event: { id: string; slug: string; title: string };
  attendees: EventAttendee[];
  /** Kept so existing callers compile; nothing here posts any more. */
  returnTo?: string;
}) {
  const requested = attendees.filter((a) => a.feedbackRequestedAt).length;
  return (
    <div className="space-y-6">
      <Card>
        <p className="px-4 py-3 text-[13.5px] text-[#6b6459] md:px-5">
          {attendees.length} on the list{requested ? ` · ${requested} asked for feedback` : ""}.
        </p>
      </Card>
      <AttendeesTable attendees={attendees} eventTitle={event.title} />
    </div>
  );
}

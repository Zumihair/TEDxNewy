import Link from "next/link";
import { Download, Mail } from "lucide-react";
import { Card } from "../../../ui";
import type { EventAttendee } from "@/lib/event-feedback";
import AttendeesTable from "./AttendeesTable";

/**
 * The Attendees page's actual content: the list and "Email everyone". The feedback request lives under
 * Feedback; lists are attached by hand (give Claude the file) or synced from Humanitix rather than from the admin.
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
  const composeHref = `/admin/emails?to=${encodeURIComponent(
    attendees.map((a) => a.email).join(","),
  )}#compose`;
  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-5">
          <p className="text-[13.5px] text-[#6b6459]">
            {attendees.length} on the list{requested ? ` · ${requested} asked for feedback` : ""}.
          </p>
          {event.slug === "signal-2026" && (
            <a
              href="/api/admin/checked-in"
              className="tx-btn tx-btn--secondary tx-btn--sm tx-btn--auto"
            >
              <Download className="h-4 w-4" strokeWidth={2.25} />
              Checked-in list (CSV)
            </a>
          )}
          {attendees.length > 0 && (
            <Link href={composeHref} className="tx-btn tx-btn--secondary tx-btn--sm tx-btn--auto adm-write">
              <Mail className="h-4 w-4" strokeWidth={2.25} />
              Email everyone
            </Link>
          )}
        </div>
      </Card>
      <AttendeesTable attendees={attendees} eventTitle={event.title} />
    </div>
  );
}

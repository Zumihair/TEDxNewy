import Link from "next/link";
import { Download, Mail } from "lucide-react";
import type { EventAttendee } from "@/lib/event-feedback";
import AttendeesTable from "./AttendeesTable";

/**
 * The Attendees page's actual content: the list, with "Email everyone" and
 * the Signal check-in export in the table's own top row. The feedback request
 * lives under Feedback; lists are attached by hand (give Claude the file)
 * rather than from the admin.
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
  const composeHref = `/admin/emails?to=${encodeURIComponent(
    attendees.map((a) => a.email).join(","),
  )}#compose`;
  return (
    <AttendeesTable
      attendees={attendees}
      eventTitle={event.title}
      actions={
        <>
          {event.slug === "signal-2026" && (
            <a
              href="/api/admin/checked-in"
              className="tx-btn tx-btn--secondary tx-btn--sm tx-btn--auto"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={2.25} />
              Checked-in list (CSV)
            </a>
          )}
          {attendees.length > 0 && (
            <Link href={composeHref} className="tx-btn tx-btn--secondary tx-btn--sm tx-btn--auto adm-write">
              <Mail className="h-3.5 w-3.5" strokeWidth={2.25} />
              Email everyone
            </Link>
          )}
        </>
      }
    />
  );
}

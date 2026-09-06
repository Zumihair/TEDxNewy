import Link from "next/link";
import { Mail, Send, Upload } from "lucide-react";
import { Card, inputCls } from "../../../ui";
import { PendingButton, PendingSecondaryButton } from "../../../PendingButtons";
import type { EventAttendee } from "@/lib/event-feedback";
import AttendeesTable from "./AttendeesTable";
import {
  importCsvAction,
  importTalkNightAction,
  importYouthFuturesAction,
  sendFeedbackRequestsAction,
} from "./actions";

/**
 * The Attendees page's actual content: import buttons, "Email everyone",
 * "Send feedback request", CSV import, and the table. Split out of
 * page.tsx (2026-09-06) so the Events list's Attendees modal can render the
 * exact same thing without the page's back-link/PageHeader chrome.
 */
export default function AttendeesContent({
  event,
  attendees,
  returnTo,
}: {
  event: { id: string; slug: string; title: string };
  attendees: EventAttendee[];
  /** Where each form's action redirects on completion: the standalone page
   *  passes its own path, the Events-list modal passes "/admin/events". */
  returnTo: string;
}) {
  const isTalkNight = event.slug === "60-second-talk-night";
  const isYouthFutures = event.slug === "youth-futures-lab";
  const emails = attendees.map((a) => a.email);
  const requested = attendees.filter((a) => a.feedbackRequestedAt).length;
  const composeHref = `/admin/emails?to=${encodeURIComponent(
    emails.join(","),
  )}#compose`;

  return (
    <div className="space-y-6">
      <p className="text-[13.5px] text-[#6b6459]">
        {attendees.length} on the list
        {requested ? ` · ${requested} asked for feedback` : ""}. Import the
        list, export it, email everyone, or send the feedback request.
      </p>

      {/* Actions */}
      <Card>
        <div className="flex flex-wrap items-center gap-3 px-4 py-4 md:px-5">
          {isTalkNight && (
            <form action={importTalkNightAction}>
              <input type="hidden" name="eventId" value={event.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <PendingSecondaryButton
                icon={<Upload className="h-4 w-4" strokeWidth={2.25} />}
              >
                Import Talk Night registrations
              </PendingSecondaryButton>
            </form>
          )}

          {isYouthFutures && (
            <form action={importYouthFuturesAction}>
              <input type="hidden" name="eventId" value={event.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <PendingSecondaryButton
                icon={<Upload className="h-4 w-4" strokeWidth={2.25} />}
              >
                Import Youth Futures Lab EOIs
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
              <input type="hidden" name="eventId" value={event.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
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
          <input type="hidden" name="eventId" value={event.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
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

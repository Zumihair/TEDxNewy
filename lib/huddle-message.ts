/**
 * Slack message builders for the monthly team huddle (pure, no I/O).
 * Plain text, Australian spelling, no dashes.
 */
import { longWhen, type HuddleSlot } from "@/lib/huddle-dates";

type Block = Record<string, unknown>;
export type Payload = { text: string; blocks: Block[] };

export type VotesBySlot = Record<string, string[]>; // slot key -> Slack user ids

const testTag = (isTest: boolean) => (isTest ? ":test_tube: *TEST ONLY, ignore* " : "");

function who(ids: string[]): string {
  return ids.length ? ids.map((u) => `<@${u}>`).join(", ") : "no one yet";
}

/** The poll in #team-meetings: one button per day, live tallies under it. */
export function pollMessage(input: {
  pollId: string;
  slots: HuddleSlot[];
  votes: VotesBySlot;
  monthLabel: string;
  closesAtUnix: number;
  isTest: boolean;
  closed?: boolean;
}): Payload {
  const { pollId, slots, votes, monthLabel, isTest, closed } = input;
  const blocks: Block[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${testTag(isTest)}:calendar: *${monthLabel} team huddle*\n${
          closed
            ? "Voting is closed. Will is confirming the day."
            : `Which nights work for you? All start at 7pm. Tap every day you can make (tap again to undo). Voting closes <!date^${input.closesAtUnix}^{date_short_pretty} at {time}|in 48 hours>.`
        }`,
      },
    },
  ];
  if (!closed) {
    blocks.push({
      type: "actions",
      elements: slots.map((s) => ({
        type: "button",
        text: { type: "plain_text", text: `${s.label} (${(votes[s.key] ?? []).length})` },
        action_id: "huddle_vote",
        value: `${pollId}|${s.key}`,
      })),
    });
  }
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: slots.map((s) => `*${s.label}:* ${who(votes[s.key] ?? [])}`).join("\n"),
    },
  });
  return { text: `${monthLabel} team huddle: vote for the day`, blocks };
}

/** The private note to the organiser once voting closes. */
export function confirmDm(input: {
  pollId: string;
  slots: HuddleSlot[];
  votes: VotesBySlot;
  winnerKey: string;
  isTest: boolean;
}): Payload {
  const { pollId, slots, votes, winnerKey, isTest } = input;
  const winner = slots.find((s) => s.key === winnerKey) ?? slots[0];
  const tally = slots.map((s) => `*${s.label}:* ${(votes[s.key] ?? []).length} (${who(votes[s.key] ?? [])})`).join("\n");
  const total = new Set(Object.values(votes).flat()).size;
  return {
    text: `Voting closed: confirm the huddle day`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${testTag(isTest)}*Voting has closed.* ${total} ${total === 1 ? "person" : "people"} voted.\n${tally}\n\nTop pick: *${longWhen(winner.startsAt)}*. Confirming books it and invites everyone in the workspace.`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            style: "primary",
            text: { type: "plain_text", text: `Confirm ${winner.label}` },
            action_id: "huddle_confirm",
            value: `${pollId}|${winner.key}`,
          },
          {
            type: "static_select",
            action_id: "huddle_pick_other",
            placeholder: { type: "plain_text", text: "Pick a different day" },
            options: slots.map((s) => ({
              text: { type: "plain_text", text: s.label },
              value: `${pollId}|${s.key}`,
            })),
          },
          {
            type: "button",
            text: { type: "plain_text", text: "Extend 24 hours" },
            action_id: "huddle_extend",
            value: pollId,
          },
        ],
      },
    ],
  };
}

/** The announcement in #team-meetings once booked. */
export function bookedMessage(input: { startsAtIso: string; huddleLink: string; isTest: boolean }): Payload {
  const when = longWhen(input.startsAtIso);
  return {
    text: `Team huddle booked: ${when}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${testTag(input.isTest)}:white_check_mark: *Team huddle booked: ${when}*\nInvites are in your inbox. We meet in the channel huddle: <${input.huddleLink}|Join the huddle>.`,
        },
      },
    ],
  };
}

/** The agenda starter. Items are posted as thread replies. */
export function agendaMessage(input: { pollId: string; startsAtIso: string; isTest: boolean }): Payload {
  return {
    text: `Agenda for ${longWhen(input.startsAtIso)}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${testTag(input.isTest)}:memo: *Agenda for ${longWhen(input.startsAtIso)}*\nAdd your items below. Each one is posted as a reply in this thread.`,
        },
        accessory: {
          type: "button",
          text: { type: "plain_text", text: "Add agenda item" },
          action_id: "huddle_add_agenda",
          value: input.pollId,
        },
      },
    ],
  };
}

export function reminderMessage(input: { kind: "day" | "hour"; startsAtIso: string; huddleLink: string; isTest: boolean }): Payload {
  const lead =
    input.kind === "day"
      ? `Reminder: team huddle tomorrow, ${longWhen(input.startsAtIso)}.`
      : `Team huddle starts in an hour, at ${longWhen(input.startsAtIso).split(" at ")[1] ?? "7:00pm"}.`;
  return {
    text: lead,
    blocks: [
      {
        type: "section",
        text: { type: "mrkdwn", text: `${testTag(input.isTest)}:alarm_clock: ${lead} <${input.huddleLink}|Join the huddle>` },
      },
    ],
  };
}

export function minutesMessage(input: { startsAtIso: string; isTest: boolean }): Payload {
  return {
    text: `Minutes for ${longWhen(input.startsAtIso)}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${testTag(input.isTest)}:pencil: *Minutes for ${longWhen(input.startsAtIso)}*\nReply in this thread with the notes and any action items.`,
        },
      },
    ],
  };
}

export function agendaModal(pollId: string): Record<string, unknown> {
  return {
    type: "modal",
    callback_id: "huddle_agenda_modal",
    private_metadata: pollId,
    title: { type: "plain_text", text: "Add agenda item" },
    submit: { type: "plain_text", text: "Add" },
    close: { type: "plain_text", text: "Cancel" },
    blocks: [
      {
        type: "input",
        block_id: "item",
        label: { type: "plain_text", text: "What should we cover?" },
        element: { type: "plain_text_input", action_id: "text", max_length: 300 },
      },
    ],
  };
}

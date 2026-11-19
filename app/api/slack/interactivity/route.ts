import { NextResponse } from "next/server";
import { verifySlackSignature, slackApi } from "@/lib/slack-api";
import {
  addAgendaItem,
  confirmPoll,
  extendPoll,
  openAgendaModal,
  toggleVote,
} from "@/lib/huddle";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Slack interactivity endpoint for the huddle bot (button clicks, the select,
 * the agenda modal). Every request is signature checked. Slack wants a 200
 * within 3 seconds, so each action does its work inline and returns.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifySlackSignature(raw, req.headers.get("x-slack-request-timestamp"), req.headers.get("x-slack-signature"))) {
    return new NextResponse("bad signature", { status: 401 });
  }
  const payloadStr = new URLSearchParams(raw).get("payload");
  if (!payloadStr) return new NextResponse("bad request", { status: 400 });
  const p = JSON.parse(payloadStr) as {
    type: string;
    user?: { id: string };
    trigger_id?: string;
    channel?: { id: string };
    actions?: Array<{ action_id: string; value?: string; selected_option?: { value: string } }>;
    view?: { callback_id: string; private_metadata: string; state: { values: Record<string, Record<string, { value?: string }>> } };
  };
  const userId = p.user?.id ?? "";

  if (p.type === "block_actions" && p.actions?.length) {
    const a = p.actions[0];
    const value = a.selected_option?.value ?? a.value ?? "";
    if (a.action_id.startsWith("huddle_vote")) {
      const [pollId, slot] = value.split("|");
      const ok = await toggleVote(pollId, slot, userId);
      if (!ok && p.channel?.id) {
        await slackApi("chat.postEphemeral", { channel: p.channel.id, user: userId, text: "Voting for this huddle has closed." });
      }
    } else if (a.action_id === "huddle_confirm" || a.action_id === "huddle_pick_other") {
      const [pollId, slot] = value.split("|");
      const r = await confirmPoll(pollId, slot, userId);
      if (!r.ok && p.channel?.id) {
        await slackApi("chat.postMessage", { channel: p.channel.id, text: `:warning: ${r.note}` });
      }
    } else if (a.action_id === "huddle_extend") {
      await extendPoll(value);
    } else if (a.action_id === "huddle_add_agenda" && p.trigger_id) {
      await openAgendaModal(value, p.trigger_id);
    }
    return new NextResponse("", { status: 200 });
  }

  if (p.type === "view_submission" && p.view?.callback_id === "huddle_agenda_modal") {
    const text = p.view.state.values.item?.text?.value?.trim();
    if (text) await addAgendaItem(p.view.private_metadata, text, userId);
    return NextResponse.json({ response_action: "clear" });
  }

  return new NextResponse("", { status: 200 });
}

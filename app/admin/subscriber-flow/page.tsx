import Link from "next/link";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import {
  Badge,
  Card,
  DangerButton,
  PageHeader,
  PrimaryButton,
} from "../ui";
import { addStep, deleteStep, reorderStep, toggleStep } from "./actions";

export const metadata = {
  title: "Subscriber Flow · Admin · TEDxNewy",
};

type Step = {
  id: string;
  position: number;
  name: string;
  enabled: boolean;
  delay_days: number;
  subject: string;
};

function delayLine(delayDays: number): string {
  if (delayDays <= 0) return "Instantly on subscribe";
  if (delayDays === 1) return "1 day after subscribing";
  return `${delayDays} days after subscribing`;
}

export default async function AdminSubscriberFlowPage() {
  await requireAdmin();
  const supabase = await getServerSupabase();

  const { data: stepsData } = await supabase
    .from("subscriber_flow_steps")
    .select("id, position, name, enabled, delay_days, subject")
    .order("position", { ascending: true });
  const steps = (stepsData ?? []) as Step[];

  // Tally sends per step in JS from a single select.
  const { data: sendRows } = await supabase
    .from("subscriber_flow_sends")
    .select("step_id");
  const counts = new Map<string, number>();
  for (const row of sendRows ?? []) {
    const key = row.step_id as string;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Community · Subscriber Flow"
        title="Subscriber Flow"
        description="The welcome sequence a new subscriber receives after they sign up. The first step sends the moment someone subscribes, replacing the old confirmation email. Later steps go out on a delay you set, run by the same cron that sends newsletters. Turn any step on or off, reorder them, or edit the content with the block builder."
        actions={
          <form action={addStep}>
            <PrimaryButton type="submit">
              <Plus className="h-4 w-4" strokeWidth={2.25} />
              Add step
            </PrimaryButton>
          </form>
        }
      />

      {steps.length === 0 ? (
        <Card className="p-6">
          <p className="text-[14px] leading-[1.6] text-[#6b6459]">
            No steps yet. Apply the subscriber flow migration, or add a step to
            begin.
          </p>
        </Card>
      ) : (
        <ol className="space-y-4">
          {steps.map((step, i) => {
            const sends = counts.get(step.id) ?? 0;
            return (
              <li key={step.id}>
                <Card className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Step number */}
                    <span
                      className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#141210] font-mono text-[13px] font-semibold text-white"
                      aria-hidden
                    >
                      {step.position}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-sans text-[15.5px] font-medium text-[#141210]">
                          {step.name}
                        </span>
                        <Badge tone={step.enabled ? "live" : "neutral"}>
                          {step.enabled ? "On" : "Off"}
                        </Badge>
                      </div>
                      {step.subject && (
                        <div className="mt-1 truncate text-[13.5px] text-[#6b6459]">
                          {step.subject}
                        </div>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-[#6b6459]">
                        <span>{delayLine(step.delay_days)}</span>
                        <span aria-hidden>·</span>
                        <span>sends so far: {sends}</span>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/subscriber-flow/${step.id}`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-4 py-2 text-[12.5px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
                        >
                          <Pencil className="h-3.5 w-3.5" strokeWidth={2.25} />
                          Edit
                        </Link>

                        <form action={toggleStep}>
                          <input type="hidden" name="id" value={step.id} />
                          <input
                            type="hidden"
                            name="enabled"
                            value={step.enabled ? "false" : "true"}
                          />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-4 py-2 text-[12.5px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)]"
                          >
                            {step.enabled ? "Turn off" : "Turn on"}
                          </button>
                        </form>

                        <form action={reorderStep}>
                          <input type="hidden" name="id" value={step.id} />
                          <input type="hidden" name="dir" value="up" />
                          <button
                            type="submit"
                            disabled={i === 0}
                            aria-label="Move up"
                            title="Move up"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6b6459] transition-colors hover:bg-[rgba(20,18,16,0.08)] hover:text-[#141210] disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <ChevronUp className="h-4 w-4" strokeWidth={2.25} />
                          </button>
                        </form>
                        <form action={reorderStep}>
                          <input type="hidden" name="id" value={step.id} />
                          <input type="hidden" name="dir" value="down" />
                          <button
                            type="submit"
                            disabled={i === steps.length - 1}
                            aria-label="Move down"
                            title="Move down"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6b6459] transition-colors hover:bg-[rgba(20,18,16,0.08)] hover:text-[#141210] disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <ChevronDown className="h-4 w-4" strokeWidth={2.25} />
                          </button>
                        </form>

                        <div className="ml-auto">
                          <form action={deleteStep}>
                            <input type="hidden" name="id" value={step.id} />
                            <DangerButton type="submit">
                              <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                              Delete
                            </DangerButton>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

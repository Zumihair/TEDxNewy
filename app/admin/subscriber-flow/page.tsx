import Link from "next/link";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { Badge, Card, PageHeader } from "../ui";
import {
  PendingButton,
  PendingDangerButton,
  PendingIconButton,
  PendingSecondaryButton,
} from "../PendingButtons";
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

/** How many people are in the flow at all. Everyone else never receives a
 *  step, whatever their signup date says. */
async function enrolledCount(
  supabase: Awaited<ReturnType<typeof getServerSupabase>>,
): Promise<number> {
  const { count } = await supabase
    .from("subscribers")
    .select("id", { count: "exact", head: true })
    .not("flow_started_at", "is", null)
    .is("unsubscribed_at", null);
  return count ?? 0;
}

export default async function AdminSubscriberFlowPage() {
  await requireAdmin();
  const supabase = await getServerSupabase();

  const { data: stepsData } = await supabase
    .from("subscriber_flow_steps")
    .select("id, position, name, enabled, delay_days, subject")
    .order("position", { ascending: true });
  const steps = (stepsData ?? []) as Step[];

  // Tally sends per step with per-step head-count queries in parallel, so no
  // send rows are ever pulled into memory.
  const [sendCounts, enrolled] = await Promise.all([
    Promise.all(
      steps.map((step) =>
        supabase
          .from("subscriber_flow_sends")
          .select("id", { count: "exact", head: true })
          .eq("step_id", step.id),
      ),
    ),
    enrolledCount(supabase),
  ]);
  const counts = new Map<string, number>();
  steps.forEach((step, i) => {
    counts.set(step.id, sendCounts[i]?.count ?? 0);
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Community · Newsletter"
        title="Subscriber flow"
        backHref="/admin/newsletter"
        description="The welcome sequence a new subscriber receives after they sign up. Every new address enters the flow and works down the enabled steps in order: nobody gets step 2 without step 1. The first step sends the moment someone subscribes; later steps go out on the delay you set, checked every few minutes. Turning a step on or off is the only thing that changes who receives what."
        actions={
          <form action={addStep}>
            <PendingButton icon={<Plus className="h-4 w-4" strokeWidth={2.25} />}>
              Add step
            </PendingButton>
          </form>
        }
      />

      <Card className="p-5">
        <p className="text-[13.5px] leading-[1.6] text-[#6b6459]">
          <span className="font-medium text-[#141210]">
            {enrolled} {enrolled === 1 ? "person is" : "people are"} in the flow.
          </span>{" "}
          Only addresses that signed up since the flow went in are in it. The
          list imported from Mailchimp is deliberately left out, so switching a
          step on can never blast the whole base. Worth knowing before you do:
          turning a step on sends it to everyone in the flow who is already
          past its delay and has had the step before it, within a few minutes.
        </p>
      </Card>

      {steps.length === 0 ? (
        <Card className="p-6">
          <p className="text-[14px] leading-[1.6] text-[#6b6459]">
            No steps yet. Add a step to begin.
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
                          <PendingSecondaryButton
                            className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(20,18,16,0.06)] px-4 py-2 text-[12.5px] font-medium text-[#141210] transition-colors hover:bg-[rgba(20,18,16,0.10)] disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {step.enabled ? "Turn off" : "Turn on"}
                          </PendingSecondaryButton>
                        </form>

                        <form action={reorderStep}>
                          <input type="hidden" name="id" value={step.id} />
                          <input type="hidden" name="dir" value="up" />
                          <PendingIconButton
                            disabled={i === 0}
                            ariaLabel="Move up"
                            title="Move up"
                          >
                            <ChevronUp className="h-4 w-4" strokeWidth={2.25} />
                          </PendingIconButton>
                        </form>
                        <form action={reorderStep}>
                          <input type="hidden" name="id" value={step.id} />
                          <input type="hidden" name="dir" value="down" />
                          <PendingIconButton
                            disabled={i === steps.length - 1}
                            ariaLabel="Move down"
                            title="Move down"
                          >
                            <ChevronDown className="h-4 w-4" strokeWidth={2.25} />
                          </PendingIconButton>
                        </form>

                        <div className="ml-auto">
                          <form action={deleteStep}>
                            <input type="hidden" name="id" value={step.id} />
                            <PendingDangerButton
                              icon={<Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />}
                            >
                              Delete
                            </PendingDangerButton>
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

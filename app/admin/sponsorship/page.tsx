import Link from "next/link";
import { Pencil, Plus, Target, Trash2 } from "lucide-react";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { Badge, NotSetUp, PageHeader, PrimaryButton, SecondaryButton } from "../ui";
import { PendingIconButton } from "../PendingButtons";
import { Modal } from "../Modal";
import FlashToast from "../FlashToast";
import PledgeForm, { STATUS_LABEL, type Pledge } from "./PledgeForm";
import { deletePledge, savePledge, saveGoal } from "./actions";

export const metadata = { title: "Sponsorship · Admin · TEDxNewy", robots: { index: false, follow: false } };

const money = (n: number) =>
  n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });

const TONE: Record<Pledge["status"], "draft" | "live" | "red" | "neutral"> = {
  talking: "draft",
  committed: "live",
  paid: "live",
  declined: "neutral",
};

export default async function SponsorshipPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; saved?: string; deleted?: string; error?: string }>;
}) {
  await requireFullAdmin();
  const sp = await searchParams;
  const thisYear = new Date().getFullYear();
  const year = Number(sp.year) || thisYear + 1;

  const supabase = await getServerSupabase();
  const [pledgesRes, goalRes] = await Promise.all([
    supabase.from("sponsorship_pledges").select("*").eq("year", year).order("amount", { ascending: false }),
    supabase.from("sponsorship_goals").select("goal").eq("year", year).maybeSingle(),
  ]);

  if (pledgesRes.error?.code === "42P01") {
    return (
      <div className="adm-stack">
        <PageHeader title="Sponsorship" description="A simple tracker for what each partner has pledged." />
        <NotSetUp title="The tracker isn't set up yet">
          Run <code>supabase/migrations/20261017b_sponsorship_tracker.sql</code> in the Supabase SQL editor, then reload.
        </NotSetUp>
      </div>
    );
  }

  const pledges = ((pledgesRes.data ?? []) as (Pledge & { amount: number | string })[]).map((p) => ({
    ...p,
    amount: Number(p.amount),
  })) as Pledge[];
  const goal = Number((goalRes.data as { goal?: number } | null)?.goal ?? 0);

  const sum = (f: (p: Pledge) => boolean) => pledges.filter(f).reduce((a, p) => a + p.amount, 0);
  const cash = (p: Pledge) => p.kind === "cash";
  const paid = sum((p) => cash(p) && p.status === "paid");
  const committed = sum((p) => cash(p) && (p.status === "committed" || p.status === "paid"));
  const talking = sum((p) => cash(p) && p.status === "talking");
  const inKind = sum((p) => p.kind === "in_kind" && (p.status === "committed" || p.status === "paid"));
  const pct = goal > 0 ? Math.min(100, Math.round((committed / goal) * 100)) : 0;

  const years = [thisYear, thisYear + 1, thisYear + 2];
  const yearHref = (y: number) => `/admin/sponsorship?year=${y}`;

  return (
    <div className="adm-stack">
      <PageHeader
        title="Sponsorship"
        description="A simple tracker: who has pledged what, and how close the year is to its goal."
        actions={
          <Modal
            title="Add a pledge"
            trigger={
              <PrimaryButton type="button">
                <Plus className="h-4 w-4" strokeWidth={2.25} />
                Add pledge
              </PrimaryButton>
            }
          >
            <PledgeForm action={savePledge} year={year} />
          </Modal>
        }
      />

      {sp.saved && <FlashToast clear="saved">Saved.</FlashToast>}
      {sp.deleted && <FlashToast clear="deleted">Removed.</FlashToast>}
      {sp.error && (
        <FlashToast tone="error" clear="error">
          {sp.error === "name" ? "Give the organisation a name." : "Could not save that. Try again."}
        </FlashToast>
      )}

      <div className="adm-pills" role="tablist" aria-label="Year">
        {years.map((y) => (
          <Link key={y} href={yearHref(y)} role="tab" aria-selected={y === year} className={"adm-pill" + (y === year ? " is-active" : "")}>
            {y}
          </Link>
        ))}
      </div>

      <section className="adm-statrow" style={{ ["--n" as string]: 4 }}>
        <div className="adm-stat2">
          <span className="adm-stat2__label">Committed</span>
          <span className="adm-stat2__value">{money(committed)}</span>
          <span className="adm-stat2__foot">
            {goal > 0 && (
              <span className="adm-bar" aria-hidden>
                <i style={{ width: `${Math.max(2, pct)}%` }} />
              </span>
            )}
            <span>{goal > 0 ? `${pct}% of ${money(goal)} goal` : "No goal set"}</span>
          </span>
        </div>
        <div className="adm-stat2">
          <span className="adm-stat2__label">Received</span>
          <span className="adm-stat2__value">{money(paid)}</span>
          <span className="adm-stat2__foot">{money(committed - paid)} still to come in</span>
        </div>
        <div className="adm-stat2">
          <span className="adm-stat2__label">Still talking</span>
          <span className="adm-stat2__value">{money(talking)}</span>
          <span className="adm-stat2__foot">possible, not yet agreed</span>
        </div>
        <div className="adm-stat2">
          <span className="adm-stat2__label">In kind</span>
          <span className="adm-stat2__value">{money(inKind)}</span>
          <span className="adm-stat2__foot">value of agreed support</span>
        </div>
      </section>

      <div className="adm-card__top">
        <h2 className="adm-section__title">{year} pledges</h2>
        <Modal
          title={`${year} goal`}
          trigger={
            <SecondaryButton type="button">
              <Target className="h-3.5 w-3.5" strokeWidth={2.25} />
              {goal > 0 ? "Change goal" : "Set a goal"}
            </SecondaryButton>
          }
        >
          <form action={saveGoal} className="adm-form-stack">
            <input type="hidden" name="year" value={year} />
            <label className="tx-field">
              <span className="tx-field__label">Fundraising goal (AUD)</span>
              <input name="goal" inputMode="decimal" defaultValue={goal || ""} placeholder="60000" className="tx-input" />
            </label>
            <PrimaryButton type="submit">Save goal</PrimaryButton>
          </form>
        </Modal>
      </div>

      {pledges.length === 0 ? (
        <p className="adm-card__text">No pledges for {year} yet. Add the first one.</p>
      ) : (
        <ul className="adm-eventlist">
          {pledges.map((p) => (
            <li key={p.id} className="adm-contact" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
              <div className="adm-contact__main">
                <div className="adm-card__top" style={{ justifyContent: "flex-start", gap: 8 }}>
                  <span className="adm-card__title">{p.org_name}</span>
                  <Badge tone={TONE[p.status]}>{STATUS_LABEL[p.status]}</Badge>
                  {p.kind === "in_kind" && <Badge tone="neutral">In kind</Badge>}
                </div>
                <span className="adm-card__text">
                  {[p.contact_name, p.email].filter(Boolean).join(" · ") || "No contact yet"}
                  {p.notes ? ` · ${p.notes}` : ""}
                </span>
              </div>
              <div className="adm-contact__actions" style={{ alignItems: "center" }}>
                <span className="adm-pledge__amount">{money(p.amount)}</span>
                <Modal
                  title={`Edit ${p.org_name}`}
                  trigger={
                    <SecondaryButton type="button">
                      <Pencil className="h-3.5 w-3.5" strokeWidth={2.25} />
                      Edit
                    </SecondaryButton>
                  }
                >
                  <PledgeForm action={savePledge} year={year} initial={p} />
                </Modal>
                <form action={deletePledge}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="year" value={year} />
                  <PendingIconButton tone="danger" ariaLabel={`Remove ${p.org_name}`} title="Remove">
                    <Trash2 className="h-4 w-4" strokeWidth={2.25} />
                  </PendingIconButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

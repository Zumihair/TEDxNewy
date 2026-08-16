import { Plus, ShieldCheck, Trash2, UserCog, Users } from "lucide-react";
import { requireFullAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import {
  Card,
  DangerButton,
  Field,
  Flash,
  PageHeader,
  PrimaryButton,
  SectionLabel,
  inputCls,
} from "../ui";
import { THEMES } from "../section-theme";
import { addAdmin, removeAdmin, setAdminAccess } from "./actions";

const green = THEMES.green; // Admins is a Settings (green) page.

const ERR_COPY: Record<string, string> = {
  "bad-email": "That doesn't look like a valid email address.",
  exists: "That email is already on the admin list.",
  self: "You can't remove your own access from here. Ask another admin.",
  "self-level":
    "You can't change your own access level. Ask another full admin to do it.",
  failed: "Something went wrong. Try again.",
};

/** What each level can reach. Mirrors app/admin/access.ts. */
const LEVEL_COPY = {
  full: {
    label: "Full",
    hint: "Everything, including this page",
  },
  community: {
    label: "Community",
    hint: "Quick email, Calendar, Socials, Newsletter",
  },
} as const;

type Level = keyof typeof LEVEL_COPY;

const levelOf = (row: { access_level?: string | null }): Level =>
  row.access_level === "community" ? "community" : "full";

export default async function AdminTeamPage({
  searchParams,
}: {
  searchParams: Promise<{
    added?: string;
    removed?: string;
    level?: string;
    error?: string;
  }>;
}) {
  const { email: callerEmail } = await requireFullAdmin();
  const { added, removed, level, error } = await searchParams;
  const supabase = await getServerSupabase();

  const { data: admins } = await supabase
    .from("cms_admins")
    .select("*")
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Team access"
        title="Who can sign in to the admin"
        description="Anyone on this list can sign in to /admin with a magic link. Full access covers the whole CMS; community access is limited to Quick email, Calendar, Socials and Newsletter."
      />

      {added && <Flash tone="ok">Admin added.</Flash>}
      {removed && <Flash tone="ok">Admin removed.</Flash>}
      {level && <Flash tone="ok">Access level updated.</Flash>}
      {error && <Flash tone="error">{ERR_COPY[error] ?? "Something went wrong."}</Flash>}

      <div className="grid gap-8 md:grid-cols-[1fr_320px]">
        {/* List */}
        <Card>
          <ul className="divide-y divide-[rgba(20,18,16,0.08)]">
            {(admins ?? []).map((a) => {
              const isSelf =
                (a.email as string).toLowerCase() === callerEmail.toLowerCase();
              const lvl = levelOf(a);
              return (
                <li
                  key={a.id}
                  className="grid grid-cols-[36px_1fr_auto] items-center gap-4 px-4 py-3.5 md:px-5"
                >
                  <span
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full font-mono text-[12px] font-semibold uppercase"
                    style={{ backgroundColor: green.chipBg, color: green.chipFg }}
                    aria-hidden
                  >
                    {(a.name ?? a.email).slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-[14.5px] font-medium text-[#141210]">
                        {a.name ?? a.email}
                      </span>
                      {isSelf && (
                        <span
                          className="rounded-full px-2 py-0.5 font-mono text-[9.5px] font-semibold uppercase"
                          style={{
                            letterSpacing: "0.22em",
                            backgroundColor: green.chipBg,
                            color: green.chipFg,
                          }}
                        >
                          You
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[12.5px] text-[#6b6459]">
                      {a.email}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <LevelControl email={a.email} level={lvl} locked={isSelf} />
                    {!isSelf && (
                      <form action={removeAdmin}>
                        <input type="hidden" name="email" value={a.email} />
                        <DangerButton type="submit">
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                          Remove
                        </DangerButton>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
            {(!admins || admins.length === 0) && (
              <li className="px-5 py-12 text-center text-[14px] text-[#6b6459]">
                No admins yet. (How are you reading this?)
              </li>
            )}
          </ul>
        </Card>

        {/* Add form */}
        <aside className="md:sticky md:top-8 md:self-start">
          <SectionLabel>Add an admin</SectionLabel>
          <Card className="mt-3 space-y-4 p-5">
            <form action={addAdmin} className="space-y-4">
              <Field label="Email">
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="teammate@tedxnewy.com.au"
                  className={inputCls}
                />
              </Field>
              <Field label="Name" hint="Optional — shown in the list.">
                <input
                  name="name"
                  placeholder="e.g. Jane Doe"
                  className={inputCls}
                />
              </Field>
              <Field
                label="Access"
                hint="Community is the safe default. You can change it any time."
              >
                <div className="space-y-1.5">
                  {(["community", "full"] as Level[]).map((l) => (
                    <label
                      key={l}
                      className="flex cursor-pointer items-start gap-2.5 rounded-[var(--radius-sm)] border border-[rgba(20,18,16,0.10)] px-3 py-2 transition-colors hover:bg-[#f9f5ec]"
                    >
                      <input
                        type="radio"
                        name="access"
                        value={l}
                        defaultChecked={l === "community"}
                        className="mt-1 accent-[#2f6f4e]"
                      />
                      <span className="min-w-0">
                        <span className="block text-[13.5px] font-medium text-[#141210]">
                          {LEVEL_COPY[l].label}
                        </span>
                        <span className="block text-[11.5px] leading-[1.45] text-[#6b6459]">
                          {LEVEL_COPY[l].hint}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </Field>
              <div className="flex">
                <PrimaryButton type="submit">
                  <Plus className="h-4 w-4" strokeWidth={2.25} />
                  Add admin
                </PrimaryButton>
              </div>
            </form>
            <div className="rounded-[var(--radius-sm)] bg-[#f9f5ec] p-3 text-[12px] leading-[1.55] text-[#6b6459]">
              <div className="inline-flex items-center gap-1.5 text-[#141210]">
                <UserCog className="h-3.5 w-3.5" strokeWidth={2.25} />
                <span className="font-mono text-[10.5px] font-semibold uppercase" style={{ letterSpacing: "0.22em" }}>
                  Heads-up
                </span>
              </div>
              <p className="mt-1.5">
                The new admin won&rsquo;t receive a notification. Send them to{" "}
                <code className="font-mono text-[#141210]">/admin/login</code> and tell
                them to use that email — they&rsquo;ll get a magic link the
                first time they try.
              </p>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

/**
 * Segmented Full / Community switch for one row. Two one-button forms rather
 * than a select, so it works without JS and reads as a state at a glance.
 * Your own row renders as a static chip: you can't change your own level.
 */
function LevelControl({
  email,
  level,
  locked,
}: {
  email: string;
  level: Level;
  locked: boolean;
}) {
  const Icon = level === "full" ? ShieldCheck : Users;

  if (locked) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[9.5px] font-semibold uppercase"
        style={{
          letterSpacing: "0.18em",
          backgroundColor: green.chipBg,
          color: green.chipFg,
        }}
        title={LEVEL_COPY[level].hint}
      >
        <Icon className="h-3 w-3" strokeWidth={2.25} />
        {LEVEL_COPY[level].label}
      </span>
    );
  }

  return (
    <div className="inline-flex overflow-hidden rounded-full border border-[rgba(20,18,16,0.12)]">
      {(["full", "community"] as Level[]).map((l) => {
        const active = l === level;
        return (
          <form key={l} action={setAdminAccess}>
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="access" value={l} />
            <button
              type="submit"
              disabled={active}
              title={LEVEL_COPY[l].hint}
              className={
                "px-2.5 py-1 font-mono text-[9.5px] font-semibold uppercase transition-colors " +
                (active
                  ? "cursor-default"
                  : "text-[#6b6459] hover:bg-[rgba(20,18,16,0.06)] hover:text-[#141210]")
              }
              style={
                active
                  ? {
                      letterSpacing: "0.18em",
                      backgroundColor: green.chipBg,
                      color: green.chipFg,
                    }
                  : { letterSpacing: "0.18em" }
              }
            >
              {LEVEL_COPY[l].label}
            </button>
          </form>
        );
      })}
    </div>
  );
}

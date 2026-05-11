import { Plus, Trash2, UserCog } from "lucide-react";
import { requireAdmin } from "@/lib/cms-auth";
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
import { addAdmin, removeAdmin } from "./actions";

const ERR_COPY: Record<string, string> = {
  "bad-email": "That doesn't look like a valid email address.",
  exists: "That email is already on the admin list.",
  self: "You can't remove your own access from here. Ask another admin.",
  failed: "Something went wrong. Try again.",
};

export default async function AdminTeamPage({
  searchParams,
}: {
  searchParams: Promise<{
    added?: string;
    removed?: string;
    error?: string;
  }>;
}) {
  const { email: callerEmail } = await requireAdmin();
  const { added, removed, error } = await searchParams;
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
        description="Anyone on this list can sign in to /admin with a magic link. Add a teammate by email — they'll get the link the next time they hit /admin/login."
      />

      {added && <Flash tone="ok">Admin added.</Flash>}
      {removed && <Flash tone="ok">Admin removed.</Flash>}
      {error && <Flash tone="error">{ERR_COPY[error] ?? "Something went wrong."}</Flash>}

      <div className="grid gap-8 md:grid-cols-[1fr_320px]">
        {/* List */}
        <Card>
          <ul className="divide-y divide-[rgba(20,18,16,0.08)]">
            {(admins ?? []).map((a) => {
              const isSelf =
                (a.email as string).toLowerCase() === callerEmail.toLowerCase();
              return (
                <li
                  key={a.id}
                  className="grid grid-cols-[36px_1fr_auto] items-center gap-4 px-4 py-3.5 md:px-5"
                >
                  <span
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#141210] font-mono text-[12px] font-semibold uppercase text-white"
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
                          className="rounded-full bg-[#e02214]/10 px-2 py-0.5 font-mono text-[9.5px] font-semibold uppercase text-[#b91404]"
                          style={{ letterSpacing: "0.22em" }}
                        >
                          You
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[12.5px] text-[#6b6459]">
                      {a.email}
                    </div>
                  </div>
                  {!isSelf && (
                    <form action={removeAdmin}>
                      <input type="hidden" name="email" value={a.email} />
                      <DangerButton type="submit">
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                        Remove
                      </DangerButton>
                    </form>
                  )}
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

import { Plus, Save } from "lucide-react";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { Badge, Card, Field, NotSetUp, PageHeader, SectionLabel, inputCls } from "../ui";
import { PendingButton } from "../PendingButtons";
import NavItemRow, { type NavItem } from "./NavItemRow";
import { addItem, updateGroup } from "./actions";

type Group = {
  key: string;
  label: string;
  style: "list" | "cards";
  kicker: string | null;
  heading: string | null;
  blurb: string | null;
  display_order: number | null;
};

export const metadata = {
  title: "Navigation · Admin · TEDxNewy",
};

export default async function AdminNavigationPage() {
  await requireAdmin();
  const supabase = await getServerSupabase();

  const [groupsRes, itemsRes] = await Promise.all([
    supabase
      .from("cms_nav_groups")
      .select("*")
      .order("display_order", { ascending: true }),
    supabase
      .from("cms_nav_items")
      .select("*")
      .order("display_order", { ascending: true }),
  ]);

  if (groupsRes.error) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Settings"
          title="Header menu"
          description="Edit the drop-down menus in the site header."
        />
        <NotSetUp title="The menu isn't set up yet">
          The navigation database update hasn&rsquo;t been applied yet. Ask Will
          to run the database update, then reload this page.
        </NotSetUp>
      </div>
    );
  }

  const groups = (groupsRes.data ?? []) as Group[];
  const allItems = (itemsRes.data ?? []) as NavItem[];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Settings"
        title="Header menu"
        description="Edit the drop-down menus in the site header. Each menu is either a simple list of links or a row of picture cards. The Upcoming menu also fills itself with announced events automatically, so you only manage extra links here. Changes go live within a few minutes."
      />

      <div className="space-y-8">
        {groups.map((group) => {
          const items = allItems.filter((i) => i.group_key === group.key);
          return (
            <Card key={group.key} className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <SectionLabel>{group.label} menu</SectionLabel>
                <Badge tone="neutral">
                  {group.style === "cards" ? "Picture cards" : "Link list"}
                </Badge>
              </div>

              {/* Group heading / lede (shown on link-list menus) */}
              <form action={updateGroup} className="mt-5 space-y-4">
                <input type="hidden" name="key" value={group.key} />
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Menu name" hint="The word shown in the header.">
                    <input
                      name="label"
                      defaultValue={group.label}
                      className={inputCls}
                    />
                  </Field>
                  {group.style === "list" && (
                    <Field label="Kicker" hint="Small label above the heading.">
                      <input
                        name="kicker"
                        defaultValue={group.kicker ?? ""}
                        className={inputCls}
                      />
                    </Field>
                  )}
                </div>
                {group.style === "list" && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Heading">
                      <input
                        name="heading"
                        defaultValue={group.heading ?? ""}
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Blurb" hint="One line under the heading.">
                      <input
                        name="blurb"
                        defaultValue={group.blurb ?? ""}
                        className={inputCls}
                      />
                    </Field>
                  </div>
                )}
                {group.style === "cards" && (
                  <>
                    <input type="hidden" name="kicker" value={group.kicker ?? ""} />
                    <input type="hidden" name="heading" value={group.heading ?? ""} />
                    <input type="hidden" name="blurb" value={group.blurb ?? ""} />
                  </>
                )}
                <div>
                  <PendingButton
                    icon={<Save className="h-4 w-4" strokeWidth={2.25} />}
                  >
                    Save menu
                  </PendingButton>
                </div>
              </form>

              {group.key === "upcoming" && (
                <p className="mt-6 rounded-[var(--radius-md)] bg-[rgba(47,111,78,0.06)] px-4 py-3 text-[13px] leading-[1.55] text-[#6b6459]">
                  Announced events show at the top of this menu automatically.
                  Manage those under Events. Anything you add below appears after
                  them.
                </p>
              )}

              {/* Items */}
              <div className="mt-6 space-y-4">
                {items.map((item, i) => (
                  <NavItemRow
                    key={item.id}
                    item={item}
                    style={group.style}
                    isFirst={i === 0}
                    isLast={i === items.length - 1}
                  />
                ))}
                {items.length === 0 && (
                  <p className="text-[13.5px] text-[#6b6459]">
                    No extra links in this menu yet.
                  </p>
                )}
              </div>

              <form action={addItem} className="mt-5">
                <input type="hidden" name="group_key" value={group.key} />
                <PendingButton
                  icon={<Plus className="h-4 w-4" strokeWidth={2.25} />}
                >
                  Add a link
                </PendingButton>
              </form>
            </Card>
          );
        })}

        {groups.length === 0 && (
          <NotSetUp title="No menus yet">
            The navigation database update may not have finished. Ask Will to run
            the database update, then reload this page.
          </NotSetUp>
        )}
      </div>
    </div>
  );
}

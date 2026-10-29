import Link from "next/link";
import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { GENERAL_ROLE, type VolunteerRoleRow } from "@/lib/volunteer-roles";
import { NotSetUp, PageHeader } from "../ui";
import AddRecordButton from "../AddRecordButton";
import FlashToast from "../FlashToast";
import RoleForm from "./RoleForm";
import RolesList from "./RolesList";
import { createRole } from "./actions";

export const metadata = { title: "Volunteer roles · Admin · TEDxNewy", robots: { index: false, follow: false } };

const DESCRIPTION = "The roles posted on /volunteer. Open ones are live; applications land in Forms, Volunteers.";

export default async function VolunteerRolesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string }>;
}) {
  await requireAdmin();
  const { saved, deleted } = await searchParams;
  const supabase = await getServerSupabase();

  const [{ data, error }, { data: apps }] = await Promise.all([
    supabase
      .from("volunteer_roles")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase.from("applications").select("role").not("role", "is", null),
  ]);

  if (error?.code === "42P01" || error?.code === "PGRST205") {
    return (
      <div className="adm-stack">
        <PageHeader title="Volunteer roles" description={DESCRIPTION} />
        <NotSetUp title="Volunteer roles aren't set up yet">
          Run <code>supabase/migrations/20261029b_volunteer_roles.sql</code> in the Supabase SQL editor, then reload.
        </NotSetUp>
      </div>
    );
  }

  const applications: Record<string, number> = {};
  for (const a of apps ?? []) {
    const k = String((a as { role: string }).role);
    applications[k] = (applications[k] ?? 0) + 1;
  }
  const general = applications[GENERAL_ROLE.title] ?? 0;

  return (
    <div className="adm-stack">
      <PageHeader
        title="Volunteer roles"
        description={DESCRIPTION}
        actions={
          <AddRecordButton label="Add role">
            <RoleForm mode="new" initial={{ status: "draft" }} action={createRole} />
          </AddRecordButton>
        }
      />

      {saved && <FlashToast clear="saved">Saved.</FlashToast>}
      {deleted && <FlashToast clear="deleted">Deleted.</FlashToast>}

      <RolesList roles={(data ?? []) as VolunteerRoleRow[]} applications={applications} />

      <p className="adm-card__text">
        The general &ldquo;{GENERAL_ROLE.title}&rdquo; card always shows first on the page, for anyone who
        isn&rsquo;t sure where they fit ({general} application{general === 1 ? "" : "s"} so far). Read
        applications in <Link href="/admin/forms/volunteers">Forms, Volunteers</Link>, where each one shows the
        role it was for.
      </p>
    </div>
  );
}

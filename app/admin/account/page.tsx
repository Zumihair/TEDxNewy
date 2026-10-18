import { requireAdmin } from "@/lib/cms-auth";
import { getServerSupabase } from "@/lib/supabase-server";
import { Badge, Card, Field, PageHeader, SectionLabel, inputCls } from "../ui";
import ImageUploadField from "../ImageUploadField";
import FlashToast from "../FlashToast";
import { changePassword, saveMyProfile } from "./actions";

export const metadata = { title: "My account · Admin · TEDxNewy", robots: { index: false, follow: false } };

type Member = {
  slug: string;
  name: string;
  role: string | null;
  bio: string | null;
  image_url: string | null;
  email: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const me = await requireAdmin({ readOnly: true });
  const { saved, error } = await searchParams;
  let member: Member | null = null;
  if (me.teamSlug) {
    const supabase = await getServerSupabase();
    const { data } = await supabase.from("cms_team_members").select("*").eq("slug", me.teamSlug).maybeSingle();
    member = (data as Member | null) ?? null;
  }

  return (
    <div className="adm-stack">
      <PageHeader title="My account" description="Your password and, if you are on the team page, your own profile." />
      {saved && <FlashToast clear="saved">{saved}</FlashToast>}
      {error && (
        <FlashToast tone="error" clear="error">
          {error}
        </FlashToast>
      )}

      <Card className="space-y-4 p-6">
        <div className="adm-card__top" style={{ justifyContent: "flex-start", gap: 8 }}>
          <span className="adm-card__title">{me.label ?? me.email}</span>
          {me.admin ? <Badge tone="red">Admin</Badge> : me.canEdit ? <Badge tone="neutral">Can edit</Badge> : <Badge tone="neutral">View only</Badge>}
        </div>
        <SectionLabel>Change password</SectionLabel>
        <form action={changePassword} data-keep="1" className="adm-form-stack">
          <label className="tx-field">
            <span className="tx-field__label">New password</span>
            <input name="password" type="password" autoComplete="new-password" required minLength={8} className="tx-input" />
          </label>
          <label className="tx-field">
            <span className="tx-field__label">Again</span>
            <input name="again" type="password" autoComplete="new-password" required minLength={8} className="tx-input" />
            <span className="tx-field__hint">Your password is what signs you in, so it has to be different from everyone else&rsquo;s.</span>
          </label>
          <button type="submit" className="tx-btn tx-btn--accent">Change password</button>
        </form>
      </Card>

      {member ? (
        <Card className="space-y-6 p-6">
          <SectionLabel>My profile</SectionLabel>
          <p className="adm-card__text">This is what shows for {member.name} on the team page.</p>
          <form action={saveMyProfile} data-keep="1" className="space-y-6">
            <ImageUploadField
              name="image_url"
              label="Headshot"
              defaultValue={member.image_url ?? ""}
              folder="team"
              baseName={member.slug}
              aspect="4/5"
              hint="A 4:5 portrait works best."
            />
            <Field label="Role">
              <input name="role" defaultValue={member.role ?? ""} className={inputCls} />
            </Field>
            <Field label="Bio" hint="One or two sentences. Plain text.">
              <textarea name="bio" rows={4} defaultValue={member.bio ?? ""} className={`${inputCls} leading-[1.55]`} />
            </Field>
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Contact email">
                <input type="email" name="email" defaultValue={member.email ?? ""} className={inputCls} />
              </Field>
              <Field label="LinkedIn URL">
                <input type="url" name="linkedin_url" defaultValue={member.linkedin_url ?? ""} className={inputCls} />
              </Field>
            </div>
            <Field label="Instagram URL">
              <input type="url" name="instagram_url" defaultValue={member.instagram_url ?? ""} className={inputCls} />
            </Field>
            <button type="submit" className="tx-btn tx-btn--accent">Save profile</button>
          </form>
        </Card>
      ) : (
        <Card className="p-6">
          <span className="adm-card__title">Profile</span>
          <p className="adm-card__text" style={{ marginTop: 8 }}>
            Your sign-in is not linked to a team member yet. An admin can link it from the Team page, and then you can
            keep your headshot, bio and social links up to date here.
          </p>
        </Card>
      )}
    </div>
  );
}

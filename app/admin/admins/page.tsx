import { requireFullAdmin } from "@/lib/cms-auth";
import { ADMIN_ACCOUNTS } from "@/lib/admin-accounts";
import { Badge, Card, PageHeader } from "../ui";

const REACH: Record<string, string> = {
  full: "Everything: events, tickets, partners, the inbox, the library and settings.",
  community: "Quick email, Newsletter, Socials and Calendar.",
};

export default async function AdminAccessPage() {
  await requireFullAdmin();
  return (
    <div className="adm-stack">
      <PageHeader
        title="Access levels"
        description="Sign-in is by password. The password someone enters decides what they can reach."
      />
      <div className="adm-grid adm-grid--cards">
        {ADMIN_ACCOUNTS.map((a) => (
          <Card key={a.email} className="p-6">
            <div className="adm-card__top">
              <span className="adm-card__title">{a.label}</span>
              <Badge tone={a.access === "full" ? "red" : "neutral"}>{a.access}</Badge>
            </div>
            <p className="adm-card__text" style={{ marginTop: 8 }}>
              {a.access === "full"
                ? REACH.full
                : "Quick email, Newsletter, Socials and Calendar."}
            </p>
            <p className="adm-card__text" style={{ marginTop: 8 }}>
              Account: <code>{a.email}</code>
            </p>
          </Card>
        ))}
      </div>
      <Card className="p-6">
        <span className="adm-card__title">Changing a password</span>
        <p className="adm-card__text" style={{ marginTop: 8 }}>
          In Supabase, open Authentication, then Users, pick the account above and choose Reset
          password. The change applies immediately. Share the new password with the people who
          need that level.
        </p>
      </Card>
    </div>
  );
}

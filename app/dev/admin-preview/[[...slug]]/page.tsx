import "../../../admin/admin.css";
import { notFound } from "next/navigation";
import AdminShell from "../../../admin/AdminShell";
import { HomeView, HubView } from "../../../admin/views";
import { PageHeader } from "../../../admin/PageHeader";
import { Card, PrimaryButton, SecondaryButton, Badge } from "../../../admin/ui";
import { NAV_GROUPS } from "../../../admin/nav-config";
import { Field, Segmented } from "@/components/ds";

export const metadata = { title: "Admin preview (sample data)", robots: { index: false, follow: false } };

async function noop() {
  "use server";
}

/** Sample-data preview of the new admin look. No sign-in, no database; safe to share. */
export default async function AdminPreview({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const key = slug?.[0] ?? "home";
  const group = NAV_GROUPS.find((g) => g.key === key);
  const isSample = key === "sample";
  if (!group && !isSample) notFound();
  const activeKey = isSample ? "comms" : key;

  return (
    <AdminShell user={{ email: "full@admin.tedxnewy.com.au" }} groups={NAV_GROUPS} signOutAction={noop} activeKey={activeKey} defaultOpen={slug?.[1] === "menu"}>
      {key === "home" ? (
        <HomeView
          greeting="Good morning"
          today="Friday 16 October"
          pulse={[
            { href: "#", label: "Signal tickets", value: "232/240", sub: "97% sold, +6 this week", pct: 97 },
            { href: "#", label: "Gross ticket revenue", value: "$14,820", sub: "+6 tickets this week" },
            { href: "#", label: "Subscribers", value: "1,284", sub: "+31 this week" },
            { href: "#", label: "Partner pipeline", value: "27", sub: "organisations on the board" },
          ]}
          forms={[
            { label: "Speaker nominations", count: 12, href: "#" },
            { label: "Volunteers", count: 8, href: "#" },
            { label: "Partner enquiries", count: 3, href: "#" },
            { label: "Contact messages", count: 5, href: "#" },
            { label: "Waitlist", count: 41, href: "#" },
            { label: "Feedback", count: 19, href: "#" },
          ]}
          workspaces={NAV_GROUPS.filter((g) => g.key !== "home")}
        />
      ) : isSample ? (
        <div className="adm-stack">
          <PageHeader
            title="Newsletter"
            description="Campaigns, the subscriber list and the welcome flow."
            backHref="/dev/admin-preview/comms"
            actions={<PrimaryButton>New campaign</PrimaryButton>}
          />
          <Segmented options={["Campaigns", "Subscribers", "Welcome flow"]} value="Campaigns" />
          <Card className="p-5">
            <div style={{ display: "grid", gap: 16 }}>
              <Field label="Subject" placeholder="Signal is nearly here" />
              <Field label="Audience" type="select" options={[{ value: "all", label: "All subscribers" }]} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <Badge tone="draft">Draft</Badge>
                <Badge tone="live">Live</Badge>
              </div>
              <SecondaryButton>Save draft</SecondaryButton>
              <PrimaryButton>Send test</PrimaryButton>
            </div>
          </Card>
        </div>
      ) : (
        <HubView group={group!} />
      )}
    </AdminShell>
  );
}

import "../../../admin/admin.css";
import { notFound } from "next/navigation";
import Link from "next/link";
import AdminShell from "../../../admin/AdminShell";
import { CommsView, HomeView, HubView } from "../../../admin/views";
import { PageHeader } from "../../../admin/PageHeader";
import { Badge, Card, PrimaryButton, SecondaryButton } from "../../../admin/ui";
import { NAV_GROUPS } from "../../../admin/nav-config";
import EventsTable, { type EventRow } from "../../../admin/events/EventsTable";
import { Field, Meter, Segmented } from "@/components/ds";
import BrandPortal from "@/components/team-brand/BrandPortal";
import NewsletterEditor from "../../../admin/newsletter/NewsletterEditor";
import SubmissionsTable from "../../../admin/SubmissionsTable";
import TemplateEditor from "@/components/team-brand/TemplateEditor";
import { TEMPLATES, TEMPLATE_GROUPS } from "@/components/team-brand/templates-data";
import { Icon, type IconName } from "@/components/ds";
import CampaignsList from "../../../admin/newsletter/campaigns/CampaignsList";
import TalksTable from "../../../admin/talks/TalksTable";
import TalksSpeakersNav from "../../../admin/talks/TalksSpeakersNav";
import SpeakersList from "../../../admin/speakers/SpeakersList";
import SponsorsList from "../../../admin/sponsors/SponsorsList";
import ComposeForm from "../../../admin/emails/ComposeForm";
import CreativeStudio from "@/components/team-brand/CreativeStudio";
import DeckTemplate from "@/components/team-brand/DeckTemplate";
import Studio from "@/components/team-brand/Studio";
import { TicketsView } from "../../../admin/tickets/TicketsView";

export const metadata = { title: "Admin preview (sample data)", robots: { index: false, follow: false } };

async function noop() {
  "use server";
}

const growth = {
  total: 1284,
  last7: 31,
  labels: ["17 Jul", "24 Jul", "31 Jul", "7 Aug", "14 Aug", "21 Aug", "28 Aug", "4 Sep", "11 Sep", "18 Sep", "25 Sep", "2 Oct", "9 Oct"],
  values: [880, 902, 931, 968, 1004, 1038, 1061, 1102, 1139, 1176, 1210, 1253, 1284],
};

const events: EventRow[] = [
  { id: "1", slug: "signal-2026", title: "Signal", status: "announced", starts_at: "2026-10-24T01:00:00Z", date_label: "Saturday 24 October 2026", short_date: "24 Oct", venue: "Conservatorium of Music", chips: { attendees: <p>Sample attendees</p>, demographics: <p>Sample demographics</p> } },
  { id: "2", slug: "youth-futures-lab", title: "Youth Futures Lab", status: "past", starts_at: "2026-08-06T23:00:00Z", date_label: "Friday 7 August 2026", short_date: "7 Aug", venue: "NUspace", chips: { attendees: <p>x</p>, feedback: <p>x</p>, impactReport: <p>x</p> } },
  { id: "3", slug: "60-second-talk-night", title: "60-Second Talk Night", status: "past", starts_at: "2026-07-16T09:00:00Z", date_label: "Thursday 16 July 2026", short_date: "16 Jul", venue: "The Base, Newcastle West", chips: { attendees: <p>x</p>, feedback: <p>x</p> } },
];

/** Sample-data preview of the new admin look. No sign-in, no database; safe to share. */
export default async function AdminPreview({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const key = slug?.[0] ?? "home";
  const group = NAV_GROUPS.find((g) => g.key === key);
  const special = ["sample", "brand", "template", "access", "comms-dash", "newsletter-edit", "submissions", "campaigns", "talks", "speakers", "sponsors", "compose", "graphic", "deck", "templates", "tickets", "studio"].includes(key);
  if (!group && !special) notFound();
  const activeKey =
    ["sample", "comms-dash", "newsletter-edit", "campaigns", "compose", "graphic"].includes(key) ? "comms"
    : key === "submissions" ? "inbox"
    : ["brand", "template", "deck", "templates", "studio"].includes(key) ? "library"
    : key === "access" ? "settings"
    : ["talks", "speakers", "tickets"].includes(key) ? "events"
    : key === "sponsors" ? "partners"
    : key;
  const activeHref =
    key === "brand" ? "/admin/brand"
    : ["template", "deck", "templates", "studio"].includes(key) ? "/admin/brand/templates"
    : key === "access" ? "/admin/admins"
    : key === "newsletter-edit" || key === "campaigns" || key === "sample" ? "/admin/newsletter"
    : key === "submissions" ? "/admin/forms"
    : key === "events" ? "/admin/events"
    : key === "comms-dash" ? "/admin/w/comms"
    : key === "talks" || key === "speakers" ? "/admin/talks"
    : key === "tickets" ? "/admin/tickets"
    : key === "sponsors" ? "/admin/sponsors"
    : key === "compose" ? "/admin/emails"
    : key === "graphic" ? "/admin/socials"
    : undefined;
  const comms = NAV_GROUPS.find((g) => g.key === "comms")!;

  return (
    <AdminShell
      user={{ email: "full@admin.tedxnewy.com.au", label: "Full access" }}
      groups={NAV_GROUPS}
      signOutAction={noop}
      activeKey={activeKey}
      activeHref={activeHref}
      defaultOpen={slug?.[1] === "menu"}
    >
      {key === "home" ? (
        <HomeView
          greeting="Good morning"
          headline="Signal is 8 days away."
          today="Friday 16 October"
          stats={[
            { href: "#", label: "Signal tickets sold", value: "232", foot: "of 240 · +6 this week", pct: 97 },
            { href: "#", label: "Ticket revenue", value: "$14,820", foot: "before fees" },
            { href: "#", label: "Subscribers", value: "1,284", foot: "+31 this week" },
          ]}
          growth={growth}
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
      ) : key === "comms" || key === "comms-dash" ? (
        <CommsView
          group={comms}
          growth={growth}
          upcoming={[
            { id: "a", title: "Signal: one week to go", kind: "Newsletter", when: "Fri 16 Oct, 6:00 pm", href: "#", days: 0 },
            { id: "b", title: "Meet the speakers", kind: "Social post", when: "Sat 17 Oct, 9:00 am", href: "#", days: 1 },
            { id: "c", title: "Event week guide", kind: "Social post", when: "Mon 19 Oct, 12:00 pm", href: "#", days: 3 },
          ]}
          drafts={{ newsletters: 3, posts: 5 }}
          stats={[
            { href: "#", label: "Subscribers", value: "1,284", foot: "on the list" },
            { href: "#", label: "New this week", value: "+31", foot: "joined in 7 days" },
            { href: "#", label: "Scheduled", value: "3", foot: "going out soon" },
            { href: "#", label: "Drafts", value: "8", foot: "in progress" },
          ]}
        />
      ) : key === "events" ? (
        <div className="adm-stack">
          <PageHeader title="Events" description="What each event gathered: submissions, attendees, feedback and who bought tickets. Events themselves change through code and database migrations." />
          <Link href="#" className="adm-ticketstrip">
            <div className="adm-ticketstrip__main">
              <span className="tx-stat__label">Signal tickets</span>
              <span className="adm-ticketstrip__value">232<small> of 240</small></span>
            </div>
            <div className="adm-ticketstrip__meter"><Meter label="Sold" value={97} display="97%" /></div>
            <div className="adm-ticketstrip__side"><span className="tx-stat__label">Revenue</span><strong>$14,820</strong></div>
            <div className="adm-ticketstrip__side"><span className="tx-stat__label">Last 7 days</span><strong>+6</strong></div>
          </Link>
          <section className="adm-section">
            <h2 className="adm-section__title">Coming up</h2>
            <EventsTable events={events.slice(0, 1)} />
          </section>
          <section className="adm-section">
            <h2 className="adm-section__title">Past events</h2>
            <EventsTable events={events.slice(1)} />
          </section>
        </div>
      ) : key === "newsletter-edit" ? (
        <div className="adm-stack">
          <PageHeader title="Signal: one week to go" description="Build the email, preview it, then schedule it." backHref="/dev/admin-preview/campaigns" />
          <NewsletterEditor
            newsletter={{
              id: "x",
              title: "Signal: one week to go",
              subject: "One week until Signal",
              preheader: "Everything you need for Saturday",
              from_address: "TEDxNewy <noreply@tedxnewy.com.au>",
              audience: "subscribers",
              blocks: [
                { id: "a", type: "header", title: "One week to go", subtitle: "Signal, Saturday 24 October" },
                { id: "b", type: "text", html: "<p>Doors open at 1:30pm at the Conservatorium of Music.</p>" },
              ],
              status: "draft",
              stage: "polish",
              scheduled_at: null,
            }}
            templates={[]}
            subscriberCount={1284}
            staticPreviewHtml={'<body style="font-family:Inter,sans-serif;margin:0;background:#fff"><div style="max-width:520px;margin:24px auto;padding:0 20px"><img src="/brand/media/TEDxNewy-Standard-black.png" height="28" alt=""/><h1 style="font-size:28px;margin:28px 0 8px">One week to go</h1><p style="color:#555">Signal, Saturday 24 October</p><p>Doors open at 1:30pm at the Conservatorium of Music.</p></div></body>'}
          />
        </div>
      ) : key === "campaigns" ? (
        <div className="adm-stack">
          <PageHeader title="Newsletter" actions={<PrimaryButton>New newsletter</PrimaryButton>} />
          <div className="adm-pills"><span className="adm-pill is-active">Drafts<span className="adm-pill__n">3</span></span><span className="adm-pill">Scheduled<span className="adm-pill__n">1</span></span><span className="adm-pill">Sent<span className="adm-pill__n">14</span></span></div>
          <CampaignsList
            tab="drafts"
            rows={[
              { id: "1", title: "Signal: one week to go", subject: "One week until Signal", preheader: "", blocks: [], status: "draft", stage: "ready", updated_at: "2026-10-16T05:00:00Z", scheduled_at: null, sent_at: null, sent_count: null, failed_count: null, send_batch_id: null },
              { id: "2", title: "Meet the speakers", subject: "", preheader: "", blocks: [], status: "draft", stage: "polish", updated_at: "2026-10-14T05:00:00Z", scheduled_at: null, sent_at: null, sent_count: null, failed_count: null, send_batch_id: null },
              { id: "3", title: "Thank you to our partners", subject: "", preheader: "", blocks: [], status: "draft", stage: "draft", updated_at: "2026-10-10T05:00:00Z", scheduled_at: null, sent_at: null, sent_count: null, failed_count: null, send_batch_id: null },
            ]}
          />
        </div>
      ) : key === "submissions" ? (
        <div className="adm-stack">
          <PageHeader title="Speaker nominations" description="12 nominations so far." backHref="/dev/admin-preview/inbox" />
          <SubmissionsTable
            rows={[
              { id: "1", created_at: "2026-10-14T01:00:00Z", name: "Alex Morgan", email: "alex@example.com", idea: "Why Newcastle should have a night sky strategy", contacted: false },
              { id: "2", created_at: "2026-10-12T04:00:00Z", name: "Priya Shah", email: "priya@example.com", idea: "Teaching kids to disagree well", contacted: true },
              { id: "3", created_at: "2026-10-09T22:30:00Z", name: "Sam O'Connor", email: "sam@example.com", idea: "The case for slow infrastructure", contacted: false },
            ]}
            columns={[
              { id: "name", label: "Name", headline: true },
              { id: "email", label: "Email", link: "mailto", headline: true },
              { id: "idea", label: "Idea", headline: true },
            ]}
            searchKeys={["name", "email", "idea"]}
            deleteAction={noop}
            contactedAction={noop}
            exportName="nominations"
          />
        </div>
      ) : key === "access" ? (
        <div className="adm-stack">
          <PageHeader title="Access" description="Each password signs in with its own set of workspaces. Create one per group, and change or remove it any time." actions={<PrimaryButton>New access</PrimaryButton>} />
          <ul className="adm-eventlist">
            <li className="adm-access"><div className="adm-access__main"><div className="adm-card__top" style={{ justifyContent: "flex-start", gap: 8 }}><span className="adm-card__title">Full access</span><Badge tone="red">Everything</Badge><Badge tone="live">You</Badge></div><span className="adm-card__text">Every workspace, including this page.</span></div></li>
            <li className="adm-access"><div className="adm-access__main"><span className="adm-card__title">Comms team</span><div className="adm-access__chips"><Badge tone="neutral">Comms</Badge><Badge tone="neutral">Library</Badge></div></div><div className="adm-access__actions"><SecondaryButton>Edit</SecondaryButton></div></li>
          </ul>
        </div>
      ) : key === "brand" ? (
        <div className="adm-stack">
          <PageHeader title="Logos and branding" description="Logos, colours, fonts and the lines we use again and again, ready to download or copy." />
          <BrandPortal />
        </div>
      ) : key === "templates" ? (
        <div className="adm-stack">
          <PageHeader title="Templates" description="Ready-made, on-brand starting points. Open one, fill it in and print, copy or download." />
          {TEMPLATE_GROUPS.map((g) => (
            <section key={g.key} className="adm-section">
              <div><h2 className="adm-section__title">{g.title}</h2><p className="adm-card__text">{g.blurb}</p></div>
              <div className="adm-grid adm-grid--cards">
                {TEMPLATES.filter((t) => t.group === g.key).map((t) => (
                  <Link key={t.slug} href={`/dev/admin-preview/template/${t.slug}`} className="adm-card">
                    <div className="adm-card__top"><span className="adm-chip"><Icon name={t.icon as IconName} size={18} /></span><Icon name="arrow-up-right" size={16} /></div>
                    <span className="adm-card__title">{t.title}</span>
                    <span className="adm-card__text">{t.blurb}</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : key === "template" ? (
        <TemplateEditor slug={slug?.[1] ?? "letterhead"} title={TEMPLATES.find((t) => t.slug === slug?.[1])?.title ?? "Letterhead"} />
      ) : key === "deck" ? (
        <div className="adm-stack"><PageHeader title="PowerPoint deck" description="Seven slides for presenting on behalf of TEDxNewy." backHref="/dev/admin-preview/templates" /><DeckTemplate /></div>
      ) : key === "studio" ? (
        <div className="adm-stack"><PageHeader title={slug?.[1] === "signature" ? "Email signature" : slug?.[1] === "vbg" ? "Virtual background" : "Social banners"} backHref="/dev/admin-preview/templates" /><Studio fixedKind={(slug?.[1] as "vbg" | "banner" | "signature") ?? "banner"} team={[{ name: "Will Berry", role: "Chief Operating Officer", email: "will@tedxnewy.com.au", linkedin_url: null }, { name: "Jake Hartley", role: "Licensee and CEO", email: "jake@tedxnewy.com.au", linkedin_url: null }]} /></div>
      ) : key === "talks" || key === "speakers" ? (
        <div className="adm-stack">
          <PageHeader title="Talks and speakers" actions={<PrimaryButton>{key === "talks" ? "Add talk" : "Add speaker"}</PrimaryButton>} />
          <TalksSpeakersNav active={key} counts={{ talks: 20, speakers: 26 }} />
          {key === "talks" ? (
            <TalksTable
              events={[]}
              talks={[
                { id: "t1", speaker: "Dr Maya Chen", speaker_slug: "maya-chen", title: "What a city remembers", year: 2025, event: "Reframe", event_id: null, youtube_id: "dQw4w9WgXcQ", blurb: null, display_order: 1, view_count: 1840 },
                { id: "t2", speaker: "Tom Wallace", speaker_slug: "tom-wallace", title: "The case for slow infrastructure and very long titles that wrap", year: 2025, event: "Reframe", event_id: null, youtube_id: "dQw4w9WgXcQ", blurb: null, display_order: 2, view_count: 920 },
                { id: "t3", speaker: "Priya Shah", speaker_slug: "priya-shah", title: "Teaching kids to disagree well", year: 2024, event: "Beyond Boundaries", event_id: null, youtube_id: "dQw4w9WgXcQ", blurb: null, display_order: 1, view_count: 4300 },
              ]}
            />
          ) : (
            <SpeakersList
              talks={[]}
              events={[]}
              speakers={[
                { slug: "maya-chen", name: "Dr Maya Chen", year: 2025, image_url: null, title: "Urban historian", talk_id: "t1", event_id: null, blurb: null, linkedin_url: null, instagram_url: null, display_order: 1 },
                { slug: "tom-wallace", name: "Tom Wallace", year: 2025, image_url: null, title: "Civil engineer", talk_id: null, event_id: null, blurb: null, linkedin_url: null, instagram_url: null, display_order: 2 },
                { slug: "priya-shah", name: "Priya Shah", year: 2024, image_url: null, title: "Educator", talk_id: "t3", event_id: null, blurb: null, linkedin_url: null, instagram_url: null, display_order: 1 },
              ]}
            />
          )}
        </div>
      ) : key === "sponsors" ? (
        <div className="adm-stack">
          <PageHeader title="Sponsors" actions={<PrimaryButton>Add sponsor</PrimaryButton>} />
          <SponsorsList
            filesReady
            files={[{ id: "f1", sponsor_id: "s1", name: "Partnership agreement 2026.pdf", kind: "agreement", file_url: "#", size_bytes: 240000, created_at: "2026-08-01T00:00:00Z" }]}
            sponsors={[
              { id: "s1", name: "University of Newcastle", tier: "Presenting", partner_type: null, logo_url: "/brand/media/TEDxNewy-Standard-black.png", website_url: null, display_order: 1, is_current: true },
              { id: "s2", name: "Henderson", tier: "Presenting", partner_type: null, logo_url: "/brand/media/TEDxNewy-Standard-white.png", website_url: null, display_order: 2, is_current: true },
              { id: "s3", name: "Sketch It Live", tier: "Community", partner_type: "Creative Partner", logo_url: null, website_url: null, display_order: 3, is_current: true },
            ]}
          />
        </div>
      ) : key === "compose" ? (
        <div className="adm-stack"><PageHeader title="Quick email" description="Write a branded email to anyone." /><ComposeForm templates={[]} /></div>
      ) : key === "graphic" ? (
        <div className="adm-stack"><PageHeader title="Edit graphic" backHref="/dev/admin-preview/comms" /><CreativeStudio /></div>
      ) : key === "tickets" ? (
        <TicketsView />
      ) : key === "sample" ? (
        <div className="adm-stack">
          <PageHeader title="Newsletter" description="Campaigns, the subscriber list and the welcome flow." backHref="/dev/admin-preview/comms" actions={<PrimaryButton>New campaign</PrimaryButton>} />
          <Card className="p-6">
            <div style={{ display: "grid", gap: 16 }}>
              <Field label="Subject" placeholder="Signal is nearly here" />
              <Field label="Audience" type="select" options={[{ value: "all", label: "All subscribers" }]} />
              <Field label="Notes" type="textarea" placeholder="Anything the team should know" />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <Badge tone="draft">Draft</Badge>
                <Badge tone="live">Live</Badge>
              </div>
              <SecondaryButton>Save draft</SecondaryButton>
              <PrimaryButton>Send test</PrimaryButton>
            </div>
          </Card>
        </div>
      ) : key === "library" ? (
        <div className="adm-stack">
          <header className="adm-head"><div><h1 className="adm-head__title">Resources</h1><p className="adm-head__desc">{group!.blurb}</p></div></header>
          <section className="adm-statrow" style={{ ["--n" as string]: 3 }}>
            <Link href="#" className="adm-stat2"><span className="adm-stat2__label">Images</span><span className="adm-stat2__value">1,052</span><span className="adm-stat2__foot">from 5 event galleries</span></Link>
            <Link href="#" className="adm-stat2"><span className="adm-stat2__label">Documents</span><span className="adm-stat2__value">11</span><span className="adm-stat2__foot">with a public link</span></Link>
            <Link href="#" className="adm-stat2"><span className="adm-stat2__label">Logos and branding</span><span className="adm-stat2__value">{TEMPLATES.length}</span><span className="adm-stat2__foot">templates ready to use</span></Link>
          </section>
        </div>
      ) : (
        <HubView group={group!} />
      )}
    </AdminShell>
  );
}

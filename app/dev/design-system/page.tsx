import {
  Badge,
  Banner,
  BarChart,
  Button,
  Card,
  EmptyState,
  Field,
  LineChart,
  MediaCard,
  Meter,
  SectionHeader,
  Stat,
  Waves,
} from "@/components/ds";
import { DemoControls } from "./DemoControls";

export const metadata = {
  title: "Design system · TEDxNewy",
  robots: { index: false, follow: false },
};

export default function DesignSystemPage() {
  return (
    <main className="voice-brand surface-white" style={{ padding: "var(--space-16) var(--space-6)" }}>
      <div style={{ maxWidth: "var(--container)", margin: "0 auto", display: "grid", gap: "var(--space-16)" }}>
        <SectionHeader
          as="h1"
          size="h1"
          title="TEDxNewy design system"
          meta="Live components, generated from design/tokens.json"
          intro="This page renders the ported components so the preview deploy can be checked against the Design System artifact."
        />

        <section style={{ display: "grid", gap: "var(--space-6)" }}>
          <SectionHeader title="Buttons" />
          <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap" }}>
            <Button variant="accent">Get tickets</Button>
            <Button icon="arrow-right">See how it went</Button>
            <Button variant="secondary">Partner with us</Button>
            <Button variant="danger" icon="trash-2" iconPosition="start">
              Delete
            </Button>
            <Button size="lg" href="/events" icon="arrow-right">
              Large link
            </Button>
          </div>
          <div className="surface-maroon" style={{ padding: "var(--space-6)", borderRadius: "var(--radius-lg)", display: "flex", gap: "var(--space-4)", flexWrap: "wrap" }}>
            <Button onDark>Primary on dark</Button>
            <Button onDark variant="secondary">
              Secondary on dark
            </Button>
            <Button variant="accent">Accent on dark</Button>
          </div>
        </section>

        <section style={{ display: "grid", gap: "var(--space-6)" }}>
          <SectionHeader title="Forms and feedback" />
          <div style={{ display: "grid", gap: "var(--space-4)", maxWidth: "var(--container-text)" }}>
            <Field label="Email" type="email" placeholder="you@tedxnewy.com.au" hint="We only use this to reply." />
            <Field label="Topic" type="select" options={["Speaking", "Sponsorship", "Volunteering"]} />
            <Field label="Message" type="textarea" error="Tell us a little more." />
            <DemoControls />
          </div>
          <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
            <Badge>Past</Badge>
            <Badge tone="success">Confirmed</Badge>
            <Badge tone="warning">Draft</Badge>
            <Badge tone="info">Scheduled</Badge>
            <Badge tone="danger">Sold out</Badge>
          </div>
          <Banner tone="info" title="Signal 2026">
            Doors open at 5pm at the Conservatorium of Music.
          </Banner>
          <EmptyState title="No partners yet" action={<Button size="sm" variant="accent" icon="plus" iconPosition="start">Add partner</Button>}>
            Add your first prospect to start the pipeline.
          </EmptyState>
        </section>

        <section style={{ display: "grid", gap: "var(--space-6)" }}>
          <SectionHeader title="Cards, data and motifs" />
          <div style={{ display: "grid", gap: "var(--space-6)", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            <Card>
              <Stat value="1,284" label="Tickets sold" delta="+18 this week" trend={[3, 5, 4, 8, 9, 12, 14]} />
            </Card>
            <Card tint>
              <Meter label="Ticket target" value={61} display="61% sold" note="Goal 2,100" />
            </Card>
            <MediaCard pending title="TEDxNewy Signal" meta="24 October 2026" label="Flagship" />
          </div>
          <Card>
            <LineChart
              labels={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
              series={[{ name: "Tickets", values: [4, 9, 12, 18, 26, 31, 40] }]}
            />
          </Card>
          <Card>
            <BarChart data={[{ label: "Instagram", value: 420 }, { label: "Email", value: 310 }, { label: "Search", value: 150 }]} />
          </Card>
          <div className="surface-maroon" style={{ position: "relative", overflow: "hidden", height: 220, borderRadius: "var(--radius-lg)" }}>
            <Waves />
          </div>
        </section>
      </div>
    </main>
  );
}

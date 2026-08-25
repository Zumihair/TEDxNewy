
// /events: the cream archive list. Filter pills, then hairline-divided rows.
function EventsScreen({ onNavigate }) {
  const { PageHero, EventRow, Pill, Button } = window.TEDxNewyDesignSystem_0329fe;
  const [filter, setFilter] = React.useState("All");
  const kinds = { flagship: "Signature", salon: "Salon", special: "Special" };
  const rows = window.TEDX.pastEvents.filter((e) => filter === "All" || kinds[e.kind] === filter);
  return (
    <Chrome onNavigate={onNavigate}>
      <PageHero
        kicker="The archive"
        title="Every event we have run, and what came out of it."
        intro="Our flagship main stage each October, Salon nights across the year, and the one-off experiments in between. Talks are published to YouTube once they are edited."
        meta={<div style={{ display: "flex", gap: 8 }}>{["All", "Signature", "Salon", "Special"].map((k) => (
          <button key={k} type="button" onClick={() => setFilter(k)} style={{ border: 0, padding: 0, background: "none" }}>
            <Pill tone={filter === k ? "red" : "cream"}>{k}</Pill>
          </button>
        ))}</div>}
      />
      <Section padding="0 40px 112px">
        <div>
          {rows.map((e, i) => (
            <div key={e.title} style={{ borderTop: i ? "1px solid var(--line-hairline)" : "1px solid var(--line-warm)" }}>
              <EventRow href="#" image={e.image} label={kinds[e.kind]} labelAccent={e.kind === "flagship" ? "red" : "neutral"} title={e.title} meta={`${e.date} · ${e.venue}`} description={DESCRIPTIONS[e.title]} linkLabel="Read more" />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 56, display: "flex", gap: 12 }}>
          <Button variant="primary" icon="arrow-right" onClick={() => onNavigate("signal")}>What&rsquo;s coming up</Button>
          <Button variant="secondary" icon="arrow-up-right">Watch every talk</Button>
        </div>
      </Section>
    </Chrome>
  );
}

const DESCRIPTIONS = {
  "Youth Futures Lab": "Sixty students, ten tables, and one afternoon designing the Newcastle they want to inherit.",
  "Newcastle 2050": "A room full of Novocastrians mapping the city they want in 25 years, then voting on it.",
  "60-Second Talk Night": "Anyone could put their hand up. Sixty seconds each, no slides, no second takes.",
  Reframe: "Eight speakers on the ideas we have been looking at the wrong way round.",
  "Beyond Boundaries": "Our first main stage as TEDxNewy, and a full house at City Hall.",
};

Object.assign(window, { EventsScreen });

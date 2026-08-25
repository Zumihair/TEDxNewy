
// /speak: the cream nomination page. Three ways in, the form itself, and the crew.
function ParticipateScreen({ onNavigate }) {
  const { PageHero, ParticipateCard, FormField, Button, SpeakerCard, Card, SectionKicker } = window.TEDxNewyDesignSystem_0329fe;
  const [sent, setSent] = React.useState(false);
  return (
    <Chrome onNavigate={onNavigate}>
      <PageHero
        kicker="Participate"
        title="Know someone who should be heard?"
        intro="Our best talks don&rsquo;t come from LinkedIn bios. They come from someone in the room saying you need to hear this person."
        body="Tell us who we are missing. We read every nomination, and we come back to everyone."
      />
      <Section padding="0 40px 112px">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
          <ParticipateCard href="#" title="Nominate a speaker" body="One idea, one person, one paragraph. That is all we need to start." image="../../../../../public/images/stage-welcome.jpg" gradient="var(--grad-flagship)" ratio="4/3" cta="You are here" />
          <ParticipateCard href="#" title="Volunteer with us" body="Six crews, year-round roles. No experience needed, just reliability and curiosity." image="../../../../../public/images/participate/volunteers.webp" gradient="var(--grad-special)" ratio="4/3" />
          <ParticipateCard href="#" title="Partner with us" body="It takes a village. Yours, ideally." image="../../../../../public/images/participate/partners.webp" gradient="var(--grad-brand)" ratio="4/3" />
        </div>
      </Section>

      <Section background="var(--cream-light)" narrow padding="112px 24px">
        <SectionKicker label="The nomination" />
        <h2 style={{ marginTop: 20, fontSize: "var(--fs-h3)", lineHeight: 1.05, fontWeight: 500, letterSpacing: "var(--tracking-display)", fontVariationSettings: '"opsz" 144' }}>Tell us about them</h2>
        {sent ? (
          <Card padding={32} hoverable={false} style={{ marginTop: 40 }}>
            <div style={{ fontSize: 19, fontWeight: 500 }}>Thanks. That is with the curation crew.</div>
            <p style={{ marginTop: 8, fontSize: 14.5, lineHeight: 1.6, color: "var(--ink-3)" }}>We read every nomination and we will come back to you either way, usually within a fortnight.</p>
            <div style={{ marginTop: 24 }}><Button variant="secondary" onClick={() => setSent(false)}>Nominate someone else</Button></div>
          </Card>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); setSent(true); }}
            style={{ marginTop: 40, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
          >
            <FormField label="Their name" name="speaker" required placeholder="First and last" />
            <FormField label="Their city or suburb" name="where" placeholder="Newcastle, Lambton, Maitland…" />
            <FormField label="What is the idea?" name="idea" required textarea rows={4} placeholder="One idea, in a sentence or two. Not a CV." style={{ gridColumn: "1 / -1" }} />
            <FormField label="How do you know them?" name="relationship" select options={["I know them", "I saw them speak", "I read their work", "Other"]} />
            <FormField label="Your email" name="email" required type="email" hint="So we can reply" placeholder="you@example.com" />
            <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 16 }}>
              <Button variant="red" type="submit" icon="arrow-right">Send the nomination</Button>
              <span style={{ fontSize: 13, color: "var(--ink-3)" }}>No newsletter sign-up attached. Promise.</span>
            </div>
          </form>
        )}
      </Section>

      <Section padding="112px 40px">
        <SectionKicker label="Who reads it" />
        <h2 style={{ marginTop: 20, maxWidth: "22ch", fontSize: "var(--fs-h3)", lineHeight: 1.05, fontWeight: 500, letterSpacing: "var(--tracking-display)", fontVariationSettings: '"opsz" 144' }}>A volunteer crew, from here</h2>
        <div style={{ marginTop: 48, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24 }}>
          {window.TEDX.team.map((t) => <SpeakerCard key={t.name} name={t.name} title={t.title} image={t.image} />)}
        </div>
      </Section>
    </Chrome>
  );
}

Object.assign(window, { ParticipateScreen });

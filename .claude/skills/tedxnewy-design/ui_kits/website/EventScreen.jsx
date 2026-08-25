
// A flagship event page (/signal): photo hero on dark, countdown, the lineup,
// what to expect, FAQs and the ticket close. Clicking a speaker opens their bio.
function EventScreen({ onNavigate }) {
  const { CountdownClock, SpeakerCarousel, FaqAccordion, Button, EditionStamp, Pill, Icon, NodeNetwork } = window.TEDxNewyDesignSystem_0329fe;
  const [speaker, setSpeaker] = React.useState(null);
  const d = window.TEDX;
  return (
    <Chrome darkHero onNavigate={onNavigate}>
      <section className="grain grain-dark" style={{ position: "relative", overflow: "hidden", background: "var(--red-deep)", color: "#fff" }}>
        <img src="../../../../../public/images/signal-home-hero.webp" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.35 }} />
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(42,6,4,0.55) 0%, rgba(42,6,4,0.75) 55%, rgba(42,6,4,0.96) 100%)" }} />
        <div style={{ position: "relative", margin: "0 auto", maxWidth: "var(--container)", padding: "200px 40px 96px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Pill tone="red">On sale now</Pill>
            <span style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "var(--tracking-kicker-wide)", color: "var(--red-blush)" }}>Signature · Edition 11</span>
          </div>
          <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "1fr auto", gap: 48, alignItems: "start" }}>
            <div>
              <h1 style={{ maxWidth: "16ch", fontSize: "clamp(3rem,8vw,7rem)", lineHeight: 0.96, fontWeight: 400, letterSpacing: "-0.035em", color: "#fff" }}>Signal</h1>
              <p style={{ marginTop: 32, maxWidth: "52ch", fontSize: 18, lineHeight: 1.65, color: "rgba(255,255,255,0.85)" }}>
                Eight speakers, one stage, and a day about the ideas cutting through the noise in Newcastle. Saturday 24 October at the Conservatorium of Music.
              </p>
              <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", gap: 24, fontSize: 14, color: "rgba(255,255,255,0.7)" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Icon name="calendar" size={16} />Saturday 24 October 2026</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Icon name="map-pin" size={16} />Conservatorium of Music, Newcastle</span>
              </div>
              <div style={{ marginTop: 40, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Button variant="red" icon="arrow-right">Get tickets</Button>
                <Button variant="ghost-light" icon="play">Watch the 2025 recap</Button>
              </div>
            </div>
            <EditionStamp size={132} text="TEDxNEWY · EDITION 11 · 2026 · SIGNAL ·" />
          </div>
          <div style={{ marginTop: 80, maxWidth: 620 }}><CountdownClock target="2026-10-24T09:30:00+11:00" /></div>
        </div>
      </section>

      <Section padding="112px 0">
        <SpeakerCarousel speakers={d.speakers} onSelect={setSpeaker} />
      </Section>

      <Section background="var(--cream-light)" padding="112px 40px">
        <div style={{ display: "grid", gridTemplateColumns: "4fr 8fr", gap: 64 }}>
          <div>
            <div className="section-accent" />
            <h2 style={{ marginTop: 20, maxWidth: "14ch", fontSize: "var(--fs-h3)", lineHeight: 1.05, fontWeight: 500, letterSpacing: "var(--tracking-display)", fontVariationSettings: '"opsz" 144' }}>What the day looks like</h2>
          </div>
          <div style={{ display: "grid", gap: 0 }}>
            {[["09:30", "Doors and coffee", "Come early. The foyer is half the point."], ["10:15", "Session one", "Four talks, then a long break on purpose."], ["12:30", "Lunch", "Included, local, and eaten standing up talking to strangers."], ["14:00", "Session two", "Four more talks and the closing."], ["16:00", "Afterwards", "The bar stays open. Most people stay too."]].map(([t, title, body], i) => (
              <div key={t} style={{ display: "grid", gridTemplateColumns: "84px 1fr", gap: 24, padding: "24px 0", borderTop: i ? "1px solid var(--line-hairline)" : "none" }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--red-mid)", fontVariantNumeric: "tabular-nums" }}>{t}</div>
                <div>
                  <div style={{ fontSize: 19, fontWeight: 500, letterSpacing: "-0.01em" }}>{title}</div>
                  <p style={{ marginTop: 6, fontSize: 14.5, lineHeight: 1.55, color: "var(--ink-3)" }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <section style={{ position: "relative", overflow: "hidden", background: "var(--red-deep)", color: "#fff" }}>
        <NodeNetwork variant="light" opacity={0.2} />
        <div style={{ position: "relative", margin: "0 auto", maxWidth: "var(--container-prose)", padding: "112px 40px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 64, alignItems: "start" }}>
            <div>
              <SectionTitle tone="light" max="12ch">Before you book.</SectionTitle>
              <p style={{ marginTop: 20, fontSize: 15, lineHeight: 1.65, color: "rgba(255,255,255,0.7)" }}>
                Anything we have missed? Ask us at hello@tedxnewy.com.au and we will answer properly.
              </p>
              <div style={{ marginTop: 32 }}><Button variant="cream" icon="arrow-right">Get tickets</Button></div>
            </div>
            <FaqAccordion faqs={d.faqs} />
          </div>
        </div>
      </section>

      {speaker && (
        <div
          onClick={() => setSpeaker(null)}
          style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 40, background: "rgba(20,18,16,0.72)", backdropFilter: "blur(6px)" }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: 760, background: "var(--cream)", borderRadius: "var(--radius-lg)", overflow: "hidden", display: "grid", gridTemplateColumns: "280px 1fr", boxShadow: "var(--shadow-lg)" }}>
            <img src={speaker.image} alt={speaker.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ padding: 40 }}>
              <button type="button" onClick={() => setSpeaker(null)} aria-label="Close" style={{ position: "absolute", top: 16, right: 16, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", border: 0, background: "rgba(20,18,16,0.06)", color: "var(--ink)" }}>
                <Icon name="x" size={16} />
              </button>
              <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.24em", color: "var(--red-mid)" }}>Speaker</div>
              <h3 style={{ marginTop: 16, fontSize: 34, lineHeight: 1.05, fontWeight: 500, letterSpacing: "var(--tracking-display)", fontVariationSettings: '"opsz" 144' }}>{speaker.name}</h3>
              <div style={{ marginTop: 8, fontSize: 14, color: "var(--ink-3)" }}>{speaker.title}</div>
              <p style={{ marginTop: 20, fontSize: 15, lineHeight: 1.65, color: "var(--ink-2)" }}>
                Bio copy sits here on the live site, pulled from the event CMS along with the talk video and socials once the talk is published.
              </p>
              <div style={{ marginTop: 28 }}><Button variant="secondary" icon="arrow-up-right">Watch the talk</Button></div>
            </div>
          </div>
        </div>
      )}
    </Chrome>
  );
}

Object.assign(window, { EventScreen });

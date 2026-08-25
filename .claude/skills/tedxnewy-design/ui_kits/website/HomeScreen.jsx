
// The homepage: dark spotlight hero, the most recent event as a feature, the
// past-event row, the red stats band, "What is TEDx", Participate, and the
// deep-red subscribe close.
function HomeScreen({ onNavigate }) {
  const { PastEventCard, ParticipateCard, Stat, CircleArrowLink, Button, SubscribeForm, NodeNetwork } = window.TEDxNewyDesignSystem_0329fe;
  const [spot, setSpot] = React.useState({ x: 0, y: 0 });
  const d = window.TEDX;
  const [featured, ...older] = d.pastEvents;
  return (
    <Chrome darkHero onNavigate={onNavigate}>
      {/* HERO */}
      <section
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setSpot({ x: ((e.clientX - r.left) / r.width - 0.5) * 30, y: ((e.clientY - r.top) / r.height - 0.5) * 30 });
        }}
        onMouseLeave={() => setSpot({ x: 0, y: 0 })}
        className="grain grain-dark"
        style={{ position: "relative", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "var(--red-deep)" }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute", left: "50%", top: "50%", width: "min(115vw,1700px)", height: "min(75vh,1700px)",
            transform: `translate(calc(-50% + ${spot.x}%), calc(-50% + ${spot.y}%))`,
            transition: "transform 1.2s var(--ease-out-quint)",
            background: "radial-gradient(circle closest-side at 50% 50%, #ff3626 0%, #e11905 18%, #b91404 38%, rgba(138,13,5,0.6) 62%, rgba(42,6,4,0) 100%)",
          }}
        />
        <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: "var(--container-wide)", padding: "160px 40px", textAlign: "center" }}>
          <h1 className="rise rise-d1" style={{ margin: "0 auto", fontSize: "clamp(3.5rem,10vw,9rem)", lineHeight: 0.96, fontWeight: 400, letterSpacing: "-0.035em", color: "#fff" }}>
            Ideas that refuse to sit still.
          </h1>
          <p className="rise rise-d2" style={{ margin: "48px auto 0", maxWidth: "48ch", fontSize: "1.3rem", lineHeight: 1.55, color: "rgba(255,255,255,0.9)" }}>
            TEDxNewy champions all that is remarkable, challenging and thought-provoking, from Novocastrian stages to a global audience.
          </p>
          <div className="rise rise-d3" style={{ marginTop: 48, display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <Button variant="white" icon="arrow-right" onClick={() => onNavigate("signal")}>Get tickets to Signal</Button>
            <Button variant="outline-light" onClick={() => onNavigate("events")}>Watch past talks</Button>
          </div>
        </div>
        <div className="rise rise-d5" style={{ position: "absolute", left: 0, right: 0, bottom: 0, borderTop: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.15)", backdropFilter: "blur(4px)" }}>
          <div style={{ margin: "0 auto", maxWidth: "var(--container-wide)", display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
            {["Student Speaker Competition", "60-Second Talk Night", "Youth Futures Lab"].map((l, i) => (
              <a key={l} href="#" onClick={(e) => { e.preventDefault(); onNavigate("events"); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "20px 32px", fontSize: 11.5, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(255,255,255,0.8)", textDecoration: "none", borderLeft: i ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
                {l}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* JUST WRAPPED */}
      <Section background="var(--red-section)" color="#fff">
        <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 64, alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span aria-hidden="true" style={{ position: "relative", display: "flex", width: 8, height: 8 }}>
                <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "var(--red-bright)", opacity: 0.7, animation: "ping-soft 2s cubic-bezier(0,0,0.2,1) infinite" }} />
                <span style={{ position: "relative", width: 8, height: 8, borderRadius: "50%", background: "#ff6e62" }} />
              </span>
              <span style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "var(--tracking-kicker-wide)", color: "var(--red-blush)" }}>
                Just wrapped · {featured.date}
              </span>
            </div>
            <SectionTitle tone="light">{featured.title}</SectionTitle>
            <p style={{ marginTop: 28, maxWidth: "60ch", fontSize: 16.5, lineHeight: 1.65, color: "rgba(255,255,255,0.8)" }}>
              Sixty students, ten tables, one afternoon spent building the Newcastle they want to inherit. They pitched it back to a panel before the room emptied.
            </p>
            <div style={{ marginTop: 20, fontSize: 13.5, color: "rgba(255,255,255,0.55)" }}>{featured.venue}</div>
            <div style={{ marginTop: 40 }}><CircleArrowLink href="#" onClick={(e) => { e.preventDefault(); onNavigate("events"); }}>See how it went</CircleArrowLink></div>
          </div>
          <div>
            <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden", borderRadius: "var(--radius-lg)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "var(--shadow-panel-dark)" }}>
              <img src={featured.image} alt={featured.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
              {["../../../../../public/images/youth-futures/yfl-student-speaker.webp", "../../../../../public/images/salon-2050/group-discussion.webp", "../../../../../public/images/salon-2050/activity-postits.webp"].map((s) => (
                <div key={s} style={{ position: "relative", aspectRatio: "4/3", overflow: "hidden", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <img src={s} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* OTHER RECENT EVENTS */}
      <section className="grain grain-dark" style={{ position: "relative", overflow: "hidden", background: "var(--red-section)", color: "#fff" }}>
        <div aria-hidden="true" style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: "min(96vw,1120px)", height: "min(64vw,640px)", background: "radial-gradient(ellipse at center, rgba(255,54,38,0.5) 0%, rgba(224,34,20,0.28) 24%, rgba(138,13,5,0.14) 50%, rgba(42,6,4,0) 74%)" }} />
        <div style={{ position: "relative", margin: "0 auto", maxWidth: "var(--container)", padding: "128px 40px" }}>
          <SectionTitle tone="light">Our other recent events.</SectionTitle>
          <p style={{ marginTop: 24, maxWidth: "62ch", fontSize: 16.5, lineHeight: 1.65, color: "rgba(255,255,255,0.8)" }}>
            Our flagship main stage each October, Salon nights across the year, and the one-off experiments in between. Here&rsquo;s what we&rsquo;ve built together so far.
          </p>
          <ul style={{ listStyle: "none", margin: "64px 0 0", padding: 0, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "48px 28px" }}>
            {older.slice(0, 3).map((e) => (
              <li key={e.title}>
                <PastEventCard href="#" image={e.image} date={e.date} title={e.title} subtitle={e.venue} imageGradient={`var(--grad-${e.kind})`} />
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 64, display: "flex", gap: 16, alignItems: "center" }}>
            <Button variant="white" icon="arrow-right" onClick={() => onNavigate("events")}>View Salons</Button>
            <Button variant="outline-light" icon="arrow-right" onClick={() => onNavigate("events")}>View Signature events</Button>
          </div>
        </div>
      </section>

      {/* STATS */}
      <Section background="var(--red)" color="#fff" padding="96px 40px">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 40 }}>
          <Stat value="5" label="Events" sub="Since 2024" />
          <Stat value="12" label={<>Published<br />talks</>} />
          <Stat value="100" suffix="%" label="Volunteer-run" sub="Not-for-profit" />
          <Stat value="2M" suffix="+" label="Cumulative talk views" sub="Online" />
        </div>
      </Section>

      {/* WHAT IS TEDx */}
      <section style={{ position: "relative", background: "var(--red-section)", color: "#fff" }}>
        <NodeNetwork variant="light" opacity={0.18} />
        <div style={{ position: "relative", margin: "0 auto", maxWidth: "var(--container)", padding: "96px 40px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "4fr 8fr", gap: 64 }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "var(--tracking-kicker-wide)", color: "var(--red-blush)" }}>About TEDx</div>
              <h2 style={{ marginTop: 24, maxWidth: "16ch", fontSize: "var(--fs-h3)", lineHeight: 1.05, fontWeight: 500, letterSpacing: "var(--tracking-display)", color: "#fff", fontVariationSettings: '"opsz" 144' }}>What is a TEDx event?</h2>
            </div>
            <div>
              <p style={{ fontSize: 17.5, lineHeight: 1.7, color: "rgba(255,255,255,0.85)" }}>
                In the spirit of <strong>ideas worth spreading</strong>, TEDx is a programme of local, self-organised events that bring people together to share a TED-like experience. At a TEDx event, TED Talks video and live speakers combine to spark deep discussion and connection. These local, self-organised events are branded TEDx, where <em>x = independently organised TED event</em>.
              </p>
              <p style={{ marginTop: 20, fontSize: 17.5, lineHeight: 1.7, color: "rgba(255,255,255,0.85)" }}>
                The TED Conference provides general guidance for the TEDx programme, but individual TEDx events, like ours, are self-organised.
              </p>
              <div style={{ marginTop: 28 }}><CircleArrowLink href="#" size="sm">Learn more about TEDx</CircleArrowLink></div>
            </div>
          </div>
        </div>
      </section>

      {/* PARTICIPATE */}
      <Section background="var(--red-section)" color="#fff">
        <SectionTitle tone="light">Participate</SectionTitle>
        <p style={{ marginTop: 24, fontSize: 16.5, lineHeight: 1.65, color: "rgba(255,255,255,0.8)" }}>
          TEDxNewy is built by Novocastrians, for Novocastrians. Pick a way in. We&rsquo;d love to hear from you.
        </p>
        <ul style={{ listStyle: "none", margin: "64px 0 0", padding: 0, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
          <li><ParticipateCard href="#" title="Volunteer with us" body="Six crews, year-round roles. No experience needed, just reliability and curiosity." image="../../../../../public/images/stage-dialogue.jpg" gradient="var(--grad-special)" /></li>
          <li><ParticipateCard href="#" title="Partner with us" body="Back the speakers, the stage and the next generation of Novocastrian storytellers." image="../../../../../public/images/participate/partners.webp" gradient="var(--grad-brand)" /></li>
          <li><ParticipateCard href="#" title="Nominate a speaker" body="Know someone with an idea worth spreading? Tell us before we hear it elsewhere." image="../../../../../public/images/stage-welcome.jpg" gradient="var(--grad-flagship)" /></li>
        </ul>
        <div style={{ marginTop: 48 }}><Button variant="cream" icon="arrow-right" onClick={() => onNavigate("participate")}>All the ways in</Button></div>
      </Section>

      {/* SUBSCRIBE */}
      <Section background="var(--red-deep)" color="#fff" narrow padding="128px 24px">
        <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "var(--tracking-kicker-wide)", color: "var(--red-blush)" }}>TEDxNewy</div>
        <p style={{ marginTop: 24, fontSize: "clamp(1.6rem,2.8vw,2.25rem)", lineHeight: 1.2, fontWeight: 400, letterSpacing: "var(--tracking-title)", color: "#fff" }}>
          An independently licensed TED event in Newcastle, Australia, on Awabakal and Worimi Country. Join our community below:
        </p>
        <p style={{ marginTop: 20, fontSize: 16.5, lineHeight: 1.65, color: "rgba(255,255,255,0.8)" }}>
          Across the year we put events together in the aim of sharing ideas and thinking. We want you to be part of that.
        </p>
        <div style={{ marginTop: 40 }}><SubscribeForm /></div>
      </Section>
    </Chrome>
  );
}

Object.assign(window, { HomeScreen });

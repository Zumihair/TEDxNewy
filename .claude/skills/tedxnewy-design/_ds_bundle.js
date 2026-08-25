/* @ds-bundle: {"format":4,"namespace":"TEDxNewyDesignSystem_0329fe","components":[{"name":"Card","sourcePath":"components/cards/Card.jsx"},{"name":"EventRow","sourcePath":"components/cards/EventRow.jsx"},{"name":"ParticipateCard","sourcePath":"components/cards/ParticipateCard.jsx"},{"name":"PastEventCard","sourcePath":"components/cards/PastEventCard.jsx"},{"name":"PhotoPending","sourcePath":"components/cards/PhotoPending.jsx"},{"name":"SpeakerCard","sourcePath":"components/cards/SpeakerCard.jsx"},{"name":"Stat","sourcePath":"components/cards/Stat.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"CircleArrowLink","sourcePath":"components/core/CircleArrowLink.jsx"},{"name":"EditionStamp","sourcePath":"components/core/EditionStamp.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"Pill","sourcePath":"components/core/Pill.jsx"},{"name":"RedCircle","sourcePath":"components/core/RedCircle.jsx"},{"name":"SectionKicker","sourcePath":"components/core/SectionKicker.jsx"},{"name":"CountdownClock","sourcePath":"components/feedback/CountdownClock.jsx"},{"name":"FaqAccordion","sourcePath":"components/feedback/FaqAccordion.jsx"},{"name":"FormField","sourcePath":"components/forms/FormField.jsx"},{"name":"SubscribeForm","sourcePath":"components/forms/SubscribeForm.jsx"},{"name":"NodeNetwork","sourcePath":"components/motifs/NodeNetwork.jsx"},{"name":"PageHero","sourcePath":"components/navigation/PageHero.jsx"},{"name":"SiteFooter","sourcePath":"components/navigation/SiteFooter.jsx"},{"name":"SiteHeader","sourcePath":"components/navigation/SiteHeader.jsx"},{"name":"SpeakerCarousel","sourcePath":"components/navigation/SpeakerCarousel.jsx"}],"sourceHashes":{"components/cards/Card.jsx":"caac7dc5c654","components/cards/EventRow.jsx":"be58d4ce18b0","components/cards/ParticipateCard.jsx":"637c913a4f53","components/cards/PastEventCard.jsx":"c1e4470fc603","components/cards/PhotoPending.jsx":"ae7ae420e533","components/cards/SpeakerCard.jsx":"69171c7f68d6","components/cards/Stat.jsx":"c4aef981a2ec","components/core/Button.jsx":"19e900447e25","components/core/CircleArrowLink.jsx":"413400c3acb4","components/core/EditionStamp.jsx":"1693708c9d52","components/core/Icon.jsx":"9dc8729ce3f1","components/core/Pill.jsx":"94cefc4bf2d3","components/core/RedCircle.jsx":"6365b0670c28","components/core/SectionKicker.jsx":"ca138ebaa9a2","components/feedback/CountdownClock.jsx":"73d9c394015a","components/feedback/FaqAccordion.jsx":"33829f82f85d","components/forms/FormField.jsx":"18ffcddbacab","components/forms/SubscribeForm.jsx":"8fef2fbac52b","components/motifs/NodeNetwork.jsx":"3adc2a970d5e","components/navigation/PageHero.jsx":"4630d4bd1f77","components/navigation/SiteFooter.jsx":"99c90c232ef3","components/navigation/SiteHeader.jsx":"76af89400649","components/navigation/SpeakerCarousel.jsx":"eca45c82e584","ui_kits/website/Chrome.jsx":"615bab5e3180","ui_kits/website/EventScreen.jsx":"e15fe6407c32","ui_kits/website/EventsScreen.jsx":"51adc426a9a5","ui_kits/website/HomeScreen.jsx":"297f47b9f9c1","ui_kits/website/ParticipateScreen.jsx":"fa8bca54346c","ui_kits/website/data.js":"17952faad1eb"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.TEDxNewyDesignSystem_0329fe = window.TEDxNewyDesignSystem_0329fe || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/cards/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** The standard white card: 8px radius, hairline border, 2px lift + soft shadow on hover. */
function Card({
  children,
  padding = 24,
  hoverable = true,
  as = "div",
  style,
  ...rest
}) {
  const Tag = as;
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: hoverable ? "card" : undefined,
    style: {
      padding,
      background: "var(--surface-card)",
      borderRadius: "var(--radius-card)",
      border: "1px solid var(--border-card)",
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/Card.jsx", error: String((e && e.message) || e) }); }

// components/cards/SpeakerCard.jsx
try { (() => {
/** A speaker's portrait, name and role line. Opens their bio in a modal on the real site. */
function SpeakerCard({
  name,
  title,
  image,
  onClick
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    "aria-label": `Read about ${name}`,
    style: {
      display: "block",
      width: "100%",
      textAlign: "left",
      background: "none",
      border: 0,
      padding: 0,
      font: "inherit"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      aspectRatio: "4/5",
      overflow: "hidden",
      borderRadius: "var(--radius-md)",
      background: "#1a1714"
    }
  }, image && /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: name,
    style: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      transform: hover ? "scale(1.03)" : "none",
      transition: "transform var(--dur-zoom) var(--ease-out-quint)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 500,
      lineHeight: 1.15,
      letterSpacing: "-0.01em",
      color: hover ? "var(--red-mid)" : "var(--ink)",
      transition: "color var(--dur-hover) var(--ease-out-quint)"
    }
  }, name), title && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      fontSize: 13.5,
      lineHeight: 1.5,
      color: "var(--ink-3)"
    }
  }, title)));
}
Object.assign(__ds_scope, { SpeakerCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/SpeakerCard.jsx", error: String((e && e.message) || e) }); }

// components/cards/Stat.jsx
try { (() => {
/** A single honest number: huge figure, label, optional small caps sub-line. */
function Stat({
  value,
  suffix,
  suffixColor = "var(--red-section)",
  label,
  sub,
  tone = "light"
}) {
  const isLight = tone === "light";
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-stat)",
      lineHeight: 0.9,
      fontWeight: 500,
      letterSpacing: "-0.04em",
      color: isLight ? "#fff" : "var(--ink)",
      fontVariationSettings: '"opsz" 144'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontVariantNumeric: "tabular-nums"
    }
  }, value), suffix && /*#__PURE__*/React.createElement("span", {
    style: {
      color: suffixColor
    }
  }, suffix)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      fontSize: 14.5,
      fontWeight: 500,
      lineHeight: 1.3,
      color: isLight ? "#fff" : "var(--ink)"
    }
  }, label), sub && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      fontSize: 10.5,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.2em",
      color: isLight ? "rgba(255,255,255,0.75)" : "var(--ink-3)"
    }
  }, sub));
}
Object.assign(__ds_scope, { Stat });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/Stat.jsx", error: String((e && e.message) || e) }); }

// components/core/EditionStamp.jsx
try { (() => {
/** Slowly rotating circular stamp: the edition, year and theme around a red dot. */
function EditionStamp({
  text = "TEDxNEWY · EDITION 11 · 2026 · TIDES & TURBINES ·",
  size = 120,
  tone = "light",
  style
}) {
  const stroke = tone === "light" ? "rgba(255,255,255,0.85)" : "#141210";
  const id = React.useMemo(() => `stamp-${Math.random().toString(36).slice(2, 8)}`, []);
  return /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      position: "relative",
      width: size,
      height: size,
      pointerEvents: "none",
      ...style
    }
  }, /*#__PURE__*/React.createElement("style", null, `@keyframes stamp-rotate{from{transform:rotate(0)}to{transform:rotate(360deg)}}`), /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 120 120",
    width: size,
    height: size,
    style: {
      position: "absolute",
      inset: 0,
      animation: "stamp-rotate 28s linear infinite"
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("path", {
    id: id,
    d: "M 60,60 m -48,0 a 48,48 0 1,1 96,0 a 48,48 0 1,1 -96,0"
  })), /*#__PURE__*/React.createElement("circle", {
    cx: "60",
    cy: "60",
    r: "58",
    fill: "none",
    stroke: stroke,
    strokeOpacity: "0.3",
    strokeWidth: "0.8",
    strokeDasharray: "1 3"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "60",
    cy: "60",
    r: "40",
    fill: "none",
    stroke: stroke,
    strokeOpacity: "0.2",
    strokeWidth: "0.6"
  }), /*#__PURE__*/React.createElement("text", {
    fill: tone === "light" ? "rgba(255,255,255,0.95)" : "#141210",
    fontFamily: "var(--font-sans)",
    fontSize: "8.4",
    fontWeight: "600",
    letterSpacing: "2.8",
    textLength: "290"
  }, /*#__PURE__*/React.createElement("textPath", {
    href: `#${id}`,
    startOffset: "0"
  }, text))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: "50%",
      top: "50%",
      width: 12,
      height: 12,
      transform: "translate(-50%,-50%)",
      borderRadius: "50%",
      background: "var(--red)",
      boxShadow: "0 0 20px rgba(224,34,20,0.6)"
    }
  }));
}
Object.assign(__ds_scope, { EditionStamp });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/EditionStamp.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Lucide (lucide.dev, ISC) is the site's icon set — imported in the real code as
// `lucide-react`. These are the glyphs the site actually uses, with Lucide's own
// 24x24 stroke geometry, so a design-system consumer gets identical icons without
// a package install. Add a glyph here rather than hand-drawing one inline.
const PATHS = {
  "arrow-right": ["M5 12h14", "m12 5 7 7-7 7"],
  "arrow-up-right": ["M7 7h10v10", "M7 17 17 7"],
  "arrow-left": ["m12 19-7-7 7-7", "M19 12H5"],
  "chevron-down": ["m6 9 6 6 6-6"],
  "chevron-left": ["m15 18-6-6 6-6"],
  "chevron-right": ["m9 18 6-6-6-6"],
  menu: ["M4 12h16", "M4 6h16", "M4 18h16"],
  x: ["M18 6 6 18", "m6 6 12 12"],
  play: ["m6 3 14 9-14 9V3z"],
  mail: ["m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"],
  "map-pin": ["M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"],
  calendar: ["M8 2v4", "M16 2v4", "M3 10h18"]
};
const EXTRA = {
  mail: /*#__PURE__*/React.createElement("rect", {
    key: "r",
    x: "2",
    y: "4",
    width: "20",
    height: "16",
    rx: "2"
  }),
  "map-pin": /*#__PURE__*/React.createElement("circle", {
    key: "c",
    cx: "12",
    cy: "10",
    r: "3"
  }),
  calendar: /*#__PURE__*/React.createElement("rect", {
    key: "r",
    x: "3",
    y: "4",
    width: "18",
    height: "18",
    rx: "2"
  }),
  image: [/*#__PURE__*/React.createElement("rect", {
    key: "r",
    x: "3",
    y: "3",
    width: "18",
    height: "18",
    rx: "2"
  }), /*#__PURE__*/React.createElement("circle", {
    key: "c",
    cx: "9",
    cy: "9",
    r: "2"
  })]
};
function Icon({
  name,
  size = 16,
  strokeWidth = 2,
  color = "currentColor",
  style,
  ...rest
}) {
  const paths = name === "image" ? ["m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"] : PATHS[name] || [];
  return /*#__PURE__*/React.createElement("svg", _extends({
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: name === "play" ? color : "none",
    stroke: color,
    strokeWidth: strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    style: {
      display: "block",
      flexShrink: 0,
      ...style
    }
  }, rest), EXTRA[name], paths.map(d => /*#__PURE__*/React.createElement("path", {
    key: d,
    d: d
  })));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/cards/ParticipateCard.jsx
try { (() => {
/** Full-bleed photo card with a bottom scrim: title top, blurb and circle arrow bottom. */
function ParticipateCard({
  href = "#",
  title,
  body,
  image,
  gradient = "var(--grad-brand)",
  cta = "Learn more",
  ratio = "4/5"
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("a", {
    href: href,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      position: "relative",
      display: "block",
      aspectRatio: ratio,
      overflow: "hidden",
      borderRadius: "var(--radius-md)",
      background: gradient,
      textDecoration: "none"
    }
  }, image && /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: "",
    style: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      opacity: 0.65
    }
  }), /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      position: "absolute",
      inset: 0,
      background: "var(--grad-photo-scrim)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "flex",
      height: "100%",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: 28
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      maxWidth: "14ch",
      fontSize: "clamp(1.65rem,2.4vw,2rem)",
      lineHeight: 1.05,
      fontWeight: 500,
      letterSpacing: "var(--tracking-title)",
      color: "#fff",
      fontVariationSettings: '"opsz" 96'
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 20
    }
  }, body && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14.5,
      lineHeight: 1.5,
      color: "rgba(255,255,255,0.85)"
    }
  }, body), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 500,
      color: "#fff"
    }
  }, cta), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 40,
      height: 40,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "50%",
      background: hover ? "var(--red-mid)" : "var(--red)",
      boxShadow: "0 8px 22px rgba(224,34,20,0.35)",
      transform: hover ? "translateX(4px)" : "none",
      transition: "all var(--dur-hover) var(--ease-out-quint)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "arrow-right",
    size: 16,
    strokeWidth: 2.25,
    color: "#fff"
  }))))));
}
Object.assign(__ds_scope, { ParticipateCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/ParticipateCard.jsx", error: String((e && e.message) || e) }); }

// components/cards/PhotoPending.jsx
try { (() => {
/** Stands in for an event photo that doesn't exist yet. Always brand red. */
function PhotoPending({
  title
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      padding: "0 20px",
      textAlign: "center",
      background: "var(--grad-brand)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "image",
    size: 20,
    strokeWidth: 1.75,
    color: "rgba(255,255,255,0.45)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 500,
      lineHeight: 1.15,
      letterSpacing: "-0.01em",
      color: "#fff"
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "var(--tracking-kicker)",
      color: "rgba(255,255,255,0.6)"
    }
  }, "Photos coming soon"));
}
Object.assign(__ds_scope, { PhotoPending });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/PhotoPending.jsx", error: String((e && e.message) || e) }); }

// components/cards/EventRow.jsx
try { (() => {
/** Minimal event row: compact photo left, text right, no card frame. */
function EventRow({
  href = "#",
  image,
  imageAlt,
  imageGradient = "var(--grad-brand)",
  label,
  labelAccent = "neutral",
  title,
  meta,
  description,
  linkLabel = "Read more"
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("a", {
    href: href,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(0,4fr) minmax(0,7fr)",
      gap: 40,
      padding: "36px 0",
      textDecoration: "none",
      color: "inherit"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      aspectRatio: "4/3",
      overflow: "hidden",
      borderRadius: "var(--radius-md)",
      background: imageGradient
    }
  }, image ? /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: imageAlt || title,
    style: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      transform: hover ? "scale(1.03)" : "none",
      transition: "transform var(--dur-zoom) var(--ease-out-quint)"
    }
  }) : /*#__PURE__*/React.createElement(__ds_scope.PhotoPending, {
    title: title
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      gap: 10
    }
  }, label && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "var(--tracking-kicker)",
      color: labelAccent === "red" ? "var(--red)" : "var(--ink-3)"
    }
  }, label), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: "var(--fs-card-title)",
      lineHeight: "var(--lh-title)",
      fontWeight: 500,
      letterSpacing: "var(--tracking-title)",
      color: "var(--ink)",
      fontVariationSettings: '"opsz" 96'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      backgroundImage: "linear-gradient(var(--red),var(--red))",
      backgroundSize: hover ? "100% 1px" : "0% 1px",
      backgroundPosition: "0 100%",
      backgroundRepeat: "no-repeat",
      transition: "background-size 500ms var(--ease-out-quint)"
    }
  }, title)), meta && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: "var(--ink-3)"
    }
  }, meta), description && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14.5,
      lineHeight: 1.55,
      color: "var(--ink-2)"
    }
  }, description), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: 13.5,
      fontWeight: 500,
      color: "var(--red-mid)"
    }
  }, linkLabel, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      transform: hover ? "translate(2px,-2px)" : "none",
      transition: "transform var(--dur-hover) var(--ease-out-quint)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "arrow-up-right",
    size: 14,
    strokeWidth: 2
  })))));
}
Object.assign(__ds_scope, { EventRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/EventRow.jsx", error: String((e && e.message) || e) }); }

// components/cards/PastEventCard.jsx
try { (() => {
/** Past-event card for dark surfaces: photo on top, date eyebrow, title, circle-arrow CTA. */
function PastEventCard({
  href = "#",
  image,
  imageAlt,
  imageGradient = "var(--grad-brand)",
  date,
  title,
  subtitle,
  cta = "View Event"
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("a", {
    href: href,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "block",
      textDecoration: "none",
      color: "inherit"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      aspectRatio: "4/3",
      width: "100%",
      overflow: "hidden",
      borderRadius: "var(--radius-lg)",
      background: imageGradient
    }
  }, image ? /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: imageAlt || title,
    style: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      transform: hover ? "scale(1.03)" : "none",
      transition: "transform var(--dur-zoom) var(--ease-out-quint)"
    }
  }) : /*#__PURE__*/React.createElement(__ds_scope.PhotoPending, {
    title: title
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "rgba(255,255,255,0.7)"
    }
  }, date), /*#__PURE__*/React.createElement("h3", {
    style: {
      marginTop: 8,
      fontSize: "var(--fs-card-title)",
      lineHeight: "var(--lh-title)",
      fontWeight: 500,
      letterSpacing: "var(--tracking-title)",
      color: "#fff",
      fontVariationSettings: '"opsz" 96'
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      fontSize: 13,
      color: "rgba(255,255,255,0.6)"
    }
  }, subtitle), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      display: "inline-flex",
      alignItems: "center",
      gap: 12,
      fontSize: 14,
      fontWeight: 500,
      color: "#fff"
    }
  }, cta, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 36,
      height: 36,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "50%",
      background: hover ? "var(--red-mid)" : "var(--red)",
      boxShadow: "0 8px 22px rgba(224,34,20,0.35)",
      transform: hover ? "translateX(4px)" : "none",
      transition: "all var(--dur-hover) var(--ease-out-quint)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "arrow-right",
    size: 16,
    strokeWidth: 2.25,
    color: "#fff"
  })))));
}
Object.assign(__ds_scope, { PastEventCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/PastEventCard.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * The pill button. Every variant is 14px/500 label, 999px radius, and lifts 1px
 * on hover; the classes live in tokens/patterns.css exactly as they do in the
 * site's globals.css, so this component only picks one.
 */
function Button({
  variant = "primary",
  href,
  children,
  icon,
  disabled,
  onClick,
  type = "button",
  className = "",
  style,
  ...rest
}) {
  const cls = `btn-pill btn-${variant} ${className}`.trim();
  const inner = /*#__PURE__*/React.createElement(React.Fragment, null, children, icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 16,
    strokeWidth: 2.25
  }) : null);
  if (href && !disabled) {
    return /*#__PURE__*/React.createElement("a", _extends({
      href: href,
      className: cls,
      style: style,
      onClick: onClick
    }, rest), inner);
  }
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    className: cls,
    style: style,
    disabled: disabled,
    onClick: onClick
  }, rest), inner);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/CircleArrowLink.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Label + red filled circle with a white arrow. The whole row is the target. */
function CircleArrowLink({
  href = "#",
  children,
  size = "md",
  color = "#ffffff",
  style,
  ...rest
}) {
  const dim = size === "lg" ? 48 : size === "sm" ? 36 : 40;
  const font = size === "lg" ? 16 : size === "sm" ? 13 : 14.5;
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("a", _extends({
    href: href,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 14,
      color,
      textDecoration: "none",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: font,
      fontWeight: 500
    }
  }, children), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: dim,
      height: dim,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "50%",
      background: hover ? "var(--red-mid)" : "var(--red)",
      color: "#fff",
      boxShadow: "var(--shadow-red-circle)",
      transform: hover ? "translateX(4px)" : "none",
      transition: "transform var(--dur-hover) var(--ease-out-quint), background var(--dur-hover) var(--ease-out-quint)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "arrow-right",
    size: size === "lg" ? 20 : 16,
    strokeWidth: 2.25
  })));
}
Object.assign(__ds_scope, { CircleArrowLink });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/CircleArrowLink.jsx", error: String((e && e.message) || e) }); }

// components/core/Pill.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Small status / category pill. Four tints, same radius as every other pill. */
function Pill({
  tone = "cream",
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    className: `pill pill-${tone}`,
    style: style
  }, rest), children);
}
Object.assign(__ds_scope, { Pill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Pill.jsx", error: String((e && e.message) || e) }); }

// components/core/RedCircle.jsx
try { (() => {
/** The stage's red circle, as a decorative sphere. Purely presentational. */
function RedCircle({
  size = 200,
  opacity = 1,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      pointerEvents: "none",
      borderRadius: "50%",
      width: size,
      height: size,
      opacity,
      background: "radial-gradient(circle at 38% 38%, #ff5247 0%, #e62b1e 42%, #b91d12 75%, #8a1409 100%)",
      boxShadow: "inset 6px -14px 24px rgba(0,0,0,0.22), 0 10px 30px rgba(230,43,30,0.35)",
      ...style
    }
  });
}
Object.assign(__ds_scope, { RedCircle });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/RedCircle.jsx", error: String((e && e.message) || e) }); }

// components/core/SectionKicker.jsx
try { (() => {
/** Eyebrow above a section heading: a short rule, then wide-tracked uppercase. */
function SectionKicker({
  label,
  accent = "red",
  inverted = false,
  showRule = true,
  style
}) {
  const accentColor = accent === "amber" ? "#d89645" : accent === "coast" ? "#1f4a5c" : accent === "white" ? "rgba(255,255,255,0.6)" : "var(--ted-red)";
  const color = inverted ? "rgba(255,255,255,0.85)" : accentColor;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      color,
      ...style
    }
  }, showRule && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      display: "inline-block",
      height: 2,
      width: 40,
      borderRadius: 999,
      background: inverted ? "rgba(255,255,255,0.6)" : accentColor
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "var(--tracking-kicker)"
    }
  }, label));
}
Object.assign(__ds_scope, { SectionKicker });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/SectionKicker.jsx", error: String((e && e.message) || e) }); }

// components/feedback/CountdownClock.jsx
try { (() => {
const CELLS = ["Days", "Hours", "Minutes", "Seconds"];

/** Counts down to an event. Four bordered cells on a dark surface. */
function CountdownClock({
  target = "2026-10-24T18:00:00+11:00",
  label = "Counting down to the night"
}) {
  const [parts, setParts] = React.useState(null);
  const [passed, setPassed] = React.useState(false);
  React.useEffect(() => {
    const t = new Date(target).getTime();
    const tick = () => {
      const total = Math.max(0, t - Date.now());
      const s = Math.floor(total / 1000);
      setPassed(Date.now() >= t);
      setParts([Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60]);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "var(--tracking-kicker-wide)",
      color: "var(--red-blush)"
    }
  }, passed ? "The night has arrived" : label), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 16
    }
  }, CELLS.map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: c,
    style: {
      borderRadius: "var(--radius-input)",
      border: "1px solid rgba(255,255,255,0.12)",
      background: "rgba(255,255,255,0.04)",
      padding: "20px 8px",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "clamp(1.9rem,6vw,3.25rem)",
      lineHeight: 1,
      fontWeight: 500,
      color: "#fff",
      fontVariantNumeric: "tabular-nums",
      fontVariationSettings: '"opsz" 144'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      visibility: parts ? "visible" : "hidden"
    }
  }, String(parts ? parts[i] : 0).padStart(2, "0"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      fontSize: 9.5,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.2em",
      color: "rgba(255,255,255,0.55)"
    }
  }, c)))));
}
Object.assign(__ds_scope, { CountdownClock });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/CountdownClock.jsx", error: String((e && e.message) || e) }); }

// components/feedback/FaqAccordion.jsx
try { (() => {
/** Single-open accordion. Answers stay in the DOM and grow from 0fr to 1fr. */
function FaqAccordion({
  faqs = [],
  tone = "dark"
}) {
  const [open, setOpen] = React.useState(null);
  const light = tone === "dark"; // dark surface => light text
  const line = light ? "1px solid rgba(255,255,255,0.10)" : "1px solid var(--line-hairline)";
  return /*#__PURE__*/React.createElement("div", null, faqs.map((item, i) => {
    const isOpen = open === i;
    return /*#__PURE__*/React.createElement("div", {
      key: item.q,
      style: {
        padding: "20px 0",
        borderTop: i === 0 ? "none" : line
      }
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => setOpen(isOpen ? null : i),
      "aria-expanded": isOpen,
      style: {
        display: "flex",
        width: "100%",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        textAlign: "left",
        background: "none",
        border: 0,
        padding: 0,
        fontFamily: "var(--font-sans)",
        fontSize: 16,
        fontWeight: 500,
        lineHeight: 1.35,
        color: light ? "#fff" : "var(--ink)"
      }
    }, item.q, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        transform: isOpen ? "rotate(180deg)" : "none",
        transition: "transform 300ms var(--ease-out-quint)",
        color: light ? "rgba(255,255,255,0.5)" : "var(--ink-3)"
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "chevron-down",
      size: 16
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateRows: isOpen ? "1fr" : "0fr",
        opacity: isOpen ? 1 : 0,
        transition: "grid-template-rows 320ms var(--ease-out-quint), opacity 260ms ease-out"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        overflow: "hidden",
        minHeight: 0
      }
    }, /*#__PURE__*/React.createElement("p", {
      style: {
        marginTop: 12,
        fontSize: 14.5,
        lineHeight: 1.65,
        color: light ? "rgba(255,255,255,0.7)" : "var(--ink-2)"
      }
    }, item.a))));
  }));
}
Object.assign(__ds_scope, { FaqAccordion });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/FaqAccordion.jsx", error: String((e && e.message) || e) }); }

// components/forms/FormField.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Labelled input / textarea / select. White field, 16px radius, hairline border, red focus ring. */
function FormField({
  label,
  name,
  required,
  hint,
  type = "text",
  placeholder,
  textarea,
  rows = 5,
  select,
  options = [],
  defaultValue,
  style
}) {
  const [focus, setFocus] = React.useState(false);
  const field = {
    marginTop: 10,
    width: "100%",
    boxSizing: "border-box",
    borderRadius: "var(--radius-input)",
    background: "#fff",
    padding: "16px 20px",
    fontFamily: "var(--font-sans)",
    fontSize: 15,
    fontWeight: 500,
    color: "#1a1513",
    border: "1px solid rgba(97,74,68,0.13)",
    outline: "none",
    boxShadow: focus ? "0 0 0 3px rgba(230,43,30,0.2)" : "none",
    transition: "box-shadow var(--dur-hover) var(--ease-out-quint)"
  };
  const handlers = {
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false)
  };
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "block",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 700,
      color: "#1a1513"
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 4,
      color: "var(--ted-red)"
    }
  }, "*")), hint && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.14em",
      color: "#8a7e74"
    }
  }, hint)), textarea ? /*#__PURE__*/React.createElement("textarea", _extends({
    name: name,
    required: required,
    rows: rows,
    placeholder: placeholder,
    style: field
  }, handlers)) : select ? /*#__PURE__*/React.createElement("select", _extends({
    name: name,
    required: required,
    defaultValue: defaultValue ?? "",
    style: field
  }, handlers), /*#__PURE__*/React.createElement("option", {
    value: "",
    disabled: true
  }, "Select\u2026"), options.map(o => /*#__PURE__*/React.createElement("option", {
    key: o,
    value: o
  }, o))) : /*#__PURE__*/React.createElement("input", _extends({
    name: name,
    type: type,
    required: required,
    placeholder: placeholder,
    style: field
  }, handlers)));
}
Object.assign(__ds_scope, { FormField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/FormField.jsx", error: String((e && e.message) || e) }); }

// components/forms/SubscribeForm.jsx
try { (() => {
/** Email + red pill submit. The site's newsletter row, on the deep-red close of the homepage. */
function SubscribeForm({
  placeholder = "your@email.com",
  cta = "Subscribe",
  onSubmit
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      onSubmit && onSubmit(e);
    },
    style: {
      display: "flex",
      gap: 12,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "subscribe-email",
    style: {
      position: "absolute",
      width: 1,
      height: 1,
      overflow: "hidden",
      clip: "rect(0 0 0 0)"
    }
  }, "Email address"), /*#__PURE__*/React.createElement("input", {
    id: "subscribe-email",
    type: "email",
    name: "email",
    required: true,
    placeholder: placeholder,
    style: {
      flex: 1,
      minWidth: 220,
      boxSizing: "border-box",
      borderRadius: "var(--radius-input)",
      border: "1px solid rgba(97,74,68,0.13)",
      background: "#fff",
      padding: "16px 20px",
      fontFamily: "var(--font-sans)",
      fontSize: 15,
      fontWeight: 500,
      color: "#1a1513",
      outline: "none"
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      flexShrink: 0,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      whiteSpace: "nowrap",
      borderRadius: "var(--radius-pill)",
      border: 0,
      background: hover ? "var(--red-mid)" : "var(--red)",
      padding: "14px 28px",
      fontFamily: "var(--font-sans)",
      fontSize: 14.5,
      fontWeight: 500,
      color: "#fff",
      transform: hover ? "translateY(-2px)" : "none",
      transition: "all var(--dur-hover) var(--ease-out-quint)"
    }
  }, cta));
}
Object.assign(__ds_scope, { SubscribeForm });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SubscribeForm.jsx", error: String((e && e.message) || e) }); }

// components/motifs/NodeNetwork.jsx
try { (() => {
// Hand-placed so the constellation stays deliberate (no random => no drift).
const NODES = [[120, 140], [340, 90], [520, 220], [250, 320], [80, 470], [440, 430], [660, 120], [770, 340], [900, 220], [1080, 120], [1240, 250], [1180, 450], [980, 470], [1350, 130], [600, 620], [300, 600], [120, 730], [430, 800], [720, 780], [900, 680], [1120, 660], [1300, 790], [520, 980], [980, 900]];
const EDGES = [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5], [2, 5], [1, 6], [6, 7], [7, 8], [8, 9], [9, 13], [9, 10], [10, 11], [11, 12], [12, 7], [7, 14], [5, 14], [14, 15], [15, 3], [15, 16], [16, 17], [17, 14], [14, 18], [18, 19], [19, 12], [19, 20], [20, 11], [20, 21], [21, 13], [18, 22], [17, 22], [18, 23], [23, 19], [22, 23]];

/** Ambient "nodes and edges" background motif for dark flagship sections. */
function NodeNetwork({
  variant = "light",
  opacity = 0.35,
  style
}) {
  const color = variant === "light" ? "#ffffff" : "#141210";
  return /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      opacity,
      ...style
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 1440 1024",
    preserveAspectRatio: "xMidYMid slice",
    style: {
      width: "100%",
      height: "100%"
    }
  }, /*#__PURE__*/React.createElement("g", {
    className: "salon-net-g"
  }, EDGES.map(([a, b], i) => /*#__PURE__*/React.createElement("line", {
    key: i,
    x1: NODES[a][0],
    y1: NODES[a][1],
    x2: NODES[b][0],
    y2: NODES[b][1],
    stroke: color,
    strokeOpacity: 0.5,
    strokeWidth: 1
  })), NODES.map(([x, y], i) => /*#__PURE__*/React.createElement("circle", {
    key: i,
    className: "salon-net-node",
    cx: x,
    cy: y,
    r: i % 4 === 0 ? 4 : 2.6,
    fill: color,
    style: {
      animationDelay: `${i % 7 * 0.9}s`
    }
  })))));
}
Object.assign(__ds_scope, { NodeNetwork });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/motifs/NodeNetwork.jsx", error: String((e && e.message) || e) }); }

// components/navigation/PageHero.jsx
try { (() => {
/** The cream page hero every inner page opens with. Kicker, big title, intro. */
function PageHero({
  kicker,
  title,
  intro,
  body,
  meta
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: "var(--cream)",
      padding: "144px 0 64px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      margin: "0 auto",
      maxWidth: "var(--container-prose)",
      padding: "0 24px"
    }
  }, kicker && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.24em",
      color: "var(--red-mid)"
    }
  }, kicker), /*#__PURE__*/React.createElement("h1", {
    style: {
      marginTop: kicker ? 24 : 0,
      fontSize: "var(--fs-display)",
      lineHeight: 0.98,
      fontWeight: 500,
      letterSpacing: "var(--tracking-display)",
      color: "var(--ink)",
      fontVariationSettings: '"opsz" 144'
    }
  }, title), intro && /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 32,
      fontSize: 18,
      lineHeight: 1.65,
      color: "var(--ink-2)"
    }
  }, intro), body && /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 16,
      fontSize: 18,
      lineHeight: 1.65,
      color: "var(--ink-2)"
    }
  }, body), meta && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 32
    }
  }, meta)));
}
Object.assign(__ds_scope, { PageHero });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/PageHero.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SiteFooter.jsx
try { (() => {
/** Ink footer: brand line and socials left, three link columns right, then fine print. */
function SiteFooter({
  logo,
  tagline = "Ideas change everything.",
  columns = [],
  socials = [],
  acknowledgment,
  access,
  legal,
  legalLinks = []
}) {
  return /*#__PURE__*/React.createElement("footer", {
    className: "grain",
    style: {
      position: "relative",
      overflow: "hidden",
      background: "var(--ink)",
      color: "var(--cream)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      margin: "0 auto",
      maxWidth: "var(--container-wide)",
      padding: "0 40px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "5fr 7fr",
      gap: 32,
      padding: "56px 0"
    }
  }, /*#__PURE__*/React.createElement("div", null, logo && /*#__PURE__*/React.createElement("img", {
    src: logo,
    alt: "TEDxNewy",
    style: {
      height: 32,
      width: "auto",
      marginBottom: 24
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "18ch",
      fontSize: "clamp(1.6rem,2.4vw,2.1rem)",
      fontWeight: 400,
      lineHeight: 1.05,
      letterSpacing: "-0.03em"
    }
  }, tagline), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 28,
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, socials.map(s => /*#__PURE__*/React.createElement("a", {
    key: s.label,
    href: s.href,
    "aria-label": s.label,
    style: {
      width: 36,
      height: 36,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "50%",
      border: "1px solid var(--line-light)",
      textDecoration: "none"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: s.icon,
    alt: "",
    style: {
      width: 16,
      height: 16,
      opacity: 0.75
    }
  }))))), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 32
    }
  }, columns.map(col => /*#__PURE__*/React.createElement("div", {
    key: col.title
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      marginBottom: 16,
      fontSize: 10.5,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "var(--tracking-kicker-wide)",
      color: "rgba(255,255,255,0.45)"
    }
  }, col.title), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: "none",
      margin: 0,
      padding: 0,
      display: "grid",
      gap: 10
    }
  }, col.items.map(it => /*#__PURE__*/React.createElement("li", {
    key: it.label
  }, /*#__PURE__*/React.createElement("a", {
    href: it.href,
    style: {
      fontSize: 14,
      fontWeight: 500,
      color: "rgba(255,255,255,0.85)",
      textDecoration: "none"
    }
  }, it.label)))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "24px 48px",
      borderTop: "1px solid var(--line-light-soft)",
      padding: "32px 0"
    }
  }, [["Acknowledgment of Country", acknowledgment], ["Access & inclusion", access]].map(([t, body]) => body ? /*#__PURE__*/React.createElement("div", {
    key: t
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      fontSize: 10,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "var(--tracking-kicker-wide)",
      color: "rgba(255,255,255,0.4)"
    }
  }, t), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 12,
      fontSize: 12.5,
      lineHeight: 1.6,
      color: "rgba(255,255,255,0.55)"
    }
  }, body)) : null)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      borderTop: "1px solid var(--line-light-soft)",
      padding: "20px 0",
      fontSize: 11.5,
      color: "rgba(255,255,255,0.55)"
    }
  }, /*#__PURE__*/React.createElement("div", null, legal), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 20
    }
  }, legalLinks.map(l => /*#__PURE__*/React.createElement("a", {
    key: l.label,
    href: l.href,
    style: {
      color: "inherit",
      textDecoration: "none"
    }
  }, l.label))))));
}
Object.assign(__ds_scope, { SiteFooter });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SiteFooter.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SiteHeader.jsx
try { (() => {
/**
 * The site header. Transparent over a dark hero, lifting to an opaque cream bar
 * on scroll. Top-level items don't navigate: they reveal a full-width panel,
 * either a lede + divided link list, or a row of three photo cards.
 */
function SiteHeader({
  logo,
  logoLight,
  groups = [],
  cta = {
    label: "Get tickets",
    href: "/signal"
  },
  darkHero = false,
  scrolled = false
}) {
  const [menu, setMenu] = React.useState(null);
  const [drawer, setDrawer] = React.useState(false);
  const atTop = !scrolled;
  const lightContent = atTop && darkHero;
  const expanded = !!menu || drawer;
  const bar = atTop && !expanded ? {
    background: "transparent",
    borderBottom: "1px solid transparent",
    boxShadow: "none"
  } : lightContent && expanded ? {
    background: "rgba(42,6,4,0.96)",
    backdropFilter: "var(--blur-bar)",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "none"
  } : {
    background: "rgba(247,243,235,0.97)",
    backdropFilter: "var(--blur-bar)",
    borderBottom: "1px solid var(--line-hairline)",
    boxShadow: "var(--shadow-nav)"
  };
  const active = groups.find(g => g.key === menu) || null;
  const linkColor = lightContent ? "rgba(255,255,255,0.88)" : "var(--ink)";
  return /*#__PURE__*/React.createElement("nav", {
    onMouseLeave: () => setMenu(null),
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      zIndex: "var(--z-nav)",
      transition: "all var(--dur-hover) var(--ease-out-quint)",
      ...bar
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      margin: "0 auto",
      maxWidth: "var(--container-wide)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "8px 40px"
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "/",
    "aria-label": "TEDxNewy home",
    style: {
      display: "block",
      lineHeight: 0
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: lightContent ? logoLight : logo,
    alt: "TEDxNewy",
    style: {
      height: 56,
      width: "auto"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 32
    }
  }, groups.map(g => {
    const isOpen = menu === g.key;
    return /*#__PURE__*/React.createElement("div", {
      key: g.key,
      style: {
        position: "relative"
      },
      onMouseEnter: () => setMenu(g.key)
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      "aria-haspopup": "true",
      "aria-expanded": isOpen,
      onClick: () => setMenu(isOpen ? null : g.key),
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: "none",
        border: 0,
        padding: 0,
        fontFamily: "var(--font-sans)",
        fontSize: 15,
        color: isOpen && lightContent ? "#fff" : linkColor,
        transition: "color var(--dur-hover) var(--ease-out-quint)"
      }
    }, g.label, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        transform: isOpen ? "rotate(180deg)" : "none",
        transition: "transform var(--dur-hover) var(--ease-out-quint)"
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "chevron-down",
      size: 14,
      strokeWidth: 2.25
    }))), isOpen && /*#__PURE__*/React.createElement("span", {
      "aria-hidden": "true",
      style: {
        position: "absolute",
        bottom: -8,
        left: 0,
        height: 2,
        width: "100%",
        borderRadius: 999,
        background: "var(--red)"
      }
    }));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: cta.href,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      borderRadius: "var(--radius-pill)",
      padding: "8px 20px",
      fontSize: 13.5,
      fontWeight: 500,
      textDecoration: "none",
      background: lightContent ? "#fff" : "var(--red)",
      color: lightContent ? "var(--red-deep)" : "#fff",
      transition: "all var(--dur-hover) var(--ease-out-quint)"
    }
  }, cta.label))), active && /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: lightContent ? "1px solid rgba(255,255,255,0.10)" : "1px solid var(--line-hairline)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      margin: "0 auto",
      maxWidth: "var(--container-wide)",
      padding: "48px 40px"
    }
  }, active.style === "cards" ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 24
    }
  }, active.items.map(it => /*#__PURE__*/React.createElement(__ds_scope.ParticipateCard, {
    key: it.label,
    href: it.href || "#",
    title: it.label,
    body: it.description,
    image: it.imageUrl,
    gradient: it.gradient,
    cta: it.ctaLabel || "Learn more",
    ratio: "4/3"
  }))) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "0.85fr 2fr",
      gap: 64
    }
  }, /*#__PURE__*/React.createElement("div", null, active.kicker && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "var(--tracking-kicker-wide)",
      color: lightContent ? "rgba(255,255,255,0.55)" : "var(--ink-3)"
    }
  }, active.kicker), /*#__PURE__*/React.createElement("h3", {
    style: {
      marginTop: 16,
      fontSize: "clamp(1.5rem,2.2vw,2rem)",
      lineHeight: 1.05,
      fontWeight: 500,
      letterSpacing: "var(--tracking-title)",
      color: lightContent ? "#fff" : "var(--ink)"
    }
  }, active.heading || active.label), active.blurb && /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 12,
      maxWidth: "34ch",
      fontSize: 14,
      lineHeight: 1.6,
      color: lightContent ? "rgba(255,255,255,0.65)" : "var(--ink-2)"
    }
  }, active.blurb)), /*#__PURE__*/React.createElement("div", null, active.items.map((it, i) => /*#__PURE__*/React.createElement("a", {
    key: it.label,
    href: it.href || undefined,
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 24,
      padding: "14px 12px",
      margin: "0 -12px",
      borderRadius: 8,
      borderTop: i === 0 ? "none" : lightContent ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(20,18,16,0.10)",
      textDecoration: "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontSize: 16,
      fontWeight: 500,
      color: lightContent ? "rgba(255,255,255,0.9)" : "var(--ink)"
    }
  }, it.label), it.description && /*#__PURE__*/React.createElement("span", {
    style: {
      marginTop: 4,
      display: "block",
      fontSize: 13,
      color: lightContent ? "rgba(255,255,255,0.45)" : "var(--ink-4)"
    }
  }, it.description)), it.href ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "arrow-right",
    size: 16,
    strokeWidth: 2,
    color: lightContent ? "rgba(255,255,255,0.4)" : "#cfc7ba"
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      borderRadius: 999,
      background: "rgba(224,34,20,0.14)",
      padding: "4px 12px",
      fontSize: 10,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.14em",
      color: "var(--red)"
    }
  }, "Coming soon"))))))));
}
Object.assign(__ds_scope, { SiteHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SiteHeader.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SpeakerCarousel.jsx
try { (() => {
/** Swipeable speaker lineup. Arrow controls on desktop, swipe on touch. */
function SpeakerCarousel({
  speakers = [],
  kicker = "The lineup",
  heading = "Speakers",
  onSelect
}) {
  const track = React.useRef(null);
  const step = dir => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector("li");
    el.scrollBy({
      left: (card && card.clientWidth || 240 + 24) * dir,
      behavior: "smooth"
    });
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      padding: "0 24px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.24em",
      color: "var(--red-mid)"
    }
  }, kicker), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, [-1, 1].map(d => /*#__PURE__*/React.createElement("button", {
    key: d,
    type: "button",
    onClick: () => step(d),
    "aria-label": d < 0 ? "Scroll speakers left" : "Scroll speakers right",
    style: {
      width: 36,
      height: 36,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "50%",
      border: "1px solid rgba(20,18,16,0.15)",
      background: "transparent",
      color: "var(--ink)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: d < 0 ? "chevron-left" : "chevron-right",
    size: 16,
    strokeWidth: 2.25
  }))))), /*#__PURE__*/React.createElement("h2", {
    style: {
      marginTop: 16,
      padding: "0 24px",
      fontSize: "clamp(1.65rem,3vw,2.25rem)",
      lineHeight: 1.1,
      fontWeight: 500,
      letterSpacing: "var(--tracking-display)",
      color: "var(--ink)",
      fontVariationSettings: '"opsz" 144'
    }
  }, heading), /*#__PURE__*/React.createElement("ul", {
    ref: track,
    className: "carousel-scrollbar",
    style: {
      listStyle: "none",
      display: "flex",
      gap: 24,
      overflowX: "auto",
      scrollSnapType: "x mandatory",
      margin: "40px 0 0",
      padding: "0 24px 16px"
    }
  }, speakers.map(s => /*#__PURE__*/React.createElement("li", {
    key: s.name,
    style: {
      width: 240,
      flexShrink: 0,
      scrollSnapAlign: "start"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.SpeakerCard, {
    name: s.name,
    title: s.title,
    image: s.image,
    onClick: () => onSelect && onSelect(s)
  })))));
}
Object.assign(__ds_scope, { SpeakerCarousel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SpeakerCarousel.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Chrome.jsx
try { (() => {
// Shared page chrome: the fixed header (transparent over a dark hero) and the
// ink footer. `route` drives the header CTA and the dark-hero treatment.
function Chrome({
  children,
  darkHero,
  onNavigate
}) {
  const {
    SiteHeader,
    SiteFooter
  } = window.TEDxNewyDesignSystem_0329fe;
  const [scrolled, setScrolled] = React.useState(false);
  const ref = React.useRef(null);
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    onScroll: e => setScrolled(e.currentTarget.scrollTop > 60),
    style: {
      height: "100vh",
      overflowY: "auto",
      background: "var(--cream)",
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 50,
      height: 0
    }
  }, /*#__PURE__*/React.createElement(SiteHeader, {
    darkHero: darkHero,
    scrolled: scrolled,
    logo: "../../assets/logos/tedxnewy-black.png",
    logoLight: "../../assets/logos/tedxnewy-white.png",
    cta: {
      label: "Get tickets",
      href: "#signal"
    },
    groups: window.TEDX.nav
  })), children, /*#__PURE__*/React.createElement(SiteFooter, {
    logo: "../../assets/logos/tedxnewy-white.png",
    columns: window.TEDX.footerColumns,
    socials: window.TEDX.socials,
    acknowledgment: window.TEDX.acknowledgment,
    access: window.TEDX.access,
    legal: "\xA9 2026 Newcastle Ideas Network Limited \xB7 ACN 676 155 462 \xB7 formerly TEDxCooksHill",
    legalLinks: [{
      label: "Privacy",
      href: "#"
    }, {
      label: "Terms",
      href: "#"
    }, {
      label: "Code of Conduct",
      href: "#"
    }, {
      label: "Contact",
      href: "#"
    }]
  }));
}

// Section shell: max-width container with the site's vertical rhythm.
function Section({
  children,
  background = "var(--cream)",
  color,
  narrow,
  padding = "128px 40px",
  style
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background,
      color,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      margin: "0 auto",
      maxWidth: narrow ? "var(--container-narrow)" : "var(--container)",
      padding
    }
  }, children));
}
function SectionTitle({
  children,
  tone = "dark",
  max = "20ch"
}) {
  return /*#__PURE__*/React.createElement("h2", {
    style: {
      maxWidth: max,
      fontSize: "var(--fs-h2)",
      lineHeight: "var(--lh-display)",
      fontWeight: 500,
      letterSpacing: "var(--tracking-display)",
      color: tone === "dark" ? "var(--ink)" : "#fff",
      fontVariationSettings: '"opsz" 144'
    }
  }, children);
}
Object.assign(window, {
  Chrome,
  Section,
  SectionTitle
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Chrome.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/EventScreen.jsx
try { (() => {
// A flagship event page (/signal): photo hero on dark, countdown, the lineup,
// what to expect, FAQs and the ticket close. Clicking a speaker opens their bio.
function EventScreen({
  onNavigate
}) {
  const {
    CountdownClock,
    SpeakerCarousel,
    FaqAccordion,
    Button,
    EditionStamp,
    Pill,
    Icon,
    NodeNetwork
  } = window.TEDxNewyDesignSystem_0329fe;
  const [speaker, setSpeaker] = React.useState(null);
  const d = window.TEDX;
  return /*#__PURE__*/React.createElement(Chrome, {
    darkHero: true,
    onNavigate: onNavigate
  }, /*#__PURE__*/React.createElement("section", {
    className: "grain grain-dark",
    style: {
      position: "relative",
      overflow: "hidden",
      background: "var(--red-deep)",
      color: "#fff"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/imagery/signal-home-hero.webp",
    alt: "",
    style: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      opacity: 0.35
    }
  }), /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      position: "absolute",
      inset: 0,
      background: "linear-gradient(180deg, rgba(42,6,4,0.55) 0%, rgba(42,6,4,0.75) 55%, rgba(42,6,4,0.96) 100%)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      margin: "0 auto",
      maxWidth: "var(--container)",
      padding: "200px 40px 96px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Pill, {
    tone: "red"
  }, "On sale now"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "var(--tracking-kicker-wide)",
      color: "var(--red-blush)"
    }
  }, "Signature \xB7 Edition 11")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 32,
      display: "grid",
      gridTemplateColumns: "1fr auto",
      gap: 48,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      maxWidth: "16ch",
      fontSize: "clamp(3rem,8vw,7rem)",
      lineHeight: 0.96,
      fontWeight: 400,
      letterSpacing: "-0.035em",
      color: "#fff"
    }
  }, "Signal"), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 32,
      maxWidth: "52ch",
      fontSize: 18,
      lineHeight: 1.65,
      color: "rgba(255,255,255,0.85)"
    }
  }, "Eight speakers, one stage, and a day about the ideas cutting through the noise in Newcastle. Saturday 24 October at the Conservatorium of Music."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 28,
      display: "flex",
      flexWrap: "wrap",
      gap: 24,
      fontSize: 14,
      color: "rgba(255,255,255,0.7)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "calendar",
    size: 16
  }), "Saturday 24 October 2026"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "map-pin",
    size: 16
  }), "Conservatorium of Music, Newcastle")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 40,
      display: "flex",
      gap: 12,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "red",
    icon: "arrow-right"
  }, "Get tickets"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost-light",
    icon: "play"
  }, "Watch the 2025 recap"))), /*#__PURE__*/React.createElement(EditionStamp, {
    size: 132,
    text: "TEDxNEWY \xB7 EDITION 11 \xB7 2026 \xB7 SIGNAL \xB7"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 80,
      maxWidth: 620
    }
  }, /*#__PURE__*/React.createElement(CountdownClock, {
    target: "2026-10-24T09:30:00+11:00"
  })))), /*#__PURE__*/React.createElement(Section, {
    padding: "112px 0"
  }, /*#__PURE__*/React.createElement(SpeakerCarousel, {
    speakers: d.speakers,
    onSelect: setSpeaker
  })), /*#__PURE__*/React.createElement(Section, {
    background: "var(--cream-light)",
    padding: "112px 40px"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "4fr 8fr",
      gap: 64
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "section-accent"
  }), /*#__PURE__*/React.createElement("h2", {
    style: {
      marginTop: 20,
      maxWidth: "14ch",
      fontSize: "var(--fs-h3)",
      lineHeight: 1.05,
      fontWeight: 500,
      letterSpacing: "var(--tracking-display)",
      fontVariationSettings: '"opsz" 144'
    }
  }, "What the day looks like")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 0
    }
  }, [["09:30", "Doors and coffee", "Come early. The foyer is half the point."], ["10:15", "Session one", "Four talks, then a long break on purpose."], ["12:30", "Lunch", "Included, local, and eaten standing up talking to strangers."], ["14:00", "Session two", "Four more talks and the closing."], ["16:00", "Afterwards", "The bar stays open. Most people stay too."]].map(([t, title, body], i) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      display: "grid",
      gridTemplateColumns: "84px 1fr",
      gap: 24,
      padding: "24px 0",
      borderTop: i ? "1px solid var(--line-hairline)" : "none"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 600,
      color: "var(--red-mid)",
      fontVariantNumeric: "tabular-nums"
    }
  }, t), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 19,
      fontWeight: 500,
      letterSpacing: "-0.01em"
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 6,
      fontSize: 14.5,
      lineHeight: 1.55,
      color: "var(--ink-3)"
    }
  }, body))))))), /*#__PURE__*/React.createElement("section", {
    style: {
      position: "relative",
      overflow: "hidden",
      background: "var(--red-deep)",
      color: "#fff"
    }
  }, /*#__PURE__*/React.createElement(NodeNetwork, {
    variant: "light",
    opacity: 0.2
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      margin: "0 auto",
      maxWidth: "var(--container-prose)",
      padding: "112px 40px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1.4fr",
      gap: 64,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionTitle, {
    tone: "light",
    max: "12ch"
  }, "Before you book."), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 20,
      fontSize: 15,
      lineHeight: 1.65,
      color: "rgba(255,255,255,0.7)"
    }
  }, "Anything we have missed? Ask us at hello@tedxnewy.com.au and we will answer properly."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 32
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "cream",
    icon: "arrow-right"
  }, "Get tickets"))), /*#__PURE__*/React.createElement(FaqAccordion, {
    faqs: d.faqs
  })))), speaker && /*#__PURE__*/React.createElement("div", {
    onClick: () => setSpeaker(null),
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 60,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
      background: "rgba(20,18,16,0.72)",
      backdropFilter: "blur(6px)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      position: "relative",
      width: "100%",
      maxWidth: 760,
      background: "var(--cream)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
      display: "grid",
      gridTemplateColumns: "280px 1fr",
      boxShadow: "var(--shadow-lg)"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: speaker.image,
    alt: speaker.name,
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 40
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setSpeaker(null),
    "aria-label": "Close",
    style: {
      position: "absolute",
      top: 16,
      right: 16,
      width: 36,
      height: 36,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "50%",
      border: 0,
      background: "rgba(20,18,16,0.06)",
      color: "var(--ink)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    size: 16
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.24em",
      color: "var(--red-mid)"
    }
  }, "Speaker"), /*#__PURE__*/React.createElement("h3", {
    style: {
      marginTop: 16,
      fontSize: 34,
      lineHeight: 1.05,
      fontWeight: 500,
      letterSpacing: "var(--tracking-display)",
      fontVariationSettings: '"opsz" 144'
    }
  }, speaker.name), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      fontSize: 14,
      color: "var(--ink-3)"
    }
  }, speaker.title), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 20,
      fontSize: 15,
      lineHeight: 1.65,
      color: "var(--ink-2)"
    }
  }, "Bio copy sits here on the live site, pulled from the event CMS along with the talk video and socials once the talk is published."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 28
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    icon: "arrow-up-right"
  }, "Watch the talk"))))));
}
Object.assign(window, {
  EventScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/EventScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/EventsScreen.jsx
try { (() => {
// /events: the cream archive list. Filter pills, then hairline-divided rows.
function EventsScreen({
  onNavigate
}) {
  const {
    PageHero,
    EventRow,
    Pill,
    Button
  } = window.TEDxNewyDesignSystem_0329fe;
  const [filter, setFilter] = React.useState("All");
  const kinds = {
    flagship: "Signature",
    salon: "Salon",
    special: "Special"
  };
  const rows = window.TEDX.pastEvents.filter(e => filter === "All" || kinds[e.kind] === filter);
  return /*#__PURE__*/React.createElement(Chrome, {
    onNavigate: onNavigate
  }, /*#__PURE__*/React.createElement(PageHero, {
    kicker: "The archive",
    title: "Every event we have run, and what came out of it.",
    intro: "Our flagship main stage each October, Salon nights across the year, and the one-off experiments in between. Talks are published to YouTube once they are edited.",
    meta: /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8
      }
    }, ["All", "Signature", "Salon", "Special"].map(k => /*#__PURE__*/React.createElement("button", {
      key: k,
      type: "button",
      onClick: () => setFilter(k),
      style: {
        border: 0,
        padding: 0,
        background: "none"
      }
    }, /*#__PURE__*/React.createElement(Pill, {
      tone: filter === k ? "red" : "cream"
    }, k))))
  }), /*#__PURE__*/React.createElement(Section, {
    padding: "0 40px 112px"
  }, /*#__PURE__*/React.createElement("div", null, rows.map((e, i) => /*#__PURE__*/React.createElement("div", {
    key: e.title,
    style: {
      borderTop: i ? "1px solid var(--line-hairline)" : "1px solid var(--line-warm)"
    }
  }, /*#__PURE__*/React.createElement(EventRow, {
    href: "#",
    image: e.image,
    label: kinds[e.kind],
    labelAccent: e.kind === "flagship" ? "red" : "neutral",
    title: e.title,
    meta: `${e.date} · ${e.venue}`,
    description: DESCRIPTIONS[e.title],
    linkLabel: "Read more"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 56,
      display: "flex",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    icon: "arrow-right",
    onClick: () => onNavigate("signal")
  }, "What\u2019s coming up"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    icon: "arrow-up-right"
  }, "Watch every talk"))));
}
const DESCRIPTIONS = {
  "Youth Futures Lab": "Sixty students, ten tables, and one afternoon designing the Newcastle they want to inherit.",
  "Newcastle 2050": "A room full of Novocastrians mapping the city they want in 25 years, then voting on it.",
  "60-Second Talk Night": "Anyone could put their hand up. Sixty seconds each, no slides, no second takes.",
  Reframe: "Eight speakers on the ideas we have been looking at the wrong way round.",
  "Beyond Boundaries": "Our first main stage as TEDxNewy, and a full house at City Hall."
};
Object.assign(window, {
  EventsScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/EventsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/HomeScreen.jsx
try { (() => {
// The homepage: dark spotlight hero, the most recent event as a feature, the
// past-event row, the red stats band, "What is TEDx", Participate, and the
// deep-red subscribe close.
function HomeScreen({
  onNavigate
}) {
  const {
    PastEventCard,
    ParticipateCard,
    Stat,
    CircleArrowLink,
    Button,
    SubscribeForm,
    NodeNetwork
  } = window.TEDxNewyDesignSystem_0329fe;
  const [spot, setSpot] = React.useState({
    x: 0,
    y: 0
  });
  const d = window.TEDX;
  const [featured, ...older] = d.pastEvents;
  return /*#__PURE__*/React.createElement(Chrome, {
    darkHero: true,
    onNavigate: onNavigate
  }, /*#__PURE__*/React.createElement("section", {
    onMouseMove: e => {
      const r = e.currentTarget.getBoundingClientRect();
      setSpot({
        x: ((e.clientX - r.left) / r.width - 0.5) * 30,
        y: ((e.clientY - r.top) / r.height - 0.5) * 30
      });
    },
    onMouseLeave: () => setSpot({
      x: 0,
      y: 0
    }),
    className: "grain grain-dark",
    style: {
      position: "relative",
      display: "flex",
      minHeight: "100vh",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      background: "var(--red-deep)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      position: "absolute",
      left: "50%",
      top: "50%",
      width: "min(115vw,1700px)",
      height: "min(75vh,1700px)",
      transform: `translate(calc(-50% + ${spot.x}%), calc(-50% + ${spot.y}%))`,
      transition: "transform 1.2s var(--ease-out-quint)",
      background: "radial-gradient(circle closest-side at 50% 50%, #ff3626 0%, #e11905 18%, #b91404 38%, rgba(138,13,5,0.6) 62%, rgba(42,6,4,0) 100%)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      zIndex: 10,
      width: "100%",
      maxWidth: "var(--container-wide)",
      padding: "160px 40px",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("h1", {
    className: "rise rise-d1",
    style: {
      margin: "0 auto",
      fontSize: "clamp(3.5rem,10vw,9rem)",
      lineHeight: 0.96,
      fontWeight: 400,
      letterSpacing: "-0.035em",
      color: "#fff"
    }
  }, "Ideas that refuse to sit still."), /*#__PURE__*/React.createElement("p", {
    className: "rise rise-d2",
    style: {
      margin: "48px auto 0",
      maxWidth: "48ch",
      fontSize: "1.3rem",
      lineHeight: 1.55,
      color: "rgba(255,255,255,0.9)"
    }
  }, "TEDxNewy champions all that is remarkable, challenging and thought-provoking, from Novocastrian stages to a global audience."), /*#__PURE__*/React.createElement("div", {
    className: "rise rise-d3",
    style: {
      marginTop: 48,
      display: "flex",
      justifyContent: "center",
      gap: 12,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "white",
    icon: "arrow-right",
    onClick: () => onNavigate("signal")
  }, "Get tickets to Signal"), /*#__PURE__*/React.createElement(Button, {
    variant: "outline-light",
    onClick: () => onNavigate("events")
  }, "Watch past talks"))), /*#__PURE__*/React.createElement("div", {
    className: "rise rise-d5",
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      borderTop: "1px solid rgba(255,255,255,0.15)",
      background: "rgba(0,0,0,0.15)",
      backdropFilter: "blur(4px)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      margin: "0 auto",
      maxWidth: "var(--container-wide)",
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)"
    }
  }, ["Student Speaker Competition", "60-Second Talk Night", "Youth Futures Lab"].map((l, i) => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: "#",
    onClick: e => {
      e.preventDefault();
      onNavigate("events");
    },
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      padding: "20px 32px",
      fontSize: 11.5,
      fontWeight: 500,
      textTransform: "uppercase",
      letterSpacing: "0.14em",
      color: "rgba(255,255,255,0.8)",
      textDecoration: "none",
      borderLeft: i ? "1px solid rgba(255,255,255,0.1)" : "none"
    }
  }, l))))), /*#__PURE__*/React.createElement(Section, {
    background: "var(--red-section)",
    color: "#fff"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.05fr 1fr",
      gap: 64,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: "relative",
      display: "flex",
      width: 8,
      height: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      inset: 0,
      borderRadius: "50%",
      background: "var(--red-bright)",
      opacity: 0.7,
      animation: "ping-soft 2s cubic-bezier(0,0,0.2,1) infinite"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: "#ff6e62"
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "var(--tracking-kicker-wide)",
      color: "var(--red-blush)"
    }
  }, "Just wrapped \xB7 ", featured.date)), /*#__PURE__*/React.createElement(SectionTitle, {
    tone: "light"
  }, featured.title), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 28,
      maxWidth: "60ch",
      fontSize: 16.5,
      lineHeight: 1.65,
      color: "rgba(255,255,255,0.8)"
    }
  }, "Sixty students, ten tables, one afternoon spent building the Newcastle they want to inherit. They pitched it back to a panel before the room emptied."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      fontSize: 13.5,
      color: "rgba(255,255,255,0.55)"
    }
  }, featured.venue), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 40
    }
  }, /*#__PURE__*/React.createElement(CircleArrowLink, {
    href: "#",
    onClick: e => {
      e.preventDefault();
      onNavigate("events");
    }
  }, "See how it went"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      aspectRatio: "16/9",
      overflow: "hidden",
      borderRadius: "var(--radius-lg)",
      border: "1px solid rgba(255,255,255,0.1)",
      boxShadow: "var(--shadow-panel-dark)"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: featured.image,
    alt: featured.title,
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 16
    }
  }, ["../../assets/imagery/yfl-student-speaker.webp", "../../assets/imagery/salon2050-group-discussion.webp", "../../assets/imagery/salon2050-activity-postits.webp"].map(s => /*#__PURE__*/React.createElement("div", {
    key: s,
    style: {
      position: "relative",
      aspectRatio: "4/3",
      overflow: "hidden",
      borderRadius: "var(--radius-md)",
      border: "1px solid rgba(255,255,255,0.1)"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: s,
    alt: "",
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    }
  }))))))), /*#__PURE__*/React.createElement("section", {
    className: "grain grain-dark",
    style: {
      position: "relative",
      overflow: "hidden",
      background: "var(--red-section)",
      color: "#fff"
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%,-50%)",
      width: "min(96vw,1120px)",
      height: "min(64vw,640px)",
      background: "radial-gradient(ellipse at center, rgba(255,54,38,0.5) 0%, rgba(224,34,20,0.28) 24%, rgba(138,13,5,0.14) 50%, rgba(42,6,4,0) 74%)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      margin: "0 auto",
      maxWidth: "var(--container)",
      padding: "128px 40px"
    }
  }, /*#__PURE__*/React.createElement(SectionTitle, {
    tone: "light"
  }, "Our other recent events."), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 24,
      maxWidth: "62ch",
      fontSize: 16.5,
      lineHeight: 1.65,
      color: "rgba(255,255,255,0.8)"
    }
  }, "Our flagship main stage each October, Salon nights across the year, and the one-off experiments in between. Here\u2019s what we\u2019ve built together so far."), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: "none",
      margin: "64px 0 0",
      padding: 0,
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: "48px 28px"
    }
  }, older.slice(0, 3).map(e => /*#__PURE__*/React.createElement("li", {
    key: e.title
  }, /*#__PURE__*/React.createElement(PastEventCard, {
    href: "#",
    image: e.image,
    date: e.date,
    title: e.title,
    subtitle: e.venue,
    imageGradient: `var(--grad-${e.kind})`
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 64,
      display: "flex",
      gap: 16,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "white",
    icon: "arrow-right",
    onClick: () => onNavigate("events")
  }, "View Salons"), /*#__PURE__*/React.createElement(Button, {
    variant: "outline-light",
    icon: "arrow-right",
    onClick: () => onNavigate("events")
  }, "View Signature events")))), /*#__PURE__*/React.createElement(Section, {
    background: "var(--red)",
    color: "#fff",
    padding: "96px 40px"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 40
    }
  }, /*#__PURE__*/React.createElement(Stat, {
    value: "5",
    label: "Events",
    sub: "Since 2024"
  }), /*#__PURE__*/React.createElement(Stat, {
    value: "12",
    label: /*#__PURE__*/React.createElement(React.Fragment, null, "Published", /*#__PURE__*/React.createElement("br", null), "talks")
  }), /*#__PURE__*/React.createElement(Stat, {
    value: "100",
    suffix: "%",
    label: "Volunteer-run",
    sub: "Not-for-profit"
  }), /*#__PURE__*/React.createElement(Stat, {
    value: "2M",
    suffix: "+",
    label: "Cumulative talk views",
    sub: "Online"
  }))), /*#__PURE__*/React.createElement("section", {
    style: {
      position: "relative",
      background: "var(--red-section)",
      color: "#fff"
    }
  }, /*#__PURE__*/React.createElement(NodeNetwork, {
    variant: "light",
    opacity: 0.18
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      margin: "0 auto",
      maxWidth: "var(--container)",
      padding: "96px 40px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "4fr 8fr",
      gap: 64
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "var(--tracking-kicker-wide)",
      color: "var(--red-blush)"
    }
  }, "About TEDx"), /*#__PURE__*/React.createElement("h2", {
    style: {
      marginTop: 24,
      maxWidth: "16ch",
      fontSize: "var(--fs-h3)",
      lineHeight: 1.05,
      fontWeight: 500,
      letterSpacing: "var(--tracking-display)",
      color: "#fff",
      fontVariationSettings: '"opsz" 144'
    }
  }, "What is a TEDx event?")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 17.5,
      lineHeight: 1.7,
      color: "rgba(255,255,255,0.85)"
    }
  }, "In the spirit of ", /*#__PURE__*/React.createElement("strong", null, "ideas worth spreading"), ", TEDx is a programme of local, self-organised events that bring people together to share a TED-like experience. At a TEDx event, TED Talks video and live speakers combine to spark deep discussion and connection. These local, self-organised events are branded TEDx, where ", /*#__PURE__*/React.createElement("em", null, "x = independently organised TED event"), "."), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 20,
      fontSize: 17.5,
      lineHeight: 1.7,
      color: "rgba(255,255,255,0.85)"
    }
  }, "The TED Conference provides general guidance for the TEDx programme, but individual TEDx events, like ours, are self-organised."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 28
    }
  }, /*#__PURE__*/React.createElement(CircleArrowLink, {
    href: "#",
    size: "sm"
  }, "Learn more about TEDx")))))), /*#__PURE__*/React.createElement(Section, {
    background: "var(--red-section)",
    color: "#fff"
  }, /*#__PURE__*/React.createElement(SectionTitle, {
    tone: "light"
  }, "Participate"), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 24,
      fontSize: 16.5,
      lineHeight: 1.65,
      color: "rgba(255,255,255,0.8)"
    }
  }, "TEDxNewy is built by Novocastrians, for Novocastrians. Pick a way in. We\u2019d love to hear from you."), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: "none",
      margin: "64px 0 0",
      padding: 0,
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement(ParticipateCard, {
    href: "#",
    title: "Volunteer with us",
    body: "Six crews, year-round roles. No experience needed, just reliability and curiosity.",
    image: "../../assets/imagery/stage-dialogue.jpg",
    gradient: "var(--grad-special)"
  })), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement(ParticipateCard, {
    href: "#",
    title: "Partner with us",
    body: "Back the speakers, the stage and the next generation of Novocastrian storytellers.",
    image: "../../assets/imagery/participate-partners.webp",
    gradient: "var(--grad-brand)"
  })), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement(ParticipateCard, {
    href: "#",
    title: "Nominate a speaker",
    body: "Know someone with an idea worth spreading? Tell us before we hear it elsewhere.",
    image: "../../assets/imagery/stage-welcome.jpg",
    gradient: "var(--grad-flagship)"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 48
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "cream",
    icon: "arrow-right",
    onClick: () => onNavigate("participate")
  }, "All the ways in"))), /*#__PURE__*/React.createElement(Section, {
    background: "var(--red-deep)",
    color: "#fff",
    narrow: true,
    padding: "128px 24px"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "var(--tracking-kicker-wide)",
      color: "var(--red-blush)"
    }
  }, "TEDxNewy"), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 24,
      fontSize: "clamp(1.6rem,2.8vw,2.25rem)",
      lineHeight: 1.2,
      fontWeight: 400,
      letterSpacing: "var(--tracking-title)",
      color: "#fff"
    }
  }, "An independently licensed TED event in Newcastle, Australia, on Awabakal and Worimi Country. Join our community below:"), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 20,
      fontSize: 16.5,
      lineHeight: 1.65,
      color: "rgba(255,255,255,0.8)"
    }
  }, "Across the year we put events together in the aim of sharing ideas and thinking. We want you to be part of that."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 40
    }
  }, /*#__PURE__*/React.createElement(SubscribeForm, null))));
}
Object.assign(window, {
  HomeScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/HomeScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/ParticipateScreen.jsx
try { (() => {
// /speak: the cream nomination page. Three ways in, the form itself, and the crew.
function ParticipateScreen({
  onNavigate
}) {
  const {
    PageHero,
    ParticipateCard,
    FormField,
    Button,
    SpeakerCard,
    Card,
    SectionKicker
  } = window.TEDxNewyDesignSystem_0329fe;
  const [sent, setSent] = React.useState(false);
  return /*#__PURE__*/React.createElement(Chrome, {
    onNavigate: onNavigate
  }, /*#__PURE__*/React.createElement(PageHero, {
    kicker: "Participate",
    title: "Know someone who should be heard?",
    intro: "Our best talks don\u2019t come from LinkedIn bios. They come from someone in the room saying you need to hear this person.",
    body: "Tell us who we are missing. We read every nomination, and we come back to everyone."
  }), /*#__PURE__*/React.createElement(Section, {
    padding: "0 40px 112px"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(ParticipateCard, {
    href: "#",
    title: "Nominate a speaker",
    body: "One idea, one person, one paragraph. That is all we need to start.",
    image: "../../assets/imagery/stage-welcome.jpg",
    gradient: "var(--grad-flagship)",
    ratio: "4/3",
    cta: "You are here"
  }), /*#__PURE__*/React.createElement(ParticipateCard, {
    href: "#",
    title: "Volunteer with us",
    body: "Six crews, year-round roles. No experience needed, just reliability and curiosity.",
    image: "../../assets/imagery/participate-volunteers.webp",
    gradient: "var(--grad-special)",
    ratio: "4/3"
  }), /*#__PURE__*/React.createElement(ParticipateCard, {
    href: "#",
    title: "Partner with us",
    body: "It takes a village. Yours, ideally.",
    image: "../../assets/imagery/participate-partners.webp",
    gradient: "var(--grad-brand)",
    ratio: "4/3"
  }))), /*#__PURE__*/React.createElement(Section, {
    background: "var(--cream-light)",
    narrow: true,
    padding: "112px 24px"
  }, /*#__PURE__*/React.createElement(SectionKicker, {
    label: "The nomination"
  }), /*#__PURE__*/React.createElement("h2", {
    style: {
      marginTop: 20,
      fontSize: "var(--fs-h3)",
      lineHeight: 1.05,
      fontWeight: 500,
      letterSpacing: "var(--tracking-display)",
      fontVariationSettings: '"opsz" 144'
    }
  }, "Tell us about them"), sent ? /*#__PURE__*/React.createElement(Card, {
    padding: 32,
    hoverable: false,
    style: {
      marginTop: 40
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 19,
      fontWeight: 500
    }
  }, "Thanks. That is with the curation crew."), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 8,
      fontSize: 14.5,
      lineHeight: 1.6,
      color: "var(--ink-3)"
    }
  }, "We read every nomination and we will come back to you either way, usually within a fortnight."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: () => setSent(false)
  }, "Nominate someone else"))) : /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      setSent(true);
    },
    style: {
      marginTop: 40,
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(FormField, {
    label: "Their name",
    name: "speaker",
    required: true,
    placeholder: "First and last"
  }), /*#__PURE__*/React.createElement(FormField, {
    label: "Their city or suburb",
    name: "where",
    placeholder: "Newcastle, Lambton, Maitland\u2026"
  }), /*#__PURE__*/React.createElement(FormField, {
    label: "What is the idea?",
    name: "idea",
    required: true,
    textarea: true,
    rows: 4,
    placeholder: "One idea, in a sentence or two. Not a CV.",
    style: {
      gridColumn: "1 / -1"
    }
  }), /*#__PURE__*/React.createElement(FormField, {
    label: "How do you know them?",
    name: "relationship",
    select: true,
    options: ["I know them", "I saw them speak", "I read their work", "Other"]
  }), /*#__PURE__*/React.createElement(FormField, {
    label: "Your email",
    name: "email",
    required: true,
    type: "email",
    hint: "So we can reply",
    placeholder: "you@example.com"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: "1 / -1",
      display: "flex",
      alignItems: "center",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "red",
    type: "submit",
    icon: "arrow-right"
  }, "Send the nomination"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--ink-3)"
    }
  }, "No newsletter sign-up attached. Promise.")))), /*#__PURE__*/React.createElement(Section, {
    padding: "112px 40px"
  }, /*#__PURE__*/React.createElement(SectionKicker, {
    label: "Who reads it"
  }), /*#__PURE__*/React.createElement("h2", {
    style: {
      marginTop: 20,
      maxWidth: "22ch",
      fontSize: "var(--fs-h3)",
      lineHeight: 1.05,
      fontWeight: 500,
      letterSpacing: "var(--tracking-display)",
      fontVariationSettings: '"opsz" 144'
    }
  }, "A volunteer crew, from here"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 48,
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 24
    }
  }, window.TEDX.team.map(t => /*#__PURE__*/React.createElement(SpeakerCard, {
    key: t.name,
    name: t.name,
    title: t.title,
    image: t.image
  })))));
}
Object.assign(window, {
  ParticipateScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/ParticipateScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/data.js
try { (() => {
// Content lifted from the live site (lib/nav-fallback.ts, app/page.tsx, llms.txt)
// so the recreation reads in the real TEDxNewy voice.
window.TEDX = {
  nav: [{
    key: "upcoming",
    label: "Upcoming",
    style: "list",
    kicker: "On the horizon",
    heading: "What's coming up",
    blurb: "The events we're building toward across the season.",
    items: [{
      label: "Signal",
      href: "#signal",
      description: "24 October · Conservatorium of Music"
    }, {
      label: "Student Speaker Competition",
      href: "#",
      description: "Submissions close 6 September"
    }]
  }, {
    key: "past",
    label: "Past Events",
    style: "cards",
    items: [{
      label: "Signature",
      href: "#events",
      description: "Our flagship main stage, year on year",
      imageUrl: "../../assets/imagery/nav-signature.webp",
      gradient: "var(--grad-brand)",
      ctaLabel: "Explore Signature"
    }, {
      label: "Salons",
      href: "#events",
      description: "Our intimate idea nights",
      imageUrl: "../../assets/imagery/salon2050-community-event.webp",
      gradient: "var(--grad-special)",
      ctaLabel: "Explore salons"
    }, {
      label: "All Talks",
      href: "#events",
      description: "Watch every TEDxNewy talk",
      imageUrl: "../../assets/imagery/nav-all-talks.webp",
      gradient: "var(--grad-flagship)",
      ctaLabel: "Watch talks"
    }]
  }, {
    key: "participate",
    label: "Participate",
    style: "cards",
    items: [{
      label: "Volunteer with us",
      href: "#participate",
      description: "Be part of the season",
      imageUrl: "../../assets/imagery/stage-dialogue.jpg",
      gradient: "var(--grad-special)",
      ctaLabel: "Learn more"
    }, {
      label: "Partner with us",
      href: "#participate",
      description: "Back the season",
      imageUrl: "../../assets/imagery/participate-partners.webp",
      gradient: "var(--grad-brand)",
      ctaLabel: "Start a conversation"
    }, {
      label: "Nominate a speaker",
      href: "#participate",
      description: "Tell us who we're missing",
      imageUrl: "../../assets/imagery/stage-benjie.jpg",
      gradient: "var(--grad-flagship)",
      ctaLabel: "Learn more"
    }]
  }, {
    key: "about",
    label: "About",
    style: "list",
    kicker: "About TEDxNewy",
    heading: "Who we are",
    blurb: "What we stand for and the people behind the season.",
    items: [{
      label: "Mission",
      href: "#",
      description: "What TEDxNewy stands for"
    }, {
      label: "Sponsors",
      href: "#",
      description: "The partners behind the season"
    }, {
      label: "Team",
      href: "#",
      description: "The volunteer crew"
    }]
  }],
  pastEvents: [{
    title: "Youth Futures Lab",
    date: "7 August 2026",
    venue: "The Base, Newcastle",
    image: "../../assets/imagery/yfl-card.webp",
    kind: "special"
  }, {
    title: "Newcastle 2050",
    date: "30 April 2026",
    venue: "Q Building, Honeysuckle",
    image: "../../assets/imagery/salon2050-community-event.webp",
    kind: "salon"
  }, {
    title: "60-Second Talk Night",
    date: "27 February 2026",
    venue: "The Base, Newcastle",
    image: "../../assets/imagery/talk-night.webp",
    kind: "special"
  }, {
    title: "Reframe",
    date: "18 October 2025",
    venue: "Newcastle City Hall",
    image: "../../assets/imagery/past-2025.jpg",
    kind: "flagship"
  }, {
    title: "Beyond Boundaries",
    date: "19 October 2024",
    venue: "Newcastle City Hall",
    image: "../../assets/imagery/past-2024.jpg",
    kind: "flagship"
  }],
  speakers: [{
    name: "Harry Garside",
    title: "Olympic boxer and author",
    image: "../../assets/speakers/harry-garside.webp"
  }, {
    name: "Mariam Mohammed",
    title: "Financial literacy educator",
    image: "../../assets/speakers/mariam-mohammed.webp"
  }, {
    name: "Declan Edwards",
    title: "Wellbeing scientist",
    image: "../../assets/speakers/declan-edwards.webp"
  }, {
    name: "Kate Cashman",
    title: "Leadership coach",
    image: "../../assets/speakers/kate-cashman.webp"
  }, {
    name: "Dan Ballard",
    title: "Energy transition strategist",
    image: "../../assets/speakers/dan-ballard.webp"
  }, {
    name: "Charanya Ramakrishnan",
    title: "Researcher, University of Newcastle",
    image: "../../assets/speakers/charanya-ramakrishnan.webp"
  }, {
    name: "Tim Stewart",
    title: "Behavioural designer",
    image: "../../assets/speakers/tim-stewart.webp"
  }, {
    name: "Trudi Boatwright",
    title: "Artist and educator",
    image: "../../assets/speakers/trudi-boatwright.webp"
  }],
  team: [{
    name: "Theo Kapodistrias",
    title: "Licensee and host",
    image: "../../assets/team/theo-kapodistrias.webp"
  }, {
    name: "Hannah Berry",
    title: "Speaker curation",
    image: "../../assets/team/hannah-berry.webp"
  }, {
    name: "Craig Smith",
    title: "Partnerships",
    image: "../../assets/team/craig-smith.webp"
  }, {
    name: "Melanie Renfrew",
    title: "Production",
    image: "../../assets/team/melanie-renfrew.webp"
  }],
  faqs: [{
    q: "Where is Signal held?",
    a: "The Conservatorium of Music, in the middle of town. A ten minute walk from Newcastle Interchange."
  }, {
    q: "Can I come on my own?",
    a: "Most people do. There is a long break built in for exactly that reason."
  }, {
    q: "What is included in a ticket?",
    a: "Every talk, the breaks, and catering through the day."
  }, {
    q: "Do you offer concession tickets?",
    a: "Yes. Get in touch and we will sort something out. Nobody should miss out on cost."
  }],
  footerColumns: [{
    title: "Explore",
    items: [{
      label: "Events",
      href: "#events"
    }, {
      label: "Signature",
      href: "#events"
    }, {
      label: "Salons",
      href: "#events"
    }, {
      label: "Talks",
      href: "#events"
    }]
  }, {
    title: "Participate",
    items: [{
      label: "Speakers",
      href: "#participate"
    }, {
      label: "Partners",
      href: "#participate"
    }, {
      label: "Volunteers",
      href: "#participate"
    }]
  }, {
    title: "About",
    items: [{
      label: "Mission",
      href: "#"
    }, {
      label: "The Team",
      href: "#"
    }, {
      label: "Sponsors",
      href: "#"
    }, {
      label: "Press",
      href: "#"
    }, {
      label: "Contact",
      href: "#"
    }]
  }],
  socials: [{
    label: "TEDxNewy on Instagram",
    href: "#",
    icon: "../../assets/icons/social/instagram.png"
  }, {
    label: "TEDxNewy on TikTok",
    href: "#",
    icon: "../../assets/icons/social/tiktok.png"
  }, {
    label: "TEDxNewy on LinkedIn",
    href: "#",
    icon: "../../assets/icons/social/linkedin.png"
  }],
  acknowledgment: "TEDxNewy is staged on the land of the Awabakal and Worimi people. We pay our respects to Elders past, present and emerging, and acknowledge their continuing connection to land, waters and culture. Sovereignty was never ceded.",
  access: "TEDxNewy is for everyone, regardless of ability, age, background, culture, gender or identity. If something would help you take part, whether an access requirement, a dietary need or anything else, please get in touch."
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/data.js", error: String((e && e.message) || e) }); }

__ds_ns.Card = __ds_scope.Card;

__ds_ns.EventRow = __ds_scope.EventRow;

__ds_ns.ParticipateCard = __ds_scope.ParticipateCard;

__ds_ns.PastEventCard = __ds_scope.PastEventCard;

__ds_ns.PhotoPending = __ds_scope.PhotoPending;

__ds_ns.SpeakerCard = __ds_scope.SpeakerCard;

__ds_ns.Stat = __ds_scope.Stat;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.CircleArrowLink = __ds_scope.CircleArrowLink;

__ds_ns.EditionStamp = __ds_scope.EditionStamp;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.Pill = __ds_scope.Pill;

__ds_ns.RedCircle = __ds_scope.RedCircle;

__ds_ns.SectionKicker = __ds_scope.SectionKicker;

__ds_ns.CountdownClock = __ds_scope.CountdownClock;

__ds_ns.FaqAccordion = __ds_scope.FaqAccordion;

__ds_ns.FormField = __ds_scope.FormField;

__ds_ns.SubscribeForm = __ds_scope.SubscribeForm;

__ds_ns.NodeNetwork = __ds_scope.NodeNetwork;

__ds_ns.PageHero = __ds_scope.PageHero;

__ds_ns.SiteFooter = __ds_scope.SiteFooter;

__ds_ns.SiteHeader = __ds_scope.SiteHeader;

__ds_ns.SpeakerCarousel = __ds_scope.SpeakerCarousel;

})();

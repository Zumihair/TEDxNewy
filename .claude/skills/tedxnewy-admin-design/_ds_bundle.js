/* @ds-bundle: {"format":4,"namespace":"TEDxNewyAdminDesignSystem_bb30ae","components":[{"name":"DashboardTile","sourcePath":"components/chrome/DashboardTile.jsx"},{"name":"PulseTile","sourcePath":"components/chrome/DashboardTile.jsx"},{"name":"PageHeader","sourcePath":"components/chrome/PageHeader.jsx"},{"name":"SectionLabel","sourcePath":"components/chrome/PageHeader.jsx"},{"name":"SidebarNav","sourcePath":"components/chrome/SidebarNav.jsx"},{"name":"StageHeading","sourcePath":"components/chrome/StageHeading.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"IconButton","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Flash","sourcePath":"components/core/Flash.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"NotSetUp","sourcePath":"components/core/NotSetUp.jsx"},{"name":"EmptyState","sourcePath":"components/core/NotSetUp.jsx"},{"name":"SkeletonBar","sourcePath":"components/core/PageSkeleton.jsx"},{"name":"PageSkeleton","sourcePath":"components/core/PageSkeleton.jsx"},{"name":"StatChip","sourcePath":"components/core/StatChip.jsx"},{"name":"StatChipGrid","sourcePath":"components/core/StatChip.jsx"},{"name":"TabBar","sourcePath":"components/core/TabBar.jsx"},{"name":"DataList","sourcePath":"components/data/DataList.jsx"},{"name":"DataRow","sourcePath":"components/data/DataList.jsx"},{"name":"RowMeta","sourcePath":"components/data/DataList.jsx"},{"name":"ConfirmDialog","sourcePath":"components/feedback/ConfirmDialog.jsx"},{"name":"PromptDialog","sourcePath":"components/feedback/ConfirmDialog.jsx"},{"name":"Modal","sourcePath":"components/feedback/Modal.jsx"},{"name":"DateTimePicker","sourcePath":"components/forms/DateTimePicker.jsx"},{"name":"Field","sourcePath":"components/forms/Field.jsx"},{"name":"Input","sourcePath":"components/forms/Field.jsx"},{"name":"Textarea","sourcePath":"components/forms/Field.jsx"},{"name":"Select","sourcePath":"components/forms/Field.jsx"},{"name":"AdvancedToggle","sourcePath":"components/forms/Field.jsx"}],"sourceHashes":{"components/chrome/DashboardTile.jsx":"9b5636dc49de","components/chrome/PageHeader.jsx":"23bf6cfb0c51","components/chrome/SidebarNav.jsx":"10c3e2434315","components/chrome/StageHeading.jsx":"4f5a4ea391af","components/core/Badge.jsx":"7f8503943a57","components/core/Button.jsx":"27046f044f62","components/core/Card.jsx":"a3fa21af9f91","components/core/Flash.jsx":"9feb8e2c378e","components/core/Icon.jsx":"2c60cc8640d1","components/core/NotSetUp.jsx":"9569ab1a57f1","components/core/PageSkeleton.jsx":"57c4d494517b","components/core/StatChip.jsx":"1a96a15f46cb","components/core/TabBar.jsx":"1fb03eb32703","components/data/DataList.jsx":"2154b28ed3cd","components/feedback/ConfirmDialog.jsx":"48962dd3d1d0","components/feedback/Modal.jsx":"60ac9eb54a6d","components/forms/DateTimePicker.jsx":"0e5f5ea4a37a","components/forms/Field.jsx":"e6e70db1defe","ui_kits/admin/CalendarBoard.jsx":"55ecbc7de74f","ui_kits/admin/Dashboard.jsx":"30b6604d281e","ui_kits/admin/EventsList.jsx":"d880c6942b1d","ui_kits/admin/SocialsList.jsx":"4bd69be28fac","ui_kits/admin/nav.js":"3969a9624fdf"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.TEDxNewyAdminDesignSystem_bb30ae = window.TEDxNewyAdminDesignSystem_bb30ae || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/chrome/DashboardTile.jsx
try { (() => {
const CHIP = {
  yellow: ["var(--sec-yellow-chip-bg)", "var(--sec-yellow-chip-fg)", "var(--sec-yellow-border)", "var(--sec-yellow-border-hover)"],
  coast: ["var(--sec-coast-chip-bg)", "var(--sec-coast-chip-fg)", "var(--sec-coast-border)", "var(--sec-coast-border-hover)"],
  red: ["var(--sec-red-chip-bg)", "var(--sec-red-chip-fg)", "var(--sec-red-border)", "var(--sec-red-border-hover)"],
  green: ["var(--sec-green-chip-bg)", "var(--sec-green-chip-fg)", "var(--sec-green-border)", "var(--sec-green-border-hover)"],
  grey: ["var(--sec-grey-chip-bg)", "var(--sec-grey-chip-fg)", "var(--sec-grey-border)", "var(--sec-grey-border-hover)"]
};

/**
 * A dashboard tile: 84px, 2px border in its family's hue, a coloured icon
 * chip, and either a live count or an open arrow (for a tool with no count).
 * `feature` renders the one primary action as a full-red tile.
 */
function DashboardTile({
  section = "grey",
  icon,
  title,
  count,
  tool,
  feature,
  href = "#",
  onClick
}) {
  const [hover, setHover] = React.useState(false);
  const [bg, fg, border, borderHover] = CHIP[section] || CHIP.grey;
  const common = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    height: "var(--tile-h)",
    boxSizing: "border-box",
    borderRadius: "var(--radius-md)",
    padding: "12px",
    textDecoration: "none",
    boxShadow: hover ? "var(--shadow-md)" : "var(--shadow-sm)",
    transform: hover ? "translateY(-2px)" : "none",
    transition: "all var(--dur-slow) var(--ease-out-quint)"
  };
  if (feature) {
    return /*#__PURE__*/React.createElement("a", {
      href: href,
      onClick: onClick,
      onMouseEnter: () => setHover(true),
      onMouseLeave: () => setHover(false),
      style: {
        ...common,
        background: "linear-gradient(to bottom right, var(--red), var(--red-mid))",
        color: "#fff"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        height: "32px",
        width: "32px",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "var(--radius-pill)",
        background: "rgba(255,255,255,0.15)"
      }
    }, icon), /*#__PURE__*/React.createElement(Arrow, {
      color: "rgba(255,255,255,0.85)"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: "14px",
        fontWeight: "var(--weight-semibold)",
        lineHeight: 1.2,
        letterSpacing: "var(--tracking-snug)"
      }
    }, title));
  }
  return /*#__PURE__*/React.createElement("a", {
    href: href,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      ...common,
      border: `2px solid ${hover ? borderHover : border}`,
      background: "var(--surface-card)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      display: "inline-flex",
      height: "32px",
      width: "32px",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "var(--radius-pill)",
      background: bg,
      color: fg
    }
  }, icon), tool ? /*#__PURE__*/React.createElement(Arrow, {
    color: hover ? "var(--ink)" : "var(--ink-3)"
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "clamp(1.3rem, 2vw, 1.6rem)",
      fontWeight: "var(--weight-medium)",
      lineHeight: 1,
      letterSpacing: "var(--tracking-tight)",
      color: "var(--ink)",
      fontVariationSettings: "var(--display-variation)"
    }
  }, count)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "13.5px",
      fontWeight: "var(--weight-medium)",
      lineHeight: 1.2,
      letterSpacing: "var(--tracking-snug)",
      color: "var(--ink)"
    }
  }, title));
}
function Arrow({
  color
}) {
  return /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: "2.25",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true
  }, /*#__PURE__*/React.createElement("path", {
    d: "M7 7h10v10"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M7 17 17 7"
  }));
}

/**
 * A pulse-band stat: the numbers that matter today. Big display number,
 * optional progress bar, red on hover. Sits four across above the tiles.
 */
function PulseTile({
  label,
  value,
  sub,
  pct,
  accent,
  href = "#"
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("a", {
    href: href,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      position: "relative",
      overflow: "hidden",
      borderRadius: "var(--radius-md)",
      border: "1px solid " + (hover ? "rgba(224,34,20,0.45)" : "var(--line-strong)"),
      background: "var(--surface-card)",
      padding: "16px",
      textDecoration: "none",
      boxShadow: hover ? "var(--shadow-accent-hover)" : "var(--shadow-hairline)",
      transform: hover ? "translateY(-2px)" : "none",
      transition: "all var(--dur-slow) var(--ease-out-quint)",
      display: "block"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-badge)",
      fontWeight: "var(--weight-semibold)",
      textTransform: "uppercase",
      letterSpacing: "0.16em",
      color: hover ? "var(--red-mid)" : "var(--ink-4)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      transition: "color var(--dur-base)"
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "10px",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-stat-xl)",
      fontWeight: "var(--weight-medium)",
      lineHeight: 1,
      letterSpacing: "var(--tracking-display)",
      fontVariantNumeric: "tabular-nums",
      fontVariationSettings: "var(--display-variation)",
      color: accent ? "var(--red)" : "var(--ink)"
    }
  }, value), typeof pct === "number" && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "10px",
      height: "6px",
      overflow: "hidden",
      borderRadius: "var(--radius-pill)",
      background: "rgba(20,18,16,0.08)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      borderRadius: "var(--radius-pill)",
      background: "var(--red)",
      width: `${Math.max(2, pct)}%`
    }
  })), sub && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "8px",
      fontSize: "var(--text-micro)",
      color: "var(--ink-4)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, sub));
}
Object.assign(__ds_scope, { DashboardTile, PulseTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/chrome/DashboardTile.jsx", error: String((e && e.message) || e) }); }

// components/chrome/PageHeader.jsx
try { (() => {
const SECTION_INK = {
  yellow: "var(--sec-yellow-ink)",
  coast: "var(--sec-coast-ink)",
  red: "var(--sec-red-ink)",
  green: "var(--sec-green-ink)",
  grey: "var(--sec-grey-ink)"
};

/**
 * The header at the top of every admin page. It colours itself from its
 * section — accent bar, eyebrow and back-link hover — so a page matches its
 * sidebar item and dashboard tile. In the codebase the section is read from
 * the route; here it is an explicit prop.
 */
function PageHeader({
  section = "grey",
  eyebrow,
  title,
  description,
  backHref,
  actions
}) {
  const ink = SECTION_INK[section] || SECTION_INK.grey;
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("header", {
    style: {
      display: "grid",
      gap: "20px"
    }
  }, backHref && /*#__PURE__*/React.createElement("a", {
    href: backHref,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      justifySelf: "start",
      fontFamily: "var(--font-mono)",
      fontSize: "11px",
      fontWeight: "var(--weight-semibold)",
      textTransform: "uppercase",
      textDecoration: "none",
      color: hover ? ink : "var(--ink-3)",
      transition: "color var(--dur-base)"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true
  }, /*#__PURE__*/React.createElement("path", {
    d: "M19 12H5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m12 19-7-7 7-7"
  })), "Back"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: "20px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, eyebrow && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "8px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      height: "14px",
      width: "4px",
      borderRadius: "var(--radius-pill)",
      background: ink
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-label)",
      fontWeight: "var(--weight-semibold)",
      textTransform: "uppercase",
      letterSpacing: "var(--tracking-label)",
      color: ink
    }
  }, eyebrow)), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: eyebrow ? "12px 0 0" : 0,
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-page-title)",
      fontWeight: "var(--weight-medium)",
      lineHeight: "var(--leading-title)",
      letterSpacing: "var(--tracking-title)",
      color: "var(--ink)",
      textWrap: "balance",
      fontVariationSettings: "var(--display-variation)"
    }
  }, title), description && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "12px 0 0",
      fontSize: "var(--text-body)",
      lineHeight: "var(--leading-body)",
      color: "var(--ink-3)"
    }
  }, description)), actions && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "8px"
    }
  }, actions)));
}

/** Small sub-heading with a section-coloured dot. Groups content inside a page. */
function SectionLabel({
  section = "grey",
  children
}) {
  const ink = SECTION_INK[section] || SECTION_INK.grey;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "8px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      height: "6px",
      width: "6px",
      borderRadius: "var(--radius-pill)",
      background: ink
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-label)",
      fontWeight: "var(--weight-semibold)",
      textTransform: "uppercase",
      letterSpacing: "var(--tracking-label)",
      color: "var(--ink-3)"
    }
  }, children));
}
Object.assign(__ds_scope, { PageHeader, SectionLabel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/chrome/PageHeader.jsx", error: String((e && e.message) || e) }); }

// components/chrome/StageHeading.jsx
try { (() => {
const STAGE_CHIP = {
  early: {
    background: "var(--wash)",
    color: "var(--ink-3)"
  },
  polish: {
    background: "var(--warn-bg)",
    color: "var(--warn-fg)"
  },
  ready: {
    background: "var(--ok-bg)",
    color: "var(--ok-fg)"
  }
};
const STAGE_LABEL = {
  early: "Early draft",
  polish: "Needs polish",
  ready: "Ready to schedule"
};

/**
 * Group heading for a stage-grouped draft list. Stage is the MANUALLY chosen
 * "how finished is this", separate from the derived status Badge — a grouping
 * heading, never a second status pill. Order: ready, polish, early.
 */
function StageHeading({
  stage = "early",
  count,
  label
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "10px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      borderRadius: "var(--radius-pill)",
      padding: "2px 10px",
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-badge)",
      fontWeight: "var(--weight-semibold)",
      textTransform: "uppercase",
      letterSpacing: "0.18em",
      ...STAGE_CHIP[stage]
    }
  }, label ?? STAGE_LABEL[stage]), typeof count === "number" && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-meta)",
      color: "var(--ink-3)",
      fontVariantNumeric: "tabular-nums"
    }
  }, count), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      height: "1px",
      flex: 1,
      background: "var(--line)"
    }
  }));
}
Object.assign(__ds_scope, { StageHeading });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/chrome/StageHeading.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
const TONES = {
  neutral: {
    background: "var(--wash)",
    color: "var(--ink-3)"
  },
  red: {
    background: "var(--error-bg)",
    color: "var(--error-fg)"
  },
  live: {
    background: "var(--ok-bg)",
    color: "var(--ok-fg)"
  },
  soon: {
    background: "var(--wash)",
    color: "var(--ink-3)"
  },
  draft: {
    background: "var(--warn-bg)",
    color: "var(--warn-fg)"
  },
  scheduled: {
    background: "var(--info-bg)",
    color: "var(--info-fg)"
  }
};

/**
 * Tiny uppercase pill. The admin's one status signal: automatically-derived
 * lifecycle status (draft / scheduled / posted), never a hand-picked stage.
 */
function Badge({
  tone = "neutral",
  children
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      borderRadius: "var(--radius-pill)",
      padding: "2px 10px",
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-badge)",
      fontWeight: "var(--weight-semibold)",
      textTransform: "uppercase",
      letterSpacing: "var(--tracking-badge)",
      ...TONES[tone]
    }
  }, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const base = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  border: "none",
  borderRadius: "var(--radius-pill)",
  fontFamily: "var(--font-sans)",
  fontWeight: "var(--weight-medium)",
  transition: "all var(--dur-slow) var(--ease-out-quint)"
};
const VARIANTS = {
  primary: {
    background: "var(--red)",
    color: "#fff",
    padding: "10px 20px",
    fontSize: "var(--text-control)"
  },
  secondary: {
    background: "var(--wash)",
    color: "var(--ink)",
    padding: "10px 20px",
    fontSize: "var(--text-control)"
  },
  danger: {
    background: "var(--danger-bg)",
    color: "var(--error-fg)",
    padding: "6px 12px",
    fontSize: "var(--text-row-meta)",
    gap: "6px"
  },
  ghost: {
    background: "transparent",
    color: "var(--ink)",
    padding: "6px 12px",
    fontSize: "var(--text-meta)",
    gap: "6px"
  },
  dark: {
    background: "var(--ink)",
    color: "#fff",
    padding: "10px 20px",
    fontSize: "var(--text-control)"
  },
  row: {
    background: "var(--wash)",
    color: "var(--ink)",
    padding: "6px 12px",
    fontSize: "var(--text-meta)",
    gap: "6px"
  }
};
const HOVER = {
  primary: {
    background: "var(--red-mid)",
    transform: "translateY(-2px)"
  },
  secondary: {
    background: "var(--wash-hover)"
  },
  danger: {
    background: "var(--danger-bg-hover)"
  },
  ghost: {
    background: "var(--wash)"
  },
  dark: {
    background: "#000"
  },
  row: {
    background: "var(--wash-hover)"
  }
};

/**
 * The admin's pill button. `row` and `ghost` are the compact variants used
 * inside table rows; primary/secondary/dark are the page-level actions.
 * A pending button swaps its icon for a spinner and disables itself.
 */
function Button({
  variant = "secondary",
  children,
  icon,
  type = "button",
  disabled,
  pending,
  fullWidth,
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const off = disabled || pending;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: off,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      ...base,
      ...VARIANTS[variant],
      ...(hover && !off ? HOVER[variant] : null),
      width: fullWidth ? "100%" : undefined,
      opacity: off ? 0.7 : 1,
      cursor: off ? "not-allowed" : "pointer",
      ...style
    }
  }, rest), pending ? /*#__PURE__*/React.createElement(Spinner, null) : icon, children);
}
function Spinner() {
  return /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.25",
    strokeLinecap: "round",
    style: {
      animation: "ds-spin 1s linear infinite"
    },
    "aria-hidden": true
  }, /*#__PURE__*/React.createElement("path", {
    d: "M21 12a9 9 0 1 1-6.219-8.56"
  }), /*#__PURE__*/React.createElement("style", null, "@keyframes ds-spin{to{transform:rotate(360deg)}}"));
}

/**
 * Icon-only round button — the house pattern for common row actions
 * (reorder, delete, download). 32px tap target, hover fills a soft circle;
 * tone="danger" turns that circle red.
 */
function IconButton({
  children,
  ariaLabel,
  title,
  tone = "neutral",
  disabled,
  pending,
  onClick,
  type = "button"
}) {
  const [hover, setHover] = React.useState(false);
  const off = disabled || pending;
  const hoverBg = tone === "danger" ? "rgba(224,34,20,0.10)" : "rgba(20,18,16,0.08)";
  const hoverFg = tone === "danger" ? "var(--error-fg)" : "var(--ink)";
  return /*#__PURE__*/React.createElement("button", {
    type: type,
    "aria-label": ariaLabel,
    title: title || ariaLabel,
    disabled: off,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      height: "32px",
      width: "32px",
      border: "none",
      borderRadius: "var(--radius-pill)",
      background: hover && !off ? hoverBg : "transparent",
      color: hover && !off ? hoverFg : "var(--ink-3)",
      transition: "background-color var(--dur-base), color var(--dur-base)",
      opacity: off ? 0.3 : 1,
      cursor: off ? "not-allowed" : "pointer"
    }
  }, pending ? /*#__PURE__*/React.createElement(Spinner, null) : children);
}
Object.assign(__ds_scope, { Button, IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
/** White card on cream: hairline ink border, 12px radius, warm hairline shadow. */
function Card({
  children,
  padded = false,
  className = "",
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: className,
    style: {
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--line)",
      background: "var(--surface-card)",
      boxShadow: "var(--shadow-sm)",
      padding: padded ? "var(--card-p)" : undefined,
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Flash.jsx
try { (() => {
const TONES = {
  ok: {
    borderColor: "var(--ok-flash-border)",
    background: "var(--ok-flash-bg)",
    color: "var(--ok-flash-fg)"
  },
  info: {
    borderColor: "var(--info-flash-border)",
    background: "var(--info-flash-bg)",
    color: "var(--info-flash-fg)"
  },
  error: {
    borderColor: "var(--error-border)",
    background: "var(--error-bg)",
    color: "var(--error-fg)"
  }
};

/** Inline result banner above the page content. Never a toast — the admin has none. */
function Flash({
  tone = "ok",
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: tone === "error" ? "alert" : "status",
    style: {
      borderRadius: "var(--radius-md)",
      borderWidth: "1px",
      borderStyle: "solid",
      padding: "12px 16px",
      fontSize: "13.5px",
      lineHeight: "var(--leading-body)",
      ...TONES[tone]
    }
  }, children);
}
Object.assign(__ds_scope, { Flash });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Flash.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
/**
 * Thin wrapper over the lucide-react icon set the admin uses everywhere.
 * The design system ships no icon binaries: it reads the lucide UMD build
 * (window.lucide) so card HTML and UI kits can name icons the same way the
 * codebase imports them ("Pencil", "Trash2", "CalendarDays").
 */
function Icon({
  name,
  size = 16,
  strokeWidth = 2,
  color = "currentColor",
  className = "",
  style
}) {
  const lib = typeof window !== "undefined" && window.lucide || null;
  const raw = lib ? lib.icons ? lib.icons[name] : lib[name] : null;
  const nodes = !raw ? null : raw[0] === "svg" ? raw[2] : raw;
  const box = {
    width: size,
    height: size,
    display: "inline-block",
    flexShrink: 0,
    ...style
  };
  if (!nodes) return /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    className: className,
    style: box
  });
  return /*#__PURE__*/React.createElement("svg", {
    "aria-hidden": true,
    className: className,
    style: box,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, nodes.map(([tag, attrs], i) => React.createElement(tag, {
    key: i,
    ...attrs
  })));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/chrome/SidebarNav.jsx
try { (() => {
const ON_DARK = {
  yellow: "var(--sec-yellow-on-dark)",
  coast: "var(--sec-coast-on-dark)",
  red: "var(--sec-red-on-dark)",
  green: "var(--sec-green-on-dark)",
  grey: "var(--sec-grey-on-dark)"
};
const headingStyle = {
  padding: "4px 12px",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-nav-heading)",
  fontWeight: "var(--weight-semibold)",
  textTransform: "uppercase",
  letterSpacing: "var(--tracking-nav)",
  color: "rgba(255,255,255,0.35)",
  background: "none",
  border: "none",
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px"
};

/**
 * The near-black admin sidebar: brand lockup, grouped nav, signed-in footer.
 * The active item's accent (left bar + icon chip fill) is its SECTION's
 * on-dark hue, so the selected page matches its family everywhere else.
 */
function SidebarNav({
  groups,
  active,
  logoSrc,
  email = "will@tedxnewy.com.au",
  onNavigate
}) {
  const [collapsed, setCollapsed] = React.useState({});
  const [hover, setHover] = React.useState(null);
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      width: "var(--sidebar-w)",
      flexShrink: 0,
      background: "var(--sidebar-bg)",
      padding: "24px 16px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      gap: "24px",
      minHeight: "100%",
      boxSizing: "border-box"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "20px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "6px",
      justifyItems: "start"
    }
  }, logoSrc ? /*#__PURE__*/React.createElement("img", {
    src: logoSrc,
    alt: "TEDxNewy",
    style: {
      height: "32px",
      width: "auto"
    }
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#fff",
      fontSize: "18px",
      fontWeight: 600,
      letterSpacing: "-0.02em"
    }
  }, "TEDxNewy"), /*#__PURE__*/React.createElement("span", {
    style: {
      paddingLeft: "12px",
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-eyebrow-sidebar)",
      fontWeight: "var(--weight-semibold)",
      textTransform: "uppercase",
      letterSpacing: "var(--tracking-nav)",
      color: "rgba(255,255,255,0.45)"
    }
  }, "Admin")), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "14px"
    }
  }, groups.map(group => {
    const isOpen = collapsed[group.heading] === undefined ? true : collapsed[group.heading];
    return /*#__PURE__*/React.createElement("div", {
      key: group.heading,
      style: {
        display: "grid",
        gap: "2px"
      }
    }, group.collapsible ? /*#__PURE__*/React.createElement("button", {
      type: "button",
      "aria-expanded": isOpen,
      onClick: () => setCollapsed(s => ({
        ...s,
        [group.heading]: !isOpen
      })),
      style: {
        ...headingStyle,
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement("span", null, group.heading), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "ChevronRight",
      size: 12,
      strokeWidth: 2.5,
      style: {
        transform: isOpen ? "rotate(90deg)" : "none",
        transition: "transform var(--dur-base)"
      }
    })) : /*#__PURE__*/React.createElement("div", {
      style: headingStyle
    }, group.heading), (!group.collapsible || isOpen) && group.items.map(item => {
      const isActive = item.href === active;
      const accent = ON_DARK[item.section] || ON_DARK.grey;
      const isHover = hover === item.href;
      return /*#__PURE__*/React.createElement("a", {
        key: item.href,
        href: item.href,
        onClick: e => {
          if (onNavigate) {
            e.preventDefault();
            onNavigate(item.href);
          }
        },
        onMouseEnter: () => setHover(item.href),
        onMouseLeave: () => setHover(null),
        style: {
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          borderRadius: "var(--radius-nav)",
          padding: "5px 12px",
          textDecoration: "none",
          background: isActive ? "rgba(255,255,255,0.10)" : isHover ? "rgba(255,255,255,0.06)" : "transparent",
          color: isActive || isHover ? "#fff" : "rgba(255,255,255,0.65)",
          transition: "background-color var(--dur-base), color var(--dur-base)"
        }
      }, /*#__PURE__*/React.createElement("span", {
        "aria-hidden": true,
        style: {
          position: "absolute",
          left: 0,
          top: "50%",
          height: "20px",
          width: isActive ? "3px" : 0,
          transform: "translateY(-50%)",
          borderRadius: "0 999px 999px 0",
          background: isActive ? accent : "transparent",
          transition: "width var(--dur-base)"
        }
      }), /*#__PURE__*/React.createElement("span", {
        style: {
          display: "inline-flex",
          height: "24px",
          width: "24px",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "6px",
          background: isActive ? accent : "rgba(255,255,255,0.04)",
          color: isActive ? "#111" : "rgba(255,255,255,0.55)"
        }
      }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
        name: item.iconName,
        size: 15,
        strokeWidth: 2
      })), /*#__PURE__*/React.createElement("span", {
        style: {
          flex: 1,
          fontSize: "12.5px",
          fontWeight: "var(--weight-medium)",
          letterSpacing: "-0.005em"
        }
      }, item.label));
    }));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "8px",
      borderTop: "1px solid rgba(255,255,255,0.08)",
      paddingTop: "16px"
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "/",
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      borderRadius: "var(--radius-nav)",
      padding: "8px 12px",
      fontSize: "12.5px",
      fontWeight: "var(--weight-medium)",
      color: "rgba(255,255,255,0.55)",
      textDecoration: "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "Home",
    size: 14,
    strokeWidth: 2
  }), "View live site"), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "ChevronRight",
    size: 14,
    strokeWidth: 2.25
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: "var(--radius-nav)",
      background: "rgba(255,255,255,0.04)",
      padding: "10px 12px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "11px",
      fontWeight: "var(--weight-medium)",
      color: "rgba(255,255,255,0.55)"
    }
  }, "Signed in as"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "4px",
      fontSize: "12.5px",
      fontWeight: "var(--weight-medium)",
      color: "#fff",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, email), /*#__PURE__*/React.createElement("button", {
    type: "button",
    style: {
      marginTop: "10px",
      width: "100%",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      border: "none",
      borderRadius: "var(--radius-sm)",
      background: "rgba(255,255,255,0.06)",
      padding: "6px 12px",
      fontSize: "12px",
      fontWeight: "var(--weight-medium)",
      color: "rgba(255,255,255,0.85)",
      fontFamily: "var(--font-sans)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "LogOut",
    size: 14,
    strokeWidth: 2.25
  }), "Sign out"))));
}
Object.assign(__ds_scope, { SidebarNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/chrome/SidebarNav.jsx", error: String((e && e.message) || e) }); }

// components/core/NotSetUp.jsx
try { (() => {
/**
 * "The database update hasn't been applied yet" state. A dashed sunken panel,
 * shown by admin pages whose tables don't exist yet so they never crash.
 */
function NotSetUp({
  title = "Not set up yet",
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: "var(--radius-md)",
      border: "1px dashed var(--line-dashed)",
      background: "var(--surface-sunken)",
      padding: "56px 24px",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "17px",
      fontWeight: "var(--weight-medium)",
      color: "var(--ink)"
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "8px auto 0",
      maxWidth: "52ch",
      fontSize: "13.5px",
      lineHeight: "var(--leading-body)",
      color: "var(--ink-3)"
    }
  }, children ?? "This feature needs a database update before it can be used. Ask Will to run the database update, then reload this page."));
}

/** Nothing-here-yet state for a list. Same dashed panel, one line of copy. */
function EmptyState({
  children = "No records yet."
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: "var(--radius-md)",
      border: "1px dashed var(--line-input)",
      background: "var(--surface-sunken)",
      padding: "64px 24px",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: "15px",
      color: "var(--ink-2)"
    }
  }, children));
}
Object.assign(__ds_scope, { NotSetUp, EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/NotSetUp.jsx", error: String((e && e.message) || e) }); }

// components/core/PageSkeleton.jsx
try { (() => {
/**
 * Loading state = a skeleton matching the page's real layout, never a
 * spinner-only screen. `Bar` is the primitive; `PageSkeleton` is the
 * route-level shape (header + card rows) the admin ships.
 */
function SkeletonBar({
  width = "100%",
  height = 12,
  radius = "var(--radius-pill)"
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width,
      height,
      borderRadius: radius,
      background: "var(--wash)"
    }
  });
}
function PageSkeleton({
  rows = 3
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      animation: "ds-pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
      display: "grid",
      gap: "32px"
    }
  }, /*#__PURE__*/React.createElement("style", null, "@keyframes ds-pulse{50%{opacity:.5}}"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "16px"
    }
  }, /*#__PURE__*/React.createElement(SkeletonBar, {
    width: "120px",
    height: 12
  }), /*#__PURE__*/React.createElement(SkeletonBar, {
    width: "40%",
    height: 36,
    radius: "var(--radius-md)"
  }), /*#__PURE__*/React.createElement(SkeletonBar, {
    width: "60%",
    height: 16
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "16px"
    }
  }, Array.from({
    length: rows
  }, (_, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--line-strong)",
      background: "var(--surface-card)",
      padding: "20px",
      display: "grid",
      gap: "12px"
    }
  }, /*#__PURE__*/React.createElement(SkeletonBar, {
    width: "33%",
    height: 16
  }), /*#__PURE__*/React.createElement(SkeletonBar, {
    width: "50%",
    height: 12
  })))));
}
Object.assign(__ds_scope, { SkeletonBar, PageSkeleton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/PageSkeleton.jsx", error: String((e && e.message) || e) }); }

// components/core/StatChip.jsx
try { (() => {
/**
 * Small value + label tile. The house way to show a metric: never a run-on
 * sentence of numbers. Sits in a grid of 3.
 */
function StatChip({
  value,
  label
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: "var(--radius-statchip)",
      background: "var(--surface-chip)",
      padding: "8px 10px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-stat-sm)",
      fontWeight: "var(--weight-medium)",
      lineHeight: 1,
      letterSpacing: "var(--tracking-tight)",
      color: "var(--ink)",
      fontVariantNumeric: "tabular-nums",
      fontVariationSettings: "var(--display-variation)"
    }
  }, value), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "4px",
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-statchip-label)",
      fontWeight: "var(--weight-semibold)",
      textTransform: "uppercase",
      lineHeight: 1.2,
      letterSpacing: "var(--tracking-statchip)",
      color: "var(--ink-4)"
    }
  }, label));
}

/** A grid of StatChips — three across, the admin's default metric block. */
function StatChipGrid({
  columns = 3,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))`,
      gap: "6px"
    }
  }, children);
}
Object.assign(__ds_scope, { StatChip, StatChipGrid });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/StatChip.jsx", error: String((e && e.message) || e) }); }

// components/core/TabBar.jsx
try { (() => {
/**
 * The house tab bar: an underline row, red underline + ink text when active.
 * Used for drafts / scheduled / sent-style views. Plain links to a `?tab=`
 * query param in the real admin, so it needs no client JS.
 */
function TabBar({
  tabs,
  active,
  hrefFor,
  onSelect
}) {
  const [hover, setHover] = React.useState(null);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      borderBottom: "1px solid var(--line-strong)"
    }
  }, tabs.map(t => {
    const isActive = t.key === active;
    return /*#__PURE__*/React.createElement("a", {
      key: t.key,
      href: hrefFor ? hrefFor(t.key) : "#",
      onClick: e => {
        if (onSelect) {
          e.preventDefault();
          onSelect(t.key);
        }
      },
      onMouseEnter: () => setHover(t.key),
      onMouseLeave: () => setHover(null),
      style: {
        marginBottom: "-1px",
        borderBottom: "2px solid " + (isActive ? "var(--red)" : "transparent"),
        padding: "10px 16px",
        fontSize: "var(--text-control)",
        fontWeight: "var(--weight-medium)",
        textDecoration: "none",
        color: isActive || hover === t.key ? "var(--ink)" : "var(--ink-3)",
        transition: "color var(--dur-base)"
      }
    }, t.label, typeof t.count === "number" && /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: "8px",
        color: "var(--ink-4)",
        fontVariantNumeric: "tabular-nums"
      }
    }, t.count));
  }));
}
Object.assign(__ds_scope, { TabBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/TabBar.jsx", error: String((e && e.message) || e) }); }

// components/data/DataList.jsx
try { (() => {
/**
 * The admin's list/table pattern: a Card holding hairline-divided rows.
 * The ROW is the click target (a clickable row, not a separate "open"
 * button); actions on the right are icon buttons. Compact by default —
 * this admin favours dense lists over card grids.
 */
function DataList({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--line)",
      background: "var(--surface-card)",
      boxShadow: "var(--shadow-sm)",
      overflow: "hidden",
      ...style
    }
  }, /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: 0,
      padding: 0,
      listStyle: "none"
    }
  }, children));
}
function DataRow({
  title,
  meta,
  actions,
  href = "#",
  onClick,
  hoverColor = "var(--section-ink)",
  first
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("li", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "grid",
      gridTemplateColumns: "1fr auto",
      alignItems: "center",
      gap: "16px",
      padding: "var(--row-py) var(--row-px)",
      borderTop: first ? "none" : "1px solid var(--line)",
      background: hover ? "rgba(20,18,16,0.015)" : "transparent"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: href,
    onClick: onClick,
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-row-title)",
      fontWeight: "var(--weight-medium)",
      letterSpacing: "-0.005em",
      textDecoration: "none",
      color: hover ? hoverColor : "var(--ink)",
      transition: "color var(--dur-base)"
    }
  }, title), meta && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "4px",
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      columnGap: "12px",
      rowGap: "4px",
      fontSize: "var(--text-meta)",
      color: "var(--ink-3)"
    }
  }, meta)), actions && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: "8px"
    }
  }, actions));
}

/** A mono, tabular meta value inside a row (order numbers, ids, counts). */
function RowMeta({
  children
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-label)",
      color: "var(--ink-4)",
      fontVariantNumeric: "tabular-nums"
    }
  }, children);
}
Object.assign(__ds_scope, { DataList, DataRow, RowMeta });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/DataList.jsx", error: String((e && e.message) || e) }); }

// components/feedback/ConfirmDialog.jsx
try { (() => {
/**
 * Confirm / prompt dialogs that match the admin chrome, used in place of
 * window.confirm / window.prompt. EVERY destructive action goes through
 * ConfirmDialog — a native browser confirm is never acceptable here.
 *
 * Traps Tab, focuses the primary control on open, cancels on Escape or an
 * overlay click.
 */
function Shell({
  children,
  onCancel,
  labelledBy
}) {
  React.useEffect(() => {
    const onKey = e => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);
  return /*#__PURE__*/React.createElement("div", {
    onClick: onCancel,
    style: {
      position: "fixed",
      inset: 0,
      zIndex: "var(--z-dialog)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,0.5)",
      padding: "16px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    "aria-labelledby": labelledBy,
    onClick: e => e.stopPropagation(),
    style: {
      width: "100%",
      maxWidth: "var(--dialog-w)",
      borderRadius: "var(--radius-md)",
      background: "var(--surface-card)",
      padding: "24px",
      boxShadow: "var(--shadow-modal)",
      boxSizing: "border-box"
    }
  }, children));
}
const confirmBtn = tone => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  border: "none",
  borderRadius: "var(--radius-pill)",
  padding: "10px 20px",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--text-control)",
  fontWeight: "var(--weight-medium)",
  color: "#fff",
  background: tone === "danger" ? "var(--red)" : "var(--ink)"
});
const cancelBtn = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  border: "none",
  borderRadius: "var(--radius-pill)",
  background: "var(--wash)",
  padding: "10px 20px",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--text-control)",
  fontWeight: "var(--weight-medium)",
  color: "var(--ink)"
};
function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  onConfirm,
  onCancel
}) {
  const id = React.useId();
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (open) ref.current?.focus();
  }, [open]);
  if (!open) return null;
  return /*#__PURE__*/React.createElement(Shell, {
    onCancel: onCancel,
    labelledBy: id
  }, /*#__PURE__*/React.createElement("h2", {
    id: id,
    style: {
      margin: 0,
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-dialog-title)",
      fontWeight: "var(--weight-semibold)",
      letterSpacing: "var(--tracking-snug)",
      color: "var(--ink)"
    }
  }, title), body && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "8px",
      fontSize: "13.5px",
      lineHeight: "var(--leading-body)",
      color: "var(--ink-3)"
    }
  }, body), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "20px",
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: "10px"
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onCancel,
    style: cancelBtn
  }, cancelLabel), /*#__PURE__*/React.createElement("button", {
    ref: ref,
    type: "button",
    onClick: onConfirm,
    style: confirmBtn(tone)
  }, confirmLabel)));
}
function PromptDialog({
  open,
  title,
  body,
  label,
  placeholder,
  defaultValue = "",
  confirmLabel = "Save",
  cancelLabel = "Cancel",
  tone = "neutral",
  onConfirm,
  onCancel
}) {
  const id = React.useId();
  const [value, setValue] = React.useState(defaultValue);
  React.useEffect(() => {
    if (open) setValue(defaultValue);
  }, [open, defaultValue]);
  if (!open) return null;
  return /*#__PURE__*/React.createElement(Shell, {
    onCancel: onCancel,
    labelledBy: id
  }, /*#__PURE__*/React.createElement("h2", {
    id: id,
    style: {
      margin: 0,
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-dialog-title)",
      fontWeight: "var(--weight-semibold)",
      letterSpacing: "var(--tracking-snug)",
      color: "var(--ink)"
    }
  }, title), body && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "8px",
      fontSize: "13.5px",
      lineHeight: "var(--leading-body)",
      color: "var(--ink-3)"
    }
  }, body), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "16px"
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-label)",
      fontWeight: "var(--weight-semibold)",
      textTransform: "uppercase",
      letterSpacing: "var(--tracking-label)",
      color: "var(--ink-3)"
    }
  }, label), /*#__PURE__*/React.createElement("input", {
    autoFocus: true,
    value: value,
    placeholder: placeholder,
    onChange: e => setValue(e.target.value),
    onKeyDown: e => e.key === "Enter" && onConfirm(value.trim()),
    style: {
      marginTop: "8px",
      display: "block",
      width: "100%",
      boxSizing: "border-box",
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--line-input)",
      background: "var(--surface-card)",
      padding: "12px 16px",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-input)",
      color: "var(--ink)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "20px",
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: "10px"
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onCancel,
    style: cancelBtn
  }, cancelLabel), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => onConfirm(value.trim()),
    style: confirmBtn(tone)
  }, confirmLabel)));
}
Object.assign(__ds_scope, { ConfirmDialog, PromptDialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/ConfirmDialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Modal.jsx
try { (() => {
/**
 * The house modal shell: a trigger button plus an overlay dialog. Portalled
 * to document.body in the codebase so no ancestor can trap the fixed overlay;
 * closes on Escape or an overlay click, with body scroll locked while open.
 *
 * This is the "buttons open a modal, not an inline section" pattern — the
 * standard for every add-a-record flow.
 */
const MAX_W = {
  default: "var(--modal-w)",
  wide: "var(--modal-w-wide)",
  xl: "var(--modal-w-xl)"
};
function Modal({
  trigger,
  title,
  size = "default",
  defaultOpen = false,
  children
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  React.useEffect(() => {
    if (!open) return;
    const onKey = e => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    onClick: () => setOpen(true)
  }, trigger), open && /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    "aria-label": title,
    onClick: () => setOpen(false),
    style: {
      position: "fixed",
      inset: 0,
      zIndex: "var(--z-modal)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,0.5)",
      padding: "24px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      display: "flex",
      maxHeight: "92vh",
      width: "100%",
      maxWidth: MAX_W[size],
      flexDirection: "column",
      overflow: "hidden",
      borderRadius: "var(--radius-md)",
      background: "var(--surface-card)",
      boxShadow: "var(--shadow-modal)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexShrink: 0,
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
      borderBottom: "1px solid var(--line)",
      padding: "16px 20px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-modal-title)",
      fontWeight: "var(--weight-medium)",
      letterSpacing: "var(--tracking-snug)",
      color: "var(--ink)"
    }
  }, title), /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "Close",
    onClick: () => setOpen(false),
    style: {
      display: "inline-flex",
      height: "32px",
      width: "32px",
      flexShrink: 0,
      alignItems: "center",
      justifyContent: "center",
      border: "none",
      borderRadius: "var(--radius-pill)",
      background: "transparent",
      color: "var(--ink-3)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "X",
    size: 16,
    strokeWidth: 2.25
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      overflowY: "auto",
      padding: "20px"
    }
  }, children))));
}
Object.assign(__ds_scope, { Modal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Modal.jsx", error: String((e && e.message) || e) }); }

// components/forms/DateTimePicker.jsx
try { (() => {
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const pad = n => String(n).padStart(2, "0");
const daysInMonth = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
/** Monday-first lead offset. All date maths goes through Date.UTC, never the
 *  local constructor, which can land on the previous day across a DST jump. */
const firstWeekday = (y, m) => (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
function parse(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(value || "");
  if (!m) return null;
  return {
    y: +m[1],
    m: +m[2],
    d: +m[3],
    hh: m[4] ? +m[4] : 0,
    mm: m[5] ? +m[5] : 0
  };
}
const format = (p, withTime) => `${p.y}-${pad(p.m)}-${pad(p.d)}` + (withTime ? `T${pad(p.hh)}:${pad(p.mm)}` : "");
function label(p, withTime) {
  const d = new Date(Date.UTC(p.y, p.m - 1, p.d));
  const day = new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(d);
  if (!withTime) return day;
  const h12 = p.hh % 12 === 0 ? 12 : p.hh % 12;
  return `${day}, ${h12}:${pad(p.mm)}${p.hh >= 12 ? "pm" : "am"}`;
}

/**
 * The custom date/time picker used everywhere a date is chosen. Native
 * `datetime-local` / `date` inputs are never used in this admin: they look
 * nothing like the rest of it and differ per browser.
 *
 * Value shape is identical to the input it replaced: `YYYY-MM-DDTHH:mm` with
 * time, `YYYY-MM-DD` without, always LOCAL wall-clock, empty string for unset.
 */
function DateTimePicker({
  value = "",
  onChange,
  withTime = true,
  placeholder,
  id,
  name,
  inline = false
}) {
  const parsed = parse(value);
  const today = React.useMemo(() => {
    const n = new Date();
    return {
      y: n.getFullYear(),
      m: n.getMonth() + 1,
      d: n.getDate(),
      hh: n.getHours(),
      mm: 0
    };
  }, []);
  const [open, setOpen] = React.useState(inline);
  const [view, setView] = React.useState(() => ({
    y: (parsed ?? today).y,
    m: (parsed ?? today).m
  }));
  const commit = next => onChange && onChange(format(next, withTime));
  const ph = placeholder ?? (withTime ? "Pick a date and time" : "Pick a date");
  const trigger = /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: "100%"
    }
  }, /*#__PURE__*/React.createElement("button", {
    id: id,
    type: "button",
    onClick: () => setOpen(o => !o),
    "aria-haspopup": "dialog",
    "aria-expanded": open,
    style: {
      display: "flex",
      width: "100%",
      boxSizing: "border-box",
      alignItems: "center",
      gap: "8px",
      borderRadius: "var(--radius-md)",
      border: "1px solid " + (open ? "var(--focus-border)" : "var(--line-input)"),
      boxShadow: open ? "0 0 0 2px var(--focus-ring)" : "none",
      background: "var(--surface-card)",
      padding: "12px 16px",
      paddingRight: parsed ? "40px" : "16px",
      textAlign: "left",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--text-input)",
      color: parsed ? "var(--ink)" : "var(--text-placeholder)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "CalendarDays",
    size: 16,
    strokeWidth: 2,
    color: parsed ? "var(--red)" : "var(--ink-5)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, parsed ? label(parsed, withTime) : ph)), parsed && /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "Clear date",
    onClick: () => onChange && onChange(""),
    style: {
      position: "absolute",
      right: "8px",
      top: "50%",
      transform: "translateY(-50%)",
      display: "inline-flex",
      height: "24px",
      width: "24px",
      alignItems: "center",
      justifyContent: "center",
      border: "none",
      borderRadius: "var(--radius-pill)",
      background: "transparent",
      color: "var(--ink-5)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "X",
    size: 14,
    strokeWidth: 2.25
  })));
  const total = daysInMonth(view.y, view.m);
  const lead = firstWeekday(view.y, view.m);
  const cells = [...Array(lead).fill(null), ...Array.from({
    length: total
  }, (_, i) => i + 1)];
  const hh = parsed?.hh ?? 9;
  const mm = parsed?.mm ?? 0;
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  const isPm = hh >= 12;
  const todayKey = format(today, false);
  const step = delta => {
    const m0 = view.m - 1 + delta;
    setView({
      y: view.y + Math.floor(m0 / 12),
      m: (m0 % 12 + 12) % 12 + 1
    });
  };
  const setTime = (h, m) => commit({
    ...(parsed ?? today),
    hh: h,
    mm: m
  });
  const panel = /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-label": "Choose a date",
    style: {
      width: "var(--picker-w)",
      boxSizing: "border-box",
      borderRadius: "var(--radius-md)",
      border: "1px solid rgba(20,18,16,0.12)",
      background: "var(--surface-card)",
      padding: "12px",
      boxShadow: "var(--shadow-lg)",
      position: inline ? "relative" : "absolute",
      top: inline ? undefined : "calc(100% + 6px)",
      left: 0,
      zIndex: "var(--z-datepicker)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement(RoundBtn, {
    ariaLabel: "Previous month",
    onClick: () => step(-1)
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "ChevronLeft",
    size: 16,
    strokeWidth: 2.25
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "13.5px",
      fontWeight: "var(--weight-medium)",
      color: "var(--ink)"
    }
  }, MONTHS[view.m - 1], " ", view.y), /*#__PURE__*/React.createElement(RoundBtn, {
    ariaLabel: "Next month",
    onClick: () => step(1)
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "ChevronRight",
    size: 16,
    strokeWidth: 2.25
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(7,1fr)",
      gap: "2px"
    }
  }, WEEKDAYS.map(d => /*#__PURE__*/React.createElement("div", {
    key: d,
    style: {
      paddingBottom: "4px",
      textAlign: "center",
      fontFamily: "var(--font-mono)",
      fontSize: "9px",
      fontWeight: "var(--weight-semibold)",
      textTransform: "uppercase",
      letterSpacing: "0.14em",
      color: "var(--ink-5)"
    }
  }, d[0])), cells.map((d, i) => {
    if (d === null) return /*#__PURE__*/React.createElement("div", {
      key: `lead-${i}`
    });
    const key = `${view.y}-${pad(view.m)}-${pad(d)}`;
    const isSelected = parsed && parsed.y === view.y && parsed.m === view.m && parsed.d === d;
    const isToday = key === todayKey;
    return /*#__PURE__*/React.createElement("button", {
      key: key,
      type: "button",
      onClick: () => {
        commit({
          ...(parsed ?? {
            ...today,
            hh: 9,
            mm: 0
          }),
          y: view.y,
          m: view.m,
          d
        });
        if (!withTime && !inline) setOpen(false);
      },
      style: {
        display: "flex",
        height: "32px",
        alignItems: "center",
        justifyContent: "center",
        border: "none",
        borderRadius: "var(--radius-pill)",
        fontFamily: "var(--font-sans)",
        fontSize: "12.5px",
        background: isSelected ? "var(--red)" : "transparent",
        color: isSelected ? "#fff" : isToday ? "var(--red)" : "var(--ink)",
        fontWeight: isSelected || isToday ? "var(--weight-semibold)" : "var(--weight-body)",
        boxShadow: !isSelected && isToday ? "inset 0 0 0 1px rgba(224,34,20,0.35)" : "none"
      }
    }, d);
  })), withTime && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "12px",
      borderTop: "1px solid var(--line)",
      paddingTop: "12px",
      display: "flex",
      alignItems: "center",
      gap: "8px"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "Clock",
    size: 14,
    strokeWidth: 2,
    color: "var(--ink-5)"
  }), /*#__PURE__*/React.createElement(MiniSelect, {
    ariaLabel: "Hour",
    value: h12,
    onChange: v => setTime((isPm ? 12 : 0) + v % 12, mm),
    options: Array.from({
      length: 12
    }, (_, i) => i + 1)
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "13px",
      color: "var(--ink-3)"
    }
  }, ":"), /*#__PURE__*/React.createElement(MiniSelect, {
    ariaLabel: "Minute",
    value: mm,
    onChange: v => setTime(hh, v),
    options: Array.from({
      length: 12
    }, (_, i) => i * 5),
    format: pad
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: "auto",
      display: "inline-flex",
      overflow: "hidden",
      borderRadius: "var(--radius-pill)",
      border: "1px solid var(--line-input)"
    }
  }, ["am", "pm"].map(p => {
    const on = p === "pm" === isPm;
    return /*#__PURE__*/React.createElement("button", {
      key: p,
      type: "button",
      onClick: () => setTime(p === "pm" ? hh % 12 + 12 : hh % 12, mm),
      style: {
        border: "none",
        padding: "6px 10px",
        fontFamily: "var(--font-sans)",
        fontSize: "12px",
        fontWeight: "var(--weight-medium)",
        textTransform: "uppercase",
        background: on ? "var(--red)" : "var(--surface-card)",
        color: on ? "#fff" : "var(--ink-3)"
      }
    }, p);
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "12px",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      borderTop: "1px solid var(--line)",
      paddingTop: "10px"
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => commit(withTime ? today : {
      ...today,
      hh: 0,
      mm: 0
    }),
    style: {
      border: "none",
      borderRadius: "var(--radius-pill)",
      background: "var(--wash)",
      padding: "6px 12px",
      fontFamily: "var(--font-sans)",
      fontSize: "12px",
      fontWeight: "var(--weight-medium)",
      color: "var(--ink)"
    }
  }, withTime ? "Now" : "Today"), !inline && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setOpen(false),
    style: {
      marginLeft: "auto",
      border: "none",
      borderRadius: "var(--radius-pill)",
      background: "var(--red)",
      padding: "6px 16px",
      fontFamily: "var(--font-sans)",
      fontSize: "12px",
      fontWeight: "var(--weight-medium)",
      color: "#fff"
    }
  }, "Done")));
  if (inline) return panel;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, name && /*#__PURE__*/React.createElement("input", {
    type: "hidden",
    name: name,
    value: value
  }), trigger, open && panel);
}
function RoundBtn({
  ariaLabel,
  onClick,
  children
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": ariaLabel,
    onClick: onClick,
    style: {
      display: "inline-flex",
      height: "28px",
      width: "28px",
      alignItems: "center",
      justifyContent: "center",
      border: "none",
      borderRadius: "var(--radius-pill)",
      background: "transparent",
      color: "var(--ink-3)"
    }
  }, children);
}
function MiniSelect({
  ariaLabel,
  value,
  onChange,
  options,
  format: fmt
}) {
  return /*#__PURE__*/React.createElement("select", {
    "aria-label": ariaLabel,
    value: value,
    onChange: e => onChange(Number(e.currentTarget.value)),
    style: {
      borderRadius: "var(--radius-sm)",
      border: "1px solid var(--line-input)",
      background: "var(--surface-card)",
      padding: "6px 8px",
      fontFamily: "var(--font-sans)",
      fontSize: "13px",
      color: "var(--ink)"
    }
  }, options.map(o => /*#__PURE__*/React.createElement("option", {
    key: o,
    value: o
  }, fmt ? fmt(o) : o)));
}
Object.assign(__ds_scope, { DateTimePicker });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/DateTimePicker.jsx", error: String((e && e.message) || e) }); }

// components/forms/Field.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Label + control + hint/error. The label is the admin's mono caps style;
 * an error replaces the hint.
 */
function Field({
  label,
  hint,
  error,
  htmlFor,
  children
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    htmlFor: htmlFor,
    style: {
      display: "block",
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-label)",
      fontWeight: "var(--weight-semibold)",
      textTransform: "uppercase",
      letterSpacing: "var(--tracking-label)",
      color: "var(--ink-3)"
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "var(--field-gap)"
    }
  }, children), hint && !error && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "6px 0 0",
      fontSize: "var(--text-meta)",
      color: "var(--ink-3)"
    }
  }, hint), error && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "6px 0 0",
      fontSize: "var(--text-row-meta)",
      fontWeight: "var(--weight-medium)",
      color: "var(--error-fg)"
    }
  }, error));
}
const controlStyle = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--line-input)",
  background: "var(--surface-card)",
  padding: "12px 16px",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--text-input)",
  color: "var(--ink)",
  outline: "none"
};
function useFocusRing() {
  const [focused, setFocused] = React.useState(false);
  return [focused ? {
    borderColor: "var(--focus-border)",
    boxShadow: "0 0 0 2px var(--focus-ring)"
  } : null, {
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false)
  }];
}
function Input({
  style,
  ...rest
}) {
  const [ring, handlers] = useFocusRing();
  return /*#__PURE__*/React.createElement("input", _extends({}, handlers, rest, {
    style: {
      ...controlStyle,
      ...ring,
      ...style
    }
  }));
}
function Textarea({
  rows = 4,
  style,
  ...rest
}) {
  const [ring, handlers] = useFocusRing();
  return /*#__PURE__*/React.createElement("textarea", _extends({
    rows: rows
  }, handlers, rest, {
    style: {
      ...controlStyle,
      lineHeight: "var(--leading-body)",
      resize: "vertical",
      ...ring,
      ...style
    }
  }));
}
function Select({
  options = [],
  style,
  children,
  ...rest
}) {
  const [ring, handlers] = useFocusRing();
  return /*#__PURE__*/React.createElement("select", _extends({}, handlers, rest, {
    style: {
      ...controlStyle,
      appearance: "none",
      paddingRight: "36px",
      ...ring,
      ...style
    }
  }), children ?? options.map(o => typeof o === "string" ? /*#__PURE__*/React.createElement("option", {
    key: o,
    value: o
  }, o) : /*#__PURE__*/React.createElement("option", {
    key: o.value,
    value: o.value
  }, o.label)));
}

/**
 * Rare or advanced options fold behind this rather than being shown by
 * default — the house answer to a long form.
 */
function AdvancedToggle({
  label = "Advanced options",
  open: openProp,
  children
}) {
  const [open, setOpen] = React.useState(!!openProp);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: "1px solid var(--line)",
      paddingTop: "12px"
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setOpen(o => !o),
    "aria-expanded": open,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      border: "none",
      background: "none",
      padding: 0,
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-label)",
      fontWeight: "var(--weight-semibold)",
      textTransform: "uppercase",
      letterSpacing: "var(--tracking-label)",
      color: "var(--ink-3)"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    style: {
      transform: open ? "rotate(90deg)" : "none",
      transition: "transform var(--dur-base)"
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "m9 18 6-6-6-6"
  })), label), open && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "12px",
      display: "grid",
      gap: "16px"
    }
  }, children));
}
Object.assign(__ds_scope, { Field, Input, Textarea, Select, AdvancedToggle });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Field.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/CalendarBoard.jsx
try { (() => {
const {
  PageHeader,
  Button,
  Icon,
  Badge,
  Modal,
  Field,
  Input,
  Textarea,
  DateTimePicker,
  SectionLabel
} = window.TEDxNewyAdminDesignSystem_bb30ae;

/* Chips are coloured by TYPE, not status: newsletters red, socials green,
   notes grey — that is what makes the month scannable. A draft is drawn with
   a dashed outline and a lighter fill instead. */
const TYPE_CHIP = {
  newsletter: {
    bg: "var(--sec-red-chip-bg)",
    fg: "var(--sec-red-ink)",
    border: "rgba(185,20,4,0.35)"
  },
  social: {
    bg: "var(--sec-green-chip-bg)",
    fg: "var(--sec-green-ink)",
    border: "rgba(47,111,78,0.35)"
  },
  note: {
    bg: "var(--sec-grey-chip-bg)",
    fg: "var(--sec-grey-ink)",
    border: "rgba(87,83,77,0.35)"
  }
};
const ITEMS = {
  3: [{
    type: "social",
    label: "Speaker reveal",
    time: "6:00pm",
    draft: true
  }],
  4: [{
    type: "social",
    label: "Signal lineup",
    time: "6:00pm"
  }, {
    type: "newsletter",
    label: "September dispatch",
    time: "7:30am"
  }],
  7: [{
    type: "social",
    label: "Talk Night highlights",
    time: "12:30pm"
  }],
  9: [{
    type: "note",
    label: "Prospectus to Newcastle Permanent"
  }],
  11: [{
    type: "newsletter",
    label: "Ticket reminder",
    time: "9:00am",
    draft: true
  }],
  14: [{
    type: "social",
    label: "Volunteer callout",
    time: "8:00am",
    draft: true
  }],
  16: [{
    type: "note",
    label: "Venue walkthrough, Q Building"
  }],
  18: [{
    type: "social",
    label: "Partner thank-you",
    time: "5:00pm"
  }],
  22: [{
    type: "newsletter",
    label: "48 hours left",
    time: "6:00am"
  }],
  25: [{
    type: "social",
    label: "Countdown day 1",
    time: "7:00am"
  }, {
    type: "note",
    label: "AV run sheet due"
  }]
};
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
function CalendarBoard() {
  const [day, setDay] = React.useState("2026-09-09");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "20px"
    },
    "data-section": "red"
  }, /*#__PURE__*/React.createElement(PageHeader, {
    section: "red",
    eyebrow: "Community",
    title: "Calendar",
    description: "Four weeks at a glance: scheduled social posts, newsletters and the events they line up against.",
    actions: /*#__PURE__*/React.createElement(Modal, {
      title: "Add a note",
      trigger: /*#__PURE__*/React.createElement(Button, {
        variant: "primary",
        icon: /*#__PURE__*/React.createElement(Icon, {
          name: "Plus",
          size: 14,
          strokeWidth: 2.25
        })
      }, "Add note")
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: "16px"
      }
    }, /*#__PURE__*/React.createElement(Field, {
      label: "Day"
    }, /*#__PURE__*/React.createElement(DateTimePicker, {
      value: day,
      onChange: setDay,
      withTime: false
    })), /*#__PURE__*/React.createElement(Field, {
      label: "Title"
    }, /*#__PURE__*/React.createElement(Input, {
      placeholder: "Prospectus to Newcastle Permanent"
    })), /*#__PURE__*/React.createElement(Field, {
      label: "Description",
      hint: "Notes are inert: no link to a post, newsletter or event."
    }, /*#__PURE__*/React.createElement(Textarea, {
      rows: 3
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "10px",
        borderTop: "1px solid var(--line)",
        paddingTop: "16px"
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary"
    }, "Cancel"), /*#__PURE__*/React.createElement(Button, {
      variant: "primary"
    }, "Save note"))))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "8px"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "row",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "ChevronLeft",
      size: 14,
      strokeWidth: 2.25
    })
  }, "Previous"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "13.5px",
      fontWeight: 500,
      color: "var(--ink)"
    }
  }, "31 Aug \u2013 27 Sep 2026"), /*#__PURE__*/React.createElement(Button, {
    variant: "row"
  }, "Next ", /*#__PURE__*/React.createElement(Icon, {
    name: "ChevronRight",
    size: 14,
    strokeWidth: 2.25
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "14px"
    }
  }, [["newsletter", "Newsletters"], ["social", "Socials"], ["note", "Notes"]].map(([k, l]) => /*#__PURE__*/React.createElement("span", {
    key: k,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      fontFamily: "var(--font-mono)",
      fontSize: "9.5px",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.16em",
      color: "var(--ink-3)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      height: "10px",
      width: "10px",
      borderRadius: "3px",
      background: TYPE_CHIP[k].bg,
      border: `1px solid ${TYPE_CHIP[k].border}`
    }
  }), l)))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--line)",
      background: "var(--surface-card)",
      boxShadow: "var(--shadow-sm)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      borderBottom: "1px solid var(--line)"
    }
  }, WEEKDAYS.map(d => /*#__PURE__*/React.createElement("div", {
    key: d,
    style: {
      padding: "8px 10px",
      fontFamily: "var(--font-mono)",
      fontSize: "9px",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.16em",
      color: "var(--ink-4)"
    }
  }, d))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)"
    }
  }, Array.from({
    length: 28
  }, (_, i) => {
    const n = i + 1;
    const items = ITEMS[n] || [];
    return /*#__PURE__*/React.createElement("div", {
      key: n,
      style: {
        minHeight: "92px",
        padding: "6px",
        borderRight: n % 7 === 0 ? "none" : "1px solid var(--line)",
        borderBottom: n <= 21 ? "1px solid var(--line)" : "none",
        display: "grid",
        gap: "4px",
        alignContent: "start"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: "10px",
        fontWeight: 600,
        color: n === 9 ? "var(--red)" : "var(--ink-4)",
        fontVariantNumeric: "tabular-nums"
      }
    }, n), items.map((it, j) => {
      const c = TYPE_CHIP[it.type];
      return /*#__PURE__*/React.createElement("button", {
        key: j,
        type: "button",
        style: {
          textAlign: "left",
          border: it.draft ? `1px dashed ${c.border}` : "1px solid transparent",
          borderRadius: "6px",
          background: it.draft ? "color-mix(in srgb, " + "#fff 55%, " + c.bg + ")" : c.bg,
          color: c.fg,
          padding: "4px 6px",
          fontFamily: "var(--font-sans)",
          fontSize: "10.5px",
          fontWeight: 500,
          lineHeight: 1.25,
          overflow: "hidden"
        }
      }, it.time && /*#__PURE__*/React.createElement("span", {
        style: {
          opacity: 0.7,
          fontVariantNumeric: "tabular-nums"
        }
      }, it.time, " "), it.label);
    }));
  }))), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: "12.5px",
      lineHeight: "var(--leading-body)",
      color: "var(--ink-4)"
    }
  }, "Everything buckets by Sydney local date, never UTC. Drag a future chip onto another day to reschedule it \u2014 the day moves, the time doesn\u2019t. Nothing can be dropped into the past."));
}
Object.assign(window, {
  CalendarBoard
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/CalendarBoard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/Dashboard.jsx
try { (() => {
const {
  PulseTile,
  DashboardTile,
  SectionLabel,
  Icon,
  Flash
} = window.TEDxNewyAdminDesignSystem_bb30ae;
const FAMILIES = [{
  group: "Content",
  label: "Content pages",
  section: "yellow"
}, {
  group: "Management",
  label: "Management",
  section: "coast"
}, {
  group: "Community",
  label: "Community",
  section: "red"
}, {
  group: "Settings",
  label: "Settings & tools",
  section: "green"
}];
const COUNTS = {
  "/admin/events": 8,
  "/admin/talks": 34,
  "/admin/speakers": 41,
  "/admin/team": 17,
  "/admin/sponsors": 12,
  "/admin/partners": 24,
  "/admin/documents": 6,
  "/admin/notifications": 5,
  "/admin/admins": 4
};
const TOOLS = new Set(["/admin/media", "/admin/tickets", "/admin/emails", "/admin/calendar", "/admin/socials", "/admin/newsletter"]);
function Dashboard({
  onNavigate
}) {
  const today = new Intl.DateTimeFormat("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(new Date());
  const go = href => e => {
    e.preventDefault();
    onNavigate(href);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "16px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: "12px"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "10.5px",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.22em",
      color: "var(--ink-3)"
    }
  }, "Dashboard"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: "6px 0 0",
      fontSize: "clamp(1.6rem, 3vw, 2rem)",
      fontWeight: 500,
      letterSpacing: "-0.02em",
      fontVariationSettings: '"opsz" 144',
      color: "var(--ink)"
    }
  }, "Afternoon, Will.")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "10.5px",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.18em",
      color: "var(--ink-5)"
    }
  }, today)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0,1fr))",
      gap: "8px"
    }
  }, /*#__PURE__*/React.createElement(PulseTile, {
    label: "Signal tickets",
    value: "184/300",
    sub: "61% sold \xB7 +18 this week",
    pct: 61,
    accent: true
  }), /*#__PURE__*/React.createElement(PulseTile, {
    label: "Gross ticket revenue",
    value: "$17,640",
    sub: "+18 tickets this week"
  }), /*#__PURE__*/React.createElement(PulseTile, {
    label: "Subscribers",
    value: "1,284",
    sub: "+37 this week"
  }), /*#__PURE__*/React.createElement(PulseTile, {
    label: "Partner pipeline",
    value: "24",
    sub: "organisations on the board"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: "var(--radius-md)",
      background: "var(--ink)",
      padding: "16px",
      color: "#fff",
      boxShadow: "var(--shadow-sm)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "8px 24px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "10px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      height: "32px",
      width: "32px",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "var(--radius-pill)",
      background: "rgba(255,255,255,0.1)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "Inbox",
    size: 16,
    strokeWidth: 2.25
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "10px",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.22em",
      color: "rgba(255,255,255,0.6)"
    }
  }, "Forms inbox")), /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: go("/admin/forms"),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      borderRadius: "var(--radius-pill)",
      background: "rgba(255,255,255,0.1)",
      padding: "6px 14px",
      fontSize: "11.5px",
      fontWeight: 500,
      color: "rgba(255,255,255,0.9)",
      textDecoration: "none"
    }
  }, "Open inbox ", /*#__PURE__*/React.createElement(Icon, {
    name: "ArrowUpRight",
    size: 14,
    strokeWidth: 2.25
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "12px",
      display: "grid",
      gridTemplateColumns: "repeat(6, minmax(0,1fr))",
      gap: "8px"
    }
  }, window.FORMS.map(f => /*#__PURE__*/React.createElement("a", {
    key: f.label,
    href: "#",
    onClick: go("/admin/forms"),
    style: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      gap: "8px",
      borderRadius: "12px",
      background: "rgba(255,255,255,0.05)",
      padding: "12px",
      textDecoration: "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "9px",
      fontWeight: 600,
      textTransform: "uppercase",
      lineHeight: 1.3,
      letterSpacing: "0.14em",
      color: "rgba(255,255,255,0.45)"
    }
  }, f.label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "22px",
      fontWeight: 500,
      lineHeight: 1,
      letterSpacing: "-0.02em",
      color: "#fff",
      fontVariationSettings: '"opsz" 96'
    }
  }, f.count))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "14px"
    }
  }, FAMILIES.map(fam => {
    const group = window.NAV_GROUPS.find(g => g.heading === fam.group);
    return /*#__PURE__*/React.createElement("section", {
      key: fam.group,
      style: {
        display: "grid",
        gap: "8px"
      }
    }, /*#__PURE__*/React.createElement(SectionLabel, {
      section: fam.section
    }, fam.label), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(5, minmax(0,1fr))",
        gap: "10px"
      }
    }, group.items.map(it => /*#__PURE__*/React.createElement(DashboardTile, {
      key: it.href,
      section: it.section,
      title: it.label,
      count: COUNTS[it.href],
      tool: TOOLS.has(it.href),
      feature: it.href === "/admin/emails",
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: it.iconName,
        size: 18,
        strokeWidth: 2.25
      }),
      href: "#",
      onClick: go(it.href)
    }))));
  })));
}
Object.assign(window, {
  Dashboard
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/Dashboard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/EventsList.jsx
try { (() => {
const {
  PageHeader,
  DataList,
  DataRow,
  RowMeta,
  Badge,
  Button,
  IconButton,
  Icon,
  Modal,
  ConfirmDialog,
  Field,
  Input,
  Select,
  DateTimePicker,
  AdvancedToggle,
  SectionLabel
} = window.TEDxNewyAdminDesignSystem_bb30ae;
const EVENTS = [{
  id: "1",
  title: "TEDxNewy Signal 2026",
  kind: "Flagship",
  status: "draft",
  date: "Sat 14 Nov 2026",
  order: 1,
  tickets: true
}, {
  id: "2",
  title: "TEDxNewy Salon: Newcastle 2050",
  kind: "Salon",
  status: "past",
  date: "Thu 30 Apr 2026",
  order: 2,
  tickets: true
}, {
  id: "3",
  title: "60-Second Talk Night",
  kind: "Salon",
  status: "past",
  date: "Wed 16 Jul 2026",
  order: 3
}, {
  id: "4",
  title: "Youth Futures Lab",
  kind: "Special",
  status: "past",
  date: "Thu 7 Aug 2026",
  order: 4
}, {
  id: "5",
  title: "TEDxNewy Salon: What If",
  kind: "Salon",
  status: "announced",
  date: "Fri 27 Nov 2026",
  order: 5
}];
const STATUS = {
  draft: ["draft", "Draft"],
  announced: ["soon", "Announced"],
  past: ["neutral", "Past"]
};
function EventsList() {
  const [confirming, setConfirming] = React.useState(null);
  const [rows, setRows] = React.useState(EVENTS);
  const [starts, setStarts] = React.useState("2026-11-14T18:30");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "20px"
    },
    "data-section": "yellow"
  }, /*#__PURE__*/React.createElement(PageHeader, {
    section: "yellow",
    eyebrow: "Content",
    title: "Events",
    description: "Create and edit events. Drives the header menu, /events and the home page.",
    actions: /*#__PURE__*/React.createElement(Modal, {
      title: "Add event",
      trigger: /*#__PURE__*/React.createElement(Button, {
        variant: "primary",
        icon: /*#__PURE__*/React.createElement(Icon, {
          name: "Plus",
          size: 14,
          strokeWidth: 2.25
        })
      }, "Add event")
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: "16px"
      }
    }, /*#__PURE__*/React.createElement(Field, {
      label: "Title"
    }, /*#__PURE__*/React.createElement(Input, {
      placeholder: "TEDxNewy Salon: What If"
    })), /*#__PURE__*/React.createElement(Field, {
      label: "Kind"
    }, /*#__PURE__*/React.createElement(Select, {
      options: [{
        value: "flagship",
        label: "Flagship"
      }, {
        value: "salon",
        label: "Salon"
      }, {
        value: "special",
        label: "Special"
      }]
    })), /*#__PURE__*/React.createElement(Field, {
      label: "Starts",
      hint: "Sydney local time. Drives the countdown and the Upcoming menu."
    }, /*#__PURE__*/React.createElement(DateTimePicker, {
      value: starts,
      onChange: setStarts
    })), /*#__PURE__*/React.createElement(AdvancedToggle, {
      label: "Advanced"
    }, /*#__PURE__*/React.createElement(Field, {
      label: "Slug",
      hint: "Leave blank to generate it from the title."
    }, /*#__PURE__*/React.createElement(Input, {
      placeholder: "salon-what-if"
    })), /*#__PURE__*/React.createElement(Field, {
      label: "Display order"
    }, /*#__PURE__*/React.createElement(Input, {
      defaultValue: "6"
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "10px",
        borderTop: "1px solid var(--line)",
        paddingTop: "16px"
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary"
    }, "Cancel"), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: "Save",
        size: 14,
        strokeWidth: 2.25
      })
    }, "Save event"))))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "8px"
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, {
    section: "yellow"
  }, "All events"), /*#__PURE__*/React.createElement(DataList, null, rows.map((e, i) => /*#__PURE__*/React.createElement(DataRow, {
    key: e.id,
    first: i === 0,
    title: e.title,
    hoverColor: "var(--sec-yellow-ink)",
    meta: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Badge, {
      tone: "neutral"
    }, e.kind), /*#__PURE__*/React.createElement(Badge, {
      tone: STATUS[e.status][0]
    }, STATUS[e.status][1]), /*#__PURE__*/React.createElement("span", null, e.date), /*#__PURE__*/React.createElement(RowMeta, null, "order ", e.order)),
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, e.tickets && /*#__PURE__*/React.createElement(Button, {
      variant: "row",
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: "Ticket",
        size: 14,
        strokeWidth: 2.25
      })
    }, "Tickets"), e.status === "past" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "row",
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: "Users",
        size: 14,
        strokeWidth: 2.25
      })
    }, "Attendees"), /*#__PURE__*/React.createElement(Button, {
      variant: "row",
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: "MessageSquare",
        size: 14,
        strokeWidth: 2.25
      })
    }, "Feedback")), /*#__PURE__*/React.createElement(IconButton, {
      ariaLabel: "Edit event"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "Pencil",
      size: 16,
      strokeWidth: 2.25
    })), /*#__PURE__*/React.createElement(IconButton, {
      ariaLabel: "Delete event",
      tone: "danger",
      onClick: () => setConfirming(e)
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "Trash2",
      size: 16,
      strokeWidth: 2.25
    })))
  })))), /*#__PURE__*/React.createElement(ConfirmDialog, {
    open: !!confirming,
    title: "Delete this event?",
    tone: "danger",
    confirmLabel: "Delete",
    body: confirming ? `Delete “${confirming.title}”? Talks and speakers linked to it are kept, just unlinked. This can’t be undone.` : "",
    onConfirm: () => {
      setRows(r => r.filter(x => x.id !== confirming.id));
      setConfirming(null);
    },
    onCancel: () => setConfirming(null)
  }));
}
Object.assign(window, {
  EventsList
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/EventsList.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/SocialsList.jsx
try { (() => {
const {
  PageHeader,
  TabBar,
  StageHeading,
  DataList,
  DataRow,
  RowMeta,
  Badge,
  Button,
  IconButton,
  Icon,
  Modal,
  ConfirmDialog,
  Field,
  Input,
  Textarea,
  DateTimePicker,
  StatChip,
  StatChipGrid,
  EmptyState
} = window.TEDxNewyAdminDesignSystem_bb30ae;
const POSTS = [{
  id: "1",
  title: "Signal speaker reveal — Dr Amara Chen",
  channels: ["Instagram", "LinkedIn"],
  stage: "ready",
  status: "draft",
  when: null,
  updated: "2 hours ago"
}, {
  id: "2",
  title: "Youth Futures Lab recap reel",
  channels: ["Instagram", "Facebook"],
  stage: "ready",
  status: "draft",
  when: null,
  updated: "yesterday"
}, {
  id: "3",
  title: "Tickets on sale — 48 hours left",
  channels: ["Instagram", "Facebook", "LinkedIn"],
  stage: "ready",
  status: "draft",
  when: null,
  updated: "yesterday"
}, {
  id: "4",
  title: "Partner thank-you carousel",
  channels: ["LinkedIn"],
  stage: "polish",
  status: "draft",
  when: null,
  updated: "3 days ago"
}, {
  id: "5",
  title: "Newcastle 2050 white paper teaser",
  channels: ["LinkedIn"],
  stage: "polish",
  status: "draft",
  when: null,
  updated: "4 days ago"
}, {
  id: "6",
  title: "Volunteer callout — Signal crew",
  channels: ["Instagram"],
  stage: "early",
  status: "draft",
  when: null,
  updated: "last week"
}];
const SCHEDULED = [{
  id: "7",
  title: "Signal lineup announcement",
  channels: ["Instagram", "Facebook", "LinkedIn"],
  status: "scheduled",
  when: "Fri 4 Sep, 6:00pm"
}, {
  id: "8",
  title: "60-Second Talk Night highlights",
  channels: ["Instagram"],
  status: "scheduled",
  when: "Mon 7 Sep, 12:30pm"
}];
const POSTED = [{
  id: "9",
  title: "Salon 2050 wrap",
  channels: ["Instagram", "Facebook", "LinkedIn"],
  status: "posted",
  when: "Tue 12 Aug, 9:00am"
}, {
  id: "10",
  title: "Awabakal Country acknowledgement",
  channels: ["LinkedIn"],
  status: "posted",
  when: "Fri 1 Aug, 8:00am"
}];
const STATUS_TONE = {
  draft: "draft",
  scheduled: "scheduled",
  posted: "live"
};
function SocialsList() {
  const [tab, setTab] = React.useState("drafts");
  const [confirming, setConfirming] = React.useState(null);
  const [when, setWhen] = React.useState("");
  const rowActions = p => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
    variant: "row",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "Eye",
      size: 14,
      strokeWidth: 2.25
    })
  }, "Preview"), /*#__PURE__*/React.createElement(IconButton, {
    ariaLabel: "Duplicate to drafts"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "Copy",
    size: 16,
    strokeWidth: 2.25
  })), /*#__PURE__*/React.createElement(IconButton, {
    ariaLabel: "Delete post",
    tone: "danger",
    onClick: () => setConfirming(p)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "Trash2",
    size: 16,
    strokeWidth: 2.25
  })));
  const meta = (p, showStage) => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Badge, {
    tone: STATUS_TONE[p.status]
  }, p.status === "posted" ? "Posted" : p.status === "scheduled" ? "Scheduled" : "Draft"), /*#__PURE__*/React.createElement("span", null, p.channels.join(" · ")), p.when && /*#__PURE__*/React.createElement("span", null, p.when), p.updated && /*#__PURE__*/React.createElement(RowMeta, null, "edited ", p.updated));
  const drafts = ["ready", "polish", "early"].map(stage => ({
    stage,
    rows: POSTS.filter(p => p.stage === stage)
  })).filter(g => g.rows.length);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "20px"
    },
    "data-section": "red"
  }, /*#__PURE__*/React.createElement(PageHeader, {
    section: "red",
    eyebrow: "Community",
    title: "Socials",
    description: "Draft, design and approve posts for Instagram, Facebook and LinkedIn, then publish straight from here on any channel connected via Buffer.",
    actions: /*#__PURE__*/React.createElement(Modal, {
      title: "New social post",
      size: "wide",
      trigger: /*#__PURE__*/React.createElement(Button, {
        variant: "primary",
        icon: /*#__PURE__*/React.createElement(Icon, {
          name: "Plus",
          size: 14,
          strokeWidth: 2.25
        })
      }, "New post")
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: "16px"
      }
    }, /*#__PURE__*/React.createElement(Field, {
      label: "Title",
      hint: "Internal only \u2014 never goes out with the post."
    }, /*#__PURE__*/React.createElement(Input, {
      placeholder: "Signal speaker reveal \u2014 Dr Amara Chen"
    })), /*#__PURE__*/React.createElement(Field, {
      label: "Caption"
    }, /*#__PURE__*/React.createElement(Textarea, {
      rows: 4,
      placeholder: "Write the caption every channel gets by default\u2026"
    })), /*#__PURE__*/React.createElement(Field, {
      label: "Schedule date",
      hint: "Connected channels publish within 5 minutes of it. Leave empty to keep it a draft."
    }, /*#__PURE__*/React.createElement(DateTimePicker, {
      value: when,
      onChange: setWhen
    })), /*#__PURE__*/React.createElement(Field, {
      label: "Stage"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: "8px"
      }
    }, ["Early draft", "Needs polish", "Ready to schedule"].map((s, i) => /*#__PURE__*/React.createElement(Button, {
      key: s,
      variant: i === 0 ? "dark" : "secondary"
    }, s)))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "10px",
        borderTop: "1px solid var(--line)",
        paddingTop: "16px"
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary"
    }, "Cancel"), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: "Save",
        size: 14,
        strokeWidth: 2.25
      })
    }, "Save draft"))))
  }), /*#__PURE__*/React.createElement(StatChipGrid, {
    columns: 4
  }, /*#__PURE__*/React.createElement(StatChip, {
    value: "6",
    label: "Drafts"
  }), /*#__PURE__*/React.createElement(StatChip, {
    value: "2",
    label: "Scheduled"
  }), /*#__PURE__*/React.createElement(StatChip, {
    value: "14",
    label: "Posted, 28d"
  }), /*#__PURE__*/React.createElement(StatChip, {
    value: "3",
    label: "Channels live"
  })), /*#__PURE__*/React.createElement(TabBar, {
    tabs: [{
      key: "drafts",
      label: "Drafts",
      count: POSTS.length
    }, {
      key: "scheduled",
      label: "Scheduled",
      count: SCHEDULED.length
    }, {
      key: "posted",
      label: "Posted",
      count: POSTED.length
    }],
    active: tab,
    onSelect: setTab
  }), tab === "drafts" && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "16px"
    }
  }, drafts.map(g => /*#__PURE__*/React.createElement("div", {
    key: g.stage,
    style: {
      display: "grid",
      gap: "8px"
    }
  }, /*#__PURE__*/React.createElement(StageHeading, {
    stage: g.stage,
    count: g.rows.length
  }), /*#__PURE__*/React.createElement(DataList, null, g.rows.map((p, i) => /*#__PURE__*/React.createElement(DataRow, {
    key: p.id,
    first: i === 0,
    title: p.title,
    hoverColor: "var(--sec-red-ink)",
    meta: meta(p),
    actions: rowActions(p)
  })))))), tab === "scheduled" && /*#__PURE__*/React.createElement(DataList, null, SCHEDULED.map((p, i) => /*#__PURE__*/React.createElement(DataRow, {
    key: p.id,
    first: i === 0,
    title: p.title,
    hoverColor: "var(--sec-red-ink)",
    meta: meta(p),
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "row",
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: "Send",
        size: 14,
        strokeWidth: 2.25
      })
    }, "Publish now"), /*#__PURE__*/React.createElement(Button, {
      variant: "row"
    }, "Unschedule"), /*#__PURE__*/React.createElement(IconButton, {
      ariaLabel: "Delete post",
      tone: "danger",
      onClick: () => setConfirming(p)
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "Trash2",
      size: 16,
      strokeWidth: 2.25
    })))
  }))), tab === "posted" && /*#__PURE__*/React.createElement(DataList, null, POSTED.map((p, i) => /*#__PURE__*/React.createElement(DataRow, {
    key: p.id,
    first: i === 0,
    title: p.title,
    hoverColor: "var(--sec-red-ink)",
    meta: meta(p),
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "row",
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: "ExternalLink",
        size: 14,
        strokeWidth: 2.25
      })
    }, "Permalink"), /*#__PURE__*/React.createElement(Button, {
      variant: "row",
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: "Copy",
        size: 14,
        strokeWidth: 2.25
      })
    }, "Duplicate to drafts"))
  }))), /*#__PURE__*/React.createElement(ConfirmDialog, {
    open: !!confirming,
    title: "Delete this post?",
    tone: "danger",
    confirmLabel: "Delete",
    body: confirming ? `Delete “${confirming.title}”? Its media stays in the gallery. This can’t be undone.` : "",
    onConfirm: () => setConfirming(null),
    onCancel: () => setConfirming(null)
  }));
}
Object.assign(window, {
  SocialsList
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/SocialsList.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/nav.js
try { (() => {
const NAV_GROUPS = [{
  heading: "Overview",
  items: [{
    href: "/admin",
    label: "Dashboard",
    iconName: "LayoutDashboard",
    section: "grey"
  }, {
    href: "/admin/forms",
    label: "Forms",
    iconName: "Inbox",
    section: "grey"
  }]
}, {
  heading: "Content",
  items: [{
    href: "/admin/events",
    label: "Events",
    iconName: "CalendarDays",
    section: "yellow"
  }, {
    href: "/admin/talks",
    label: "Talks",
    iconName: "Film",
    section: "yellow"
  }, {
    href: "/admin/speakers",
    label: "Speakers",
    iconName: "Users",
    section: "yellow"
  }, {
    href: "/admin/team",
    label: "Team",
    iconName: "UserCircle",
    section: "yellow"
  }, {
    href: "/admin/sponsors",
    label: "Sponsors",
    iconName: "Building2",
    section: "yellow"
  }]
}, {
  heading: "Management",
  items: [{
    href: "/admin/partners",
    label: "Partners",
    iconName: "Handshake",
    section: "coast"
  }, {
    href: "/admin/media",
    label: "Media",
    iconName: "Megaphone",
    section: "coast"
  }, {
    href: "/admin/tickets",
    label: "Tickets",
    iconName: "Ticket",
    section: "coast"
  }, {
    href: "/admin/documents",
    label: "Documents",
    iconName: "FolderOpen",
    section: "coast"
  }]
}, {
  heading: "Community",
  items: [{
    href: "/admin/emails",
    label: "Quick email",
    iconName: "Send",
    section: "red"
  }, {
    href: "/admin/calendar",
    label: "Calendar",
    iconName: "CalendarRange",
    section: "red"
  }, {
    href: "/admin/socials",
    label: "Socials",
    iconName: "Share2",
    section: "red"
  }, {
    href: "/admin/newsletter",
    label: "Newsletter",
    iconName: "Newspaper",
    section: "red"
  }]
}, {
  heading: "Settings",
  items: [{
    href: "/admin/notifications",
    label: "Notifications",
    iconName: "Bell",
    section: "green"
  }, {
    href: "/admin/admins",
    label: "Admins",
    iconName: "ShieldCheck",
    section: "green"
  }]
}];
const FORMS = [{
  label: "Youth futures",
  count: 41
}, {
  label: "Student speaker",
  count: 18
}, {
  label: "Nominations",
  count: 27
}, {
  label: "Volunteers",
  count: 33
}, {
  label: "Sponsors",
  count: 9
}, {
  label: "Contact",
  count: 62
}];
window.NAV_GROUPS = NAV_GROUPS;
window.FORMS = FORMS;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/nav.js", error: String((e && e.message) || e) }); }

__ds_ns.DashboardTile = __ds_scope.DashboardTile;

__ds_ns.PulseTile = __ds_scope.PulseTile;

__ds_ns.PageHeader = __ds_scope.PageHeader;

__ds_ns.SectionLabel = __ds_scope.SectionLabel;

__ds_ns.SidebarNav = __ds_scope.SidebarNav;

__ds_ns.StageHeading = __ds_scope.StageHeading;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Flash = __ds_scope.Flash;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.NotSetUp = __ds_scope.NotSetUp;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.SkeletonBar = __ds_scope.SkeletonBar;

__ds_ns.PageSkeleton = __ds_scope.PageSkeleton;

__ds_ns.StatChip = __ds_scope.StatChip;

__ds_ns.StatChipGrid = __ds_scope.StatChipGrid;

__ds_ns.TabBar = __ds_scope.TabBar;

__ds_ns.DataList = __ds_scope.DataList;

__ds_ns.DataRow = __ds_scope.DataRow;

__ds_ns.RowMeta = __ds_scope.RowMeta;

__ds_ns.ConfirmDialog = __ds_scope.ConfirmDialog;

__ds_ns.PromptDialog = __ds_scope.PromptDialog;

__ds_ns.Modal = __ds_scope.Modal;

__ds_ns.DateTimePicker = __ds_scope.DateTimePicker;

__ds_ns.Field = __ds_scope.Field;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.AdvancedToggle = __ds_scope.AdvancedToggle;

})();

import React from "react";
import { Icon } from "../core/Icon.jsx";

const ON_DARK = {
  yellow: "var(--sec-yellow-on-dark)",
  coast: "var(--sec-coast-on-dark)",
  red: "var(--sec-red-on-dark)",
  green: "var(--sec-green-on-dark)",
  grey: "var(--sec-grey-on-dark)",
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
  gap: "8px",
};

/**
 * The near-black admin sidebar: brand lockup, grouped nav, signed-in footer.
 * The active item's accent (left bar + icon chip fill) is its SECTION's
 * on-dark hue, so the selected page matches its family everywhere else.
 */
export function SidebarNav({ groups, active, logoSrc, email = "will@tedxnewy.com.au", onNavigate }) {
  const [collapsed, setCollapsed] = React.useState({});
  const [hover, setHover] = React.useState(null);
  return (
    <aside
      style={{
        width: "var(--sidebar-w)",
        flexShrink: 0,
        background: "var(--sidebar-bg)",
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "24px",
        minHeight: "100%",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "grid", gap: "20px" }}>
        <div style={{ display: "grid", gap: "6px", justifyItems: "start" }}>
          {logoSrc ? (
            <img src={logoSrc} alt="TEDxNewy" style={{ height: "32px", width: "auto" }} />
          ) : (
            <span style={{ color: "#fff", fontSize: "18px", fontWeight: 600, letterSpacing: "-0.02em" }}>TEDxNewy</span>
          )}
          <span
            style={{
              paddingLeft: "12px",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-eyebrow-sidebar)",
              fontWeight: "var(--weight-semibold)",
              textTransform: "uppercase",
              letterSpacing: "var(--tracking-nav)",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            Admin
          </span>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {groups.map((group) => {
            const isOpen = collapsed[group.heading] === undefined ? true : collapsed[group.heading];
            return (
              <div key={group.heading} style={{ display: "grid", gap: "2px" }}>
                {group.collapsible ? (
                  <button type="button" aria-expanded={isOpen} onClick={() => setCollapsed((s) => ({ ...s, [group.heading]: !isOpen }))} style={{ ...headingStyle, cursor: "pointer" }}>
                    <span>{group.heading}</span>
                    <Icon name="ChevronRight" size={12} strokeWidth={2.5} style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform var(--dur-base)" }} />
                  </button>
                ) : (
                  <div style={headingStyle}>{group.heading}</div>
                )}
                {(!group.collapsible || isOpen) &&
                  group.items.map((item) => {
                    const isActive = item.href === active;
                    const accent = ON_DARK[item.section] || ON_DARK.grey;
                    const isHover = hover === item.href;
                    return (
                      <a
                        key={item.href}
                        href={item.href}
                        onClick={(e) => {
                          if (onNavigate) {
                            e.preventDefault();
                            onNavigate(item.href);
                          }
                        }}
                        onMouseEnter={() => setHover(item.href)}
                        onMouseLeave={() => setHover(null)}
                        style={{
                          position: "relative",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          borderRadius: "var(--radius-nav)",
                          padding: "5px 12px",
                          textDecoration: "none",
                          background: isActive ? "rgba(255,255,255,0.10)" : isHover ? "rgba(255,255,255,0.06)" : "transparent",
                          color: isActive || isHover ? "#fff" : "rgba(255,255,255,0.65)",
                          transition: "background-color var(--dur-base), color var(--dur-base)",
                        }}
                      >
                        <span
                          aria-hidden
                          style={{
                            position: "absolute",
                            left: 0,
                            top: "50%",
                            height: "20px",
                            width: isActive ? "3px" : 0,
                            transform: "translateY(-50%)",
                            borderRadius: "0 999px 999px 0",
                            background: isActive ? accent : "transparent",
                            transition: "width var(--dur-base)",
                          }}
                        />
                        <span
                          style={{
                            display: "inline-flex",
                            height: "24px",
                            width: "24px",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "6px",
                            background: isActive ? accent : "rgba(255,255,255,0.04)",
                            color: isActive ? "#111" : "rgba(255,255,255,0.55)",
                          }}
                        >
                          <Icon name={item.iconName} size={15} strokeWidth={2} />
                        </span>
                        <span style={{ flex: 1, fontSize: "12.5px", fontWeight: "var(--weight-medium)", letterSpacing: "-0.005em" }}>{item.label}</span>
                      </a>
                    );
                  })}
              </div>
            );
          })}
        </nav>
      </div>
      <div style={{ display: "grid", gap: "8px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "16px" }}>
        <a
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: "var(--radius-nav)",
            padding: "8px 12px",
            fontSize: "12.5px",
            fontWeight: "var(--weight-medium)",
            color: "rgba(255,255,255,0.55)",
            textDecoration: "none",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <Icon name="Home" size={14} strokeWidth={2} />
            View live site
          </span>
          <Icon name="ChevronRight" size={14} strokeWidth={2.25} />
        </a>
        <div style={{ borderRadius: "var(--radius-nav)", background: "rgba(255,255,255,0.04)", padding: "10px 12px" }}>
          <div style={{ fontSize: "11px", fontWeight: "var(--weight-medium)", color: "rgba(255,255,255,0.55)" }}>Signed in as</div>
          <div style={{ marginTop: "4px", fontSize: "12.5px", fontWeight: "var(--weight-medium)", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</div>
          <button
            type="button"
            style={{
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
              fontFamily: "var(--font-sans)",
            }}
          >
            <Icon name="LogOut" size={14} strokeWidth={2.25} />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}

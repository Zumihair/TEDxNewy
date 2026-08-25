import React from "react";

/**
 * Loading state = a skeleton matching the page's real layout, never a
 * spinner-only screen. `Bar` is the primitive; `PageSkeleton` is the
 * route-level shape (header + card rows) the admin ships.
 */
export function SkeletonBar({ width = "100%", height = 12, radius = "var(--radius-pill)" }) {
  return <div style={{ width, height, borderRadius: radius, background: "var(--wash)" }} />;
}

export function PageSkeleton({ rows = 3 }) {
  return (
    <div style={{ animation: "ds-pulse 2s cubic-bezier(0.4,0,0.6,1) infinite", display: "grid", gap: "32px" }}>
      <style>{"@keyframes ds-pulse{50%{opacity:.5}}"}</style>
      <div style={{ display: "grid", gap: "16px" }}>
        <SkeletonBar width="120px" height={12} />
        <SkeletonBar width="40%" height={36} radius="var(--radius-md)" />
        <SkeletonBar width="60%" height={16} />
      </div>
      <div style={{ display: "grid", gap: "16px" }}>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--line-strong)", background: "var(--surface-card)", padding: "20px", display: "grid", gap: "12px" }}>
            <SkeletonBar width="33%" height={16} />
            <SkeletonBar width="50%" height={12} />
          </div>
        ))}
      </div>
    </div>
  );
}

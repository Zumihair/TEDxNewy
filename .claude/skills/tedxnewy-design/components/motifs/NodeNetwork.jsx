import React from "react";

// Hand-placed so the constellation stays deliberate (no random => no drift).
const NODES = [[120,140],[340,90],[520,220],[250,320],[80,470],[440,430],[660,120],[770,340],[900,220],[1080,120],[1240,250],[1180,450],[980,470],[1350,130],[600,620],[300,600],[120,730],[430,800],[720,780],[900,680],[1120,660],[1300,790],[520,980],[980,900]];
const EDGES = [[0,1],[1,2],[2,3],[3,4],[3,5],[2,5],[1,6],[6,7],[7,8],[8,9],[9,13],[9,10],[10,11],[11,12],[12,7],[7,14],[5,14],[14,15],[15,3],[15,16],[16,17],[17,14],[14,18],[18,19],[19,12],[19,20],[20,11],[20,21],[21,13],[18,22],[17,22],[18,23],[23,19],[22,23]];

/** Ambient "nodes and edges" background motif for dark flagship sections. */
export function NodeNetwork({ variant = "light", opacity = 0.35, style }) {
  const color = variant === "light" ? "#ffffff" : "#141210";
  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity, ...style }}>
      <svg viewBox="0 0 1440 1024" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%" }}>
        <g className="salon-net-g">
          {EDGES.map(([a, b], i) => (
            <line key={i} x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]} stroke={color} strokeOpacity={0.5} strokeWidth={1} />
          ))}
          {NODES.map(([x, y], i) => (
            <circle key={i} className="salon-net-node" cx={x} cy={y} r={i % 4 === 0 ? 4 : 2.6} fill={color} style={{ animationDelay: `${(i % 7) * 0.9}s` }} />
          ))}
        </g>
      </svg>
    </div>
  );
}

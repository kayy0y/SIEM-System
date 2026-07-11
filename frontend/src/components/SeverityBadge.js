import React from "react";

const config = {
  critical: { bg: "rgba(239,68,68,0.1)", text: "#ef4444", border: "rgba(239,68,68,0.25)", dot: "#ef4444" },
  high:     { bg: "rgba(249,115,22,0.1)", text: "#f97316", border: "rgba(249,115,22,0.25)", dot: "#f97316" },
  medium:   { bg: "rgba(234,179,8,0.1)",  text: "#eab308", border: "rgba(234,179,8,0.25)",  dot: "#eab308" },
  low:      { bg: "rgba(34,197,94,0.1)",  text: "#22c55e", border: "rgba(34,197,94,0.25)",  dot: "#22c55e" },
};

export default function SeverityBadge({ severity }) {
  const s = severity?.toLowerCase() || "low";
  const c = config[s] || config.low;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "3px 9px", borderRadius: "5px", fontSize: "11px",
      fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px",
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      fontFamily: "'JetBrains Mono', monospace"
    }}>
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
      {s}
    </span>
  );
}

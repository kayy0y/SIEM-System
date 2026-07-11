import React from "react";

export default function StatCard({ title, value, icon: Icon, color = "#3b82f6", subtitle, critical }) {
  return (
    <div style={{
      background: "var(--bg-card)", borderRadius: "12px", padding: "20px",
      border: "1px solid var(--border)", position: "relative", overflow: "hidden",
      transition: "transform 0.15s, box-shadow 0.15s",
      ...(critical ? { borderColor: "rgba(239,68,68,0.3)", boxShadow: "0 0 0 1px rgba(239,68,68,0.15), 0 0 24px rgba(239,68,68,0.05)" } : {})
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.2)`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = critical ? "0 0 0 1px rgba(239,68,68,0.15), 0 0 24px rgba(239,68,68,0.05)" : ""; }}
    >
      {/* Gradient top bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "2px",
        background: critical ? "linear-gradient(90deg, #ef4444, #f97316)" : `linear-gradient(90deg, ${color}, ${color}88)`
      }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "10px" }}>{title}</div>
          <div style={{ color: "var(--text-primary)", fontSize: "28px", fontWeight: 700, lineHeight: 1, letterSpacing: "-1px" }}>{value?.toLocaleString()}</div>
          {subtitle && <div style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "6px" }}>{subtitle}</div>}
        </div>
        <div style={{
          width: "40px", height: "40px", borderRadius: "10px",
          background: critical ? "rgba(239,68,68,0.1)" : `${color}15`,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: `1px solid ${critical ? "rgba(239,68,68,0.2)" : `${color}25`}`,
          flexShrink: 0
        }}>
          <Icon size={18} color={critical ? "#ef4444" : color} />
        </div>
      </div>
    </div>
  );
}

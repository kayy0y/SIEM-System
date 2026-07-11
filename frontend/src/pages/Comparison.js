import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import API from "../utils/api";

export default function Comparison() {
  const [data, setData] = useState(null);
  useEffect(() => { API.get("/comparison").then(r => setData(r.data)).catch(console.error); }, []);

  if (!data) return <div style={{ color: "var(--text-muted)", paddingTop: "60px", textAlign: "center" }}>Loading...</div>;

  const tools = data.tools;
  const isMine = (t) => t.name.includes("This System") || t.name.includes("Your");
  const shortName = (t) => isMine(t) ? "This System" : t.name;

  const chartData = tools.map(t => ({
    name: shortName(t),
    "Detection Rate": +(t.detection_rate * 100).toFixed(1),
    "Accuracy": +(t.accuracy * 100).toFixed(1),
    "False Positive": +(t.false_positive * 100).toFixed(1),
  }));

  const rows = [
    { label: "Detection Rate", key: "detection_rate", fmt: v => `${(v*100).toFixed(0)}%` },
    { label: "Accuracy",       key: "accuracy",       fmt: v => `${(v*100).toFixed(0)}%` },
    { label: "False Positive", key: "false_positive", fmt: v => `${(v*100).toFixed(0)}%` },
    { label: "Response Time",  key: "response_time",  fmt: v => v },
    { label: "Cost",           key: "cost",           fmt: v => v },
    { label: "AI Features",    key: "ai_features",    fmt: v => v ? "✅" : "❌" },
    { label: "Automation",     key: "automation",     fmt: v => v },
  ];

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Benchmarking</div>
        <h1 style={{ color: "var(--text-primary)", fontSize: "22px", fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>SIEM Comparison</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>This system vs commercial SIEM solutions</p>
      </div>

      {/* Chart */}
      <div style={{ background: "var(--bg-card)", borderRadius: "12px", padding: "20px", border: "1px solid var(--border)", marginBottom: "16px" }}>
        <h3 style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 600, marginBottom: "16px" }}>Performance (%)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} barGap={3}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "8px", fontSize: 12 }} />
            <Legend wrapperStyle={{ color: "var(--text-muted)", fontSize: 12 }} />
            <Bar dataKey="Detection Rate" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Accuracy" fill="#22c55e" radius={[3, 3, 0, 0]} />
            <Bar dataKey="False Positive" fill="#ef4444" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Comparison table - sharp */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
              <th style={{ padding: "11px 16px", color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.6px" }}>Feature</th>
              {tools.map(t => (
                <th key={t.name} style={{
                  padding: "11px 16px", fontSize: "12px", fontWeight: 700, textAlign: "center",
                  color: isMine(t) ? "#8b5cf6" : "var(--text-secondary)",
                  background: isMine(t) ? "rgba(139,92,246,0.06)" : "transparent"
                }}>{shortName(t)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ label, key, fmt }, i) => (
              <tr key={label} style={{ borderTop: "1px solid var(--border-subtle)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                <td style={{ padding: "10px 16px", color: "var(--text-secondary)", fontSize: "12px", fontWeight: 500 }}>{label}</td>
                {tools.map(t => (
                  <td key={t.name} style={{
                    padding: "10px 16px", textAlign: "center", fontSize: "12px",
                    color: isMine(t) ? "#a78bfa" : "var(--text-primary)",
                    fontWeight: isMine(t) ? 700 : 400,
                    background: isMine(t) ? "rgba(139,92,246,0.04)" : "transparent",
                    fontFamily: typeof t[key] === "number" ? "'JetBrains Mono', monospace" : "inherit"
                  }}>
                    {fmt(t[key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{
        marginTop: "12px", background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)",
        borderRadius: "8px", padding: "12px 16px"
      }}>
        <p style={{ color: "#a78bfa", fontSize: "12px", margin: 0, lineHeight: 1.6 }}>
          <strong>Note:</strong> Commercial SIEM figures are industry benchmarks. This system's metrics are live-computed from the trained ML model. Performance improves as more real log data is uploaded.
        </p>
      </div>
    </div>
  );
}

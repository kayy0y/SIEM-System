import React, { useState, useEffect } from "react";
import { Brain, RefreshCw, Cpu, Zap } from "lucide-react";
import API from "../utils/api";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";

export default function ThreatDetection() {
  const [metrics, setMetrics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [retrainMsg, setRetrainMsg] = useState("");

  useEffect(() => {
    Promise.all([API.get("/ml/metrics"), API.get("/logs", { params: { limit: 30 } })])
      .then(([m, l]) => { setMetrics(m.data); setLogs(l.data.logs); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const retrain = async () => {
    setRetraining(true); setRetrainMsg("");
    try {
      const res = await API.post("/ml/retrain");
      setRetrainMsg("success:Model retrained successfully");
      setMetrics(res.data.metrics);
    } catch (e) { setRetrainMsg("error:" + (e.response?.data?.detail || "Admin access required")); }
    finally { setRetraining(false); }
  };

  const radarData = metrics ? [
    { metric: "Accuracy", value: +(metrics.accuracy * 100).toFixed(1) },
    { metric: "Precision", value: +(metrics.precision * 100).toFixed(1) },
    { metric: "Recall", value: +(metrics.recall * 100).toFixed(1) },
    { metric: "F1 Score", value: +(metrics.f1_score * 100).toFixed(1) },
  ] : [];

  const MetricPill = ({ label, value, desc }) => {
    const pct = value * 100;
    const color = pct > 85 ? "#22c55e" : pct > 70 ? "#f59e0b" : "#ef4444";
    return (
      <div style={{ background: "var(--bg-elevated)", borderRadius: "10px", padding: "16px", border: "1px solid var(--border)" }}>
        <div style={{ color: "var(--text-muted)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "8px" }}>{label}</div>
        <div style={{ fontSize: "26px", fontWeight: 700, color, letterSpacing: "-1px", marginBottom: "4px", fontFamily: "'JetBrains Mono', monospace" }}>
          {pct.toFixed(1)}<span style={{ fontSize: "14px" }}>%</span>
        </div>
        <div style={{ height: "3px", background: "var(--border)", borderRadius: "2px" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "2px", transition: "width 0.5s" }} />
        </div>
        <div style={{ color: "var(--text-muted)", fontSize: "10px", marginTop: "6px" }}>{desc}</div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>AI Engine</div>
          <h1 style={{ color: "var(--text-primary)", fontSize: "22px", fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>Threat Detection</h1>
        </div>
        <button onClick={retrain} disabled={retraining} style={{
          display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px",
          background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
          border: "none", borderRadius: "8px", color: "white",
          cursor: "pointer", fontSize: "12px", fontWeight: 600,
          opacity: retraining ? 0.65 : 1, boxShadow: "0 2px 10px rgba(59,130,246,0.2)"
        }}>
          <RefreshCw size={13} /> {retraining ? "Retraining..." : "Retrain Model"}
        </button>
      </div>

      {retrainMsg && (() => {
        const [type, msg] = retrainMsg.split(":");
        return (
          <div style={{
            background: type === "success" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
            border: `1px solid ${type === "success" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
            borderRadius: "8px", padding: "10px 14px",
            color: type === "success" ? "#22c55e" : "#ef4444",
            fontSize: "13px", marginBottom: "20px"
          }}>{msg}</div>
        );
      })()}

      {loading ? (
        <div style={{ color: "var(--text-muted)", textAlign: "center", paddingTop: "60px" }}>Loading ML metrics...</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            {/* Metrics */}
            <div style={{ background: "var(--bg-card)", borderRadius: "12px", padding: "20px", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "16px" }}>
                <Brain size={15} color="#8b5cf6" />
                <h3 style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 600, margin: 0 }}>Model Performance</h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <MetricPill label="Accuracy" value={metrics?.accuracy || 0} desc="Overall correctness" />
                <MetricPill label="Precision" value={metrics?.precision || 0} desc="True positive rate" />
                <MetricPill label="Recall" value={metrics?.recall || 0} desc="Threat catch rate" />
                <MetricPill label="F1 Score" value={metrics?.f1_score || 0} desc="Balanced score" />
              </div>
            </div>

            {/* Radar */}
            <div style={{ background: "var(--bg-card)", borderRadius: "12px", padding: "20px", border: "1px solid var(--border)" }}>
              <h3 style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 600, marginBottom: "12px" }}>Radar View</h3>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                  <Radar name="Model" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Algorithms */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            {[
              { icon: Cpu, name: "Isolation Forest", color: "#3b82f6", type: "Unsupervised", desc: "Detects anomalies by randomly isolating observations. No labelled data needed. Outputs: Normal or Anomaly with confidence score.", use: "Unknown / zero-day threats" },
              { icon: Zap, name: "Random Forest", color: "#8b5cf6", type: "Supervised", desc: "100 decision trees voting on threat classification. Trained on labelled attack pattern data. Outputs: Threat category with probability.", use: "Known attack classification" },
            ].map(({ icon: Icon, name, color, type, desc, use }) => (
              <div key={name} style={{
                background: "var(--bg-card)", borderRadius: "12px", padding: "18px",
                border: "1px solid var(--border)",
                position: "relative", overflow: "hidden"
              }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, ${color}, ${color}44)` }} />
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: `${color}15`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={14} color={color} />
                  </div>
                  <div>
                    <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "13px" }}>{name}</div>
                    <div style={{ color, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{type}</div>
                  </div>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "12px", lineHeight: 1.6, marginBottom: "10px" }}>{desc}</p>
                <div style={{ background: `${color}10`, border: `1px solid ${color}25`, borderRadius: "6px", padding: "5px 10px", color, fontSize: "11px", fontWeight: 600 }}>
                  Use case: {use}
                </div>
              </div>
            ))}
          </div>

          {/* Recent logs table */}
          <div style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
              <h3 style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 600, margin: 0 }}>
                Recent Parsed Logs <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({logs.length})</span>
              </h3>
            </div>
            {logs.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>No logs yet. Upload a log file first.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {["Timestamp", "IP", "Event", "Severity", "Country", "Source"].map(h => (
                        <th key={h} style={{ padding: "8px 14px", color: "var(--text-muted)", fontSize: "10px", fontWeight: 700, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.6px" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((l, i) => (
                      <tr key={l.id} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: "9px 14px", color: "var(--text-muted)", fontSize: "11px", fontFamily: "monospace" }}>{l.timestamp?.slice(0, 16)}</td>
                        <td style={{ padding: "9px 14px", color: "var(--accent-blue)", fontSize: "11px", fontFamily: "monospace", fontWeight: 500 }}>{l.ip_address}</td>
                        <td style={{ padding: "9px 14px", color: "var(--text-primary)", fontSize: "12px" }}>{l.event_type}</td>
                        <td style={{ padding: "9px 14px" }}>
                          <span style={{
                            fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
                            color: l.severity === "critical" ? "#ef4444" : l.severity === "high" ? "#f97316" : l.severity === "medium" ? "#eab308" : "#22c55e"
                          }}>{l.severity}</span>
                        </td>
                        <td style={{ padding: "9px 14px", color: "var(--text-muted)", fontSize: "11px" }}>{l.country}</td>
                        <td style={{ padding: "9px 14px", color: "var(--text-muted)", fontSize: "11px" }}>{l.source_file}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

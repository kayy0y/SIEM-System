import React, { useState, useEffect, useCallback } from "react";
import { Search, RefreshCw, Eye, CheckCircle, Ban, Filter } from "lucide-react";
import API from "../utils/api";
import SeverityBadge from "../components/SeverityBadge";

const STATUS_CFG = {
  open:          { color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  investigating: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  safe:          { color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
  blocked:       { color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
};

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ severity: "", status: "" });
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.severity) params.severity = filter.severity;
      if (filter.status) params.status = filter.status;
      const res = await API.get("/alerts", { params });
      setAlerts(res.data.alerts); setTotal(res.data.total);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const doAction = async (id, action) => {
    setActionLoading(`${id}-${action}`);
    try { await API.put(`/alerts/${id}/action`, { action }); fetchAlerts(); }
    catch (e) { alert(e.response?.data?.detail || "Action failed"); }
    finally { setActionLoading(null); }
  };

  const filtered = alerts.filter(a =>
    !search || a.ip_address?.includes(search) || a.threat_type?.toLowerCase().includes(search.toLowerCase())
  );

  const selectStyle = {
    padding: "8px 12px", background: "var(--bg-elevated)", border: "1px solid var(--border)",
    borderRadius: "8px", color: "var(--text-primary)", fontSize: "12px", cursor: "pointer", outline: "none"
  };

  return (
    <div>
      <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Security</div>
          <h1 style={{ color: "var(--text-primary)", fontSize: "22px", fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>Alert Center</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{total} alerts</span>
          <button onClick={fetchAlerts} style={{
            display: "flex", alignItems: "center", gap: "6px", padding: "7px 12px",
            background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "8px",
            color: "var(--text-secondary)", cursor: "pointer", fontSize: "12px"
          }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <Search size={13} style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input placeholder="Search IP or threat type..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "8px 12px 8px 32px", background: "var(--bg-elevated)",
              border: "1px solid var(--border)", borderRadius: "8px",
              color: "var(--text-primary)", fontSize: "12px", outline: "none", boxSizing: "border-box"
            }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)" }}>
          <Filter size={13} />
        </div>
        <select value={filter.severity} onChange={e => setFilter(f => ({ ...f, severity: e.target.value }))} style={selectStyle}>
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))} style={selectStyle}>
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="investigating">Investigating</option>
          <option value="safe">Safe</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "0px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
                {["Time", "IP Address", "Threat Type", "Severity", "Confidence", "Score", "Status", "Actions"].map(h => (
                  <th key={h} style={{
                    padding: "10px 14px", color: "var(--text-muted)", fontSize: "11px",
                    fontWeight: 700, textAlign: "left", whiteSpace: "nowrap",
                    textTransform: "uppercase", letterSpacing: "0.6px"
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>Loading alerts...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                  No alerts found. Upload logs to generate detections.
                </td></tr>
              ) : filtered.map((a, idx) => (
                <tr key={a.id} style={{
                  borderBottom: "1px solid var(--border-subtle)",
                  background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                  transition: "background 0.1s"
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elevated)"}
                  onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)"}
                >
                  <td style={{ padding: "11px 14px", color: "var(--text-muted)", fontSize: "12px", whiteSpace: "nowrap", fontFamily: "'JetBrains Mono', monospace" }}>
                    {a.timestamp?.slice(0, 16)}
                  </td>
                  <td style={{ padding: "11px 14px", color: "var(--accent-blue)", fontSize: "12px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>
                    {a.ip_address}
                  </td>
                  <td style={{ padding: "11px 14px", color: "var(--text-primary)", fontSize: "13px" }}>{a.threat_type}</td>
                  <td style={{ padding: "11px 14px" }}><SeverityBadge severity={a.severity} /></td>
                  <td style={{ padding: "11px 14px", color: "var(--text-secondary)", fontSize: "12px", fontFamily: "'JetBrains Mono', monospace" }}>
                    {(a.confidence * 100).toFixed(0)}%
                  </td>
                  <td style={{ padding: "11px 14px", minWidth: "90px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ flex: 1, height: "3px", background: "var(--border)", borderRadius: "2px" }}>
                        <div style={{
                          height: "100%", borderRadius: "2px", width: `${Math.min(a.score, 100)}%`,
                          background: a.score > 80 ? "#ef4444" : a.score > 60 ? "#f97316" : "#22c55e",
                          transition: "width 0.3s"
                        }} />
                      </div>
                      <span style={{ color: "var(--text-muted)", fontSize: "10px", fontFamily: "monospace", minWidth: "22px" }}>{a.score?.toFixed(0)}</span>
                    </div>
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    {(() => {
                      const cfg = STATUS_CFG[a.status] || STATUS_CFG.open;
                      return (
                        <span style={{
                          padding: "2px 9px", borderRadius: "4px", fontSize: "10px",
                          fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px",
                          color: cfg.color, background: cfg.bg
                        }}>{a.status}</span>
                      );
                    })()}
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    {a.status === "open" && (
                      <div style={{ display: "flex", gap: "5px" }}>
                        {[
                          { action: "investigate", icon: Eye, color: "#3b82f6", title: "Investigate" },
                          { action: "safe", icon: CheckCircle, color: "#22c55e", title: "Mark Safe" },
                          { action: "block", icon: Ban, color: "#ef4444", title: "Block IP" },
                        ].map(({ action, icon: Icon, color, title }) => (
                          <button key={action} onClick={() => doAction(a.id, action)}
                            disabled={actionLoading === `${a.id}-${action}`} title={title}
                            style={{
                              padding: "5px 6px", background: `${color}12`,
                              border: `1px solid ${color}30`, borderRadius: "5px",
                              cursor: "pointer", display: "flex", alignItems: "center",
                              transition: "all 0.15s"
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = `${color}22`; e.currentTarget.style.borderColor = `${color}60`; }}
                            onMouseLeave={e => { e.currentTarget.style.background = `${color}12`; e.currentTarget.style.borderColor = `${color}30`; }}
                          >
                            <Icon size={13} color={color} />
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

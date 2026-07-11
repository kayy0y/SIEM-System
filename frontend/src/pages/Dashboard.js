import React, { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Shield, AlertTriangle, Activity, Ban, Bell, TrendingUp } from "lucide-react";
import API from "../utils/api";
import StatCard from "../components/StatCard";

const PIE_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#06b6d4"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 14px" }}>
      <p style={{ color: "var(--text-muted)", fontSize: "11px", marginBottom: "4px" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || "var(--text-primary)", fontSize: "13px", fontWeight: 600 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [attackTypes, setAttackTypes] = useState([]);
  const [topIPs, setTopIPs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAll = async () => {
    try {
      const [s, t, a, i] = await Promise.all([
        API.get("/dashboard/stats"),
        API.get("/dashboard/threat-trend"),
        API.get("/dashboard/attack-types"),
        API.get("/dashboard/top-ips"),
      ]);
      setStats(s.data); setTrend(t.data); setAttackTypes(a.data); setTopIPs(i.data);
      setLastUpdated(new Date());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); const i = setInterval(fetchAll, 10000); return () => clearInterval(i); }, []);

  const axisStyle = { fill: "var(--text-muted)", fontSize: 11 };
  const gridStyle = { stroke: "var(--border)", strokeDasharray: "3 3" };

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Overview</div>
          <h1 style={{ color: "var(--text-primary)", fontSize: "22px", fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>Security Dashboard</h1>
        </div>
        {lastUpdated && (
          <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px" }}>
            <Activity size={11} /> Updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ color: "var(--text-muted)", textAlign: "center", paddingTop: "60px" }}>Loading...</div>
      ) : (
        <>
          {/* Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginBottom: "24px" }}>
            <StatCard title="Total Logs" value={stats?.total_logs ?? 0} icon={Activity} color="#3b82f6" />
            <StatCard title="Threats Today" value={stats?.threats_today ?? 0} icon={TrendingUp} color="#f97316" />
            <StatCard title="Critical Alerts" value={stats?.critical_alerts ?? 0} icon={Shield} color="#ef4444" subtitle="Open & unresolved" critical={stats?.critical_alerts > 0} />
            <StatCard title="Blocked IPs" value={stats?.blocked_ips ?? 0} icon={Ban} color="#8b5cf6" />
            <StatCard title="Open Alerts" value={stats?.open_alerts ?? 0} icon={Bell} color="#eab308" />
          </div>

          {/* Charts row 1 */}
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "14px", marginBottom: "14px" }}>
            {/* Trend line */}
            <div style={{ background: "var(--bg-card)", borderRadius: "12px", padding: "20px", border: "1px solid var(--border)" }}>
              <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 600, margin: 0 }}>Threat Trend</h3>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Last 7 days</span>
              </div>
              {trend.length === 0 ? (
                <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                  Upload logs to see trends
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={trend}>
                    <defs>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid {...gridStyle} />
                    <XAxis dataKey="date" tick={axisStyle} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={axisStyle} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="threats" stroke="url(#lineGrad)" strokeWidth={2.5} dot={{ fill: "#3b82f6", r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Pie chart */}
            <div style={{ background: "var(--bg-card)", borderRadius: "12px", padding: "20px", border: "1px solid var(--border)" }}>
              <h3 style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 600, marginBottom: "16px" }}>Attack Types</h3>
              {attackTypes.length === 0 ? (
                <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "13px" }}>No data yet</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie data={attackTypes} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                        {attackTypes.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                    {attackTypes.slice(0, 4).map((a, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{a.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Top IPs bar */}
          <div style={{ background: "var(--bg-card)", borderRadius: "12px", padding: "20px", border: "1px solid var(--border)" }}>
            <h3 style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 600, marginBottom: "16px" }}>Top Threat Source IPs</h3>
            {topIPs.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>No IP data yet. Upload logs first.</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topIPs} layout="vertical">
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...gridStyle} horizontal={false} />
                  <XAxis type="number" tick={axisStyle} />
                  <YAxis type="category" dataKey="ip" width={115} tick={{ ...axisStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="url(#barGrad)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </div>
  );
}

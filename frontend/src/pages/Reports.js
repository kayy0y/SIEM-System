import React, { useState } from "react";
import { FileText, Download, CheckCircle } from "lucide-react";
import API from "../utils/api";

export default function Reports() {
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const downloadReport = async () => {
    setGenerating(true); setDone(false);
    try {
      const res = await API.get("/reports/generate", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url; a.download = `siem_report_${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click(); window.URL.revokeObjectURL(url);
      setDone(true);
    } catch { alert("Report generation failed"); }
    finally { setGenerating(false); }
  };

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Output</div>
        <h1 style={{ color: "var(--text-primary)", fontSize: "22px", fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>Incident Reports</h1>
      </div>

      <div style={{ maxWidth: "520px" }}>
        <div style={{
          background: "var(--bg-card)", borderRadius: "12px", padding: "32px",
          border: "1px solid var(--border)", position: "relative", overflow: "hidden"
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4)" }} />

          <div style={{
            width: "52px", height: "52px", background: "rgba(59,130,246,0.1)",
            border: "1px solid rgba(59,130,246,0.2)", borderRadius: "12px",
            display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "18px"
          }}>
            <FileText size={24} color="#3b82f6" />
          </div>

          <h2 style={{ color: "var(--text-primary)", fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>
            Generate Incident Report
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: 1.6, marginBottom: "20px" }}>
            Auto-generates a PDF containing executive summary, AI model performance metrics,
            top 20 threat alerts, and security recommendations.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "24px" }}>
            {["Executive Summary", "AI Model Metrics", "Top 20 Alerts", "Recommendations"].map(item => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-secondary)" }}>
                <CheckCircle size={12} color="#22c55e" /> {item}
              </div>
            ))}
          </div>

          {done && (
            <div style={{
              background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: "8px", padding: "9px 12px", color: "#22c55e",
              fontSize: "12px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px"
            }}>
              <CheckCircle size={13} /> Report downloaded successfully
            </div>
          )}

          <button onClick={downloadReport} disabled={generating} style={{
            display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px",
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            border: "none", borderRadius: "8px", color: "white", fontSize: "13px",
            fontWeight: 600, cursor: "pointer", opacity: generating ? 0.7 : 1,
            boxShadow: "0 4px 14px rgba(59,130,246,0.25)"
          }}>
            <Download size={15} />
            {generating ? "Generating..." : "Download PDF Report"}
          </button>
        </div>
      </div>
    </div>
  );
}

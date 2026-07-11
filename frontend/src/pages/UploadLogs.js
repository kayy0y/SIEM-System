import React, { useState, useRef } from "react";
import { Upload, CheckCircle, XCircle, FileText, Terminal } from "lucide-react";
import API from "../utils/api";

export default function UploadLogs() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  const inputRef = useRef();

  const handleFile = (f) => { setFile(f); setResult(null); setError(""); };
  const handleDrop = (e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setError("");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await API.post("/logs/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
      setResult(res.data); setFile(null);
    } catch (err) { setError(err.response?.data?.detail || "Upload failed"); }
    finally { setUploading(false); }
  };

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Ingestion</div>
        <h1 style={{ color: "var(--text-primary)", fontSize: "22px", fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>Upload Logs</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>
          .log &nbsp;·&nbsp; .txt &nbsp;·&nbsp; .csv &nbsp;·&nbsp; .json — Windows, Linux, Apache, Nginx, Firewall
        </p>
      </div>

      <div style={{ maxWidth: "640px" }}>
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current.click()}
          style={{
            border: `2px dashed ${drag ? "#3b82f6" : "var(--border)"}`,
            borderRadius: "12px", padding: "52px 24px", textAlign: "center",
            cursor: "pointer", transition: "all 0.2s",
            background: drag ? "rgba(59,130,246,0.04)" : "var(--bg-card)",
            marginBottom: "16px",
            boxShadow: drag ? "0 0 0 4px rgba(59,130,246,0.08)" : "none"
          }}
        >
          <input ref={inputRef} type="file" accept=".log,.txt,.csv,.json" hidden
            onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
          <div style={{
            width: "48px", height: "48px", borderRadius: "12px",
            background: drag ? "rgba(59,130,246,0.15)" : "var(--bg-elevated)",
            border: `1px solid ${drag ? "rgba(59,130,246,0.3)" : "var(--border)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px", transition: "all 0.2s"
          }}>
            <Upload size={20} color={drag ? "#3b82f6" : "var(--text-muted)"} />
          </div>
          <p style={{ color: file ? "var(--text-primary)" : "var(--text-secondary)", fontSize: "14px", fontWeight: file ? 600 : 400, margin: 0 }}>
            {file ? file.name : "Drop your log file here, or click to browse"}
          </p>
          {file && (
            <p style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "4px", fontFamily: "monospace" }}>
              {(file.size / 1024).toFixed(1)} KB
            </p>
          )}
          {!file && <p style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "6px" }}>Supports .log .txt .csv .json</p>}
        </div>

        {error && (
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "8px", padding: "11px 14px", color: "#ef4444",
            fontSize: "13px", marginBottom: "14px"
          }}>
            <XCircle size={15} /> {error}
          </div>
        )}

        {result && (
          <div style={{
            background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)",
            borderRadius: "12px", padding: "16px", marginBottom: "16px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px", color: "#22c55e", fontWeight: 600, fontSize: "13px", marginBottom: "12px" }}>
              <CheckCircle size={16} /> Logs analyzed successfully
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              {[
                { label: "File", value: result.filename },
                { label: "Logs Parsed", value: result.logs_parsed },
                { label: "Alerts Generated", value: result.alerts_created },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: "var(--bg-elevated)", borderRadius: "8px", padding: "10px 12px", border: "1px solid var(--border)" }}>
                  <div style={{ color: "var(--text-muted)", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>{label}</div>
                  <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "15px", wordBreak: "break-all" }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={handleUpload} disabled={!file || uploading}
          style={{
            padding: "10px 24px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            border: "none", borderRadius: "8px", color: "white", fontSize: "13px",
            fontWeight: 600, cursor: file ? "pointer" : "not-allowed",
            opacity: (!file || uploading) ? 0.5 : 1, marginBottom: "28px",
            boxShadow: file ? "0 4px 14px rgba(59,130,246,0.25)" : "none"
          }}>
          {uploading ? "Analyzing..." : "Analyze Logs"}
        </button>

        {/* Sample format */}
        <div style={{ background: "var(--bg-card)", borderRadius: "12px", padding: "18px", border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600, marginBottom: "12px" }}>
            <Terminal size={13} /> Supported log formats
          </div>
          <pre style={{
            color: "var(--text-muted)", fontSize: "11px", background: "var(--bg-elevated)",
            borderRadius: "6px", padding: "12px", overflowX: "auto", margin: 0,
            fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6
          }}>
{`# Linux SSH log
Jun 28 10:32:01 server sshd: Failed password for root from 185.220.101.5

# Apache access log
192.168.1.1 - - [28/Jun/2024] "GET /admin HTTP/1.1" 403 512

# CSV
timestamp,ip,user,event,severity
2024-06-28,192.168.1.1,admin,failed login,high

# JSON
{"timestamp":"2024-06-28T10:32:01","ip":"10.0.0.1","event":"port scan"}`}
          </pre>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Shield, Eye, EyeOff, Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg-primary)",
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden"
    }}>
      {/* Background grid */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.03,
        backgroundImage: "linear-gradient(var(--accent-blue) 1px, transparent 1px), linear-gradient(90deg, var(--accent-blue) 1px, transparent 1px)",
        backgroundSize: "40px 40px"
      }} />

      {/* Glow orbs */}
      <div style={{ position: "absolute", top: "20%", left: "10%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "20%", right: "10%", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Theme toggle top right */}
      <button onClick={toggle} style={{
        position: "absolute", top: "20px", right: "20px",
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: "8px", padding: "8px 12px", cursor: "pointer",
        color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px"
      }}>
        {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        {theme === "dark" ? "Light mode" : "Dark mode"}
      </button>

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: "400px", position: "relative", zIndex: 1, padding: "16px"
      }}>
        <div style={{
          background: "var(--bg-card)", borderRadius: "16px", padding: "36px",
          border: "1px solid var(--border)",
          boxShadow: "0 0 0 1px rgba(59,130,246,0.1), 0 20px 60px rgba(0,0,0,0.3)"
        }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{
              width: "52px", height: "52px", borderRadius: "14px",
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 14px", boxShadow: "0 0 24px rgba(59,130,246,0.3)"
            }}>
              <Shield size={24} color="white" />
            </div>
            <h1 style={{ color: "var(--text-primary)", fontSize: "20px", fontWeight: 700, letterSpacing: "-0.5px", margin: 0 }}>
              SIEM<span style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>.ai</span>
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>AI-Powered Threat Detection</p>
          </div>

          {error && (
            <div style={{
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "8px", padding: "10px 14px", color: "#ef4444",
              fontSize: "13px", marginBottom: "20px"
            }}>{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            {[
              { label: "Username", value: username, set: setUsername, type: "text", placeholder: "admin" },
            ].map(({ label, value, set, type, placeholder }) => (
              <div key={label} style={{ marginBottom: "14px" }}>
                <label style={{ color: "var(--text-secondary)", fontSize: "12px", fontWeight: 500, display: "block", marginBottom: "6px" }}>{label}</label>
                <input type={type} value={value} onChange={e => set(e.target.value)}
                  placeholder={placeholder} required
                  style={{
                    width: "100%", padding: "10px 14px",
                    background: "var(--bg-elevated)", border: "1px solid var(--border)",
                    borderRadius: "8px", color: "var(--text-primary)", fontSize: "14px",
                    outline: "none", transition: "border-color 0.15s", boxSizing: "border-box"
                  }}
                  onFocus={e => e.target.style.borderColor = "#3b82f6"}
                  onBlur={e => e.target.style.borderColor = "var(--border)"}
                />
              </div>
            ))}

            <div style={{ marginBottom: "24px" }}>
              <label style={{ color: "var(--text-secondary)", fontSize: "12px", fontWeight: 500, display: "block", marginBottom: "6px" }}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  style={{
                    width: "100%", padding: "10px 40px 10px 14px",
                    background: "var(--bg-elevated)", border: "1px solid var(--border)",
                    borderRadius: "8px", color: "var(--text-primary)", fontSize: "14px",
                    outline: "none", transition: "border-color 0.15s", boxSizing: "border-box"
                  }}
                  onFocus={e => e.target.style.borderColor = "#3b82f6"}
                  onBlur={e => e.target.style.borderColor = "var(--border)"}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{
                  position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)"
                }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: "100%", padding: "11px",
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              border: "none", borderRadius: "8px", color: "white",
              fontSize: "14px", fontWeight: 600, cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.75 : 1, transition: "opacity 0.15s",
              boxShadow: "0 4px 16px rgba(59,130,246,0.25)"
            }}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div style={{
            marginTop: "20px", padding: "12px 14px", background: "var(--bg-elevated)",
            borderRadius: "8px", border: "1px solid var(--border)"
          }}>
            <p style={{ color: "var(--text-muted)", fontSize: "11px", margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
              admin / admin123 &nbsp;·&nbsp; analyst / analyst123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

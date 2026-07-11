import React from "react";
import { Menu, Sun, Moon, Bell, Shield } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

export default function Topbar({ onToggleSidebar }) {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();

  return (
    <header style={{
      position: "fixed", top: 0, right: 0, left: 0, height: "56px", zIndex: 200,
      background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)",
      display: "flex", alignItems: "center", padding: "0 20px", gap: "12px",
    }}>
      {/* Hamburger */}
      <button onClick={onToggleSidebar} style={{
        background: "none", border: "none", cursor: "pointer",
        color: "var(--text-secondary)", padding: "6px", borderRadius: "6px",
        display: "flex", alignItems: "center", transition: "all 0.15s",
      }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elevated)"}
        onMouseLeave={e => e.currentTarget.style.background = "none"}
      >
        <Menu size={20} />
      </button>

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{
          width: "28px", height: "28px", borderRadius: "7px",
          background: "var(--grad-main)", display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <Shield size={14} color="white" />
        </div>
        <span style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)", letterSpacing: "-0.3px" }}>
          SIEM<span style={{ background: "var(--grad-main)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>.ai</span>
        </span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Live indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <div style={{
          width: "7px", height: "7px", borderRadius: "50%", background: "#22c55e",
          boxShadow: "0 0 0 2px rgba(34,197,94,0.2)",
          animation: "pulse 2s infinite"
        }} />
        <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>Live</span>
      </div>

      <style>{`@keyframes pulse { 0%,100%{box-shadow:0 0 0 2px rgba(34,197,94,0.2)} 50%{box-shadow:0 0 0 5px rgba(34,197,94,0.1)} }`}</style>

      {/* Theme toggle */}
      <button onClick={toggle} style={{
        background: "var(--bg-elevated)", border: "1px solid var(--border)",
        borderRadius: "8px", padding: "6px 10px", cursor: "pointer",
        color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px",
        fontSize: "12px", fontWeight: 500, transition: "all 0.15s"
      }}>
        {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        {theme === "dark" ? "Light" : "Dark"}
      </button>

      {/* User chip */}
      <div style={{
        display: "flex", alignItems: "center", gap: "8px",
        background: "var(--bg-elevated)", border: "1px solid var(--border)",
        borderRadius: "8px", padding: "5px 10px"
      }}>
        <div style={{
          width: "22px", height: "22px", borderRadius: "50%",
          background: "var(--grad-main)", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "white"
        }}>
          {user?.username?.[0]?.toUpperCase()}
        </div>
        <span style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 500 }}>{user?.username}</span>
        <span style={{
          fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
          color: user?.role === "admin" ? "#f59e0b" : "var(--accent-blue)",
          background: user?.role === "admin" ? "rgba(245,158,11,0.1)" : "rgba(59,130,246,0.1)",
          padding: "1px 6px", borderRadius: "4px"
        }}>{user?.role}</span>
      </div>
    </header>
  );
}

import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard, Upload, Shield, Bell, FileText,
  BarChart2, Users, LogOut, Activity, X
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/upload", icon: Upload, label: "Upload Logs" },
  { to: "/threats", icon: Shield, label: "Threat Detection" },
  { to: "/alerts", icon: Bell, label: "Alerts" },
  { to: "/reports", icon: FileText, label: "Reports" },
  { to: "/comparison", icon: BarChart2, label: "SIEM Comparison" },
  { to: "/users", icon: Users, label: "User Management", adminOnly: true },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <>
      {/* Overlay for mobile / when open */}
      {open && (
        <div onClick={onClose} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          zIndex: 299, backdropFilter: "blur(2px)"
        }} />
      )}

      {/* Sidebar panel */}
      <aside style={{
        position: "fixed", left: 0, top: "56px", bottom: 0,
        width: "240px", background: "var(--bg-secondary)",
        borderRight: "1px solid var(--border)", zIndex: 300,
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
        display: "flex", flexDirection: "column", overflowY: "auto"
      }}>
        {/* Section label */}
        <div style={{ padding: "20px 16px 8px" }}>
          <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
            Navigation
          </span>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: "4px 8px" }}>
          {navItems.map(({ to, icon: Icon, label, end, adminOnly }) => {
            if (adminOnly && user?.role !== "admin") return null;
            return (
              <NavLink key={to} to={to} end={end} onClick={onClose}
                style={({ isActive }) => ({
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "9px 12px", borderRadius: "8px", marginBottom: "2px",
                  color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                  background: isActive ? "var(--bg-elevated)" : "transparent",
                  textDecoration: "none", fontSize: "13px", fontWeight: isActive ? 600 : 400,
                  transition: "all 0.15s",
                  position: "relative",
                  ...(isActive ? {
                    boxShadow: "inset 0 0 0 1px var(--border)"
                  } : {})
                })}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div style={{
                        position: "absolute", left: 0, top: "20%", bottom: "20%",
                        width: "3px", borderRadius: "0 3px 3px 0",
                        background: "var(--grad-main)"
                      }} />
                    )}
                    <Icon size={15} color={isActive ? "var(--accent-blue)" : undefined} />
                    {label}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom user section */}
        <div style={{ padding: "12px 8px", borderTop: "1px solid var(--border)" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "10px 12px", borderRadius: "8px",
            background: "var(--bg-elevated)", marginBottom: "6px",
            border: "1px solid var(--border)"
          }}>
            <div style={{
              width: "30px", height: "30px", borderRadius: "50%",
              background: "var(--grad-main)", display: "flex", alignItems: "center",
              justifyContent: "center", color: "white", fontWeight: 700, fontSize: "13px", flexShrink: 0
            }}>{user?.username?.[0]?.toUpperCase()}</div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.username}</div>
              <div style={{ color: user?.role === "admin" ? "#f59e0b" : "var(--accent-blue)", fontSize: "10px", textTransform: "uppercase", fontWeight: 700 }}>{user?.role}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            width: "100%", display: "flex", alignItems: "center", gap: "8px",
            padding: "8px 12px", borderRadius: "8px", border: "none",
            background: "transparent", color: "#ef4444", cursor: "pointer",
            fontSize: "13px", fontWeight: 500, transition: "background 0.15s"
          }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

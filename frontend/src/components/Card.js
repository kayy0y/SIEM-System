import React from "react";

export default function Card({ children, style = {}, gradientBorder = false, title, action }) {
  return (
    <div style={{
      background: "var(--bg-card)",
      borderRadius: "12px",
      border: "1px solid var(--border)",
      overflow: "hidden",
      position: "relative",
      ...style,
    }}>
      {gradientBorder && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "1px",
          background: "linear-gradient(90deg, transparent, #3b82f6, #8b5cf6, transparent)",
        }} />
      )}
      {(title || action) && (
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {title && (
            <span style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 600 }}>
              {title}
            </span>
          )}
          {action}
        </div>
      )}
      <div style={{ padding: title || action ? "20px" : "20px" }}>
        {children}
      </div>
    </div>
  );
}

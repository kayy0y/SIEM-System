import React from "react";

export default function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      marginBottom: "28px", flexWrap: "wrap", gap: "12px",
    }}>
      <div>
        <h1 style={{
          color: "var(--text-primary)", fontSize: "20px", fontWeight: 700,
          letterSpacing: "-0.4px", margin: 0,
        }}>{title}</h1>
        {subtitle && (
          <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

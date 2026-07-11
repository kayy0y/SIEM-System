import React, { useState, useEffect } from "react";
import { Trash2, UserPlus, Shield } from "lucide-react";
import API from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "analyst" });
  const [msg, setMsg] = useState("");
  const { user: me } = useAuth();

  const fetchUsers = async () => {
    try { const res = await API.get("/users"); setUsers(res.data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const addUser = async () => {
    if (!form.username || !form.email || !form.password) return;
    try {
      await API.post("/auth/register", form);
      setMsg("success:User created successfully");
      setForm({ username: "", email: "", password: "", role: "analyst" });
      fetchUsers();
    } catch (e) { setMsg("error:" + (e.response?.data?.detail || "Failed")); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try { await API.delete(`/users/${id}`); fetchUsers(); }
    catch (e) { alert(e.response?.data?.detail || "Delete failed"); }
  };

  const inputStyle = {
    width: "100%", padding: "8px 12px", background: "var(--bg-primary)",
    border: "1px solid var(--border)", borderRadius: "7px",
    color: "var(--text-primary)", fontSize: "13px", outline: "none", boxSizing: "border-box",
    transition: "border-color 0.15s"
  };

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Admin</div>
        <h1 style={{ color: "var(--text-primary)", fontSize: "22px", fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>User Management</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "16px", alignItems: "start" }}>
        {/* Add user form */}
        <div style={{ background: "var(--bg-card)", borderRadius: "12px", padding: "20px", border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "18px" }}>
            <UserPlus size={14} color="#3b82f6" />
            <h3 style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 600, margin: 0 }}>Add User</h3>
          </div>

          {msg && (() => {
            const [type, text] = msg.split(":");
            return (
              <div style={{
                background: type === "success" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                border: `1px solid ${type === "success" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                borderRadius: "7px", padding: "8px 12px",
                color: type === "success" ? "#22c55e" : "#ef4444",
                fontSize: "12px", marginBottom: "14px"
              }}>{text}</div>
            );
          })()}

          {[
            { label: "Username", key: "username", type: "text" },
            { label: "Email", key: "email", type: "email" },
            { label: "Password", key: "password", type: "password" },
          ].map(({ label, key, type }) => (
            <div key={key} style={{ marginBottom: "12px" }}>
              <label style={{ color: "var(--text-secondary)", fontSize: "11px", fontWeight: 600, display: "block", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</label>
              <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = "#3b82f6"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
            </div>
          ))}

          <div style={{ marginBottom: "16px" }}>
            <label style={{ color: "var(--text-secondary)", fontSize: "11px", fontWeight: 600, display: "block", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Role</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="analyst">Analyst</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button onClick={addUser} style={{
            width: "100%", padding: "9px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            border: "none", borderRadius: "8px", color: "white", fontSize: "13px",
            fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 10px rgba(59,130,246,0.2)"
          }}>Create User</button>
        </div>

        {/* User list */}
        <div style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)", display: "flex", alignItems: "center", gap: "7px" }}>
            <Shield size={13} color="var(--text-muted)" />
            <h3 style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 600, margin: 0 }}>
              System Users <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({users.length})</span>
            </h3>
          </div>
          {loading ? (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>Loading...</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["User", "Email", "Role", "Created", ""].map(h => (
                    <th key={h} style={{ padding: "9px 14px", color: "var(--text-muted)", fontSize: "10px", fontWeight: 700, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.6px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{
                          width: "26px", height: "26px", borderRadius: "50%",
                          background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "white", fontSize: "11px", fontWeight: 700
                        }}>{u.username[0].toUpperCase()}</div>
                        <span style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 500 }}>{u.username}</span>
                      </div>
                    </td>
                    <td style={{ padding: "11px 14px", color: "var(--text-muted)", fontSize: "12px" }}>{u.email}</td>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
                        color: u.role === "admin" ? "#f59e0b" : "#60a5fa",
                        background: u.role === "admin" ? "rgba(245,158,11,0.1)" : "rgba(96,165,250,0.1)"
                      }}>{u.role}</span>
                    </td>
                    <td style={{ padding: "11px 14px", color: "var(--text-muted)", fontSize: "11px", fontFamily: "monospace" }}>{u.created_at?.slice(0, 10)}</td>
                    <td style={{ padding: "11px 14px" }}>
                      {u.username !== me?.username && (
                        <button onClick={() => deleteUser(u.id)} style={{
                          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                          borderRadius: "5px", padding: "5px 7px", cursor: "pointer", display: "flex", alignItems: "center"
                        }}>
                          <Trash2 size={12} color="#ef4444" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

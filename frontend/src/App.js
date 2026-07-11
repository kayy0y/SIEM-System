import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UploadLogs from "./pages/UploadLogs";
import ThreatDetection from "./pages/ThreatDetection";
import Alerts from "./pages/Alerts";
import Reports from "./pages/Reports";
import Comparison from "./pages/Comparison";
import Users from "./pages/Users";

function Layout({ children }) {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>Loading...</div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <Topbar onToggleSidebar={() => setSidebarOpen(o => !o)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {/* Main content - full width with top padding for topbar */}
      <main style={{
        paddingTop: "56px",
        minHeight: "100vh",
      }}>
        <div style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "28px 24px",
        }}>
          {children}
        </div>
      </main>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/" element={<Layout><Dashboard /></Layout>} />
      <Route path="/upload" element={<Layout><UploadLogs /></Layout>} />
      <Route path="/threats" element={<Layout><ThreatDetection /></Layout>} />
      <Route path="/alerts" element={<Layout><Alerts /></Layout>} />
      <Route path="/reports" element={<Layout><Reports /></Layout>} />
      <Route path="/comparison" element={<Layout><Comparison /></Layout>} />
      <Route path="/users" element={<Layout><Users /></Layout>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

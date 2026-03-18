"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/lib/api";

interface UserProfile {
  userId: number;
  email: string;
  name: string;
  role: string;
  status: string;
  orgId: number | null;
  orgName: string | null;
  orgDomain: string | null;
  inviteCode: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

const ROLE_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  API_PROVIDER: { label: "API Provider", color: "#0d9488", bg: "#f0fdfa", dot: "#14b8a6" },
  DEVELOPER:    { label: "Developer",    color: "#7c3aed", bg: "#f5f3ff", dot: "#8b5cf6" },
  ADMIN:        { label: "Admin",        color: "#b45309", bg: "#fffbeb", dot: "#f59e0b" },
  VIEWER:       { label: "Viewer",       color: "#6b7280", bg: "#f9fafb", dot: "#9ca3af" },
};

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [copied, setCopied]     = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "org" | "security">("profile");

  useEffect(() => {
    api.get("/api/users/me")
      .then(r => setProfile(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const copyCode = () => {
    if (!profile?.inviteCode) return;
    navigator.clipboard.writeText(profile.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const roleMeta = ROLE_META[profile?.role ?? ""] ?? ROLE_META["VIEWER"];

  if (loading) return (
    <DashboardLayout>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"60vh" }}>
        <div style={{
          width:36, height:36, borderRadius:"50%",
          border:"2.5px solid #e2e8f0", borderTopColor:"#14b8a6",
          animation:"spin 0.75s linear infinite"
        }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(20,184,166,0.35); }
          70%  { box-shadow: 0 0 0 12px rgba(20,184,166,0); }
          100% { box-shadow: 0 0 0 0 rgba(20,184,166,0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .settings-root { font-family: 'DM Sans', sans-serif; }
        .settings-root * { box-sizing: border-box; }

        /* Sidebar */
        .s-sidebar {
          width: 260px;
          flex-shrink: 0;
          position: sticky;
          top: 24px;
          align-self: flex-start;
        }

        /* Avatar ring pulse when active */
        .avatar-wrap.active-pulse { animation: pulse-ring 2.5s ease-out infinite; }

        /* Tab pill */
        .s-tab {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; border-radius: 12px;
          font-size: 13px; font-weight: 500; cursor: pointer;
          color: #6b7280; border: none; background: transparent;
          width: 100%; text-align: left; transition: all 0.15s;
        }
        .s-tab:hover { background: #f9fafb; color: #374151; }
        .s-tab.active { background: #f0fdfa; color: #0d9488; font-weight: 700; }
        .s-tab-icon {
          width: 32px; height: 32px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          background: #f3f4f6; flex-shrink: 0; transition: background 0.15s;
        }
        .s-tab.active .s-tab-icon { background: #ccfbf1; }

        /* Field rows */
        .field-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 14px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .field-row:last-child { border-bottom: none; }
        .field-label {
          font-size: 11px; font-weight: 700; color: #9ca3af;
          text-transform: uppercase; letter-spacing: 0.07em;
        }
        .field-value {
          font-size: 13px; font-weight: 500; color: #1f2937;
          text-align: right; font-family: 'DM Sans', sans-serif;
        }

        /* Copy button */
        .copy-btn {
          padding: 11px 22px; border-radius: 12px; border: none;
          font-family: 'DM Sans', sans-serif; font-weight: 700;
          font-size: 13px; cursor: pointer; transition: all 0.2s;
          white-space: nowrap; letter-spacing: 0.01em;
        }
        .copy-btn.idle {
          background: #0d9488; color: white;
          box-shadow: 0 2px 10px rgba(13,148,136,0.3);
        }
        .copy-btn.idle:hover {
          background: #0f766e;
          box-shadow: 0 4px 16px rgba(13,148,136,0.4);
          transform: translateY(-1px);
        }
        .copy-btn.done { background: #22c55e; color: white; }

        /* Invite code shimmer */
        .invite-code-text {
          font-family: 'DM Mono', monospace; font-weight: 500;
          font-size: 22px; color: #0f172a; letter-spacing: 0.18em;
          background: linear-gradient(90deg,#0f172a 25%,#0d9488 50%,#0f172a 75%);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }

        /* Security row */
        .sec-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 18px 0; border-bottom: 1px solid #f3f4f6;
        }
        .sec-row:last-child { border-bottom: none; }
        .coming-pill {
          font-size: 11px; font-weight: 600; padding: 5px 12px;
          border-radius: 8px; background: #f9fafb; color: #d1d5db;
          border: 1px solid #f3f4f6; letter-spacing: 0.02em;
        }

        /* Panel animation */
        .s-panel { animation: fadeUp 0.22s ease both; }

        /* Stats row in sidebar */
        .stat-chip {
          display: flex; flex-direction: column; align-items: center;
          gap: 2px; flex: 1; padding: 10px 8px;
          background: #f9fafb; border-radius: 12px;
          border: 1px solid #f3f4f6;
        }
        .stat-chip-val { font-size: 15px; font-weight: 800; color: #1f2937; }
        .stat-chip-lab { font-size: 10px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em; }

        /* Decorative teal line on active panel */
        .panel-header-bar {
          width: 36px; height: 3px; border-radius: 2px;
          background: linear-gradient(90deg, #14b8a6, #06b6d4);
          margin-bottom: 20px;
        }
      `}</style>

      <div className="settings-root" style={{ padding:"32px 32px 64px", maxWidth:960, margin:"0 auto" }}>

        {/* Page title */}
        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontSize:20, fontWeight:800, color:"#111827", margin:0, letterSpacing:"-0.01em" }}>
            Account Settings
          </h1>
          <p style={{ fontSize:13, color:"#9ca3af", marginTop:4 }}>
            Manage your profile, organization, and security preferences
          </p>
        </div>

        <div style={{ display:"flex", gap:24, alignItems:"flex-start" }}>

          {/* ── LEFT SIDEBAR ─────────────────────────────────────────────── */}
          <div className="s-sidebar">

            {/* Identity card */}
            <div style={{
              background:"#fff", borderRadius:20, overflow:"hidden",
              border:"1px solid #f3f4f6",
              boxShadow:"0 1px 3px rgba(0,0,0,0.05), 0 4px 20px rgba(0,0,0,0.04)",
              marginBottom:12,
            }}>
              {/* Teal header strip */}
              <div style={{
                height:52, background:"linear-gradient(135deg, #0d9488 0%, #0891b2 100%)",
                position:"relative",
              }}>
                <div style={{
                  position:"absolute", inset:0, opacity:0.15,
                  backgroundImage:"radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
                  backgroundSize:"24px 24px",
                }}/>
              </div>

              <div style={{ padding:"0 20px 20px", position:"relative" }}>
                {/* Avatar — overlaps strip */}
                <div className="avatar-wrap active-pulse" style={{
                  width:60, height:60, borderRadius:18,
                  background:"linear-gradient(135deg, #14b8a6, #06b6d4)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color:"white", fontWeight:800, fontSize:24,
                  border:"3px solid white",
                  marginTop:-30, marginBottom:12,
                  boxShadow:"0 4px 14px rgba(20,184,166,0.3)",
                  flexShrink:0,
                }}>
                  {profile?.name?.[0]?.toUpperCase() ?? "?"}
                </div>

                <p style={{ fontSize:15, fontWeight:800, color:"#111827", margin:"0 0 4px" }}>
                  {profile?.name}
                </p>
                <p style={{ fontSize:12, color:"#6b7280", margin:"0 0 10px",
                  fontFamily:"'DM Mono', monospace", letterSpacing:"0.01em" }}>
                  {profile?.email}
                </p>

                <div style={{
                  display:"inline-flex", alignItems:"center", gap:6,
                  background: roleMeta.bg, color: roleMeta.color,
                  fontSize:11, fontWeight:700,
                  padding:"4px 10px", borderRadius:999,
                }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background:roleMeta.dot, display:"inline-block" }}/>
                  {roleMeta.label}
                </div>
              </div>

              {/* Mini stats */}
              <div style={{
                display:"flex", gap:8, padding:"0 16px 16px",
              }}>
                <div className="stat-chip">
                  <span className="stat-chip-val">
                    {profile?.status === "active" ? "✓" : "✗"}
                  </span>
                  <span className="stat-chip-lab">Status</span>
                </div>
                <div className="stat-chip">
                  <span className="stat-chip-val" style={{ fontSize:11, color:"#0d9488" }}>
                    {fmt(profile?.createdAt ?? null).split(" ")[2] ?? "—"}
                  </span>
                  <span className="stat-chip-lab">Joined</span>
                </div>
                <div className="stat-chip">
                  <span className="stat-chip-val" style={{ fontSize:11 }}>
                    {profile?.orgId ? `#${profile.orgId}` : "—"}
                  </span>
                  <span className="stat-chip-lab">Org</span>
                </div>
              </div>
            </div>

            {/* Nav tabs */}
            <div style={{
              background:"#fff", borderRadius:16, padding:"8px",
              border:"1px solid #f3f4f6",
              boxShadow:"0 1px 3px rgba(0,0,0,0.04)",
            }}>
              {([
                { key:"profile",  label:"Profile",      icon:<PathIcon d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/> },
                { key:"org",      label:"Organization", icon:<PathIcon d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/> },
                { key:"security", label:"Security",     icon:<PathIcon d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/> },
              ] as const).map(t => (
                <button key={t.key} className={`s-tab ${activeTab === t.key ? "active" : ""}`}
                  onClick={() => setActiveTab(t.key)}>
                  <span className="s-tab-icon">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── RIGHT PANEL ──────────────────────────────────────────────── */}
          <div style={{ flex:1, minWidth:0 }}>

            {/* ── PROFILE TAB ── */}
            {activeTab === "profile" && (
              <div className="s-panel" key="profile">
                <div style={{
                  background:"#fff", borderRadius:20, padding:"28px 32px",
                  border:"1px solid #f3f4f6",
                  boxShadow:"0 1px 3px rgba(0,0,0,0.05), 0 4px 20px rgba(0,0,0,0.04)",
                }}>
                  <div className="panel-header-bar"/>
                  <h2 style={{ fontSize:16, fontWeight:800, color:"#111827", margin:"0 0 4px" }}>
                    Profile Information
                  </h2>
                  <p style={{ fontSize:12, color:"#9ca3af", margin:"0 0 24px" }}>
                    Your personal account details
                  </p>

                  <div className="field-row">
                    <span className="field-label">Full name</span>
                    <span className="field-value">{profile?.name ?? "—"}</span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">Email address</span>
                    <span className="field-value" style={{ fontFamily:"'DM Mono', monospace", fontSize:12, color:"#374151" }}>
                      {profile?.email ?? "—"}
                    </span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">Role</span>
                    <span style={{
                      fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:999,
                      background:roleMeta.bg, color:roleMeta.color,
                    }}>{roleMeta.label}</span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">Account status</span>
                    <span style={{
                      fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:999,
                      background: profile?.status === "active" ? "#f0fdf4" : "#fef2f2",
                      color:      profile?.status === "active" ? "#16a34a" : "#dc2626",
                    }}>
                      {profile?.status === "active" ? "● Active" : "● Inactive"}
                    </span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">Member since</span>
                    <span className="field-value">{fmt(profile?.createdAt ?? null)}</span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">Last login</span>
                    <span className="field-value" style={{ color: profile?.lastLoginAt ? "#1f2937" : "#d1d5db" }}>
                      {fmt(profile?.lastLoginAt ?? null)}
                    </span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">User ID</span>
                    <span className="field-value" style={{ fontFamily:"'DM Mono', monospace", fontSize:12, color:"#9ca3af" }}>
                      #{profile?.userId}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ── ORG TAB ── */}
            {activeTab === "org" && (
              <div className="s-panel" key="org" style={{ display:"flex", flexDirection:"column", gap:16 }}>

                {/* Org details */}
                <div style={{
                  background:"#fff", borderRadius:20, padding:"28px 32px",
                  border:"1px solid #f3f4f6",
                  boxShadow:"0 1px 3px rgba(0,0,0,0.05), 0 4px 20px rgba(0,0,0,0.04)",
                }}>
                  <div className="panel-header-bar"/>
                  <h2 style={{ fontSize:16, fontWeight:800, color:"#111827", margin:"0 0 4px" }}>Organization</h2>
                  <p style={{ fontSize:12, color:"#9ca3af", margin:"0 0 24px" }}>Your organization details</p>

                  <div className="field-row">
                    <span className="field-label">Name</span>
                    <span className="field-value">{profile?.orgName ?? "—"}</span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">Domain</span>
                    <span className="field-value" style={{ fontFamily:"'DM Mono', monospace", fontSize:12 }}>
                      {profile?.orgDomain ?? "—"}
                    </span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">Org ID</span>
                    <span className="field-value" style={{ fontFamily:"'DM Mono', monospace", fontSize:12, color:"#9ca3af" }}>
                      {profile?.orgId ? `#${profile.orgId}` : "—"}
                    </span>
                  </div>
                </div>

                {/* Invite code — hero treatment */}
                {profile?.inviteCode && (
                  <div style={{
                    borderRadius:20, overflow:"hidden",
                    border:"1px solid #99f6e4",
                    boxShadow:"0 4px 24px rgba(20,184,166,0.12)",
                  }}>
                    {/* Decorative header */}
                    <div style={{
                      background:"linear-gradient(135deg, #0d9488 0%, #0891b2 100%)",
                      padding:"20px 28px 18px",
                      position:"relative", overflow:"hidden",
                    }}>
                      <div style={{
                        position:"absolute", inset:0, opacity:0.1,
                        backgroundImage:"repeating-linear-gradient(45deg, white 0px, white 1px, transparent 1px, transparent 12px)",
                      }}/>
                      <p style={{ margin:0, fontSize:10, fontWeight:800, color:"rgba(255,255,255,0.7)",
                        textTransform:"uppercase", letterSpacing:"0.1em" }}>
                        Developer Invite Code
                      </p>
                      <p style={{ margin:"4px 0 0", fontSize:13, color:"rgba(255,255,255,0.85)", fontWeight:400 }}>
                        Share with developers to join{" "}
                        <strong style={{ color:"white" }}>{profile.orgName}</strong>
                      </p>
                    </div>

                    {/* Code display */}
                    <div style={{
                      background:"white", padding:"24px 28px",
                      display:"flex", alignItems:"center", gap:16,
                    }}>
                      <div style={{
                        flex:1, background:"#f8fafc",
                        border:"1.5px dashed #99f6e4",
                        borderRadius:14, padding:"16px 20px",
                        display:"flex", alignItems:"center", justifyContent:"center",
                      }}>
                        <span className="invite-code-text">{profile.inviteCode}</span>
                      </div>
                      <button className={`copy-btn ${copied ? "done" : "idle"}`} onClick={copyCode}>
                        {copied ? (
                          <span style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                            </svg>
                            Copied!
                          </span>
                        ) : (
                          <span style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                            </svg>
                            Copy
                          </span>
                        )}
                      </button>
                    </div>

                    <div style={{
                      background:"#f0fdfa", padding:"12px 28px",
                      display:"flex", alignItems:"center", gap:8,
                    }}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#14b8a6" strokeWidth={2}>
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      <p style={{ margin:0, fontSize:11, color:"#0d9488", fontWeight:500 }}>
                        Developers use this code on registration to join your organization automatically
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── SECURITY TAB ── */}
            {activeTab === "security" && (
              <div className="s-panel" key="security">
                <div style={{
                  background:"#fff", borderRadius:20, padding:"28px 32px",
                  border:"1px solid #f3f4f6",
                  boxShadow:"0 1px 3px rgba(0,0,0,0.05), 0 4px 20px rgba(0,0,0,0.04)",
                }}>
                  <div className="panel-header-bar"/>
                  <h2 style={{ fontSize:16, fontWeight:800, color:"#111827", margin:"0 0 4px" }}>Security</h2>
                  <p style={{ fontSize:12, color:"#9ca3af", margin:"0 0 24px" }}>
                    Manage your password and authentication settings
                  </p>

                  {[
                    {
                      icon: <PathIcon d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>,
                      title: "Password",
                      desc: "Change your account password",
                      sub: "Last changed: never",
                    },
                    {
                      icon: <PathIcon d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"/>,
                      title: "Two-Factor Authentication",
                      desc: "Add an extra layer of security to your account",
                      sub: "Authenticator app or SMS",
                    },
                    {
                      icon: <PathIcon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>,
                      title: "Active Sessions",
                      desc: "Manage devices where you're logged in",
                      sub: "View and revoke sessions",
                    },
                    {
                      icon: <PathIcon d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>,
                      title: "Account Deletion",
                      desc: "Permanently delete your account and all data",
                      sub: "This action cannot be undone",
                    },
                  ].map((item, i) => (
                    <div key={i} className="sec-row">
                      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                        <div style={{
                          width:38, height:38, borderRadius:11,
                          background:"#f9fafb", border:"1px solid #f3f4f6",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          flexShrink:0,
                        }}>
                          {item.icon}
                        </div>
                        <div>
                          <p style={{ margin:0, fontSize:13, fontWeight:600, color:"#374151" }}>
                            {item.title}
                          </p>
                          <p style={{ margin:"2px 0 0", fontSize:11, color:"#9ca3af" }}>
                            {item.desc}
                          </p>
                        </div>
                      </div>
                      <span className="coming-pill">Coming soon</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function PathIcon({ d }: { d: string }) {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d}/>
    </svg>
  );
}
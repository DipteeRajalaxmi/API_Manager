"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/lib/api";

// Auth helpers inline
const forgotPassword = async (email: string): Promise<void> => {
  await api.post("/api/auth/forgot-password", { email });
};
const logoutAndRedirect = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  window.location.href = "/login";
};

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

// Shared modal styles
const S = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 } as React.CSSProperties,
  modal:   { background: "#fff", borderRadius: 20, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.18)", overflow: "hidden", fontFamily: "'DM Sans',sans-serif" } as React.CSSProperties,
  header:  { display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "22px 24px 16px", borderBottom: "1px solid #f3f4f6" } as React.CSSProperties,
  title:   { fontSize: 17, fontWeight: 800, color: "#111827", margin: 0, letterSpacing: "-0.01em" } as React.CSSProperties,
  sub:     { fontSize: 12, color: "#6b7280", margin: "3px 0 0" } as React.CSSProperties,
  footer:  { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 } as React.CSSProperties,
  iconBtn: { background: "none", border: "none", color: "#9ca3af", cursor: "pointer", padding: 4, borderRadius: 6, lineHeight: "0", flexShrink: 0 } as React.CSSProperties,
  infoBox: { background: "#f0fdfa", border: "1px solid #99f6e4", borderRadius: 10, padding: "12px 14px", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 10 } as React.CSSProperties,
  errTxt:  { fontSize: 12, color: "#ef4444", margin: "4px 0 0" } as React.CSSProperties,
  primary: { padding: "9px 20px", borderRadius: 10, background: "linear-gradient(135deg,#0d9488,#0891b2)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" } as React.CSSProperties,
  ghost:   { padding: "9px 18px", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer" } as React.CSSProperties,
  danger:  { padding: "9px 20px", borderRadius: 10, background: "#ef4444", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" } as React.CSSProperties,
  input:   { width: "100%", padding: "10px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, color: "#111827", outline: "none", boxSizing: "border-box" as const, background: "#fafafa", fontFamily: "'DM Sans',sans-serif" } as React.CSSProperties,
};

// ── Change Password Modal ──────────────────────────────────────────────────────
function ChangePasswordModal({ userEmail, onClose }: { userEmail: string; onClose: () => void }) {
  const [step, setStep]         = useState<"confirm" | "sent">("confirm");
  const [loading, setLoading]   = useState(false);
  const [apiError, setApiError] = useState("");

  async function handleSend() {
    setLoading(true);
    setApiError("");
    try {
      await forgotPassword(userEmail);
      setStep("sent");
    } catch {
      setApiError("Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>
        <div style={S.header}>
          <div>
            <h2 style={S.title}>Change password</h2>
            <p style={S.sub}>{step === "confirm" ? "We'll send a reset link to your email" : "Reset link sent — check your inbox"}</p>
          </div>
          <button style={S.iconBtn} onClick={onClose}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div style={{ padding: "20px 24px 24px" }}>
          {step === "confirm" && (
            <>
              <div style={S.infoBox}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#0d9488" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                <p style={{ margin: 0, fontSize: 13, color: "#0f766e", lineHeight: 1.6 }}>
                  A password reset link will be sent to{" "}
                  <strong style={{ fontFamily: "'DM Mono',monospace", fontSize: 12 }}>{userEmail}</strong>.
                  {" "}Click the link in the email to set your new password.
                </p>
              </div>
              {apiError && <p style={S.errTxt}>{apiError}</p>}
              <div style={S.footer}>
                <button style={S.ghost} onClick={onClose}>Cancel</button>
                <button style={{ ...S.primary, opacity: loading ? 0.7 : 1 }} onClick={handleSend} disabled={loading}>
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </div>
            </>
          )}

          {step === "sent" && (
            <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#14b8a6,#0891b2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 4px 20px rgba(20,184,166,0.3)" }}>
                <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>Email sent!</p>
              <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 6px", lineHeight: 1.6 }}>
                Check your inbox at <strong style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: "#374151" }}>{userEmail}</strong>
              </p>
              <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 24px", lineHeight: 1.6 }}>
                Click the <strong style={{ color: "#0d9488" }}>Reset Password</strong> button in the email. The link expires in <strong>1 hour</strong>.
              </p>
              <button style={{ ...S.primary, width: "100%" }} onClick={onClose}>Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Delete Account Modal ───────────────────────────────────────────────────────
function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const [step, setStep]       = useState<"warn" | "confirm">("warn");
  const [typed, setTyped]     = useState("");
  const [loading, setLoading] = useState(false);
  const WORD = "DELETE";

  async function handleDelete() {
    if (typed !== WORD) return;
    setLoading(true);
    try {
      await api.delete("/api/users/me");
      logoutAndRedirect();
    } catch {
      setLoading(false);
      alert("Failed to delete account. Please contact support.");
    }
  }

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>
        <div style={S.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <div>
              <h2 style={{ ...S.title, color: "#dc2626" }}>Delete account</h2>
              <p style={S.sub}>This action is permanent and cannot be undone</p>
            </div>
          </div>
          <button style={S.iconBtn} onClick={onClose}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div style={{ padding: "20px 24px 24px" }}>
          {step === "warn" ? (
            <>
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#991b1b", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  The following will be permanently deleted:
                </p>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: "#7f1d1d", lineHeight: 2 }}>
                  <li>Your profile and account data</li>
                  <li>All APIs you've created or published</li>
                  <li>Organization memberships</li>
                  <li>All subscriptions and access tokens</li>
                </ul>
              </div>
              <div style={S.footer}>
                <button style={S.ghost} onClick={onClose}>Cancel</button>
                <button style={S.danger} onClick={() => setStep("confirm")}>I understand, continue</button>
              </div>
            </>
          ) : (
            <>
              <p style={{ fontSize: 13, color: "#374151", marginBottom: 14, lineHeight: 1.6 }}>
                Type <strong style={{ fontFamily: "'DM Mono',monospace", color: "#ef4444", letterSpacing: 2 }}>{WORD}</strong> to confirm:
              </p>
              <input
                type="text"
                value={typed}
                onChange={e => setTyped(e.target.value.toUpperCase())}
                placeholder={WORD}
                style={{ ...S.input, letterSpacing: 3, fontFamily: "'DM Mono',monospace", fontWeight: 700, textAlign: "center", borderColor: typed === WORD ? "#ef4444" : "#e5e7eb" }}
              />
              <div style={S.footer}>
                <button style={S.ghost} onClick={() => { setStep("warn"); setTyped(""); }}>Back</button>
                <button
                  style={{ ...S.danger, opacity: typed === WORD && !loading ? 1 : 0.45, cursor: typed === WORD ? "pointer" : "not-allowed" }}
                  onClick={handleDelete}
                  disabled={typed !== WORD || loading}
                >
                  {loading ? "Deleting…" : "Permanently delete account"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Settings Page ─────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [profile, setProfile]     = useState<UserProfile | null>(null);
  const [loading, setLoading]     = useState(true);
  const [copied, setCopied]       = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "org" | "security">("profile");
  const [modal, setModal]         = useState<"password" | "delete" | null>(null);

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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "2.5px solid #e2e8f0", borderTopColor: "#14b8a6", animation: "spin 0.75s linear infinite" }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700&family=DM+Mono:wght@400;500&display=swap');
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-ring { 0%{box-shadow:0 0 0 0 rgba(20,184,166,0.35)} 70%{box-shadow:0 0 0 12px rgba(20,184,166,0)} 100%{box-shadow:0 0 0 0 rgba(20,184,166,0)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        .sr *{box-sizing:border-box}
        .s-sidebar{width:260px;flex-shrink:0;position:sticky;top:24px;align-self:flex-start}
        .av-pulse{animation:pulse-ring 2.5s ease-out infinite}
        .s-tab{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:12px;font-size:13px;font-weight:500;cursor:pointer;color:#6b7280;border:none;background:transparent;width:100%;text-align:left;transition:all .15s}
        .s-tab:hover{background:#f9fafb;color:#374151}
        .s-tab.act{background:#f0fdfa;color:#0d9488;font-weight:700}
        .s-ti{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;background:#f3f4f6;flex-shrink:0;transition:background .15s}
        .s-tab.act .s-ti{background:#ccfbf1}
        .fr{display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid #f3f4f6}
        .fr:last-child{border-bottom:none}
        .fl{font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.07em}
        .fv{font-size:13px;font-weight:500;color:#1f2937;text-align:right}
        .copy-btn{padding:11px 22px;border-radius:12px;border:none;font-family:'DM Sans',sans-serif;font-weight:700;font-size:13px;cursor:pointer;transition:all .2s;white-space:nowrap}
        .copy-btn.idle{background:#0d9488;color:white;box-shadow:0 2px 10px rgba(13,148,136,.3)}
        .copy-btn.idle:hover{background:#0f766e;transform:translateY(-1px)}
        .copy-btn.done{background:#22c55e;color:white}
        .ic-text{font-family:'DM Mono',monospace;font-weight:500;font-size:22px;letter-spacing:.18em;background:linear-gradient(90deg,#0f172a 25%,#0d9488 50%,#0f172a 75%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 3s linear infinite}
        .panel{animation:fadeUp .22s ease both}
        .sc{display:flex;flex-direction:column;align-items:center;gap:2px;flex:1;padding:10px 8px;background:#f9fafb;border-radius:12px;border:1px solid #f3f4f6}
        .scv{font-size:15px;font-weight:800;color:#1f2937}
        .scl{font-size:10px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em}
        .phb{width:36px;height:3px;border-radius:2px;background:linear-gradient(90deg,#14b8a6,#06b6d4);margin-bottom:20px}
        .sec-row{display:flex;justify-content:space-between;align-items:center;padding:18px 0;border-bottom:1px solid #f3f4f6}
        .sec-row:last-child{border-bottom:none}
        .sbtn{padding:8px 18px;border-radius:10px;border:1.5px solid;font-size:12px;font-weight:700;cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif;white-space:nowrap;background:transparent}
        .sbtn-p{border-color:#0d9488;color:#0d9488}.sbtn-p:hover{background:#0d9488;color:white}
        .sbtn-d{border-color:#ef4444;color:#ef4444}.sbtn-d:hover{background:#ef4444;color:white}
      `}</style>

      <div className="sr" style={{ fontFamily:"'DM Sans',sans-serif", padding:"32px 32px 64px", maxWidth:960, margin:"0 auto" }}>
        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontSize:20, fontWeight:800, color:"#111827", margin:0, letterSpacing:"-0.01em" }}>Account Settings</h1>
          <p style={{ fontSize:13, color:"#9ca3af", marginTop:4 }}>Manage your profile, organization, and security preferences</p>
        </div>

        <div style={{ display:"flex", gap:24, alignItems:"flex-start" }}>

          {/* Sidebar */}
          <div className="s-sidebar">
            <div style={{ background:"#fff", borderRadius:20, overflow:"hidden", border:"1px solid #f3f4f6", boxShadow:"0 1px 3px rgba(0,0,0,.05),0 4px 20px rgba(0,0,0,.04)", marginBottom:12 }}>
              <div style={{ height:60, background:"linear-gradient(135deg,#0d9488 0%,#0891b2 100%)", position:"relative" }}>
                <div style={{ position:"absolute", inset:0, opacity:.15, backgroundImage:"radial-gradient(circle at 20% 80%,white 1px,transparent 1px),radial-gradient(circle at 80% 20%,white 1px,transparent 1px)", backgroundSize:"24px 24px" }}/>
              </div>
              <div style={{ padding:"4px 20px 20px" }}>
                <div className="av-pulse" style={{ width:60, height:60, borderRadius:18, background:"linear-gradient(135deg,#14b8a6,#06b6d4)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:800, fontSize:24, border:"3px solid white", marginTop:-32, marginBottom:12, boxShadow:"0 4px 14px rgba(20,184,166,.3)", flexShrink:0, position:"relative", zIndex:2 }}>
                  {profile?.name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <p style={{ fontSize:15, fontWeight:800, color:"#111827", margin:"0 0 4px" }}>{profile?.name}</p>
                <p style={{ fontSize:12, color:"#6b7280", margin:"0 0 10px", fontFamily:"'DM Mono',monospace", letterSpacing:".01em" }}>{profile?.email}</p>
                <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:roleMeta.bg, color:roleMeta.color, fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:999 }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background:roleMeta.dot, display:"inline-block" }}/>{roleMeta.label}
                </div>
              </div>
              <div style={{ display:"flex", gap:8, padding:"0 16px 16px" }}>
                {[
                  { val: profile?.status === "active" ? "✓" : "✗", lab: "Status" },
                  { val: fmt(profile?.createdAt ?? null).split(" ")[2] ?? "—", lab: "Joined", color: "#0d9488" },
                  { val: profile?.orgId ? `#${profile.orgId}` : "—", lab: "Org" },
                ].map(c => (
                  <div key={c.lab} className="sc">
                    <span className="scv" style={{ fontSize:11, color: c.color }}>{c.val}</span>
                    <span className="scl">{c.lab}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background:"#fff", borderRadius:16, padding:"8px", border:"1px solid #f3f4f6", boxShadow:"0 1px 3px rgba(0,0,0,.04)" }}>
              {([
                { key:"profile",  label:"Profile",      d:"M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
                { key:"org",      label:"Organization", d:"M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
                { key:"security", label:"Security",     d:"M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
              ] as const).map(t => (
                <button key={t.key} className={`s-tab ${activeTab === t.key ? "act" : ""}`} onClick={() => setActiveTab(t.key)}>
                  <span className="s-ti">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={activeTab === t.key ? "#0d9488" : "#9ca3af"} strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={t.d}/>
                    </svg>
                  </span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Panel */}
          <div style={{ flex:1, minWidth:0 }}>

            {activeTab === "profile" && (
              <div className="panel" key="profile">
                <div style={{ background:"#fff", borderRadius:20, padding:"28px 32px", border:"1px solid #f3f4f6", boxShadow:"0 1px 3px rgba(0,0,0,.05),0 4px 20px rgba(0,0,0,.04)" }}>
                  <div className="phb"/>
                  <h2 style={{ fontSize:16, fontWeight:800, color:"#111827", margin:"0 0 4px" }}>Profile Information</h2>
                  <p style={{ fontSize:12, color:"#9ca3af", margin:"0 0 24px" }}>Your personal account details</p>
                  <div className="fr"><span className="fl">Full name</span><span className="fv">{profile?.name ?? "—"}</span></div>
                  <div className="fr"><span className="fl">Email address</span><span className="fv" style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:"#374151" }}>{profile?.email ?? "—"}</span></div>
                  <div className="fr">
                    <span className="fl">Role</span>
                    <span style={{ fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:999, background:roleMeta.bg, color:roleMeta.color }}>{roleMeta.label}</span>
                  </div>
                  <div className="fr">
                    <span className="fl">Account status</span>
                    <span style={{ fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:999, background:profile?.status==="active"?"#f0fdf4":"#fef2f2", color:profile?.status==="active"?"#16a34a":"#dc2626" }}>
                      {profile?.status === "active" ? "● Active" : "● Inactive"}
                    </span>
                  </div>
                  <div className="fr"><span className="fl">Member since</span><span className="fv">{fmt(profile?.createdAt ?? null)}</span></div>
                  <div className="fr"><span className="fl">Last login</span><span className="fv" style={{ color:profile?.lastLoginAt?"#1f2937":"#d1d5db" }}>{fmt(profile?.lastLoginAt ?? null)}</span></div>
                  <div className="fr"><span className="fl">User ID</span><span className="fv" style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:"#9ca3af" }}>#{profile?.userId}</span></div>
                </div>
              </div>
            )}

            {activeTab === "org" && (
              <div className="panel" key="org" style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <div style={{ background:"#fff", borderRadius:20, padding:"28px 32px", border:"1px solid #f3f4f6", boxShadow:"0 1px 3px rgba(0,0,0,.05),0 4px 20px rgba(0,0,0,.04)" }}>
                  <div className="phb"/>
                  <h2 style={{ fontSize:16, fontWeight:800, color:"#111827", margin:"0 0 4px" }}>Organization</h2>
                  <p style={{ fontSize:12, color:"#9ca3af", margin:"0 0 24px" }}>Your organization details</p>
                  <div className="fr"><span className="fl">Name</span><span className="fv">{profile?.orgName ?? "—"}</span></div>
                  <div className="fr"><span className="fl">Domain</span><span className="fv" style={{ fontFamily:"'DM Mono',monospace", fontSize:12 }}>{profile?.orgDomain ?? "—"}</span></div>
                  <div className="fr"><span className="fl">Org ID</span><span className="fv" style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:"#9ca3af" }}>{profile?.orgId ? `#${profile.orgId}` : "—"}</span></div>
                </div>

                {profile?.inviteCode && (
                  <div style={{ borderRadius:20, overflow:"hidden", border:"1px solid #99f6e4", boxShadow:"0 4px 24px rgba(20,184,166,.12)" }}>
                    <div style={{ background:"linear-gradient(135deg,#0d9488 0%,#0891b2 100%)", padding:"20px 28px 18px", position:"relative", overflow:"hidden" }}>
                      <div style={{ position:"absolute", inset:0, opacity:.1, backgroundImage:"repeating-linear-gradient(45deg,white 0px,white 1px,transparent 1px,transparent 12px)" }}/>
                      <p style={{ margin:0, fontSize:10, fontWeight:800, color:"rgba(255,255,255,.7)", textTransform:"uppercase", letterSpacing:".1em" }}>Developer Invite Code</p>
                      <p style={{ margin:"4px 0 0", fontSize:13, color:"rgba(255,255,255,.85)" }}>Share with developers to join <strong style={{ color:"white" }}>{profile.orgName}</strong></p>
                    </div>
                    <div style={{ background:"white", padding:"24px 28px", display:"flex", alignItems:"center", gap:16 }}>
                      <div style={{ flex:1, background:"#f8fafc", border:"1.5px dashed #99f6e4", borderRadius:14, padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <span className="ic-text">{profile.inviteCode}</span>
                      </div>
                      <button className={`copy-btn ${copied ? "done" : "idle"}`} onClick={copyCode}>
                        {copied
                          ? <span style={{ display:"flex", alignItems:"center", gap:6 }}><svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>Copied!</span>
                          : <span style={{ display:"flex", alignItems:"center", gap:6 }}><svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Copy</span>
                        }
                      </button>
                    </div>
                    <div style={{ background:"#f0fdfa", padding:"12px 28px", display:"flex", alignItems:"center", gap:8 }}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#14b8a6" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <p style={{ margin:0, fontSize:11, color:"#0d9488", fontWeight:500 }}>Developers use this code on registration to join your organization automatically</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "security" && (
              <div className="panel" key="security">
                <div style={{ background:"#fff", borderRadius:20, padding:"28px 32px", border:"1px solid #f3f4f6", boxShadow:"0 1px 3px rgba(0,0,0,.05),0 4px 20px rgba(0,0,0,.04)" }}>
                  <div className="phb"/>
                  <h2 style={{ fontSize:16, fontWeight:800, color:"#111827", margin:"0 0 4px" }}>Security</h2>
                  <p style={{ fontSize:12, color:"#9ca3af", margin:"0 0 24px" }}>Manage your password and authentication settings</p>

                  <div className="sec-row">
                    <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                      <div style={{ width:38, height:38, borderRadius:11, background:"#f0fdfa", border:"1px solid #99f6e4", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#0d9488" strokeWidth={1.75}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                        </svg>
                      </div>
                      <div>
                        <p style={{ margin:0, fontSize:13, fontWeight:700, color:"#374151" }}>Password</p>
                        <p style={{ margin:"2px 0 0", fontSize:11, color:"#9ca3af" }}>Sends a reset link to your registered email address</p>
                      </div>
                    </div>
                    <button className="sbtn sbtn-p" onClick={() => setModal("password")}>Change password</button>
                  </div>

                  {/* <div className="sec-row">
                    <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                      <div style={{ width:38, height:38, borderRadius:11, background:"#fef2f2", border:"1px solid #fecaca", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={1.75}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                        </svg>
                      </div>
                      <div>
                        <p style={{ margin:0, fontSize:13, fontWeight:700, color:"#374151" }}>Account deletion</p>
                        <p style={{ margin:"2px 0 0", fontSize:11, color:"#9ca3af" }}>Permanently delete your account and all associated data</p>
                      </div>
                    </div>
                    <button className="sbtn sbtn-d" onClick={() => setModal("delete")}>Delete account</button>
                  </div> */}

                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {modal === "password" && profile && <ChangePasswordModal userEmail={profile.email} onClose={() => setModal(null)} />}
      {modal === "delete"   && <DeleteAccountModal onClose={() => setModal(null)} />}
    </DashboardLayout>
  );
}
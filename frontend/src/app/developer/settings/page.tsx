"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/lib/api";

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

const formatDate = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

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
                  <li>All APIs you've subscribed to</li>
                  <li>Organization memberships</li>
                  <li>All access tokens</li>
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

// ── Main Developer Settings Page ───────────────────────────────────────────────
export default function DeveloperSettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState<"password" | "delete" | null>(null);

  useEffect(() => {
    api
      .get("/api/users/me")
      .then((r) => setProfile(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const isIndependent = !profile?.orgId;
  const initials = profile?.name?.[0]?.toUpperCase() ?? "?";

  return (
    <DashboardLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');

        .sp-page {
          background: var(--bg);
          min-height: 100vh;
          padding: 2rem 2.5rem 4rem;
          max-width: 900px;
          margin: 0 auto;
        }

        .sp-heading { margin-bottom: 1.75rem; }
        .sp-eyebrow {
          font-size: .67rem;
          font-weight: 800;
          letter-spacing: .2em;
          text-transform: uppercase;
          color: var(--teal-dark);
          margin-bottom: .35rem;
        }
        .sp-title {
          font-size: 1.65rem;
          font-weight: 800;
          color: #1a202c;
          letter-spacing: -.03em;
          margin-bottom: .2rem;
          line-height: 1.2;
        }
        .sp-sub {
          font-size: .8rem;
          color: #718096;
          font-family: 'DM Mono', monospace;
        }
        .sp-title-bar {
          width: 32px;
          height: 3px;
          background: var(--teal);
          border-radius: 2px;
          margin-top: .6rem;
        }

        .sp-grid {
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }
        .sp-full { grid-column: 1 / -1; }

        .profile-strip {
          background: linear-gradient(130deg, #1a3a5c 0%, #1e4d72 55%, #1a5c6a 100%);
          border-radius: 20px 20px 0 0;
          padding: 1.5rem 1.75rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          position: relative;
          overflow: hidden;
        }
        .profile-strip::after {
          content: '';
          position: absolute;
          top: -50px; right: -50px;
          width: 180px; height: 180px;
          border-radius: 50%;
          background: rgba(79,209,197,.1);
          pointer-events: none;
        }
        .p-avatar {
          width: 54px;
          height: 54px;
          border-radius: 14px;
          background: linear-gradient(135deg, var(--teal), var(--teal-dark));
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 900;
          font-size: 1.45rem;
          flex-shrink: 0;
          box-shadow: 0 4px 16px rgba(79,209,197,.4);
          position: relative;
          z-index: 1;
        }
        .p-meta { position: relative; z-index: 1; }
        .p-name {
          font-size: 1rem;
          font-weight: 800;
          color: #fff;
          margin-bottom: .38rem;
          letter-spacing: -.01em;
        }
        .role-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(79,209,197,.18);
          border: 1px solid rgba(79,209,197,.3);
          color: #81e6d9;
          font-size: .66rem;
          font-weight: 800;
          padding: .26rem .72rem;
          border-radius: 50px;
          letter-spacing: .08em;
          text-transform: uppercase;
        }
        .role-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--teal); }
        .status-wrap { margin-left: auto; position: relative; z-index: 1; }
        .status-pill {
          font-size: .7rem;
          font-weight: 700;
          padding: .3rem .85rem;
          border-radius: 50px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .s-active  { background: rgba(79,209,197,.22); border: 1px solid rgba(79,209,197,.38); color: #81e6d9; }
        .s-inactive{ background: rgba(245,101,101,.18); border: 1px solid rgba(245,101,101,.3);  color: #feb2b2; }

        .profile-body {
          background: #fff;
          border: 1px solid #EDF2F7;
          border-top: none;
          border-radius: 0 0 20px 20px;
          padding: 0 1.75rem .5rem;
          box-shadow: 0 4px 20px rgba(0,0,0,.04);
        }

        .info-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: .88rem 0;
          border-bottom: 1px solid #EDF2F7;
        }
        .info-row:last-child { border-bottom: none; }
        .info-label {
          font-size: .65rem;
          font-weight: 800;
          letter-spacing: .15em;
          text-transform: uppercase;
          color: #A0AEC0;
        }
        .info-value {
          font-size: .82rem;
          font-weight: 600;
          color: #2D3748;
          font-family: 'DM Mono', monospace;
        }

        .card-head {
          padding: 1.2rem 1.5rem .9rem;
          display: flex;
          align-items: center;
          gap: .7rem;
          border-bottom: 1px solid #EDF2F7;
        }
        .card-icon {
          width: 34px; height: 34px;
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .card-title {
          font-size: .69rem;
          font-weight: 800;
          letter-spacing: .14em;
          text-transform: uppercase;
          color: #718096;
        }

        .list-body { padding: .1rem 1.5rem .9rem; }
        .list-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: .85rem 0;
          border-bottom: 1px solid #EDF2F7;
        }
        .list-row:last-child { border-bottom: none; }
        .list-label {
          font-size: .65rem;
          font-weight: 800;
          letter-spacing: .15em;
          text-transform: uppercase;
          color: #A0AEC0;
        }
        .list-value {
          font-size: .82rem;
          font-weight: 700;
          color: #2D3748;
          font-family: 'DM Mono', monospace;
        }

        .org-empty { padding: 1.5rem 1.5rem 1.2rem; text-align: center; }
        .org-empty-icon {
          width: 44px; height: 44px;
          border-radius: 11px;
          background: #F7FAFC;
          border: 1px solid #EDF2F7;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto .85rem;
        }
        .org-empty-title { font-size: .87rem; font-weight: 700; color: #718096; margin-bottom: .3rem; }
        .org-empty-desc  { font-size: .74rem; color: #A0AEC0; line-height: 1.65; max-width: 200px; margin: 0 auto; }

        /* ── Security action rows ── */
        .sec-label { font-size: .82rem; font-weight: 700; color: #2D3748; margin: 0 0 .18rem; }
        .sec-sub   { font-size: .68rem; color: #A0AEC0; margin: 0; line-height: 1.4; }
        .sec-row-inner {
          display: flex;
          flex-direction: column;
          gap: .75rem;
          padding: 1rem 0;
          border-bottom: 1px solid #EDF2F7;
        }
        .sec-row-inner:last-child { border-bottom: none; }
        .sec-row-top {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sbtn {
          align-self: flex-start;
          margin-left: 44px;
          padding: 6px 14px;
          border-radius: 8px;
          border: 1.5px solid;
          font-size: .72rem;
          font-weight: 700;
          cursor: pointer;
          transition: all .15s;
          font-family: 'DM Sans', sans-serif;
          white-space: nowrap;
          background: transparent;
        }
        .sbtn-p { border-color: #0d9488; color: #0d9488; }
        .sbtn-p:hover { background: #0d9488; color: white; }
        .sbtn-d { border-color: #ef4444; color: #ef4444; }
        .sbtn-d:hover { background: #ef4444; color: white; }

        /* ── Access banner ── */
        .access-banner {
          grid-column: 1 / -1;
          border-radius: 16px;
          padding: 1rem 1.35rem;
          display: flex;
          align-items: center;
          gap: .85rem;
          border: 1.5px solid;
        }
        .a-ok   { background: #E6FFFA; border-color: rgba(79,209,197,.4); }
        .a-warn { background: #FFFBEB; border-color: #FBD38D; }
        .a-icon {
          width: 34px; height: 34px;
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .a-icon-ok   { background: rgba(79,209,197,.18); }
        .a-icon-warn { background: rgba(251,211,141,.35); }
        .a-title-ok   { font-size: .82rem; font-weight: 800; color: var(--teal-dark); margin-bottom: .15rem; }
        .a-title-warn { font-size: .82rem; font-weight: 800; color: #C05621; margin-bottom: .15rem; }
        .a-desc { font-size: .74rem; color: #4A5568; line-height: 1.5; }

        .spinner-wrap { display: flex; align-items: center; justify-content: center; height: 300px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner {
          width: 30px; height: 30px;
          border: 2.5px solid #E2E8F0;
          border-top-color: var(--teal);
          border-radius: 50%;
          animation: spin .7s linear infinite;
        }
      `}</style>

      <div className="sp-page">

        <div className="sp-heading animate-fade-in">
          <div className="sp-eyebrow">Account</div>
          <h1 className="sp-title">Settings</h1>
          <p className="sp-sub">Manage your profile, organization &amp; security</p>
          <div className="sp-title-bar" />
        </div>

        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : (
          <div className="sp-grid stagger">

            {/* ── Profile card (full width) ── */}
            <div className="sp-full animate-fade-in">
              <div className="profile-strip">
                <div className="p-avatar">{initials}</div>
                <div className="p-meta">
                  <p className="p-name">{profile?.name}</p>
                  <span className="role-chip">
                    <span className="role-dot" />
                    {profile?.role}
                  </span>
                </div>
                <div className="status-wrap">
                  <span className={`status-pill ${profile?.status === "active" ? "s-active" : "s-inactive"}`}>
                    ● {profile?.status === "active" ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <div className="profile-body">
                <div className="info-row">
                  <span className="info-label">Email</span>
                  <span className="info-value">{profile?.email ?? "—"}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Member Since</span>
                  <span className="info-value">{formatDate(profile?.createdAt ?? null)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Last Login</span>
                  <span className="info-value">{formatDate(profile?.lastLoginAt ?? null)}</span>
                </div>
              </div>
            </div>

            {/* ── Organization ── */}
            <div className="card card-lift">
              <div className="card-head">
                <div className="card-icon" style={{ background: "rgba(79,209,197,.12)" }}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#319795" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className="card-title">Organization</span>
              </div>

              {isIndependent ? (
                <div className="org-empty">
                  <div className="org-empty-icon">
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#CBD5E0" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="org-empty-title">Independent Developer</p>
                  <p className="org-empty-desc">
                    Not part of any org. Ask your admin for an invite code to join.
                  </p>
                </div>
              ) : (
                <div className="list-body">
                  <div className="list-row">
                    <span className="list-label">Name</span>
                    <span className="list-value">{profile?.orgName ?? "—"}</span>
                  </div>
                  <div className="list-row">
                    <span className="list-label">Domain</span>
                    <span className="list-value">{profile?.orgDomain ?? "—"}</span>
                  </div>
                  <div className="list-row">
                    <span className="list-label">Joined</span>
                    <span className="list-value">{formatDate(profile?.createdAt ?? null)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Security ── */}
            <div className="card card-lift">
              <div className="card-head">
                <div className="card-icon" style={{ background: "rgba(66,153,225,.1)" }}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#4299E1" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <span className="card-title">Security</span>
              </div>
              <div className="list-body">
                {/* Change Password row */}
                <div className="sec-row-inner">
                  <div className="sec-row-top">
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(79,209,197,.1)", border: "1px solid rgba(79,209,197,.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#319795" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="sec-label">Password</p>
                      <p className="sec-sub">Sends a reset link to your registered email</p>
                    </div>
                  </div>
                  <button className="sbtn sbtn-p" onClick={() => setModal("password")}>Change password</button>
                </div>

                {/* Delete Account row */}
                {/* <div className="sec-row-inner">
                  <div className="sec-row-top">
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: "#fef2f2", border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="sec-label">Account deletion</p>
                      <p className="sec-sub">Permanently deletes your account and all data</p>
                    </div>
                  </div>
                  <button className="sbtn sbtn-d" onClick={() => setModal("delete")}>Delete account</button>
                </div> */}
              </div>
            </div>

            {/* ── Access banner ── */}
            <div className={`access-banner ${isIndependent ? "a-warn" : "a-ok"}`}>
              <div className={`a-icon ${isIndependent ? "a-icon-warn" : "a-icon-ok"}`}>
                {isIndependent ? (
                  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="#C05621" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                ) : (
                  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="#319795" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div>
                <p className={isIndependent ? "a-title-warn" : "a-title-ok"}>
                  {isIndependent ? "Limited API Access" : "Full API Access Enabled"}
                </p>
                <p className="a-desc">
                  {isIndependent
                    ? "You can view and subscribe to public APIs only. Join an organization to unlock private and restricted APIs."
                    : `You have full access to all public and private APIs within ${profile?.orgName}.`}
                </p>
              </div>
            </div>

          </div>
        )}
      </div>

      {modal === "password" && profile && (
        <ChangePasswordModal userEmail={profile.email} onClose={() => setModal(null)} />
      )}
      {modal === "delete" && (
        <DeleteAccountModal onClose={() => setModal(null)} />
      )}
    </DashboardLayout>
  );
}
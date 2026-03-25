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

const formatDate = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

export default function DeveloperSettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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

        /* Uses global: --bg, --teal, --teal-dark, --blue from globals.css */
        /* Uses global: .card, .card-lift, .grad-teal, .animate-fade-in, .stagger */

        .sp-page {
          background: var(--bg);
          min-height: 100vh;
          padding: 2rem 2.5rem 4rem;
        }

        /* ── Page heading ── */
        .sp-heading {
          margin-bottom: 1.75rem;
        }
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

        /* ── Grid ── */
        .sp-grid {
          max-width: 760px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }
        .sp-full { grid-column: 1 / -1; }

        /* ── Profile card strip (dark navy top) ── */
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
        .role-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--teal);
        }
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
        .s-active {
          background: rgba(79,209,197,.22);
          border: 1px solid rgba(79,209,197,.38);
          color: #81e6d9;
        }
        .s-inactive {
          background: rgba(245,101,101,.18);
          border: 1px solid rgba(245,101,101,.3);
          color: #feb2b2;
        }

        /* White body under strip — uses global .card border-radius only on bottom */
        .profile-body {
          background: #fff;
          border: 1px solid #EDF2F7;
          border-top: none;
          border-radius: 0 0 20px 20px;
          padding: 0 1.75rem .5rem;
          box-shadow: 0 4px 20px rgba(0,0,0,.04);
        }

        /* ── Info rows ── */
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

        /* ── Sub-card header ── */
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

        /* ── List rows (org + security) ── */
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

        /* ── Org empty state ── */
        .org-empty {
          padding: 1.5rem 1.5rem 1.2rem;
          text-align: center;
        }
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

        /* ── Security ── */
        .sec-label { font-size: .85rem; font-weight: 700; color: #2D3748; margin-bottom: .16rem; }
        .sec-sub   { font-size: .7rem; color: #A0AEC0; font-family: 'DM Mono', monospace; }
        .soon-pill {
          font-size: .63rem;
          font-weight: 800;
          letter-spacing: .1em;
          text-transform: uppercase;
          background: #F7FAFC;
          border: 1.5px solid #E2E8F0;
          color: #A0AEC0;
          padding: .32rem .85rem;
          border-radius: 7px;
          white-space: nowrap;
        }

        /* ── Access banner (full width) ── */
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

        /* ── Spinner ── */
        .spinner-wrap { display:flex; align-items:center; justify-content:center; height:300px; }
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

        {/* Page heading — no banner, just clean header */}
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
              {/* Dark navy strip */}
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
              {/* White rows below */}
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
                <div className="list-row">
                  <div>
                    <p className="sec-label">Password</p>
                    <p className="sec-sub">••••••••••••</p>
                  </div>
                  <span className="soon-pill">Soon</span>
                </div>
                <div className="list-row">
                  <div>
                    <p className="sec-label">Two-Factor Auth</p>
                    <p className="sec-sub">Extra security layer</p>
                  </div>
                  <span className="soon-pill">Soon</span>
                </div>
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
    </DashboardLayout>
  );
}
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

const styles = {
  page: {
    maxWidth: "720px",
    margin: "0 auto",
    padding: "40px 24px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "20px",
  },
  pageHeader: {
    marginBottom: "4px",
  },
  pageTitle: {
    fontSize: "22px",
    fontWeight: 800,
    color: "#1f2937",
    margin: 0,
  },
  pageSubtitle: {
    fontSize: "13px",
    color: "#9ca3af",
    marginTop: "4px",
  },
  card: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "28px 32px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 8px rgba(0,0,0,0.04)",
    border: "1px solid #f3f4f6",
  },
  profileTop: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    marginBottom: "28px",
  },
  avatar: {
    width: "56px",
    height: "56px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #14b8a6, #06b6d4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: 800,
    fontSize: "22px",
    boxShadow: "0 4px 12px rgba(20,184,166,0.25)",
    flexShrink: 0,
  },
  avatarName: {
    fontSize: "17px",
    fontWeight: 800,
    color: "#1f2937",
    margin: 0,
  },
  roleBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "#f0fdfa",
    color: "#0d9488",
    fontSize: "11px",
    fontWeight: 700,
    padding: "4px 10px",
    borderRadius: "999px",
    marginTop: "5px",
  },
  roleDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#14b8a6",
    display: "inline-block",
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "15px",
    fontWeight: 800,
    color: "#1f2937",
    marginBottom: "20px",
  },
  sectionIcon: {
    width: "30px",
    height: "30px",
    borderRadius: "10px",
    background: "#f0fdfa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rowsContainer: {
    display: "flex",
    flexDirection: "column" as const,
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "13px 0",
    borderBottom: "1px solid #f9fafb",
  },
  rowLabel: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#9ca3af",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    minWidth: "150px",
    flexShrink: 0,
  },
  rowValue: {
    fontSize: "13px",
    fontWeight: 500,
    color: "#374151",
    textAlign: "right" as const,
  },
  badgeGreen: {
    fontSize: "11px",
    fontWeight: 700,
    padding: "4px 12px",
    borderRadius: "999px",
    background: "#f0fdf4",
    color: "#16a34a",
  },
  badgeRed: {
    fontSize: "11px",
    fontWeight: 700,
    padding: "4px 12px",
    borderRadius: "999px",
    background: "#fef2f2",
    color: "#dc2626",
  },
  inviteBox: {
    background: "linear-gradient(135deg, #f0fdfa 0%, #ecfeff 100%)",
    border: "1px solid #99f6e4",
    borderRadius: "16px",
    padding: "22px 24px",
    marginTop: "20px",
  },
  inviteLabel: {
    fontSize: "10px",
    fontWeight: 800,
    color: "#0f766e",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    marginBottom: "3px",
  },
  inviteSubLabel: {
    fontSize: "12px",
    color: "#5eead4",
    marginBottom: "16px",
  },
  inviteRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  inviteCodeBox: {
    flex: 1,
    background: "white",
    border: "1.5px solid #5eead4",
    borderRadius: "12px",
    padding: "12px 16px",
    fontFamily: "monospace",
    fontWeight: 800,
    fontSize: "18px",
    color: "#1f2937",
    letterSpacing: "0.2em",
    textAlign: "center" as const,
    boxShadow: "0 1px 4px rgba(20,184,166,0.1)",
  },
  copyBtn: (copied: boolean) => ({
    padding: "12px 20px",
    borderRadius: "12px",
    fontWeight: 700,
    fontSize: "13px",
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s",
    background: copied ? "#22c55e" : "#14b8a6",
    color: "white",
    boxShadow: copied
      ? "0 2px 8px rgba(34,197,94,0.3)"
      : "0 2px 8px rgba(20,184,166,0.3)",
    whiteSpace: "nowrap" as const,
  }),
  inviteFooter: {
    fontSize: "11px",
    color: "#5eead4",
    textAlign: "center" as const,
    marginTop: "12px",
  },
  securityRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 0",
    borderBottom: "1px solid #f9fafb",
  },
  securityLabel: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#374151",
    margin: 0,
  },
  securitySub: {
    fontSize: "11px",
    color: "#9ca3af",
    marginTop: "2px",
  },
  comingSoon: {
    fontSize: "11px",
    color: "#d1d5db",
    background: "#f9fafb",
    padding: "6px 14px",
    borderRadius: "8px",
    border: "1px solid #f3f4f6",
    whiteSpace: "nowrap" as const,
  },
  spinner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "256px",
  },
};

export default function ProviderSettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get("/api/users/me")
      .then(r => setProfile(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const copyInviteCode = () => {
    if (!profile?.inviteCode) return;
    navigator.clipboard.writeText(profile.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric"
    }) : "—";

  if (loading) return (
    <DashboardLayout>
      <div style={styles.spinner}>
        <div style={{
          width: "32px", height: "32px",
          border: "2px solid #14b8a6",
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div style={styles.page}>

        {/* Header */}
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>Settings</h1>
          <p style={styles.pageSubtitle}>Manage your profile and organization</p>
        </div>

        {/* Profile card */}
        <div style={styles.card}>
          <div style={styles.profileTop}>
            <div style={styles.avatar}>
              {profile?.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <p style={styles.avatarName}>{profile?.name}</p>
              <div style={styles.roleBadge}>
                <span style={styles.roleDot} />
                {profile?.role}
              </div>
            </div>
          </div>

          <div style={styles.rowsContainer}>
            <Row label="Email"        value={profile?.email ?? "—"} />
            <Row label="Status"       value={profile?.status ?? "—"} badge
              badgeColor={profile?.status === "active" ? "green" : "red"} />
            <Row label="Member Since" value={formatDate(profile?.createdAt ?? null)} />
            <Row label="Last Login"   value={formatDate(profile?.lastLoginAt ?? null)} last />
          </div>
        </div>

        {/* Organization card */}
        <div style={styles.card}>
          <div style={styles.sectionTitle}>
            <div style={styles.sectionIcon}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#14b8a6" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            Organization
          </div>

          <div style={styles.rowsContainer}>
            <Row label="Organization" value={profile?.orgName ?? "—"} />
            <Row label="Domain"       value={profile?.orgDomain ?? "—"} />
            <Row label="Org ID"       value={profile?.orgId ? `#${profile.orgId}` : "—"} last />
          </div>

          {/* Invite code */}
          <div style={styles.inviteBox}>
            <p style={styles.inviteLabel}>Developer Invite Code</p>
            <p style={styles.inviteSubLabel}>
              Share this code with your developers so they can join your organization on registration
            </p>
            <div style={styles.inviteRow}>
              <div style={styles.inviteCodeBox}>
                {profile?.inviteCode ?? "—"}
              </div>
              <button onClick={copyInviteCode} style={styles.copyBtn(copied)}>
                {copied ? "✓ Copied!" : "Copy"}
              </button>
            </div>
            <p style={styles.inviteFooter}>
              Developers register with this code → they join{" "}
              <strong style={{ color: "#0d9488" }}>{profile?.orgName}</strong> automatically
            </p>
          </div>
        </div>

        {/* Security card */}
        <div style={styles.card}>
          <div style={styles.sectionTitle}>
            <div style={{ ...styles.sectionIcon, background: "#f9fafb" }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            Security
          </div>

          <div style={{ ...styles.securityRow }}>
            <div>
              <p style={styles.securityLabel}>Password</p>
              <p style={styles.securitySub}>••••••••••••</p>
            </div>
            <span style={styles.comingSoon}>Coming soon</span>
          </div>

          <div style={{ ...styles.securityRow, borderBottom: "none" }}>
            <div>
              <p style={styles.securityLabel}>Two-Factor Authentication</p>
              <p style={styles.securitySub}>Add an extra layer of security</p>
            </div>
            <span style={styles.comingSoon}>Coming soon</span>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

function Row({ label, value, badge, badgeColor, last }: {
  label: string;
  value: string;
  badge?: boolean;
  badgeColor?: "green" | "red";
  last?: boolean;
}) {
  return (
    <div style={{
      ...styles.row,
      borderBottom: last ? "none" : "1px solid #f9fafb",
    }}>
      <span style={styles.rowLabel}>{label}</span>
      {badge ? (
        <span style={badgeColor === "green" ? styles.badgeGreen : styles.badgeRed}>
          {value}
        </span>
      ) : (
        <span style={styles.rowValue}>{value}</span>
      )}
    </div>
  );
}
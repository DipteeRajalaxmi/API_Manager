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
    background: "linear-gradient(135deg, #3b82f6, #6366f1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: 800,
    fontSize: "22px",
    boxShadow: "0 4px 12px rgba(59,130,246,0.25)",
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
    background: "#eff6ff",
    color: "#2563eb",
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
    background: "#3b82f6",
    display: "inline-block",
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
    background: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  independentBox: {
    background: "#f9fafb",
    border: "1px solid #f3f4f6",
    borderRadius: "16px",
    padding: "28px 24px",
    textAlign: "center" as const,
  },
  independentIconWrap: {
    width: "48px",
    height: "48px",
    background: "#f3f4f6",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 14px",
  },
  independentTitle: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#4b5563",
    marginBottom: "6px",
  },
  independentDesc: {
    fontSize: "12px",
    color: "#9ca3af",
    maxWidth: "280px",
    margin: "0 auto",
    lineHeight: 1.6,
  },
  accessBannerIndependent: {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: "16px",
    padding: "16px 20px",
  },
  accessBannerOrg: {
    background: "#f0fdfa",
    border: "1px solid #99f6e4",
    borderRadius: "16px",
    padding: "16px 20px",
  },
  accessBannerInner: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  },
  accessEmoji: {
    fontSize: "18px",
    marginTop: "1px",
    flexShrink: 0,
  },
  accessTitleIndependent: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#92400e",
    marginBottom: "3px",
  },
  accessTitleOrg: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#0f766e",
    marginBottom: "3px",
  },
  accessDescIndependent: {
    fontSize: "12px",
    color: "#b45309",
    lineHeight: 1.5,
  },
  accessDescOrg: {
    fontSize: "12px",
    color: "#0d9488",
    lineHeight: 1.5,
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

export default function DeveloperSettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/users/me")
      .then(r => setProfile(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric"
    }) : "—";

  const isIndependent = !profile?.orgId;

  if (loading) return (
    <DashboardLayout>
      <div style={styles.spinner}>
        <div style={{
          width: "32px", height: "32px",
          border: "2px solid #3b82f6",
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
          <p style={styles.pageSubtitle}>Manage your profile and account</p>
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
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            Organization
          </div>

          {isIndependent ? (
            <div style={styles.independentBox}>
              <div style={styles.independentIconWrap}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p style={styles.independentTitle}>Independent Developer</p>
              <p style={styles.independentDesc}>
                You're not part of any organization. You can browse and subscribe to public APIs.
                Ask your organization admin for an invite code to join their workspace.
              </p>
            </div>
          ) : (
            <div style={styles.rowsContainer}>
              <Row label="Organization" value={profile?.orgName ?? "—"} />
              <Row label="Domain"       value={profile?.orgDomain ?? "—"} />
              {/* <Row label="Org ID"       value={profile?.orgId ? `#${profile.orgId}` : "—"} /> */}
              <Row label="Joined"       value={formatDate(profile?.createdAt ?? null)} last />
            </div>
          )}
        </div>

        {/* API Access banner */}
        <div style={isIndependent ? styles.accessBannerIndependent : styles.accessBannerOrg}>
          <div style={styles.accessBannerInner}>
            <span style={styles.accessEmoji}>{isIndependent ? "⚠️" : "✅"}</span>
            <div>
              <p style={isIndependent ? styles.accessTitleIndependent : styles.accessTitleOrg}>
                {isIndependent ? "Limited API Access" : "Full API Access"}
              </p>
              <p style={isIndependent ? styles.accessDescIndependent : styles.accessDescOrg}>
                {isIndependent
                  ? "You can only view and subscribe to public APIs. Join an organization to access private and restricted APIs."
                  : `You have access to all public and private APIs within ${profile?.orgName}.`}
              </p>
            </div>
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

          <div style={styles.securityRow}>
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
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "13px 0",
      borderBottom: last ? "none" : "1px solid #f9fafb",
    }}>
      <span style={{
        fontSize: "11px",
        fontWeight: 700,
        color: "#9ca3af",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        minWidth: "150px",
        flexShrink: 0,
      }}>
        {label}
      </span>
      {badge ? (
        <span style={badgeColor === "green"
          ? { fontSize: "11px", fontWeight: 700, padding: "4px 12px", borderRadius: "999px", background: "#f0fdf4", color: "#16a34a" }
          : { fontSize: "11px", fontWeight: 700, padding: "4px 12px", borderRadius: "999px", background: "#fef2f2", color: "#dc2626" }
        }>
          {value}
        </span>
      ) : (
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#374151", textAlign: "right" }}>
          {value}
        </span>
      )}
    </div>
  );
}
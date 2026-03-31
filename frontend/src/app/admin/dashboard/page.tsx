"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import apiClient from "@/lib/api";

interface PlatformStats {
  totalOrgs: number;
  totalUsers: number;
  totalApis: number;
  totalCallsToday: number;
  totalDevelopers: number;
  totalProviders: number;
  totalSubscriptions: number;
  totalCallsThisWeek: number;
}

/* ─── tiny sparkline bar (purely decorative) ─── */
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-1 rounded-full bg-gray-100 overflow-hidden mt-3">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

/* ─── Stat card ─── */
function StatCard({
  label, value, icon, iconBg, textAccent, sub, delay = 0, barMax,
}: {
  label: string; value: number | string; icon: string;
  iconBg: string; textAccent: string; sub?: string;
  delay?: number; barMax?: number;
}) {
  const numVal = typeof value === "number" ? value : 0;
  return (
    <div
      className="stat-card"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* top row */}
      <div className="flex items-start justify-between mb-5">
        <div className="icon-pill" style={{ background: iconBg }}>
          <span>{icon}</span>
        </div>
        {sub && (
          <span className="badge" style={{ color: textAccent, borderColor: `${textAccent}30`, background: `${textAccent}10` }}>
            {sub}
          </span>
        )}
      </div>

      {/* value */}
      <div className="stat-value" style={{ color: "#0f172a" }}>
        {value}
      </div>
      <div className="stat-label">{label}</div>

      {barMax !== undefined && (
        <MiniBar value={numVal} max={barMax} color={textAccent} />
      )}
    </div>
  );
}

/* ─── Nav card ─── */
function NavCard({
  href, icon, iconBg, title, desc, badge, badgeColor,
}: {
  href: string; icon: string; iconBg: string;
  title: string; desc: string; badge: string; badgeColor: string;
}) {
  return (
    <Link href={href} className="nav-card group">
      <div className="flex items-start justify-between mb-5">
        <div className="icon-pill" style={{ background: iconBg }}>
          <span>{icon}</span>
        </div>
        <span
          className="badge"
          style={{ color: badgeColor, borderColor: `${badgeColor}30`, background: `${badgeColor}10` }}
        >
          {badge}
        </span>
      </div>
      <h3 className="nav-title">{title}</h3>
      <p className="nav-desc">{desc}</p>
      <div className="nav-arrow" style={{ color: badgeColor }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </Link>
  );
}

/* ─── Main ─── */
export default function AdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/api/admin/stats")
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const maxCalls = Math.max(stats?.totalCallsToday ?? 0, stats?.totalCallsThisWeek ?? 0, 1);

  const cards = [
    { label: "Organizations",   value: stats?.totalOrgs          ?? 0, icon: "🏢", iconBg: "linear-gradient(135deg,#e0f2fe,#bae6fd)", textAccent: "#0284c7", delay: 0   },
    { label: "Total Users",     value: stats?.totalUsers         ?? 0, icon: "👥", iconBg: "linear-gradient(135deg,#ede9fe,#ddd6fe)", textAccent: "#7c3aed", delay: 50  },
    { label: "API Providers",   value: stats?.totalProviders     ?? 0, icon: "⚡", iconBg: "linear-gradient(135deg,#fef3c7,#fde68a)", textAccent: "#d97706", delay: 100 },
    { label: "Developers",      value: stats?.totalDevelopers    ?? 0, icon: "💻", iconBg: "linear-gradient(135deg,#dcfce7,#bbf7d0)", textAccent: "#16a34a", delay: 150 },
    { label: "Published APIs",  value: stats?.totalApis          ?? 0, icon: "🔌", iconBg: "linear-gradient(135deg,#fce7f3,#fbcfe8)", textAccent: "#db2777", delay: 200 },
    { label: "Subscriptions",   value: stats?.totalSubscriptions ?? 0, icon: "🔑", iconBg: "linear-gradient(135deg,#e0f2fe,#bae6fd)", textAccent: "#0369a1", delay: 250 },
    { label: "Calls Today",     value: stats?.totalCallsToday    ?? 0, icon: "📊", iconBg: "linear-gradient(135deg,#f0fdf4,#dcfce7)", textAccent: "#059669", sub: "24h",  delay: 300, barMax: maxCalls },
    { label: "Calls This Week", value: stats?.totalCallsThisWeek ?? 0, icon: "📈", iconBg: "linear-gradient(135deg,#faf5ff,#ede9fe)", textAccent: "#6d28d9", sub: "7d",   delay: 350, barMax: maxCalls },
  ];

  const navItems = [
    {
      href: "/admin/users",
      icon: "👥",
      iconBg: "linear-gradient(135deg,#ede9fe,#ddd6fe)",
      title: "User Management",
      desc: "View, search and manage all users across every organisation on the platform.",
      badge: `${stats?.totalUsers ?? 0} users`,
      badgeColor: "#7c3aed",
    },
    {
      href: "/admin/organizations",
      icon: "🏢",
      iconBg: "linear-gradient(135deg,#e0f2fe,#bae6fd)",
      title: "Organizations",
      desc: "Manage all registered organisations, their members and configuration.",
      badge: `${stats?.totalOrgs ?? 0} orgs`,
      badgeColor: "#0284c7",
    },
    {
      href: "/admin/apis",
      icon: "🔌",
      iconBg: "linear-gradient(135deg,#fce7f3,#fbcfe8)",
      title: "All APIs",
      desc: "Monitor and inspect every API published across the entire platform.",
      badge: `${stats?.totalApis ?? 0} APIs`,
      badgeColor: "#db2777",
    },
  ];

  return (
    <DashboardLayout>
      <style>{`
        /* ── tokens ── */
        :root {
          --radius-card: 16px;
          --shadow-card: 0 1px 3px rgba(15,23,42,.06), 0 4px 16px rgba(15,23,42,.06);
          --shadow-hover: 0 4px 8px rgba(15,23,42,.06), 0 12px 32px rgba(15,23,42,.10);
          --border: 1px solid rgba(15,23,42,.07);
        }

        /* ── animations ── */
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        .stat-card, .nav-card {
          animation: fadeUp .45s cubic-bezier(.22,1,.36,1) both;
        }

        /* ── stat card ── */
        .stat-card {
          background: #fff;
          border: var(--border);
          border-radius: var(--radius-card);
          box-shadow: var(--shadow-card);
          padding: 24px;
          transition: box-shadow .2s, transform .2s;
        }
        .stat-card:hover {
          box-shadow: var(--shadow-hover);
          transform: translateY(-2px);
        }

        /* ── nav card ── */
        .nav-card {
          display: block;
          background: #fff;
          border: var(--border);
          border-radius: var(--radius-card);
          box-shadow: var(--shadow-card);
          padding: 28px;
          text-decoration: none;
          position: relative;
          overflow: hidden;
          transition: box-shadow .2s, transform .2s;
        }
        .nav-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(248,250,252,.6) 100%);
          opacity: 0;
          transition: opacity .2s;
        }
        .nav-card:hover { box-shadow: var(--shadow-hover); transform: translateY(-3px); }
        .nav-card:hover::before { opacity: 1; }

        /* ── icon pill ── */
        .icon-pill {
          width: 44px; height: 44px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,.08);
          flex-shrink: 0;
        }

        /* ── badge ── */
        .badge {
          font-size: 11px; font-weight: 700;
          letter-spacing: .04em; text-transform: uppercase;
          padding: 3px 9px;
          border-radius: 20px;
          border-width: 1px; border-style: solid;
        }

        /* ── stat text ── */
        .stat-value {
          font-size: 30px; font-weight: 800;
          letter-spacing: -.02em; line-height: 1.1;
          margin-bottom: 4px;
          font-variant-numeric: tabular-nums;
        }
        .stat-label {
          font-size: 11px; font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase; letter-spacing: .07em;
        }

        /* ── nav text ── */
        .nav-title {
          font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 6px;
        }
        .nav-desc {
          font-size: 13px; color: #64748b; line-height: 1.6; margin-bottom: 16px;
        }
        .nav-arrow {
          display: flex; align-items: center;
          transition: transform .2s;
        }
        .nav-card:hover .nav-arrow { transform: translateX(4px); }

        /* ── header chip ── */
        .header-chip {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 700; letter-spacing: .08em;
          text-transform: uppercase; color: #0284c7;
          background: #e0f2fe; border-radius: 20px;
          padding: 4px 12px; margin-bottom: 10px;
        }

        /* ── divider ── */
        .section-divider {
          display: flex; align-items: center; gap: 12px;
          margin: 32px 0 20px;
        }
        .section-divider span {
          font-size: 11px; font-weight: 800; letter-spacing: .1em;
          text-transform: uppercase; color: #94a3b8; white-space: nowrap;
        }
        .section-divider hr {
          flex: 1; border: none; border-top: 1px solid #e2e8f0;
        }

        /* ── skeleton pulse ── */
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .skeleton { animation: pulse 1.5s ease-in-out infinite; }
      `}</style>

      <div style={{ padding: "36px 40px", minHeight: "100vh", background: "#f8fafc" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 36, animation: "fadeUp .4s cubic-bezier(.22,1,.36,1) both" }}>
          <div className="header-chip">
            🛡️ &nbsp;Admin Console
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", letterSpacing: "-.02em", margin: 0 }}>
            Platform Overview
          </h1>
          <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 6 }}>
            Real-time metrics and management for the entire API Manager platform
          </p>
        </div>

        {/* ── Stats Grid ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 0,
        }}>
          {cards.map(c => (
            <StatCard
              key={c.label}
              {...c}
              value={loading ? "—" : c.value}
            />
          ))}
        </div>

        {/* ── Section divider ── */}
        <div className="section-divider">
          <span>Quick Access</span>
          <hr />
        </div>

        {/* ── Nav Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {navItems.map((item, i) => (
            <NavCard
              key={item.href}
              {...item}
              badge={loading ? "—" : item.badge}
            />
          ))}
        </div>

      </div>
    </DashboardLayout>
  );
}
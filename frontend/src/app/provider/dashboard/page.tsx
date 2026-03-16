"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/ui/Badge";
import { getMyApis } from "@/lib/registry";
import { getUser } from "@/lib/auth";
import { Api } from "@/types/api";
import { AuthResponse } from "@/types/auth";

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
  accent,
  delay = 0,
}: {
  label: string;
  value: number;
  icon: string;
  accent: string;
  delay?: number;
}) {
  return (
    <div
      className="stat-card"
      style={{ animationDelay: `${delay}ms`, "--accent": accent } as React.CSSProperties}
    >
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-bar" />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProviderDashboard() {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [apis, setApis] = useState<Api[]>([]);

  useEffect(() => {
    getMyApis().then(setApis).catch(() => {});
    setUser(getUser());
  }, []);

  const stats = {
    total:      apis.length,
    published:  apis.filter((a) => a.status === "published").length,
    draft:      apis.filter((a) => a.status === "draft").length,
    deprecated: apis.filter((a) => a.status === "deprecated").length,
  };

  const recent = [...apis]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <DashboardLayout>
      <style>{`
        /* ── Tokens ───────────────────────────────────────────────────── */
        :root {
          --teal-400: #2dd4bf;
          --teal-500: #14b8a6;
          --teal-600: #0d9488;
          --teal-900: #042f2e;
          --blue-500: #3b82f6;
          --purple-500: #8b5cf6;
          --navy-600: #1e3a5f;
          --gray-50:  #f8fafc;
          --gray-100: #f1f5f9;
          --gray-200: #e2e8f0;
          --gray-400: #94a3b8;
          --gray-500: #64748b;
          --gray-700: #334155;
          --gray-800: #1e293b;
          --white:    #ffffff;
          --radius-xl: 1.25rem;
          --radius-2xl: 1.75rem;
          --shadow-sm:   0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04);
          --shadow-md:   0 4px 16px rgba(0,0,0,.08), 0 2px 6px rgba(0,0,0,.04);
          --shadow-teal: 0 8px 24px rgba(20,184,166,.22);
        }

        /* ── Page wrapper ─────────────────────────────────────────────── */
        .dash-root {
          min-height: 100vh;
          background: var(--gray-50);
          padding: 2.5rem 2.5rem 4rem;
          font-family: 'DM Sans', ui-sans-serif, system-ui, sans-serif;
        }

        /* ── Header ───────────────────────────────────────────────────── */
        .dash-header {
          margin-bottom: 2.5rem;
          animation: fadeUp .55s ease both;
        }
        .dash-header .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: .4rem;
          font-size: .72rem;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: var(--teal-500);
          background: rgba(20,184,166,.08);
          border: 1px solid rgba(20,184,166,.18);
          border-radius: 99px;
          padding: .25rem .75rem;
          margin-bottom: .85rem;
        }
        .dash-header h1 {
          font-size: 1.85rem;
          font-weight: 800;
          color: var(--gray-800);
          letter-spacing: -.03em;
          line-height: 1.2;
          margin: 0 0 .35rem;
        }
        .dash-header p {
          color: var(--gray-400);
          font-size: .875rem;
          margin: 0;
        }

        /* ── Stat cards grid ──────────────────────────────────────────── */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.1rem;
          margin-bottom: 1.75rem;
        }
        .stat-card {
          position: relative;
          background: var(--white);
          border-radius: var(--radius-2xl);
          padding: 1.6rem 1.5rem 1.4rem;
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--gray-100);
          overflow: hidden;
          animation: fadeUp .5s ease both;
          transition: transform .2s, box-shadow .2s;
        }
        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
        }
        .stat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: var(--accent, var(--teal-500));
          border-radius: 99px 99px 0 0;
          opacity: .85;
        }
        .stat-card::after {
          content: '';
          position: absolute;
          bottom: -24px; right: -16px;
          width: 90px; height: 90px;
          border-radius: 50%;
          background: var(--accent, var(--teal-500));
          opacity: .045;
        }
        .stat-icon {
          font-size: 1.35rem;
          margin-bottom: .9rem;
          line-height: 1;
        }
        .stat-value {
          font-size: 2.4rem;
          font-weight: 900;
          color: var(--gray-800);
          letter-spacing: -.04em;
          line-height: 1;
          margin-bottom: .35rem;
        }
        .stat-label {
          font-size: .78rem;
          font-weight: 600;
          color: var(--gray-400);
          text-transform: uppercase;
          letter-spacing: .07em;
        }

        /* ── Lower grid ───────────────────────────────────────────────── */
        .lower-grid {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 1.1rem;
        }

        /* ── Card base ────────────────────────────────────────────────── */
        .panel {
          background: var(--white);
          border-radius: var(--radius-2xl);
          border: 1px solid var(--gray-100);
          box-shadow: var(--shadow-sm);
          animation: fadeUp .55s ease both;
          overflow: hidden;
        }
        .panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.4rem 1.5rem 0;
          margin-bottom: 1.1rem;
        }
        .panel-title {
          font-size: .8rem;
          font-weight: 700;
          color: var(--gray-700);
          text-transform: uppercase;
          letter-spacing: .08em;
        }
        .panel-link {
          font-size: .75rem;
          font-weight: 600;
          color: var(--teal-500);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: .25rem;
          transition: gap .15s;
        }
        .panel-link:hover { gap: .45rem; color: var(--teal-600); }

        /* ── Quick actions ────────────────────────────────────────────── */
        .actions-body { padding: 0 1rem 1.2rem; display: flex; flex-direction: column; gap: .6rem; }
        .action-item {
          display: flex;
          align-items: center;
          gap: .85rem;
          padding: .85rem 1rem;
          border-radius: var(--radius-xl);
          text-decoration: none;
          transition: background .15s, transform .15s;
          border: 1px solid transparent;
        }
        .action-item:hover { transform: translateX(3px); }
        .action-item.primary { background: rgba(20,184,166,.07); border-color: rgba(20,184,166,.15); }
        .action-item.primary:hover { background: rgba(20,184,166,.12); }
        .action-item.secondary { background: var(--gray-50); border-color: var(--gray-100); }
        .action-item.secondary:hover { background: var(--gray-100); }
        .action-icon {
          width: 2.1rem; height: 2.1rem;
          border-radius: .6rem;
          display: flex; align-items: center; justify-content: center;
          font-size: 1rem;
          flex-shrink: 0;
          font-weight: 700;
          color: #fff;
        }
        .action-icon.teal { background: linear-gradient(135deg, var(--teal-400), var(--teal-600)); box-shadow: 0 4px 10px rgba(20,184,166,.3); }
        .action-icon.blue { background: linear-gradient(135deg, #60a5fa, var(--blue-500)); box-shadow: 0 4px 10px rgba(59,130,246,.25); }
        .action-label { font-size: .85rem; font-weight: 600; color: var(--gray-700); }
        .action-sub   { font-size: .73rem; color: var(--gray-400); margin-top: .05rem; }

        /* Divider */
        .action-divider { height: 1px; background: var(--gray-100); margin: .25rem .5rem; }

        /* ── Recent APIs list ─────────────────────────────────────────── */
        .recent-body { padding: 0 1.5rem 1.25rem; }
        .recent-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: .85rem 0;
          border-bottom: 1px solid var(--gray-50);
          transition: background .1s;
          border-radius: .5rem;
          margin: 0 -.5rem;
          padding-left: .5rem;
          padding-right: .5rem;
        }
        .recent-row:last-child { border-bottom: none; }
        .recent-row:hover { background: var(--gray-50); }
        .api-avatar {
          width: 2.1rem; height: 2.1rem;
          border-radius: .6rem;
          background: linear-gradient(135deg, var(--teal-400), var(--teal-600));
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 800; font-size: .85rem;
          flex-shrink: 0;
          box-shadow: 0 3px 8px rgba(20,184,166,.22);
        }
        .api-name { font-size: .875rem; font-weight: 600; color: var(--gray-800); }
        .api-ver  { font-size: .72rem; color: var(--gray-400); font-family: 'JetBrains Mono', monospace; margin-top: .05rem; }
        .recent-row .manage-link {
          font-size: .75rem; font-weight: 600; color: var(--teal-500);
          text-decoration: none; flex-shrink: 0;
          display: inline-flex; align-items: center; gap: .2rem;
          transition: gap .15s;
        }
        .recent-row .manage-link:hover { gap: .4rem; color: var(--teal-600); }

        /* Empty state */
        .empty-state {
          text-align: center;
          padding: 3.5rem 1rem;
        }
        .empty-state .empty-icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          opacity: .35;
          filter: grayscale(1);
        }
        .empty-state p {
          color: var(--gray-400); font-size: .875rem; margin: 0 0 1.25rem;
        }
        .empty-cta {
          display: inline-flex; align-items: center; gap: .4rem;
          background: linear-gradient(135deg, var(--teal-400), var(--teal-600));
          color: #fff;
          font-size: .8rem; font-weight: 700;
          padding: .6rem 1.25rem;
          border-radius: 99px;
          text-decoration: none;
          box-shadow: var(--shadow-teal);
          transition: transform .15s, box-shadow .15s;
        }
        .empty-cta:hover { transform: translateY(-1px); box-shadow: 0 10px 28px rgba(20,184,166,.32); }

        /* ── Animations ───────────────────────────────────────────────── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Google font import ───────────────────────────────────────── */
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');
      `}</style>

      <div className="dash-root">

        {/* ── Header ── */}
        <div className="dash-header">
          <div className="eyebrow">
            <span>⚡</span> Provider Portal
          </div>
          <h1>Welcome back, {firstName} 👋</h1>
          <p>Here's what's happening with your API portfolio today.</p>
        </div>

        {/* ── Stat cards ── */}
        <div className="stats-grid">
          <StatCard delay={0}   label="Total APIs"  value={stats.total}      icon="" accent="var(--teal-500)"   />
          <StatCard delay={60}  label="Published"   value={stats.published}  icon="" accent="var(--blue-500)"   />
          <StatCard delay={120} label="Draft"       value={stats.draft}      icon="" accent="var(--purple-500)" />
          <StatCard delay={180} label="Deprecated"  value={stats.deprecated} icon="" accent="var(--navy-600)"   />
        </div>

        {/* ── Lower grid ── */}
        <div className="lower-grid">

          {/* Quick actions */}
          <div className="panel" style={{ animationDelay: "220ms" }}>
            <div className="panel-head">
              <span className="panel-title">Quick Actions</span>
            </div>
            <div className="actions-body">
              <Link href="/provider/apis/new" className="action-item primary">
                <div className="action-icon teal">＋</div>
                <div>
                  <div className="action-label">Create New API</div>
                  <div className="action-sub">Register a new endpoint</div>
                </div>
              </Link>
              <div className="action-divider" />
              <Link href="/provider/apis" className="action-item secondary">
                <div className="action-icon blue">≡</div>
                <div>
                  <div className="action-label">Manage APIs</div>
                  <div className="action-sub">Browse & edit all APIs</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent APIs */}
          <div className="panel" style={{ animationDelay: "260ms" }}>
            <div className="panel-head">
              <span className="panel-title">Recent APIs</span>
              <Link href="/provider/apis" className="panel-link">
                View all →
              </Link>
            </div>

            <div className="recent-body">
              {recent.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🔌</div>
                  <p>You haven't registered any APIs yet.</p>
                  <Link href="/provider/apis/new" className="empty-cta">
                    ＋ Create your first API
                  </Link>
                </div>
              ) : (
                recent.map((a) => (
                  <div key={a.apiId} className="recent-row">
                    <div className="api-avatar">{a.apiName[0]?.toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="api-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {a.apiName}
                      </div>
                      <div className="api-ver">{a.version}</div>
                    </div>
                    <StatusBadge status={a.status} />
                    <Link href={`/provider/apis/${a.apiId}`} className="manage-link">
                      Manage →
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
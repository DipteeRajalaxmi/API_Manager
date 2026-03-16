"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import apiClient from "@/lib/api";

interface ApiStat {
  apiId: number;
  apiName: string;
  calls: number;
}

interface DeveloperAnalytics {
  callsToday: number;
  callsThisWeek: number;
  apiBreakdown: ApiStat[];
}

export default function DeveloperAnalyticsPage() {
  const [data,    setData]    = useState<DeveloperAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/api/analytics/developer")
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const maxCalls = Math.max(...(data?.apiBreakdown.map(a => a.calls) ?? [1]), 1);
  const total    = data?.apiBreakdown.reduce((s, a) => s + Number(a.calls), 0) ?? 0;

  return (
    <DashboardLayout>
      <style>{`
        :root {
          --teal-400:#2dd4bf;--teal-500:#14b8a6;--teal-600:#0d9488;
          --blue-500:#3b82f6;--purple-500:#8b5cf6;
          --gray-50:#f8fafc;--gray-100:#f1f5f9;--gray-200:#e2e8f0;
          --gray-400:#94a3b8;--gray-500:#64748b;--gray-700:#334155;--gray-800:#1e293b;
          --white:#ffffff;
          --radius-xl:1.25rem;--radius-2xl:1.75rem;
          --shadow-sm:0 1px 3px rgba(0,0,0,.06);--shadow-md:0 4px 16px rgba(0,0,0,.08);
        }
        .an-root{min-height:100vh;background:var(--gray-50);padding:2.5rem 2.5rem 4rem;font-family:'DM Sans',ui-sans-serif,system-ui,sans-serif;}
        .an-header{margin-bottom:2rem;animation:fadeUp .5s ease both;}
        .an-header .eyebrow{display:inline-flex;align-items:center;gap:.4rem;font-size:.72rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--blue-500);background:rgba(59,130,246,.08);border:1px solid rgba(59,130,246,.18);border-radius:99px;padding:.25rem .75rem;margin-bottom:.85rem;}
        .an-header h1{font-size:1.75rem;font-weight:800;color:var(--gray-800);letter-spacing:-.03em;margin:0 0 .3rem;}
        .an-header p{color:var(--gray-400);font-size:.875rem;margin:0;}
        .stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.1rem;margin-bottom:1.75rem;}
        .stat-card{position:relative;background:var(--white);border-radius:var(--radius-2xl);padding:1.6rem 1.5rem 1.4rem;box-shadow:var(--shadow-sm);border:1px solid var(--gray-100);overflow:hidden;animation:fadeUp .5s ease both;transition:transform .2s,box-shadow .2s;}
        .stat-card:hover{transform:translateY(-3px);box-shadow:var(--shadow-md);}
        .stat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--accent,var(--blue-500));border-radius:99px 99px 0 0;}
        .stat-card::after{content:'';position:absolute;bottom:-24px;right:-16px;width:90px;height:90px;border-radius:50%;background:var(--accent,var(--blue-500));opacity:.045;}
        .stat-icon{font-size:1.35rem;margin-bottom:.9rem;}
        .stat-value{font-size:2.4rem;font-weight:900;color:var(--gray-800);letter-spacing:-.04em;line-height:1;margin-bottom:.35rem;}
        .stat-label{font-size:.78rem;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:.07em;}
        .panel{background:var(--white);border-radius:var(--radius-2xl);border:1px solid var(--gray-100);box-shadow:var(--shadow-sm);animation:fadeUp .55s ease both;overflow:hidden;margin-bottom:1.25rem;}
        .panel-head{display:flex;align-items:center;justify-content:space-between;padding:1.4rem 1.5rem .5rem;}
        .panel-title{font-size:.8rem;font-weight:700;color:var(--gray-700);text-transform:uppercase;letter-spacing:.08em;}
        .panel-sub{font-size:.75rem;color:var(--gray-400);}
        .api-row{display:flex;align-items:center;gap:1rem;padding:1rem 1.5rem;border-bottom:1px solid var(--gray-50);transition:background .1s;}
        .api-row:last-child{border-bottom:none;}
        .api-row:hover{background:var(--gray-50);}
        .api-avatar{width:2.2rem;height:2.2rem;border-radius:.6rem;background:linear-gradient(135deg,#60a5fa,var(--blue-500));display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:.85rem;flex-shrink:0;}
        .api-name{font-size:.875rem;font-weight:600;color:var(--gray-800);}
        .api-calls{font-size:.8rem;color:var(--gray-400);margin-top:.1rem;}
        .bar-wrap{flex:1;}
        .bar-bg{height:8px;background:var(--gray-100);border-radius:99px;overflow:hidden;}
        .bar-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#60a5fa,var(--blue-500));transition:width .6s ease;}
        .calls-num{font-size:.875rem;font-weight:700;color:var(--gray-700);min-width:3rem;text-align:right;}
        .pct-badge{font-size:.72rem;font-weight:600;color:var(--blue-500);background:rgba(59,130,246,.08);border:1px solid rgba(59,130,246,.15);padding:.2rem .5rem;border-radius:.4rem;min-width:3.5rem;text-align:center;}
        .empty-state{text-align:center;padding:4rem 1rem;}
        .empty-state p{color:var(--gray-400);font-size:.875rem;margin:0 0 1rem;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
      `}</style>

      <div className="an-root">
        {/* Header */}
        <div className="an-header">
          <div className="eyebrow">📊 Analytics</div>
          <h1>My Usage Analytics</h1>
          <p>Your API call history — last 7 days</p>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="stats-grid">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="stat-card animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded mb-4" />
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="stats-grid">
            {[
              { label: "Calls Today",     value: data?.callsToday ?? 0,     icon: "⚡", accent: "var(--blue-500)",   delay: 0   },
              { label: "Calls This Week", value: data?.callsThisWeek ?? 0,  icon: "📅", accent: "var(--purple-500)", delay: 60  },
              { label: "APIs Used",       value: data?.apiBreakdown.length ?? 0, icon: "🔌", accent: "var(--teal-500)", delay: 120 },
            ].map(s => (
              <div key={s.label} className="stat-card" style={{ animationDelay: `${s.delay}ms`, "--accent": s.accent } as React.CSSProperties}>
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-value">{s.value.toLocaleString()}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* API breakdown */}
        <div className="panel" style={{ animationDelay: "200ms" }}>
          <div className="panel-head">
            <span className="panel-title">Usage by API</span>
            <span className="panel-sub">Last 7 days · {total.toLocaleString()} total calls</span>
          </div>

          {loading ? (
            <div className="empty-state"><p>Loading…</p></div>
          ) : !data?.apiBreakdown?.length ? (
            <div className="empty-state">
              <p style={{ fontSize: "2rem", marginBottom: "1rem" }}>📊</p>
              <p>No usage data yet. Start making API calls through the gateway.</p>
              <Link href="/marketplace" style={{ color: "var(--blue-500)", fontSize: ".875rem", fontWeight: 600 }}>
                Browse Marketplace →
              </Link>
            </div>
          ) : (
            data.apiBreakdown.map(api => {
              const pct = Math.round((Number(api.calls) / maxCalls) * 100);
              const totalPct = total > 0 ? Math.round((Number(api.calls) / total) * 100) : 0;
              return (
                <div key={api.apiId} className="api-row">
                  <div className="api-avatar">{api.apiName[0]?.toUpperCase()}</div>
                  <div style={{ minWidth: "140px" }}>
                    <div className="api-name">{api.apiName}</div>
                    <div className="api-calls">{Number(api.calls).toLocaleString()} calls</div>
                  </div>
                  <div className="bar-wrap">
                    <div className="bar-bg">
                      <div className="bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="calls-num">{Number(api.calls).toLocaleString()}</div>
                  <div className="pct-badge">{totalPct}%</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
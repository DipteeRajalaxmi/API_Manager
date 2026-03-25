"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import apiClient from "@/lib/api";

interface ApiStat {
  apiId: number;
  apiName: string;
  calls: number;
  avgLatency: number;
  errors: number;
}

interface DailyCall {
  date: string;
  calls: number;
}

interface UsageLog {
  requestTime: string;
  method: string;
  path: string;
  status: number;
  statusLabel?: string;
  latency: number;
  rateLimited: boolean;
  apiName?: string;
}

interface DeveloperAnalytics {
  callsToday: number;
  callsThisWeek: number;
  callsThisMonth: number;
  totalCalls: number;
  dailyCalls: DailyCall[];
  apiBreakdown: ApiStat[];
}

function getStatusStyle(status: number) {
  if (status >= 200 && status < 300) return { bg: "rgba(72,187,120,.15)", color: "#38a169", label: "2xx" };
  if (status >= 400 && status < 500) return { bg: "rgba(237,137,54,.15)", color: "#dd6b20", label: "4xx" };
  if (status >= 500) return { bg: "rgba(245,101,101,.15)", color: "#e53e3e", label: "5xx" };
  return { bg: "rgba(160,174,192,.15)", color: "#718096", label: "—" };
}

const METHOD_STYLE: Record<string, { bg: string; color: string }> = {
  GET:    { bg: "rgba(72,187,120,.15)",  color: "#38a169" },
  POST:   { bg: "rgba(66,153,225,.15)",  color: "#3182ce" },
  PUT:    { bg: "rgba(237,137,54,.15)",  color: "#dd6b20" },
  PATCH:  { bg: "rgba(159,122,234,.15)", color: "#805ad5" },
  DELETE: { bg: "rgba(245,101,101,.15)", color: "#e53e3e" },
};

function AreaSparkline({ data }: { data: DailyCall[] }) {
  if (!data.length) return <div style={{ height: 56 }} />;
  const max = Math.max(...data.map(d => Number(d.calls)), 1);
  const w = 120, h = 56, pad = 4;
  const pts = data.map((d, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2);
    const y = h - pad - (Number(d.calls) / max) * (h - pad * 2);
    return `${x},${y}`;
  }).join(" ");
  const area = `${pad},${h} ` + pts + ` ${w - pad},${h}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="teal-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#319795" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#319795" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#teal-grad)" />
      <polyline points={pts} fill="none" stroke="#319795" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function BarChart({ data }: { data: DailyCall[] }) {
  if (!data.length) return (
    <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#a0aec0", fontSize: ".85rem" }}>No data yet</p>
    </div>
  );
  const max = Math.max(...data.map(d => Number(d.calls)), 1);
  const show = data.slice(-30);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 160, padding: "0 4px" }}>
      {show.map((d, i) => {
        const pct = (Number(d.calls) / max) * 100;
        const dateLabel = new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end", cursor: "pointer" }}
            title={`${dateLabel}: ${Number(d.calls).toLocaleString()} calls`}>
            <div style={{
              width: "100%",
              borderRadius: "6px 6px 0 0",
              height: `${Math.max(pct, 3)}%`,
              background: pct > 70
                ? "linear-gradient(180deg,#319795,#2c7a7b)"
                : pct > 40
                  ? "linear-gradient(180deg,#4fd1c5,#38b2ac)"
                  : "rgba(129,230,217,.5)",
              transition: "height .4s ease",
            }} />
          </div>
        );
      })}
    </div>
  );
}

export default function DeveloperAnalyticsPage() {
  const [data,        setData]        = useState<DeveloperAnalytics | null>(null);
  const [logs,        setLogs]        = useState<UsageLog[]>([]);
  const [totalLogs,   setTotalLogs]   = useState(0);
  const [totalPages,  setTotalPages]  = useState(0);
  const [page,        setPage]        = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [activeTab,   setActiveTab]   = useState<"overview" | "logs">("overview");

  useEffect(() => {
    apiClient.get("/api/analytics/developer")
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const loadLogs = useCallback((p: number) => {
    setLogsLoading(true);
    apiClient.get(`/api/analytics/developer/logs?page=${p}&size=10`)
      .then(r => {
        setLogs(r.data.logs ?? r.data.recentLogs ?? []);
        setTotalLogs(r.data.totalLogs ?? 0);
        setTotalPages(r.data.totalPages ?? 1);
        setPage(p);
      })
      .catch(console.error)
      .finally(() => setLogsLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === "logs") loadLogs(0);
  }, [activeTab, loadLogs]);

  const total     = data?.apiBreakdown.reduce((s, a) => s + Number(a.calls), 0) ?? 0;
  const maxCalls  = Math.max(...(data?.apiBreakdown.map(a => Number(a.calls)) ?? [1]), 1);
  const errorRate = total > 0
    ? Math.round((data?.apiBreakdown.reduce((s, a) => s + Number(a.errors ?? 0), 0) ?? 0) / total * 100)
    : 0;
  const avgLatency = data?.apiBreakdown.length
    ? Math.round(data.apiBreakdown.reduce((s, a) => s + Number(a.avgLatency ?? 0), 0) / data.apiBreakdown.length)
    : 0;

  const statCards = [
    { label: "Today",       value: data?.callsToday ?? 0,     icon: "⚡", accent: "#319795", trend: "+12%" },
    { label: "This Week",   value: data?.callsThisWeek ?? 0,  icon: "📅", accent: "#3182ce", trend: "+8%"  },
    { label: "This Month",  value: data?.callsThisMonth ?? 0, icon: "🗓", accent: "#805ad5", trend: "+21%" },
    { label: "All Time",    value: data?.totalCalls ?? 0,     icon: "∞",  accent: "#dd6b20", trend: ""     },
    { label: "Avg Latency", value: `${avgLatency}ms`,         icon: "⏱", accent: "#38a169", trend: "-5%"  },
    { label: "Error Rate",  value: `${errorRate}%`,           icon: "⚠",  accent: errorRate > 5 ? "#e53e3e" : "#38a169", trend: "" },
  ];

  return (
    <DashboardLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

        :root {
          --bg:        #f7fafc;
          --sidebar:   #ffffff;
          --card:      #ffffff;
          --border:    #e2e8f0;
          --border2:   #cbd5e0;
          --teal:      #319795;
          --teal-l:    #4fd1c5;
          --teal-ll:   #e6fffa;
          --blue:      #3182ce;
          --purple:    #805ad5;
          --amber:     #dd6b20;
          --green:     #38a169;
          --red:       #e53e3e;
          --text:      #1a202c;
          --muted:     #4a5568;
          --muted2:    #718096;
          --muted3:    #a0aec0;
          --radius:    20px;
          --radius-sm: 12px;
          --shadow:    0 4px 24px rgba(0,0,0,.06);
          --shadow-md: 0 8px 32px rgba(0,0,0,.1);
        }

        .pu-root {
          background: var(--bg);
          min-height: 100vh;
          padding: 2rem 2.5rem 5rem;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: var(--text);
        }

        /* ─── Top gradient banner ─── */
        .pu-banner {
          background: linear-gradient(135deg, #2c7a7b 0%, #319795 40%, #4fd1c5 100%);
          border-radius: var(--radius);
          padding: 2rem 2.5rem 5rem;
          margin-bottom: -3.5rem;
          position: relative;
          overflow: hidden;
        }
        .pu-banner::before {
          content: '';
          position: absolute;
          top: -60px; right: -60px;
          width: 260px; height: 260px;
          border-radius: 50%;
          background: rgba(255,255,255,.08);
        }
        .pu-banner::after {
          content: '';
          position: absolute;
          bottom: -80px; left: 30%;
          width: 200px; height: 200px;
          border-radius: 50%;
          background: rgba(255,255,255,.05);
        }
        .pu-eyebrow {
          font-size: .7rem;
          font-weight: 700;
          letter-spacing: .16em;
          text-transform: uppercase;
          color: rgba(255,255,255,.75);
          margin-bottom: .5rem;
        }
        .pu-title {
          font-size: 1.85rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -.03em;
          margin: 0 0 .25rem;
        }
        .pu-sub {
          color: rgba(255,255,255,.7);
          font-size: .85rem;
          font-family: 'DM Mono', monospace;
        }

        /* ─── Tabs (white pill style) ─── */
        .tabs {
          display: flex;
          gap: 4px;
          background: rgba(255,255,255,.18);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,.25);
          border-radius: 50px;
          padding: 4px;
          width: fit-content;
          margin-top: 1.5rem;
          position: relative;
          z-index: 1;
        }
        .tab-btn {
          padding: .45rem 1.4rem;
          border-radius: 50px;
          font-size: .8rem;
          font-weight: 700;
          cursor: pointer;
          border: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all .2s;
          letter-spacing: .02em;
        }
        .tab-btn.active {
          background: #ffffff;
          color: var(--teal);
          box-shadow: 0 2px 8px rgba(0,0,0,.12);
        }
        .tab-btn:not(.active) {
          background: transparent;
          color: rgba(255,255,255,.85);
        }
        .tab-btn:not(.active):hover {
          background: rgba(255,255,255,.1);
        }

        /* ─── Stat cards ─── */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
          position: relative;
          z-index: 2;
        }
        .stat-card {
          background: var(--card);
          border-radius: var(--radius-sm);
          padding: 1.25rem;
          box-shadow: var(--shadow);
          border: 1px solid var(--border);
          transition: transform .2s, box-shadow .2s;
          position: relative;
          overflow: hidden;
        }
        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
        }
        .stat-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          margin-bottom: .85rem;
        }
        .stat-label {
          font-size: .7rem;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: var(--muted2);
          margin-bottom: .35rem;
        }
        .stat-value {
          font-size: 1.65rem;
          font-weight: 800;
          letter-spacing: -.04em;
          color: var(--text);
          line-height: 1;
        }
        .stat-trend {
          font-size: .72rem;
          font-weight: 600;
          margin-top: .4rem;
          color: var(--green);
        }
        .stat-spark {
          position: absolute;
          bottom: 0; right: 0;
          opacity: .5;
        }

        /* ─── Card base ─── */
        .card {
          background: var(--card);
          border-radius: var(--radius);
          border: 1px solid var(--border);
          box-shadow: var(--shadow);
          overflow: hidden;
        }
        .card-head {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .card-title {
          font-size: .82rem;
          font-weight: 800;
          letter-spacing: .06em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .card-badge {
          font-size: .72rem;
          font-weight: 600;
          padding: .25rem .75rem;
          border-radius: 50px;
          background: var(--teal-ll);
          color: var(--teal);
          font-family: 'DM Mono', monospace;
        }

        /* ─── API breakdown ─── */
        .col-head {
          display: grid;
          grid-template-columns: 2.5rem 1fr 90px 100px 90px 70px;
          gap: 1rem;
          padding: .75rem 1.5rem;
          font-size: .65rem;
          font-weight: 700;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: var(--muted3);
          background: #f7fafc;
          border-bottom: 1px solid var(--border);
        }
        .api-row {
          display: grid;
          grid-template-columns: 2.5rem 1fr 90px 100px 90px 70px;
          gap: 1rem;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border);
          transition: background .15s;
        }
        .api-row:last-child { border-bottom: none; }
        .api-row:hover { background: #f7fafc; }
        .api-avatar {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 800;
          font-size: .8rem;
          flex-shrink: 0;
          background: linear-gradient(135deg, #319795, #4fd1c5);
        }
        .api-name {
          font-size: .875rem;
          font-weight: 700;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .bar-bg {
          height: 5px;
          background: var(--border);
          border-radius: 99px;
          overflow: hidden;
          margin-top: 7px;
        }
        .bar-fill {
          height: 100%;
          border-radius: 99px;
          background: linear-gradient(90deg, var(--teal), var(--teal-l));
          transition: width .6s ease;
        }
        .pill {
          font-size: .72rem;
          font-weight: 700;
          padding: .28rem .65rem;
          border-radius: 6px;
          font-family: 'DM Mono', monospace;
          text-align: center;
          display: inline-block;
        }

        /* ─── Log table ─── */
        .log-head {
          display: grid;
          grid-template-columns: 150px 68px 1fr 80px 80px 100px;
          gap: .75rem;
          padding: .7rem 1.5rem;
          font-size: .65rem;
          font-weight: 700;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: var(--muted3);
          background: #f7fafc;
          border-bottom: 1px solid var(--border);
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .log-row {
          display: grid;
          grid-template-columns: 150px 68px 1fr 80px 80px 100px;
          gap: .75rem;
          align-items: center;
          padding: .85rem 1.5rem;
          border-bottom: 1px solid var(--border);
          font-family: 'DM Mono', monospace;
          font-size: .75rem;
          transition: background .15s;
        }
        .log-row:last-child { border-bottom: none; }
        .log-row:hover { background: #f7fafc; }

        /* ─── Pagination ─── */
        .pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--border);
          background: #f7fafc;
        }
        .page-btn {
          padding: .45rem 1.1rem;
          border-radius: 8px;
          border: 1.5px solid var(--border2);
          background: #fff;
          color: var(--muted);
          font-size: .78rem;
          font-weight: 700;
          cursor: pointer;
          transition: all .2s;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .page-btn:hover:not(:disabled) { border-color: var(--teal); color: var(--teal); }
        .page-btn:disabled { opacity: .35; cursor: not-allowed; }
        .page-info { font-size: .75rem; color: var(--muted2); font-family: 'DM Mono', monospace; }
        .page-numbers { display: flex; gap: 4px; }
        .page-num {
          width: 34px; height: 34px;
          border-radius: 8px;
          border: 1.5px solid var(--border);
          background: #fff;
          color: var(--muted);
          font-size: .78rem;
          font-weight: 700;
          cursor: pointer;
          transition: all .2s;
          display: flex; align-items: center; justify-content: center;
          font-family: 'DM Mono', monospace;
        }
        .page-num.active { background: var(--teal); border-color: var(--teal); color: #fff; box-shadow: 0 4px 12px rgba(49,151,149,.3); }
        .page-num:hover:not(.active) { border-color: var(--teal); color: var(--teal); }

        /* ─── Chart ─── */
        .chart-wrap { padding: 1.5rem 1.5rem 1rem; }
        .chart-x { display: flex; justify-content: space-between; padding: 6px 4px 0; }
        .chart-x span { font-size: .62rem; color: var(--muted3); font-family: 'DM Mono', monospace; }

        /* ─── Grid ─── */
        .overview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
        .full-width { grid-column: 1 / -1; }

        /* ─── Section label ─── */
        .section-wrap { position: relative; z-index: 2; margin-bottom: 1.5rem; }

        /* ─── Skeleton ─── */
        .skeleton {
          background: linear-gradient(90deg, #edf2f7 25%, #e2e8f0 50%, #edf2f7 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 8px;
        }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        /* ─── Fade animations ─── */
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp .4s ease both; }

        /* ─── Empty state ─── */
        .empty { padding: 4rem 1.5rem; text-align: center; color: var(--muted2); font-size: .85rem; }

        /* ─── Back button ─── */
        .back-btn {
          display: inline-flex; align-items: center; gap: .5rem;
          padding: .45rem 1rem .45rem .7rem;
          border-radius: 50px;
          background: rgba(255,255,255,.2);
          backdrop-filter: blur(6px);
          color: #fff;
          font-size: .78rem;
          font-weight: 700;
          text-decoration: none;
          border: 1px solid rgba(255,255,255,.3);
          transition: all .2s;
          margin-bottom: 1rem;
        }
        .back-btn:hover { background: rgba(255,255,255,.3); }
      `}</style>

      <div className="pu-root">

        {/* ── Gradient Banner ── */}
        <div className="pu-banner fade-up">
          <Link href="/developer/dashboard" className="back-btn">
            ← Back to Dashboard
          </Link>
          <div className="pu-eyebrow">Developer Portal</div>
          <h1 className="pu-title">Usage Analytics</h1>
          <p className="pu-sub">Your complete API call history & performance metrics</p>

          {/* Tabs */}
          <div className="tabs">
            {(["overview", "logs"] as const).map(t => (
              <button key={t} className={`tab-btn ${activeTab === t ? "active" : ""}`}
                onClick={() => setActiveTab(t)}>
                {t === "overview" ? "📊 Overview" : "📋 Request Logs"}
              </button>
            ))}
          </div>
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <>
            {/* Stat Cards (overlap the banner) */}
            <div className="stats-grid section-wrap fade-up" style={{ animationDelay: ".1s" }}>
              {loading
                ? [...Array(6)].map((_, i) => (
                  <div key={i} className="stat-card">
                    <div className="skeleton" style={{ width: 40, height: 40, marginBottom: 12, borderRadius: 10 }} />
                    <div className="skeleton" style={{ width: 50, height: 10, marginBottom: 10 }} />
                    <div className="skeleton" style={{ width: 80, height: 26 }} />
                  </div>
                ))
                : statCards.map((s, i) => (
                  <div key={s.label} className="stat-card fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="stat-icon-wrap" style={{ background: `${s.accent}18` }}>
                      <span>{s.icon}</span>
                    </div>
                    <div className="stat-label">{s.label}</div>
                    <div className="stat-value">
                      {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
                    </div>
                    {s.trend && (
                      <div className="stat-trend" style={{ color: s.trend.startsWith("-") && s.label !== "Avg Latency" ? "#e53e3e" : "#38a169" }}>
                        {s.trend} this period
                      </div>
                    )}
                    <div className="stat-spark">
                      <AreaSparkline data={(data?.dailyCalls ?? []).slice(-10)} />
                    </div>
                  </div>
                ))}
            </div>

            {/* Charts + API Table */}
            <div className="overview-grid fade-up" style={{ animationDelay: ".2s" }}>

              {/* Daily Trend */}
              <div className="card full-width">
                <div className="card-head">
                  <span className="card-title">Daily Call Trend</span>
                  <span className="card-badge">Last 30 days</span>
                </div>
                <div className="chart-wrap">
                  {loading ? (
                    <div className="skeleton" style={{ height: 160, borderRadius: 8 }} />
                  ) : (
                    <>
                      <BarChart data={data?.dailyCalls ?? []} />
                      <div className="chart-x">
                        {(data?.dailyCalls ?? []).filter((_, i, arr) =>
                          i === 0 || i === Math.floor(arr.length / 2) || i === arr.length - 1
                        ).map(d => (
                          <span key={d.date}>
                            {new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* API Breakdown */}
              <div className="card full-width">
                <div className="card-head">
                  <span className="card-title">API Breakdown</span>
                  <span className="card-badge">{total.toLocaleString()} total calls</span>
                </div>
                {loading ? (
                  <div style={{ padding: "1rem 1.5rem" }}>
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="skeleton" style={{ height: 48, marginBottom: 10, borderRadius: 10 }} />
                    ))}
                  </div>
                ) : !data?.apiBreakdown?.length ? (
                  <div className="empty">
                    No API calls yet.{" "}
                    <Link href="/developer/marketplace" style={{ color: "var(--teal)", fontWeight: 700 }}>
                      Browse Marketplace →
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="col-head">
                      <div />
                      <div>API Name</div>
                      <div style={{ textAlign: "center" }}>Calls</div>
                      <div style={{ textAlign: "center" }}>Avg Latency</div>
                      <div style={{ textAlign: "center" }}>Errors</div>
                      <div style={{ textAlign: "center" }}>Share</div>
                    </div>
                    {data.apiBreakdown.map((api, i) => {
                      const pct     = Math.round((Number(api.calls) / maxCalls) * 100);
                      const sharePct = total > 0 ? Math.round((Number(api.calls) / total) * 100) : 0;
                      const errRate  = Number(api.calls) > 0
                        ? Math.round((Number(api.errors ?? 0) / Number(api.calls)) * 100)
                        : 0;
                      return (
                        <div key={api.apiId} className="api-row fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                          <div className="api-avatar">{api.apiName[0]?.toUpperCase()}</div>
                          <div>
                            <div className="api-name">{api.apiName}</div>
                            <div className="bar-bg">
                              <div className="bar-fill" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <span className="pill" style={{ background: "rgba(49,151,149,.1)", color: "var(--teal)" }}>
                              {Number(api.calls).toLocaleString()}
                            </span>
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <span className="pill" style={{ background: "rgba(49,130,206,.1)", color: "var(--blue)" }}>
                              {api.avgLatency ?? 0}ms
                            </span>
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <span className="pill" style={{
                              background: errRate > 5 ? "rgba(229,62,62,.1)" : "rgba(56,161,105,.1)",
                              color:      errRate > 5 ? "var(--red)"         : "var(--green)",
                            }}>
                              {errRate}%
                            </span>
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <span className="pill" style={{ background: "rgba(128,90,213,.1)", color: "var(--purple)" }}>
                              {sharePct}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── LOGS TAB ── */}
        {activeTab === "logs" && (
          <div className="card fade-up section-wrap">
            <div className="card-head">
              <span className="card-title">Request Logs</span>
              <span className="card-badge">{totalLogs.toLocaleString()} total requests</span>
            </div>

            {logsLoading && page === 0 ? (
              <div style={{ padding: "1rem 1.5rem" }}>
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 38, marginBottom: 6, borderRadius: 6 }} />
                ))}
              </div>
            ) : !logs.length ? (
              <div className="empty">No request logs yet.</div>
            ) : (
              <>
                <div className="log-head">
                  <div>Time</div>
                  <div>Method</div>
                  <div>Path</div>
                  <div>Status</div>
                  <div>Latency</div>
                  <div>API</div>
                </div>
                <div style={{ opacity: logsLoading ? .5 : 1, transition: "opacity .2s" }}>
                  {logs.map((log, i) => {
                    const s  = getStatusStyle(log.status);
                    const ms = METHOD_STYLE[log.method] ?? { bg: "rgba(160,174,192,.12)", color: "#718096" };
                    return (
                      <div key={i} className="log-row">
                        <div style={{ color: "var(--muted2)", fontSize: ".68rem" }}>
                          {new Date(log.requestTime).toLocaleString("en-IN", {
                            day: "numeric", month: "short",
                            hour: "2-digit", minute: "2-digit", second: "2-digit",
                          })}
                        </div>
                        <div>
                          <span className="pill" style={{ background: ms.bg, color: ms.color, fontSize: ".68rem" }}>
                            {log.method}
                          </span>
                        </div>
                        <div style={{ color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={log.path}>
                          {log.path}
                        </div>
                        <div>
                          <span className="pill" style={{ background: s.bg, color: s.color, fontSize: ".68rem" }}>
                            {log.status}
                          </span>
                        </div>
                        <div style={{ color: Number(log.latency) > 500 ? "var(--amber)" : "var(--muted2)" }}>
                          {log.latency ?? "—"}ms
                        </div>
                        <div style={{ color: "var(--muted2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {log.apiName ?? "—"}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                <div className="pagination">
                  <span className="page-info">
                    Page {page + 1} of {totalPages} · {totalLogs.toLocaleString()} requests
                  </span>
                  <div className="page-numbers">
                    {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                      let p = i;
                      if (totalPages > 7) {
                        if (page <= 3) p = i;
                        else if (page >= totalPages - 4) p = totalPages - 7 + i;
                        else p = page - 3 + i;
                      }
                      return (
                        <button key={p} className={`page-num ${page === p ? "active" : ""}`}
                          onClick={() => loadLogs(p)}>
                          {p + 1}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="page-btn" disabled={page === 0} onClick={() => loadLogs(page - 1)}>← Prev</button>
                    <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => loadLogs(page + 1)}>Next →</button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
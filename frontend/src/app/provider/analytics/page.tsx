"use client";
import { useEffect, useState } from "react";
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


interface ProviderAnalytics {
  dailyCalls: DailyCall[];
  callsToday: number;
  callsThisWeek: number;
  callsThisMonth: number;
  apiBreakdown: ApiStat[];
}

// ── Mini sparkline bar chart ──────────────────────────────────────────────────
function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "80px", padding: "0 4px" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
          <div style={{
            width: "100%",
            height: `${Math.max((d.value / max) * 64, d.value > 0 ? 4 : 0)}px`,
            background: d.value > 0
              ? "linear-gradient(180deg, #2dd4bf, #14b8a6)"
              : "#f1f5f9",
            borderRadius: "4px 4px 0 0",
            transition: "height .5s ease",
            position: "relative",
          }}>
            {d.value > 0 && (
              <div style={{
                position: "absolute", top: "-20px", left: "50%", transform: "translateX(-50%)",
                fontSize: "10px", fontWeight: 700, color: "#14b8a6", whiteSpace: "nowrap",
              }}>{d.value}</div>
            )}
          </div>
          <div style={{ fontSize: "9px", color: "#94a3b8", fontWeight: 600, whiteSpace: "nowrap" }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function ProviderAnalyticsPage() {
  const [data,    setData]    = useState<ProviderAnalytics | null>(null);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    apiClient.get("/api/analytics/provider")
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const maxCalls = Math.max(...(data?.apiBreakdown.map(a => Number(a.calls)) ?? [1]), 1);
  const totalErrors = data?.apiBreakdown.reduce((s, a) => s + Number(a.errors), 0) ?? 0;
  const avgLatency  = data?.apiBreakdown.length
    ? Math.round(data.apiBreakdown.reduce((s, a) => s + Number(a.avgLatency), 0) / data.apiBreakdown.length)
    : 0;


const chartData = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (6 - i));
  const dateStr = d.toISOString().split("T")[0]; // "2026-03-14"
  const label   = d.toLocaleDateString("en-IN", { weekday: "short" });
  const found   = data?.dailyCalls.find(dc => dc.date === dateStr);
  return { label, value: found ? Number(found.calls) : 0 };
});

  return (
    <DashboardLayout>
      <style>{`
        :root {
          --teal-400:#2dd4bf;--teal-500:#14b8a6;--teal-600:#0d9488;
          --blue-500:#3b82f6;--purple-500:#8b5cf6;--red-500:#ef4444;
          --green-500:#22c55e;--amber-500:#f59e0b;
          --gray-50:#f8fafc;--gray-100:#f1f5f9;--gray-200:#e2e8f0;
          --gray-400:#94a3b8;--gray-500:#64748b;--gray-700:#334155;--gray-800:#1e293b;
          --white:#ffffff;--radius-xl:1.25rem;--radius-2xl:1.75rem;
          --shadow-sm:0 1px 3px rgba(0,0,0,.06);--shadow-md:0 4px 16px rgba(0,0,0,.08);
        }
        .an-root{min-height:100vh;background:var(--gray-50);padding:2.5rem 2.5rem 4rem;font-family:'DM Sans',ui-sans-serif,system-ui,sans-serif;}
        .an-header{margin-bottom:2rem;animation:fadeUp .5s ease both;}
        .eyebrow{display:inline-flex;align-items:center;gap:.4rem;font-size:.72rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--teal-500);background:rgba(20,184,166,.08);border:1px solid rgba(20,184,166,.18);border-radius:99px;padding:.25rem .75rem;margin-bottom:.85rem;}
        h1{font-size:1.75rem;font-weight:800;color:var(--gray-800);letter-spacing:-.03em;margin:0 0 .3rem;}
        .sub{color:var(--gray-400);font-size:.875rem;margin:0;}
        .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1.1rem;margin-bottom:1.5rem;}
        .stat-card{position:relative;background:var(--white);border-radius:var(--radius-2xl);padding:1.5rem;box-shadow:var(--shadow-sm);border:1px solid var(--gray-100);overflow:hidden;animation:fadeUp .5s ease both;transition:transform .2s,box-shadow .2s;}
        .stat-card:hover{transform:translateY(-2px);box-shadow:var(--shadow-md);}
        .stat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--accent,var(--teal-500));border-radius:99px 99px 0 0;}
        .stat-card::after{content:'';position:absolute;bottom:-20px;right:-12px;width:80px;height:80px;border-radius:50%;background:var(--accent,var(--teal-500));opacity:.05;}
        .stat-icon{font-size:1.3rem;margin-bottom:.8rem;}
        .stat-value{font-size:2.2rem;font-weight:900;color:var(--gray-800);letter-spacing:-.04em;line-height:1;margin-bottom:.3rem;}
        .stat-label{font-size:.75rem;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:.07em;}
        .grid-2{display:grid;grid-template-columns:1fr 320px;gap:1.25rem;margin-bottom:1.25rem;}
        .panel{background:var(--white);border-radius:var(--radius-2xl);border:1px solid var(--gray-100);box-shadow:var(--shadow-sm);animation:fadeUp .55s ease both;overflow:hidden;}
        .panel-head{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem .75rem;}
        .panel-title{font-size:.8rem;font-weight:700;color:var(--gray-700);text-transform:uppercase;letter-spacing:.08em;}
        .panel-sub{font-size:.75rem;color:var(--gray-400);}
        .chart-wrap{padding:.5rem 1.5rem 1.25rem;}
        .table-header{display:grid;grid-template-columns:2.5fr 1fr 1fr 1fr 2fr 40px;gap:.75rem;padding:.6rem 1.5rem;background:var(--gray-50);border-bottom:1px solid var(--gray-100);font-size:.7rem;font-weight:700;color:var(--gray-400);text-transform:uppercase;letter-spacing:.08em;}
        .table-row{display:grid;grid-template-columns:2.5fr 1fr 1fr 1fr 2fr 40px;gap:.75rem;padding:.9rem 1.5rem;border-bottom:1px solid var(--gray-50);align-items:center;cursor:pointer;transition:background .1s;}
        .table-row:last-child{border-bottom:none;}
        .table-row:hover{background:linear-gradient(90deg,rgba(20,184,166,.03),transparent);}
        .api-avatar{width:1.9rem;height:1.9rem;border-radius:.5rem;background:linear-gradient(135deg,var(--teal-400),var(--teal-600));display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:.8rem;flex-shrink:0;}
        .api-name{font-size:.875rem;font-weight:600;color:var(--gray-800);text-decoration:none;}
        .api-name:hover{color:var(--teal-600);}
        .calls-bar{height:6px;background:var(--gray-100);border-radius:99px;overflow:hidden;margin-top:3px;}
        .calls-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,var(--teal-400),var(--teal-500));transition:width .6s ease;}
        .badge{font-size:.72rem;font-weight:600;padding:.2rem .55rem;border-radius:.45rem;}
        .badge-green{background:rgba(34,197,94,.1);color:var(--green-500);}
        .badge-amber{background:rgba(245,158,11,.1);color:var(--amber-500);}
        .badge-red{background:rgba(239,68,68,.1);color:var(--red-500);}
        .arrow-btn{display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:.5rem;background:var(--gray-50);color:var(--gray-400);font-size:.75rem;transition:all .15s;text-decoration:none;}
        .arrow-btn:hover{background:var(--teal-500);color:#fff;}
        .top-api-row{display:flex;align-items:center;gap:.75rem;padding:.75rem 1.5rem;border-bottom:1px solid var(--gray-50);transition:background .1s;}
        .top-api-row:last-child{border-bottom:none;}
        .top-api-row:hover{background:var(--gray-50);}
        .rank{font-size:.85rem;font-weight:800;color:var(--gray-300);width:1.25rem;text-align:center;}
        .rank-1{color:#f59e0b;}
        .rank-2{color:#94a3b8;}
        .rank-3{color:#cd7f32;}
        .empty-state{text-align:center;padding:3.5rem 1rem;}
        .empty-state p{color:var(--gray-400);font-size:.875rem;margin:0 0 1rem;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
      `}</style>

      <div className="an-root">

        {/* Header */}
        <div className="an-header">
          <div className="eyebrow">📊 Analytics</div>
          <h1>API Analytics</h1>
          <p className="sub">Usage insights for your published APIs</p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {[
            { label: "Calls Today",      value: data?.callsToday ?? 0,      icon: "⚡", accent: "var(--teal-500)",   delay: 0   },
            { label: "Calls This Week",  value: data?.callsThisWeek ?? 0,   icon: "📅", accent: "var(--blue-500)",   delay: 50  },
            { label: "Calls This Month", value: data?.callsThisMonth ?? 0,  icon: "📈", accent: "var(--purple-500)", delay: 100 },
            { label: "Total Errors",     value: totalErrors,                 icon: "⚠️", accent: "var(--red-500)",    delay: 150 },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ animationDelay: `${s.delay}ms`, "--accent": s.accent } as React.CSSProperties}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-value">{loading ? "—" : s.value.toLocaleString()}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Chart + Top APIs */}
        <div className="grid-2" style={{ animationDelay: "180ms" }}>

          {/* Bar chart */}
          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">Daily Call Trend</span>
              <span className="panel-sub">Last 7 days</span>
            </div>
            <div className="chart-wrap">
              {loading
                ? <div style={{ height: "80px", background: "var(--gray-50)", borderRadius: "12px", animation: "pulse 1.5s infinite" }} />
                : <BarChart data={chartData} />
              }
            </div>
          </div>

          {/* Top APIs */}
          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">Top APIs</span>
              <span className="panel-sub">By calls</span>
            </div>
            {loading ? (
              <div style={{ padding: "1rem 1.5rem" }}>
                {[...Array(3)].map((_, i) => (
                  <div key={i} style={{ height: "36px", background: "var(--gray-100)", borderRadius: "8px", marginBottom: "8px", animation: "pulse 1.5s infinite" }} />
                ))}
              </div>
            ) : !data?.apiBreakdown?.length ? (
              <div className="empty-state"><p>No data yet</p></div>
            ) : (
              data.apiBreakdown.slice(0, 5).map((api, i) => (
                <div key={api.apiId} className="top-api-row">
                  <span className={`rank ${i === 0 ? "rank-1" : i === 1 ? "rank-2" : i === 2 ? "rank-3" : ""}`}>
                    {i + 1}
                  </span>
                  <div className="api-avatar" style={{ width: "1.6rem", height: "1.6rem", fontSize: ".7rem" }}>
                    {api.apiName[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: ".8rem", fontWeight: 600, color: "var(--gray-800)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {api.apiName}
                    </div>
                  </div>
                  <div style={{ fontSize: ".8rem", fontWeight: 700, color: "var(--teal-600)" }}>
                    {Number(api.calls).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* API Breakdown Table */}
        <div className="panel" style={{ animationDelay: "220ms" }}>
          <div className="panel-head">
            <span className="panel-title">API Breakdown</span>
            <span className="panel-sub">Click any row for detailed analytics</span>
          </div>

          {loading ? (
            <div className="empty-state"><p>Loading analytics…</p></div>
          ) : !data?.apiBreakdown?.length ? (
            <div className="empty-state">
              <p style={{ fontSize: "2rem", marginBottom: "1rem" }}>📊</p>
              <p>No usage data yet. Make API calls through the gateway to see analytics.</p>
              <Link href="/provider/apis" style={{ color: "var(--teal-500)", fontSize: ".875rem", fontWeight: 600 }}>View My APIs →</Link>
            </div>
          ) : (
            <>
              <div className="table-header">
                <div>API</div>
                <div>Calls</div>
                <div>Avg Latency</div>
                <div>Errors</div>
                <div>Call Volume</div>
                <div />
              </div>
              {data.apiBreakdown.map(api => {
                const pct     = Math.round((Number(api.calls) / maxCalls) * 100);
                const latency = Number(api.avgLatency);
                const errors  = Number(api.errors);
                const latencyClass = latency < 200 ? "badge-green" : latency < 500 ? "badge-amber" : "badge-red";

                return (
                  <Link key={api.apiId} href={`/provider/analytics/${api.apiId}`} style={{ textDecoration: "none", display: "block" }}>
                    <div className="table-row">
                      <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                        <div className="api-avatar">{api.apiName[0]?.toUpperCase()}</div>
                        <span className="api-name">{api.apiName}</span>
                      </div>
                      <div style={{ fontSize: ".875rem", fontWeight: 700, color: "var(--gray-800)" }}>
                        {Number(api.calls).toLocaleString()}
                      </div>
                      <div>
                        <span className={`badge ${latencyClass}`}>{latency}ms</span>
                      </div>
                      <div>
                        <span className={`badge ${errors === 0 ? "badge-green" : "badge-red"}`}>
                          {errors === 0 ? "✓ None" : `${errors} errors`}
                        </span>
                      </div>
                      <div style={{ paddingRight: ".5rem" }}>
                        <div style={{ fontSize: ".7rem", color: "var(--gray-400)", marginBottom: "3px" }}>{pct}% of total</div>
                        <div className="calls-bar">
                          <div className="calls-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span className="arrow-btn">→</span>
                    </div>
                  </Link>
                );
              })}

              {/* Footer */}
              <div style={{ padding: ".75rem 1.5rem", background: "var(--gray-50)", borderTop: "1px solid var(--gray-100)", display: "flex", gap: "1.5rem" }}>
                <span style={{ fontSize: ".75rem", color: "var(--gray-400)" }}>
                  {data.apiBreakdown.length} API{data.apiBreakdown.length !== 1 ? "s" : ""}
                </span>
                <span style={{ fontSize: ".75rem", color: "var(--gray-400)" }}>
                  Avg latency: <strong style={{ color: "var(--gray-600)" }}>{avgLatency}ms</strong>
                </span>
                <span style={{ fontSize: ".75rem", color: "var(--gray-400)" }}>
                  Total errors: <strong style={{ color: totalErrors > 0 ? "var(--red-500)" : "var(--green-500)" }}>{totalErrors}</strong>
                </span>
              </div>
            </>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import apiClient from "@/lib/api";

interface DevStat  { userId: number; name: string; calls: number; lastCall: string; }
interface RecentLog { requestTime: string; method: string; path: string; status: number; latency: number; rateLimited: boolean; developerName: string; clientId?: string; clientPlan?: string; }
interface ApiDetailAnalytics { developers: DevStat[]; recentLogs: RecentLog[]; }

function statusMeaning(s: number) {
  const map: Record<number,string> = {200:"Success",201:"Created",204:"No Content",400:"Bad Request",401:"Unauthorized",403:"Forbidden",404:"Not Found",429:"Rate Limited",500:"Server Error",502:"Bad Gateway",503:"Unavailable"};
  if (map[s]) return map[s];
  if (s < 300) return "Success"; if (s < 400) return "Redirect"; if (s < 500) return "Client Error"; return "Server Error";
}
function tier(s: number): "ok"|"warn"|"err" {
  if (s < 300) return "ok"; if (s < 400) return "warn"; return "err";
}

export default function ApiAnalyticsDetailPage() {
  const { apiId } = useParams<{ apiId: string }>();
  const [data,    setData]    = useState<ApiDetailAnalytics | null>(null);
  const [apiName, setApiName] = useState("");
  const [loading, setLoading] = useState(true);
  const [page,       setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs,  setTotalLogs]  = useState(0);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiClient.get(`/api/analytics/provider/api/${apiId}?page=${page}`),
      apiClient.get(`/api/apis/${apiId}`),
    ]).then(([analytics, api]) => {
      setData(analytics.data);
      setTotalPages(analytics.data.totalPages);
      setTotalLogs(analytics.data.totalLogs);
      setApiName(api.data.apiName);
    }).catch(console.error)
      .finally(() => setLoading(false));
}, [apiId, page]);

  const totalCalls   = data?.developers.reduce((s, d) => s + Number(d.calls), 0) ?? 0;
  const maxCalls     = Math.max(...(data?.developers.map(d => Number(d.calls)) ?? [1]), 1);
  const successCount = data?.recentLogs.filter(l => l.status < 300).length ?? 0;
  const errorCount   = data?.recentLogs.filter(l => l.status >= 400).length ?? 0;
  const rlCount      = data?.recentLogs.filter(l => l.rateLimited).length ?? 0;
  const successRate  = data?.recentLogs.length ? Math.round(successCount / data.recentLogs.length * 100) : 0;
  const avgLatency   = data?.recentLogs.length ? Math.round(data.recentLogs.reduce((s, l) => s + l.latency, 0) / data.recentLogs.length) : 0;

  const fmt = (t: string) => new Date(t).toLocaleString("en-IN", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" });

  return (
    <DashboardLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .an {
          --t4:#2dd4bf; --t5:#14b8a6; --t6:#0d9488; --t7:#0f766e;
          --b4:#60a5fa; --b5:#3b82f6;
          --ok-bg:#f0fdf4; --ok-tx:#15803d; --ok-bd:#bbf7d0;
          --wn-bg:#fffbeb; --wn-tx:#b45309; --wn-bd:#fde68a;
          --er-bg:#fff1f2; --er-tx:#be123c; --er-bd:#fecdd3;
          --s50:#f8fafc; --s100:#f1f5f9; --s200:#e2e8f0; --s300:#cbd5e1;
          --s400:#94a3b8; --s500:#64748b; --s600:#475569; --s700:#334155;
          --s800:#1e293b; --s900:#0f172a; --w:#ffffff;
          font-family:'Outfit',ui-sans-serif,system-ui,sans-serif;
          min-height:100vh; background:var(--s50); color:var(--s800);
        }
        .an *, .an *::before, .an *::after { box-sizing:border-box; }

        /* page */
        .pg { max-width:1300px; margin:0 auto; padding:2rem 1rem 5rem; }
        @media(min-width:640px){ .pg{ padding:2.5rem 1.5rem 5rem; } }
        @media(min-width:1024px){ .pg{ padding:2.5rem 2.5rem 5rem; } }

        /* back */
        .back { display:inline-flex; align-items:center; gap:.4rem; font-size:.78rem; font-weight:600;
          color:var(--s400); text-decoration:none; margin-bottom:1.75rem; transition:color .15s,gap .15s; }
        .back:hover{ color:var(--t5); gap:.6rem; }
        .back svg{ flex-shrink:0; }

        /* ── Hero ── */
        .hero {
          position:relative; overflow:hidden;
          background:linear-gradient(130deg, #0f766e 0%, #14b8a6 55%, #2dd4bf 100%);
          border-radius:1.75rem; padding:1.75rem 1.75rem 1.6rem;
          margin-bottom:1.5rem; color:#fff;
          animation:fadeUp .5s ease both;
        }
        .hero::before{
          content:''; position:absolute; top:-80px; right:-80px;
          width:280px; height:280px; border-radius:50%;
          background:rgba(255,255,255,.07); pointer-events:none;
        }
        .hero::after{
          content:''; position:absolute; bottom:-100px; left:40%;
          width:200px; height:200px; border-radius:50%;
          background:rgba(255,255,255,.04); pointer-events:none;
        }
        .hero-row{ position:relative; z-index:1; display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:1rem; }
        .hero-l  { display:flex; align-items:center; gap:1rem; }
        .h-icon  {
          width:3.25rem; height:3.25rem; border-radius:1rem; flex-shrink:0;
          background:rgba(255,255,255,.18); backdrop-filter:blur(8px);
          border:1.5px solid rgba(255,255,255,.3);
          display:flex; align-items:center; justify-content:center;
          font-weight:900; font-size:1.35rem;
        }
        .hero h1 { font-size:1.55rem; font-weight:800; margin:0 0 .2rem; letter-spacing:-.025em; line-height:1.2; }
        .hero p  { font-size:.8rem; opacity:.78; margin:0; }
        .h-pill  {
          display:inline-flex; align-items:center; gap:.3rem;
          background:rgba(255,255,255,.18); border:1px solid rgba(255,255,255,.28);
          backdrop-filter:blur(8px); border-radius:99px;
          padding:.35rem 1rem; font-size:.76rem; font-weight:600;
          color:#fff; text-decoration:none; white-space:nowrap;
          transition:background .15s; flex-shrink:0;
        }
        .h-pill:hover{ background:rgba(255,255,255,.27); }

        /* ── KPI strip ── */
        .kpis {
          display:grid;
          grid-template-columns:repeat(2,1fr);
          gap:.9rem; margin-bottom:1.4rem;
        }
        @media(min-width:580px){ .kpis{ grid-template-columns:repeat(3,1fr); } }
        @media(min-width:900px){ .kpis{ grid-template-columns:repeat(5,1fr); } }

        .kpi {
          background:var(--w); border-radius:1.25rem;
          border:1px solid var(--s100);
          padding:1.2rem 1.2rem 1rem;
          box-shadow:0 1px 4px rgba(0,0,0,.05);
          position:relative; overflow:hidden;
          animation:fadeUp .5s ease both;
          transition:transform .18s,box-shadow .18s;
        }
        .kpi:hover{ transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,.09); }
        .kpi-bar { position:absolute; top:0; left:0; right:0; height:3px; border-radius:99px 99px 0 0; }
        .kpi-ico { font-size:1.3rem; margin-bottom:.55rem; line-height:1; }
        .kpi-val { font-size:1.7rem; font-weight:800; letter-spacing:-.04em; color:var(--s800); line-height:1; margin-bottom:.28rem; }
        .kpi-lbl { font-size:.69rem; font-weight:700; color:var(--s400); text-transform:uppercase; letter-spacing:.08em; }
        .kpi-ghost{ position:absolute; bottom:-24px; right:-12px; width:80px; height:80px; border-radius:50%; opacity:.04; }

        /* ── Two col mid ── */
        .mid { display:grid; grid-template-columns:1fr; gap:1.2rem; margin-bottom:1.2rem; }
        @media(min-width:860px){ .mid{ grid-template-columns:1fr 320px; } }

        /* ── Panel ── */
        .panel {
          background:var(--w); border-radius:1.75rem;
          border:1px solid var(--s100);
          box-shadow:0 1px 4px rgba(0,0,0,.05);
          overflow:hidden; animation:fadeUp .5s ease both;
        }
        .ph {
          display:flex; align-items:center; justify-content:space-between;
          padding:1.2rem 1.5rem .8rem;
          border-bottom:1px solid var(--s50);
        }
        .ph-l { display:flex; align-items:center; gap:.55rem; }
        .ph-dot{ width:8px; height:8px; border-radius:50%; }
        .ptitle{ font-size:.76rem; font-weight:700; color:var(--s700); text-transform:uppercase; letter-spacing:.09em; }
        .psub  { font-size:.72rem; color:var(--s400); font-weight:500; }

        /* dev rows */
        .dr {
          display:flex; align-items:center; gap:.7rem;
          padding:.75rem 1.5rem; border-bottom:1px solid var(--s50);
          transition:background .1s;
        }
        .dr:last-child{ border-bottom:none; }
        .dr:hover{ background:var(--s50); }
        .dr-rank{ font-size:.75rem; font-weight:800; width:1.5rem; text-align:center; flex-shrink:0; }
        .dr-av  { width:1.85rem; height:1.85rem; border-radius:50%; background:linear-gradient(135deg,var(--b4),var(--b5)); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800; font-size:.74rem; flex-shrink:0; }
        .dr-name{ font-size:.82rem; font-weight:600; color:var(--s800); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .dr-time{ font-size:.67rem; color:var(--s400); margin-top:.04rem; }
        .dr-bg  { flex:1; height:5px; background:var(--s100); border-radius:99px; overflow:hidden; min-width:30px; }
        .dr-fil { height:100%; border-radius:99px; background:linear-gradient(90deg,var(--t4),var(--t6)); transition:width .7s cubic-bezier(.4,0,.2,1); }
        .dr-cnt { font-size:.78rem; font-weight:800; color:var(--s700); min-width:2.6rem; text-align:right; font-family:'JetBrains Mono',monospace; }

        /* summary */
        .sr { display:flex; align-items:center; justify-content:space-between; padding:.8rem 1.5rem; border-bottom:1px solid var(--s50); }
        .sr:last-child{ border-bottom:none; }
        .sr-l { display:flex; align-items:center; gap:.5rem; font-size:.82rem; color:var(--s600); font-weight:500; }
        .sr-v { font-size:.9rem; font-weight:800; color:var(--s800); font-family:'JetBrains Mono',monospace; }

        /* ══ TABLE ══ */
        .tbl-scroll{ overflow-x:auto; -webkit-overflow-scrolling:touch; }
        table.lt {
          width:100%; border-collapse:collapse; font-size:.79rem; min-width:680px;
        }
        .lt thead tr{ background:var(--s50); border-bottom:1px solid var(--s100); }
        .lt thead th{
          padding:.6rem 1rem; font-size:.65rem; font-weight:700;
          color:var(--s400); text-transform:uppercase; letter-spacing:.09em;
          text-align:left; white-space:nowrap;
        }
        .lt thead th:first-child{ padding-left:1.5rem; }
        .lt thead th:last-child { padding-right:1.5rem; }
        .lt tbody tr{ border-bottom:1px solid var(--s50); transition:background .1s; }
        .lt tbody tr:last-child{ border-bottom:none; }
        .lt tbody tr:hover{ background:#f5fefd; }
        .lt tbody td{ padding:.65rem 1rem; vertical-align:middle; }
        .lt tbody td:first-child{ padding-left:1.5rem; }
        .lt tbody td:last-child { padding-right:1.5rem; }

        .c-time{ color:var(--s400); font-size:.69rem; white-space:nowrap; font-family:'JetBrains Mono',monospace; }
        .c-path{ font-family:'JetBrains Mono',monospace; font-size:.73rem; color:var(--s700); max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .c-mng { font-size:.73rem; color:var(--s500); white-space:nowrap; }
        .c-lat { font-size:.75rem; font-weight:700; white-space:nowrap; font-family:'JetBrains Mono',monospace; }
        .lok { color:#16a34a; } .lmid{ color:#d97706; } .lbad{ color:#dc2626; }

        .mb { display:inline-block; font-size:.64rem; font-weight:700; padding:.17rem .46rem; border-radius:.38rem; font-family:'JetBrains Mono',monospace; white-space:nowrap; }
        .GET   { background:#dcfce7; color:#15803d; }
        .POST  { background:#dbeafe; color:#1d4ed8; }
        .PUT   { background:#fef3c7; color:#b45309; }
        .PATCH { background:#f3e8ff; color:#7c3aed; }
        .DELETE{ background:#fee2e2; color:#b91c1c; }

        .sc { display:inline-flex; align-items:center; gap:.28rem; font-size:.72rem; font-weight:700; padding:.18rem .5rem; border-radius:.42rem; white-space:nowrap; font-family:'JetBrains Mono',monospace; }
        .sc-ok  { background:var(--ok-bg); color:var(--ok-tx); border:1px solid var(--ok-bd); }
        .sc-warn{ background:var(--wn-bg); color:var(--wn-tx); border:1px solid var(--wn-bd); }
        .sc-err { background:var(--er-bg); color:var(--er-tx); border:1px solid var(--er-bd); }
        .sd { width:5px; height:5px; border-radius:50%; flex-shrink:0; }
        .sd-ok{ background:#22c55e; } .sd-warn{ background:#f59e0b; } .sd-err{ background:#ef4444; }

        .dc   { display:inline-flex; align-items:center; gap:.32rem; font-size:.74rem; color:var(--s600); font-weight:500; }
        .dc-d { width:6px; height:6px; border-radius:50%; background:var(--b4); flex-shrink:0; }
        .rl   { display:inline-block; font-size:.64rem; font-weight:700; padding:.17rem .46rem; border-radius:.38rem; background:var(--er-bg); color:var(--er-tx); border:1px solid var(--er-bd); }

        /* skeleton */
        .sk-row{ display:flex; gap:1rem; padding:.85rem 1.5rem; border-bottom:1px solid var(--s50); align-items:center; }
        .sk    { border-radius:.4rem; background:linear-gradient(90deg,var(--s100) 25%,var(--s50) 50%,var(--s100) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; flex-shrink:0; }
        @keyframes shimmer{ to{ background-position:-200% 0; } }

        .empty{ text-align:center; padding:3.5rem 1rem; }
        .empty-ico{ font-size:2.5rem; opacity:.28; margin-bottom:.75rem; }
        .empty p{ color:var(--s400); font-size:.875rem; margin:0; }

        @keyframes fadeUp{ from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div className="an">
        <div className="pg">

          {/* Back */}
          <Link href="/provider/analytics" className="back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back to Analytics
          </Link>

          {/* Hero */}
          <div className="hero">
            <div className="hero-row">
              <div className="hero-l">
                <div className="h-icon">{apiName[0]?.toUpperCase() ?? "A"}</div>
                <div>
                  <h1>{loading ? "Loading…" : apiName || "API Analytics"}</h1>
                  <p>Developer usage · last 7 days · {totalCalls.toLocaleString()} total calls</p>
                </div>
              </div>
              <Link href={`/provider/apis/${apiId}`} className="h-pill">
                Manage API
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            </div>
          </div>

          {/* KPI strip */}
          <div className="kpis">
            {[
              { ico:"", val:totalCalls.toLocaleString(),                               lbl:"Total Calls",    bar:"linear-gradient(90deg,#14b8a6,#2dd4bf)", ghost:"#14b8a6", delay:0   },
              { ico:"", val:(data?.developers.length??0).toString(),                   lbl:"Active Devs",    bar:"linear-gradient(90deg,#3b82f6,#60a5fa)", ghost:"#3b82f6", delay:55  },
              { ico:"", val:data?.recentLogs.length?`${successRate}%`:"—",             lbl:"Success Rate",   bar:"linear-gradient(90deg,#22c55e,#4ade80)", ghost:"#22c55e", delay:110 },
              { ico:"", val:errorCount.toString(),                                      lbl:"Errors",         bar:"linear-gradient(90deg,#ef4444,#f87171)", ghost:"#ef4444", delay:165 },
              { ico:"",  val:`${avgLatency}ms`,                                          lbl:"Avg Latency",    bar:"linear-gradient(90deg,#f59e0b,#fbbf24)", ghost:"#f59e0b", delay:220 },
            ].map(k => (
              <div key={k.lbl} className="kpi" style={{ animationDelay:`${k.delay}ms` }}>
                <div className="kpi-bar" style={{ background:k.bar }} />
                <div className="kpi-ghost" style={{ background:k.ghost }} />
                <div className="kpi-ico">{k.ico}</div>
                <div className="kpi-val">{loading?"—":k.val}</div>
                <div className="kpi-lbl">{k.lbl}</div>
              </div>
            ))}
          </div>

          {/* Mid grid */}
          <div className="mid">

            {/* Dev leaderboard */}
            <div className="panel" style={{ animationDelay:"130ms" }}>
              <div className="ph">
                <div className="ph-l">
                  <div className="ph-dot" style={{ background:"linear-gradient(135deg,#2dd4bf,#0d9488)" }} />
                  <span className="ptitle">Developer Leaderboard</span>
                </div>
                <span className="psub">{data?.developers.length??0} active · 7d</span>
              </div>
              {loading ? (
                [1,2,3].map(i=>(
                  <div key={i} className="sk-row">
                    <div className="sk" style={{width:28,height:28,borderRadius:"50%"}} />
                    <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
                      <div className="sk" style={{height:11,width:"50%"}} />
                      <div className="sk" style={{height:8,width:"32%"}} />
                    </div>
                    <div className="sk" style={{width:38,height:11}} />
                  </div>
                ))
              ) : !data?.developers?.length ? (
                <div className="empty"><div className="empty-ico">👥</div><p>No developer activity yet</p></div>
              ) : data.developers.map((dev, i) => {
                const pct = Math.round((Number(dev.calls)/maxCalls)*100);
                const medal = i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}`;
                return (
                  <div key={dev.userId} className="dr">
                    <span className="dr-rank">{medal}</span>
                    <div className="dr-av">{dev.name?.[0]?.toUpperCase()}</div>
                    <div style={{flex:"0 0 100px",minWidth:0}}>
                      <div className="dr-name">{dev.name}</div>
                      <div className="dr-time">{dev.lastCall?fmt(dev.lastCall):"—"}</div>
                    </div>
                    <div className="dr-bg"><div className="dr-fil" style={{width:`${pct}%`}} /></div>
                    <div className="dr-cnt">{Number(dev.calls).toLocaleString()}</div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="panel" style={{ animationDelay:"170ms" }}>
              <div className="ph">
                <div className="ph-l">
                  <div className="ph-dot" style={{ background:"linear-gradient(135deg,#60a5fa,#3b82f6)" }} />
                  <span className="ptitle">Summary</span>
                </div>
                <span className="psub">7-day window</span>
              </div>
              {[
                {lbl:"Total API Calls",    val:totalCalls.toLocaleString(),                               ico:"📡"},
                {lbl:"Active Developers", val:(data?.developers.length??0).toString(),                   ico:"👥"},
                {lbl:"Successful Calls",  val:successCount.toString(),                                    ico:"✅"},
                {lbl:"Failed Calls",      val:errorCount.toString(),                                      ico:"❌"},
                {lbl:"Rate Limited",      val:rlCount.toString(),                                         ico:"🚫"},
                {lbl:"Success Rate",      val:data?.recentLogs.length?`${successRate}%`:"—",             ico:"📈"},
                {lbl:"Avg Latency",       val:`${avgLatency}ms`,                                          ico:"⏱"},
              ].map(s=>(
                <div key={s.lbl} className="sr">
                  <div className="sr-l"><span>{s.ico}</span>{s.lbl}</div>
                  <span className="sr-v">{loading?"—":s.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Call logs table */}
        <div className="panel" style={{ animationDelay:"210ms" }}>
          <div className="ph">
            <div className="ph-l">
              <div className="ph-dot" style={{ background:"linear-gradient(135deg,#f59e0b,#fbbf24)" }} />
              <span className="ptitle">Recent Call Logs</span>
            </div>
            <span className="psub">{totalLogs} total calls </span>
          </div>

          {loading ? (
            [1,2,3,4,5].map(i=>(
              <div key={i} className="sk-row" style={{gap:"1.25rem"}}>
                <div className="sk" style={{width:90,height:10}} />
                <div className="sk" style={{width:44,height:20,borderRadius:6}} />
                <div className="sk" style={{width:130,height:10}} />
                <div className="sk" style={{width:48,height:20,borderRadius:6}} />
                <div className="sk" style={{width:75,height:10}} />
                <div className="sk" style={{width:50,height:10}} />
                <div className="sk" style={{width:85,height:10}} />
              </div>
            ))
          ) : !data?.recentLogs?.length ? (
            <div className="empty"><div className="empty-ico">📋</div><p>No call logs yet</p></div>
          ) : (
            <>
              <div className="tbl-scroll">
                <table className="lt">
                  <thead>
                    <tr>
                      <th>Time</th><th>Method</th><th>Path</th>
                      <th>Status</th><th>Meaning</th><th>Latency</th><th>Developer</th><th>Client</th><th>Plan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentLogs.map((log, i) => {
                      const t = tier(log.status);
                      const lc = log.latency < 150 ? "lok" : log.latency < 500 ? "lmid" : "lbad";
                      return (
                        <tr key={i}>
                          <td className="c-time">{fmt(log.requestTime)}</td>
                          <td><span className={`mb ${log.method}`}>{log.method}</span></td>
                          <td className="c-path" title={log.path}>{log.path}</td>
                          <td>
                            <span className={`sc sc-${t}`}>
                              <span className={`sd sd-${t}`} />{log.status}
                            </span>
                          </td>
                          {/* Meaning — highlights Rate Limited here */}
                          <td className="c-mng">
                            {log.rateLimited
                              ? <span className="rl">Rate Limited</span>
                              : statusMeaning(log.status)
                            }
                          </td>
                          <td className={`c-lat ${lc}`}>{log.latency}ms</td>
                          {/* Developer — always show name */}
                          <td>
                            <span className="dc">
                              <span className="dc-d"/>
                              {log.developerName || "—"}
                            </span>
                          </td>

                          <td className="c-mng">{log.clientId || "—"}</td>
                          <td>
                            {log.clientPlan ? (
                              <span style={{
                                fontSize:".68rem", fontWeight:700, padding:".17rem .46rem",
                                borderRadius:".38rem", textTransform:"capitalize",
                                background: log.clientPlan === "enterprise" ? "#f5f3ff" :
                                            log.clientPlan === "business"   ? "#eff6ff" :
                                            log.clientPlan === "professional" ? "#f0fdfa" : "#f8fafc",
                                color: log.clientPlan === "enterprise" ? "#7c3aed" :
                                      log.clientPlan === "business"   ? "#1d4ed8" :
                                      log.clientPlan === "professional" ? "#0f766e" : "#475569",
                              }}>{log.clientPlan}</span>
                            ) : <span style={{color:"var(--s300)"}}>—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination — inside the panel */}
              {totalPages > 1 && (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: ".75rem 1.5rem",
                  borderTop: "1px solid var(--s100)"
                }}>
                  <span style={{ fontSize: ".75rem", color: "var(--s400)" }}>
                    Showing {page * 10 + 1}–{Math.min((page + 1) * 10, totalLogs)} of {totalLogs} calls
                  </span>
                  <div style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
                    <button
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      style={{
                        padding: ".4rem .9rem", borderRadius: ".5rem", fontSize: ".78rem",
                        fontWeight: 600, border: "1px solid var(--s200)",
                        background: page === 0 ? "var(--s50)" : "var(--w)",
                        color: page === 0 ? "var(--s300)" : "var(--s600)",
                        cursor: page === 0 ? "not-allowed" : "pointer"
                      }}>
                      ← Prev
                    </button>
                    <span style={{
                      padding: ".4rem .9rem", borderRadius: ".5rem", fontSize: ".78rem",
                      fontWeight: 700, background: "var(--t6)", color: "#fff"
                    }}>
                      {page + 1} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      style={{
                        padding: ".4rem .9rem", borderRadius: ".5rem", fontSize: ".78rem",
                        fontWeight: 600, border: "1px solid var(--s200)",
                        background: page >= totalPages - 1 ? "var(--s50)" : "var(--w)",
                        color: page >= totalPages - 1 ? "var(--s300)" : "var(--s600)",
                        cursor: page >= totalPages - 1 ? "not-allowed" : "pointer"
                      }}>
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        </div>
        </div>
        </DashboardLayout>
        );
      }
"use client";
import { useEffect, useState, useRef } from "react";
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

// ── Animated counter ──────────────────────────────────────────────────────────
function Counter({ to, duration = 900 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * to));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [to, duration]);
  return <>{val.toLocaleString()}</>;
}

// ── SVG Bar chart ──────────────────────────────────────────────────────────────
function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const [hovered, setHovered] = useState<number | null>(null);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:120, padding:"0 4px 0" }}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 88;
        const isHot = hovered === i;
        return (
          <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6, position:"relative" }}
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
            {/* Tooltip */}
            {isHot && d.value > 0 && (
              <div style={{
                position:"absolute", top:-36, left:"50%", transform:"translateX(-50%)",
                background:"#0f172a", color:"white", fontSize:11, fontWeight:700,
                padding:"4px 8px", borderRadius:7, whiteSpace:"nowrap",
                boxShadow:"0 4px 12px rgba(0,0,0,0.2)", zIndex:10,
              }}>
                {d.value} calls
                <div style={{ position:"absolute", bottom:-4, left:"50%", transform:"translateX(-50%)",
                  width:8, height:8, background:"#0f172a", clipPath:"polygon(0 0, 100% 0, 50% 100%)" }}/>
              </div>
            )}
            {/* Bar */}
            <div style={{
              width:"100%", position:"relative",
              height:`${Math.max(pct, d.value > 0 ? 6 : 0)}px`,
              borderRadius:"6px 6px 0 0",
              background: d.value === 0
                ? "rgba(241,245,249,0.6)"
                : isHot
                  ? "linear-gradient(180deg, #5eead4 0%, #0d9488 100%)"
                  : "linear-gradient(180deg, #2dd4bf 0%, #14b8a6 100%)",
              transition:"all 0.2s ease",
              transform: isHot ? "scaleY(1.04)" : "scaleY(1)",
              transformOrigin:"bottom",
              boxShadow: isHot && d.value > 0 ? "0 -4px 16px rgba(20,184,166,0.4)" : "none",
            }}/>
            <span style={{ fontSize:9, color: isHot ? "#0d9488" : "#94a3b8",
              fontWeight: isHot ? 700 : 600, transition:"color 0.15s", letterSpacing:"0.04em" }}>
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Sparkline for the stat cards ───────────────────────────────────────────────
function MiniSparkline({ color }: { color: string }) {
  const pts = [30,45,28,60,42,75,55,80,62,90].map((y,i) => `${i*11},${100-y}`).join(" ");
  return (
    <svg width="80" height="32" viewBox="0 0 99 100" fill="none" style={{ opacity:0.35 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function ProviderAnalyticsPage() {
  const [data,    setData]    = useState<ProviderAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy,  setSortBy]  = useState<"calls"|"latency"|"errors">("calls");

  useEffect(() => {
    apiClient.get("/api/analytics/provider")
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalErrors = data?.apiBreakdown.reduce((s,a) => s + Number(a.errors), 0) ?? 0;
  const avgLatency  = data?.apiBreakdown.length
    ? Math.round(data.apiBreakdown.reduce((s,a) => s + Number(a.avgLatency), 0) / data.apiBreakdown.length)
    : 0;

  const chartData = Array.from({ length: 7 }, (_,i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const label   = d.toLocaleDateString("en-IN", { weekday:"short" });
    const found   = data?.dailyCalls.find(dc => dc.date === dateStr);
    return { label, value: found ? Number(found.calls) : 0 };
  });

  const sorted = [...(data?.apiBreakdown ?? [])].sort((a,b) => {
    if (sortBy === "calls")   return Number(b.calls) - Number(a.calls);
    if (sortBy === "latency") return Number(b.avgLatency) - Number(a.avgLatency);
    return Number(b.errors) - Number(a.errors);
  });

  const maxCalls = Math.max(...(data?.apiBreakdown.map(a => Number(a.calls)) ?? [1]), 1);

  const statCards = [
    { label:"Calls Today",      value: data?.callsToday ?? 0,     icon:"⚡", color:"#14b8a6", grad:"135deg,#0d9488,#0891b2", delay:0   },
    { label:"Calls This Week",  value: data?.callsThisWeek ?? 0,  icon:"📅", color:"#6366f1", grad:"135deg,#6366f1,#8b5cf6", delay:60  },
    { label:"Calls This Month", value: data?.callsThisMonth ?? 0, icon:"📈", color:"#f59e0b", grad:"135deg,#f59e0b,#f97316", delay:120 },
    { label:"Avg Latency",      value: avgLatency,                  icon:"⏱", color:"#22c55e", grad:"135deg,#22c55e,#16a34a", suffix:"ms", delay:180 },
  ];

  return (
    <DashboardLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,700;9..40,800;9..40,900&family=DM+Mono:wght@400;500&display=swap');
        @keyframes fadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer  { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes barGrow  { from{transform:scaleY(0)} to{transform:scaleY(1)} }
        @keyframes ping     { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.4);opacity:0} }

        .an2 { font-family:'DM Sans',system-ui,sans-serif; padding:32px 36px 72px; background:#f8fafc; min-height:100vh; }
        .an2 * { box-sizing:border-box; }

        /* Hero header */
        .hero-header {
          background:linear-gradient(135deg,#0f172a 0%,#0d2d3a 50%,#0c2230 100%);
          border-radius:24px; padding:28px 32px; margin-bottom:24px;
          position:relative; overflow:hidden;
          animation:fadeUp 0.4s ease both;
        }
        .hero-grid { position:absolute;inset:0;opacity:0.04;
          background-image:linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),
            linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px);
          background-size:32px 32px; }
        .hero-glow { position:absolute;top:-40px;right:-40px;width:220px;height:220px;
          border-radius:50%;background:radial-gradient(circle,rgba(20,184,166,.25),transparent 70%); }
        .hero-glow2 { position:absolute;bottom:-60px;left:60px;width:160px;height:160px;
          border-radius:50%;background:radial-gradient(circle,rgba(99,102,241,.2),transparent 70%); }
        .hero-eyebrow { font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;
          color:rgba(94,234,212,.8);margin-bottom:8px; }
        .hero-title { font-size:26px;font-weight:900;color:white;margin:0 0 6px;letter-spacing:-.03em; }
        .hero-sub { font-size:13px;color:rgba(255,255,255,.4);margin:0; }
        .hero-live { display:inline-flex;align-items:center;gap:6px;
          background:rgba(20,184,166,.15);border:1px solid rgba(20,184,166,.3);
          color:#5eead4;font-size:11px;font-weight:700;
          padding:4px 12px;border-radius:99px;margin-top:10px; }
        .live-dot { width:6px;height:6px;border-radius:50%;background:#14b8a6; animation:ping 2s infinite; }

        /* Stat cards */
        .stats-row { display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px; }
        .s-card {
          background:white; border-radius:20px; padding:22px;
          border:1px solid #f1f5f9;
          box-shadow:0 1px 3px rgba(0,0,0,.04),0 4px 16px rgba(0,0,0,.03);
          position:relative; overflow:hidden;
          animation:fadeUp 0.4s ease both;
          transition:transform .2s,box-shadow .2s;
          cursor:default;
        }
        .s-card:hover { transform:translateY(-3px); box-shadow:0 8px 32px rgba(0,0,0,.1); }
        .s-card-accent { position:absolute;top:0;left:0;right:0;height:3px;border-radius:20px 20px 0 0; }
        .s-card-glow { position:absolute;bottom:-16px;right:-8px;width:70px;height:70px;
          border-radius:50%;opacity:.08; }
        .s-card-icon { width:40px;height:40px;border-radius:12px;
          display:flex;align-items:center;justify-content:center;
          font-size:18px;margin-bottom:14px;position:relative;z-index:1; }
        .s-card-val { font-size:32px;font-weight:900;color:#0f172a;
          letter-spacing:-.04em;line-height:1;margin-bottom:4px;position:relative;z-index:1; }
        .s-card-lbl { font-size:11px;font-weight:700;color:#94a3b8;
          text-transform:uppercase;letter-spacing:.08em;position:relative;z-index:1; }
        .s-card-spark { position:absolute;bottom:14px;right:16px; }

        /* Two col */
        .grid2 { display:grid;grid-template-columns:1fr 300px;gap:16px;margin-bottom:20px; }

        /* Panels */
        .panel {
          background:white;border-radius:20px;
          border:1px solid #f1f5f9;
          box-shadow:0 1px 3px rgba(0,0,0,.04),0 4px 16px rgba(0,0,0,.03);
          overflow:hidden;
          animation:fadeUp 0.45s ease both;
        }
        .ph { display:flex;align-items:center;justify-content:space-between;
          padding:18px 22px 12px; border-bottom:1px solid #f8fafc; }
        .ph-left { display:flex;align-items:center;gap:10px; }
        .ph-icon { width:32px;height:32px;border-radius:9px;
          display:flex;align-items:center;justify-content:center;
          background:#f0fdfa; }
        .pt { font-size:13px;font-weight:800;color:#0f172a;letter-spacing:-.01em; }
        .ps { font-size:11px;color:#94a3b8;font-weight:500; }

        /* Sort tabs */
        .sort-tabs { display:flex;gap:4px; }
        .sort-tab { font-size:11px;font-weight:600;padding:4px 10px;
          border-radius:8px;border:none;cursor:pointer;transition:all .15s; }
        .sort-tab.active { background:#0d9488;color:white; }
        .sort-tab:not(.active) { background:#f8fafc;color:#94a3b8; }
        .sort-tab:not(.active):hover { background:#f1f5f9;color:#475569; }

        /* Table */
        .thead { display:grid;grid-template-columns:2fr 90px 90px 90px 140px 36px;
          gap:10px;padding:10px 22px;background:#fafafa;
          font-size:10px;font-weight:700;color:#94a3b8;
          text-transform:uppercase;letter-spacing:.08em;
          border-bottom:1px solid #f1f5f9; }
        .trow { display:grid;grid-template-columns:2fr 90px 90px 90px 140px 36px;
          gap:10px;padding:14px 22px;border-bottom:1px solid #f8fafc;
          align-items:center;cursor:pointer;transition:background .1s; text-decoration:none;
          color:inherit; }
        .trow:last-child { border-bottom:none; }
        .trow:hover { background:linear-gradient(90deg,rgba(20,184,166,.04),transparent); }
        .trow:hover .arr-btn { background:#0d9488;color:white; }

        .api-av { width:34px;height:34px;border-radius:10px;
          background:linear-gradient(135deg,#14b8a6,#0891b2);
          display:flex;align-items:center;justify-content:center;
          color:white;font-weight:800;font-size:14px;flex-shrink:0; }
        .api-n { font-size:13px;font-weight:700;color:#0f172a; }
        .api-id { font-size:10px;color:#94a3b8;font-family:'DM Mono',monospace;margin-top:1px; }

        .num { font-size:14px;font-weight:800;color:#0f172a; }
        .num-sub { font-size:10px;color:#94a3b8; }

        .pill { font-size:10px;font-weight:700;padding:3px 9px;border-radius:7px; }
        .pill-g { background:#f0fdf4;color:#16a34a; }
        .pill-a { background:#fffbeb;color:#b45309; }
        .pill-r { background:#fef2f2;color:#dc2626; }

        .bar-track { height:5px;background:#f1f5f9;border-radius:99px;overflow:hidden;margin-top:3px; }
        .bar-fill  { height:100%;border-radius:99px;
          background:linear-gradient(90deg,#2dd4bf,#14b8a6);
          transition:width .6s ease; }

        .arr-btn { width:28px;height:28px;border-radius:8px;background:#f8fafc;
          color:#94a3b8;display:flex;align-items:center;justify-content:center;
          font-size:12px;transition:all .15s;text-decoration:none; }

        /* Top APIs panel */
        .top-row { display:flex;align-items:center;gap:10px;
          padding:12px 22px;border-bottom:1px solid #f8fafc;
          transition:background .1s;cursor:default; }
        .top-row:last-child { border-bottom:none; }
        .top-row:hover { background:#f8fafc; }
        .rank-num { width:22px;text-align:center;font-size:13px;font-weight:900;color:#e2e8f0; }
        .rank-1  { color:#f59e0b; }
        .rank-2  { color:#94a3b8; }
        .rank-3  { color:#c97c2e; }

        .tfoot { display:flex;gap:20px;padding:12px 22px;
          background:#fafafa;border-top:1px solid #f1f5f9; }
        .tfoot-item { font-size:11px;color:#94a3b8; }
        .tfoot-item strong { color:#475569; }

        .empty { text-align:center;padding:56px 20px; }
        .empty-icon { font-size:40px;margin-bottom:12px; }
        .empty p { color:#94a3b8;font-size:13px;margin:0 0 16px; }

        .shimmer {
          background:linear-gradient(90deg,#f1f5f9 25%,#e8edf5 50%,#f1f5f9 75%);
          background-size:200% auto; animation:shimmer 1.5s linear infinite;
          border-radius:10px;
        }
      `}</style>

      <div className="an2">

        {/* ── HERO HEADER ─────────────────────────────────────────────────── */}
        <div className="hero-header">
          <div className="hero-grid"/>
          <div className="hero-glow"/>
          <div className="hero-glow2"/>
          <div style={{ position:"relative", zIndex:1 }}>
            <p className="hero-eyebrow">📊 Analytics Dashboard</p>
            <h1 className="hero-title">API Performance Overview</h1>
            <p className="hero-sub">Usage insights across all your published APIs</p>
            <div className="hero-live">
              <span className="live-dot"/>
              Live data
            </div>
          </div>
        </div>

        {/* ── STAT CARDS ──────────────────────────────────────────────────── */}
        <div className="stats-row">
          {statCards.map((s,i) => (
            <div key={s.label} className="s-card" style={{ animationDelay:`${s.delay}ms` }}>
              <div className="s-card-accent" style={{ background:`linear-gradient(${s.grad})` }}/>
              <div className="s-card-glow" style={{ background:`linear-gradient(${s.grad})` }}/>
              <div className="s-card-icon" style={{ background:`linear-gradient(${s.grad})10` }}>
                {s.icon}
              </div>
              <div className="s-card-val" style={{ color: loading ? "#e2e8f0" : "#0f172a" }}>
                {loading ? "—" : <><Counter to={s.value}/>{s.suffix ?? ""}</>}
              </div>
              <div className="s-card-lbl">{s.label}</div>
              <div className="s-card-spark"><MiniSparkline color={s.color}/></div>
            </div>
          ))}
        </div>

        {/* ── CHART + TOP APIs ─────────────────────────────────────────────── */}
        <div className="grid2">

          {/* Bar chart */}
          <div className="panel">
            <div className="ph">
              <div className="ph-left">
                <div className="ph-icon">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#0d9488" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                </div>
                <div>
                  <div className="pt">Daily Call Trend</div>
                  <div className="ps">Last 7 days</div>
                </div>
              </div>
              <div style={{ fontSize:11, fontWeight:700, color:"#14b8a6",
                background:"rgba(20,184,166,.08)", border:"1px solid rgba(20,184,166,.15)",
                padding:"3px 10px", borderRadius:8 }}>
                {chartData.reduce((s,d) => s + d.value, 0).toLocaleString()} total
              </div>
            </div>
            <div style={{ padding:"12px 22px 18px" }}>
              {loading
                ? <div className="shimmer" style={{ height:120 }}/>
                : <BarChart data={chartData}/>
              }
            </div>
          </div>

          {/* Top APIs */}
          <div className="panel">
            <div className="ph">
              <div className="ph-left">
                <div className="ph-icon">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#0d9488" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                  </svg>
                </div>
                <div>
                  <div className="pt">Top APIs</div>
                  <div className="ps">By call volume</div>
                </div>
              </div>
            </div>

            {loading ? (
              <div style={{ padding:"12px 22px", display:"flex", flexDirection:"column", gap:8 }}>
                {[...Array(4)].map((_,i) => (
                  <div key={i} className="shimmer" style={{ height:44, animationDelay:`${i*100}ms` }}/>
                ))}
              </div>
            ) : !data?.apiBreakdown?.length ? (
              <div className="empty"><p>No data yet</p></div>
            ) : (
              data.apiBreakdown.slice(0,5).map((api,i) => (
                <div key={api.apiId} className="top-row">
                  <span className={`rank-num ${i===0?"rank-1":i===1?"rank-2":i===2?"rank-3":""}`}>
                    {i+1}
                  </span>
                  <div style={{ width:30, height:30, borderRadius:9,
                    background:`hsl(${180+i*18},70%,${40+i*3}%)`,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    color:"white",fontWeight:800,fontSize:12,flexShrink:0 }}>
                    {api.apiName[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"#0f172a",
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {api.apiName}
                    </div>
                    <div style={{ fontSize:10, color:"#94a3b8" }}>
                      {Number(api.calls).toLocaleString()} calls
                    </div>
                  </div>
                  <div style={{
                    fontSize:12, fontWeight:800,
                    color: i===0?"#0d9488":i===1?"#6366f1":i===2?"#f59e0b":"#94a3b8",
                  }}>
                    {Math.round((Number(api.calls)/maxCalls)*100)}%
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── API BREAKDOWN TABLE ──────────────────────────────────────────── */}
        <div className="panel">
          <div className="ph">
            <div className="ph-left">
              <div className="ph-icon">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#0d9488" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M10 3v18M14 3v18"/>
                </svg>
              </div>
              <div>
                <div className="pt">API Breakdown</div>
                <div className="ps">Click any row for detailed analytics</div>
              </div>
            </div>
            {/* Sort controls */}
            <div className="sort-tabs">
              {(["calls","latency","errors"] as const).map(s => (
                <button key={s} className={`sort-tab ${sortBy===s?"active":""}`}
                  onClick={() => setSortBy(s)}>
                  {s === "calls" ? "Calls" : s === "latency" ? "Latency" : "Errors"}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ padding:"16px 22px", display:"flex", flexDirection:"column", gap:10 }}>
              {[...Array(3)].map((_,i) => (
                <div key={i} className="shimmer" style={{ height:56, animationDelay:`${i*80}ms` }}/>
              ))}
            </div>
          ) : !sorted.length ? (
            <div className="empty">
              <div className="empty-icon">📊</div>
              <p>No usage data yet. Make API calls through the gateway to see analytics.</p>
              <Link href="/provider/apis" style={{ color:"#0d9488", fontSize:13, fontWeight:700 }}>
                View My APIs →
              </Link>
            </div>
          ) : (
            <>
              <div className="thead">
                <div>API</div>
                <div>Calls</div>
                <div>Avg Latency</div>
                <div>Errors</div>
                <div>Volume</div>
                <div/>
              </div>

              {sorted.map((api, idx) => {
                const pct     = Math.round((Number(api.calls)/maxCalls)*100);
                const latency = Number(api.avgLatency);
                const errors  = Number(api.errors);
                const errRate = api.calls > 0 ? Math.round((errors/Number(api.calls))*100) : 0;
                const latClass = latency < 200 ? "pill-g" : latency < 500 ? "pill-a" : "pill-r";

                return (
                  <Link key={api.apiId} href={`/provider/analytics/${api.apiId}`}
                    className="trow" style={{ animationDelay:`${idx*40}ms` }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div className="api-av" style={{
                        background:`linear-gradient(135deg, hsl(${180+idx*18},70%,42%), hsl(${200+idx*18},75%,38%))`,
                      }}>
                        {api.apiName[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="api-n">{api.apiName}</div>
                        <div className="api-id">ID #{api.apiId}</div>
                      </div>
                    </div>

                    <div>
                      <div className="num">{Number(api.calls).toLocaleString()}</div>
                      <div className="num-sub">requests</div>
                    </div>

                    <div>
                      <span className={`pill ${latClass}`}>{latency}ms</span>
                      <div className="num-sub" style={{ marginTop:3 }}>
                        {latency < 200 ? "Fast" : latency < 500 ? "Moderate" : "Slow"}
                      </div>
                    </div>

                    <div>
                      <span className={`pill ${errors === 0 ? "pill-g" : errRate > 10 ? "pill-r" : "pill-a"}`}>
                        {errors === 0 ? "✓ 0" : errors}
                      </span>
                      {errors > 0 && <div className="num-sub" style={{ marginTop:3 }}>{errRate}% rate</div>}
                    </div>

                    <div style={{ paddingRight:4 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <span style={{ fontSize:10, color:"#94a3b8" }}>{pct}% of traffic</span>
                      </div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width:`${pct}%`,
                          background:`linear-gradient(90deg,hsl(${180+idx*18},60%,52%),hsl(${200+idx*18},65%,42%))`,
                        }}/>
                      </div>
                    </div>

                    <span className="arr-btn">→</span>
                  </Link>
                );
              })}

              <div className="tfoot">
                <span className="tfoot-item">
                  {sorted.length} API{sorted.length !== 1 ? "s" : ""}
                </span>
                <span className="tfoot-item">
                  Avg latency: <strong>{avgLatency}ms</strong>
                </span>
                <span className="tfoot-item">
                  Total errors: <strong style={{ color: totalErrors > 0 ? "#dc2626" : "#16a34a" }}>
                    {totalErrors}
                  </strong>
                </span>
                <span className="tfoot-item" style={{ marginLeft:"auto" }}>
                  Total calls: <strong>
                    {(data?.apiBreakdown.reduce((s,a) => s + Number(a.calls), 0) ?? 0).toLocaleString()}
                  </strong>
                </span>
              </div>
            </>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
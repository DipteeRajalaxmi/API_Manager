"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/ui/Badge";
import { getMyApis } from "@/lib/registry";
import { getUser } from "@/lib/auth";
import apiClient from "@/lib/api";
import { Api } from "@/types/api";
import { AuthResponse } from "@/types/auth";

// ── Animated counter ──────────────────────────────────────────────────────────
function Counter({ to, duration = 800 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [to, duration]);
  return <>{val.toLocaleString()}</>;
}

// ── Mini donut ────────────────────────────────────────────────────────────────
function MiniDonut({ published, draft, deprecated, total }: {
  published: number; draft: number; deprecated: number; total: number;
}) {
  const r = 28, cx = 34, cy = 34, circ = 2 * Math.PI * r;
  const segments = [
    { val: published,  color: "#14b8a6", label: "Published" },
    { val: draft,      color: "#6366f1", label: "Draft"     },
    { val: deprecated, color: "#f59e0b", label: "Deprecated"},
  ];
  let offset = 0;
  const arcs = total === 0 ? [] : segments.map(s => {
    const pct = s.val / total, dash = pct * circ, gap = circ - dash, o = offset;
    offset -= dash;
    return { ...s, dash, gap, offset: o };
  });
  return (
    <div style={{ display:"flex", alignItems:"center", gap:16 }}>
      <svg width="68" height="68" viewBox="0 0 68 68" style={{ flexShrink:0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="7"/>
        {total === 0 ? (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth="7"
            strokeDasharray={`${circ*.75} ${circ*.25}`} strokeDashoffset={circ*.25} strokeLinecap="round"/>
        ) : arcs.map((a, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={a.color} strokeWidth="7"
            strokeDasharray={`${a.dash-2} ${a.gap+2}`} strokeDashoffset={a.offset+circ*.25}
            strokeLinecap="round" style={{ transition:"stroke-dasharray .8s ease" }}/>
        ))}
        <text x={cx} y={cy+1} textAnchor="middle" dominantBaseline="central"
          style={{ fontSize:15, fontWeight:900, fill:"#0f172a", fontFamily:"DM Sans,sans-serif" }}>
          {total}
        </text>
      </svg>
      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
        {segments.map(s => (
          <div key={s.label} style={{ display:"flex", alignItems:"center", gap:7 }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:s.color, flexShrink:0, display:"block" }}/>
            <span style={{ fontSize:11, color:"#94a3b8", fontWeight:500 }}>{s.label}</span>
            <span style={{ fontSize:11, fontWeight:800, color:"#334155", marginLeft:"auto" }}>{s.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Particle canvas ───────────────────────────────────────────────────────────
function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let W = canvas.offsetWidth, H = canvas.offsetHeight;
    canvas.width = W; canvas.height = H;
    const pts = Array.from({ length: 38 }, () => ({
      x: Math.random()*W, y: Math.random()*H,
      vx: (Math.random()-.5)*.35, vy: (Math.random()-.5)*.35,
      r: Math.random()*1.5+.5,
    }));
    let raf: number;
    const draw = () => {
      ctx.clearRect(0,0,W,H);
      pts.forEach(p => {
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0||p.x>W) p.vx*=-1;
        if(p.y<0||p.y>H) p.vy*=-1;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle="rgba(94,234,212,0.5)"; ctx.fill();
      });
      pts.forEach((a,i)=>pts.slice(i+1).forEach(b=>{
        const d=Math.hypot(a.x-b.x,a.y-b.y);
        if(d<90){
          ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
          ctx.strokeStyle=`rgba(20,184,166,${0.12*(1-d/90)})`;
          ctx.lineWidth=.6; ctx.stroke();
        }
      }));
      raf=requestAnimationFrame(draw);
    };
    draw();
    const obs=new ResizeObserver(()=>{ W=canvas.offsetWidth; H=canvas.offsetHeight; canvas.width=W; canvas.height=H; });
    obs.observe(canvas);
    return ()=>{ cancelAnimationFrame(raf); obs.disconnect(); };
  },[]);
  return <canvas ref={ref} style={{ position:"absolute", inset:0, width:"100%", height:"100%" }}/>;
}

// ── Gateway health widget ─────────────────────────────────────────────────────
function GatewayHealth({ callsToday }: { callsToday: number }) {
  const pulses = [82,91,67,95,78,100,88,92,74,97,85,99];
  const max = Math.max(...pulses);
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
        <div style={{ width:8, height:8, borderRadius:"50%", background:"#22c55e",
          boxShadow:"0 0 0 3px rgba(34,197,94,0.2)", animation:"ping 2s infinite" }}/>
        <span style={{ fontSize:11, fontWeight:700, color:"#22c55e", letterSpacing:"0.06em" }}>
          GATEWAY OPERATIONAL
        </span>
      </div>
      <div style={{ display:"flex", alignItems:"flex-end", gap:3, height:40, marginBottom:10 }}>
        {pulses.map((v,i)=>(
          <div key={i} style={{
            flex:1, borderRadius:"2px 2px 0 0", height:`${(v/max)*100}%`,
            background:`rgba(20,184,166,${0.3+(v/max)*0.6})`, transition:"height .4s ease",
          }}/>
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:11, color:"#94a3b8" }}>Calls today</span>
        <span style={{ fontSize:18, fontWeight:900, color:"#14b8a6", letterSpacing:"-0.03em" }}>
          <Counter to={callsToday}/>
        </span>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ProviderDashboard() {
  const [user,        setUser]        = useState<AuthResponse | null>(null);
  const [apis,        setApis]        = useState<Api[]>([]);
  const [callsToday,  setCallsToday]  = useState(0);
  const [callsWeek,   setCallsWeek]   = useState(0);
  const [loadingApis, setLoadingApis] = useState(true);
  const [time, setTime] = useState<Date | null>(null);

  // ── New state ──────────────────────────────────────────────────────────────
  const [monthlyTrend,  setMonthlyTrend]  = useState<{month:string; calls:number}[]>([]);
  const [topConsumers,  setTopConsumers]  = useState<{userId:number; name:string; calls:number; lastCall:string}[]>([]);
  const [calendarData,  setCalendarData]  = useState<{date:string; calls:number}[]>([]);
  const [calYear,       setCalYear]       = useState(new Date().getFullYear());
  const [calMonth,      setCalMonth]      = useState(new Date().getMonth()+1);

  useEffect(() => {
    setUser(getUser());
    getMyApis().then(setApis).catch(()=>{}).finally(()=>setLoadingApis(false));
    apiClient.get("/api/analytics/provider")
      .then(r=>{ setCallsToday(r.data.callsToday??0); setCallsWeek(r.data.callsThisWeek??0); })
      .catch(()=>{});
    apiClient.get("/api/analytics/provider/monthly-trend")
      .then(r=>setMonthlyTrend(r.data)).catch(()=>{});
    apiClient.get("/api/analytics/provider/top-consumers?days=30")
      .then(r=>setTopConsumers(r.data)).catch(()=>{});
    setTime(new Date());  // ← set immediately on mount
    const t = setInterval(()=>setTime(new Date()), 60000);
    return ()=>clearInterval(t);
  }, []);

  // Re-fetch calendar whenever month/year changes
  useEffect(() => {
    apiClient.get(`/api/analytics/provider/calendar?year=${calYear}&month=${calMonth}`)
      .then(r=>setCalendarData(r.data)).catch(()=>{});
  }, [calYear, calMonth]);

  const stats = {
    total:      apis.length,
    published:  apis.filter(a=>a.status==="published").length,
    draft:      apis.filter(a=>a.status==="draft").length,
    deprecated: apis.filter(a=>a.status==="deprecated").length,
    retired:    apis.filter(a=>a.status==="retired").length,
  };

  const recent    = [...apis].sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()).slice(0,6);
  const published = apis.filter(a=>a.status==="published").slice(0,3);
  const firstName = user?.name?.split(" ")[0] ?? "there";
  const hour = time ? time.getHours() : 12;
  const greeting  = hour<12 ? "Good morning" : hour<17 ? "Good afternoon" : "Good evening";
  const fmt = (d:string) => new Date(d).toLocaleDateString("en-IN",{ day:"numeric", month:"short" });

  // ── Calendar computed values ───────────────────────────────────────────────
  const daysInMonth     = new Date(calYear, calMonth, 0).getDate();
  const firstDay        = new Date(calYear, calMonth-1, 1).getDay();
  const callMap         = new Map(calendarData.map(d=>[d.date, Number(d.calls)]));
  const maxDayCalls     = Math.max(...calendarData.map(d=>Number(d.calls)), 1);
  const todayStr        = new Date().toISOString().slice(0,10);
  const dayNames        = ["Su","Mo","Tu","We","Th","Fr","Sa"];
  const calCells        = [...Array(firstDay).fill(null), ...Array.from({length:daysInMonth},(_,i)=>i+1)] as (number|null)[];
  const calLabel        = new Date(calYear, calMonth-1).toLocaleDateString("en-IN",{month:"long",year:"numeric"});
  const currentMonthKey = `${calYear}-${String(calMonth).padStart(2,"0")}`;

  // ── Monthly trend ──────────────────────────────────────────────────────────
  const maxTrend = Math.max(...monthlyTrend.map(m=>Number(m.calls)), 1);

  // ── Top consumers ──────────────────────────────────────────────────────────
  const maxConsumerCalls = Math.max(...topConsumers.map(c=>Number(c.calls)), 1);
  const medals  = ["🥇","🥈","🥉"];
  const mColors = ["#f59e0b","#94a3b8","#cd7f32"];

  const navMonth = (delta:number) => {
    const d = new Date(calYear, calMonth-1+delta);
    setCalYear(d.getFullYear()); setCalMonth(d.getMonth()+1);
  };

  return (
    <DashboardLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,700;9..40,800;9..40,900&family=DM+Mono:wght@400;500&display=swap');
        @keyframes fadeUp  { from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)} }
        @keyframes slideR  { from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)} }
        @keyframes ping    { 0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.5);opacity:.5} }
        @keyframes shimmer { 0%{background-position:-200% center}100%{background-position:200% center} }

        .db  { font-family:'DM Sans',system-ui,sans-serif; padding:0 0 64px; background:#f8fafc; min-height:100vh; }
        .db * { box-sizing:border-box; }

        /* ── HERO ── */
        .hero {
          position:relative; overflow:hidden;
          background:linear-gradient(135deg,#040d1a 0%,#061524 40%,#0a1f2e 70%,#071820 100%);
          padding:52px 44px 52px; margin-bottom:28px;
          min-height:280px; display:flex; align-items:stretch;
        }
        .hero-noise    { position:absolute;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");opacity:.4;pointer-events:none; }
        .hero-gradient  { position:absolute;top:-100px;right:-100px;width:520px;height:520px;background:radial-gradient(circle,rgba(20,184,166,.15) 0%,transparent 65%);pointer-events:none; }
        .hero-gradient2 { position:absolute;bottom:-120px;left:100px;width:400px;height:400px;background:radial-gradient(circle,rgba(99,102,241,.12) 0%,transparent 65%);pointer-events:none; }
        .hero-content   { position:relative;z-index:2;width:100%;display:flex;flex-direction:column;justify-content:space-between; }
        .hero-top       { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:36px; }
        .hero-time      { font-family:'DM Mono',monospace;font-size:12px;color:rgba(255,255,255,.35);border:1px solid rgba(255,255,255,.1);padding:9px 16px;border-radius:10px;letter-spacing:.05em;background:rgba(255,255,255,.04);white-space:nowrap; }
        .hero-greeting  { font-size:14px;color:rgba(94,234,212,.8);font-weight:600;margin-bottom:10px;letter-spacing:.01em; }
        .hero-name      { font-size:44px;font-weight:900;color:white;letter-spacing:-.04em;line-height:1.05;margin-bottom:10px; }
        .hero-name span { background:linear-gradient(90deg,#5eead4,#38bdf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent; }
        .hero-sub       { font-size:14px;color:rgba(255,255,255,.32);margin-bottom:0; }
        .hero-pills     { display:grid;grid-template-columns:repeat(5,1fr);gap:14px;width:100%; }
        .hero-pill      { display:flex;flex-direction:column;gap:5px;padding:20px 22px;border-radius:16px;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.055);backdrop-filter:blur(12px);transition:all .2s;cursor:default;position:relative;overflow:hidden; }
        .hero-pill::before { content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--pill-accent,rgba(20,184,166,.7));border-radius:99px; }
        .hero-pill:hover { background:rgba(255,255,255,.09);border-color:rgba(255,255,255,.16);transform:translateY(-2px); }
        .hero-pill-top  { display:flex;align-items:center;gap:8px;margin-bottom:2px; }
        .hero-pill-val  { font-size:34px;font-weight:900;color:white;letter-spacing:-.04em;line-height:1; }
        .hero-pill-lbl  { font-size:10px;color:rgba(255,255,255,.38);text-transform:uppercase;letter-spacing:.1em;font-weight:700; }
        .hero-pill-dot  { width:7px;height:7px;border-radius:50%;flex-shrink:0; }

        /* ── GRIDS ── */
        .main-grid   { display:grid;grid-template-columns:1fr 1fr 320px;grid-template-rows:auto auto;gap:16px;padding:0 28px;margin-bottom:16px; }
        .bottom-grid { display:grid;grid-template-columns:1fr 1fr 320px;gap:16px;padding:0 28px; }

        /* ── CARDS ── */
        .card      { background:white;border-radius:20px;border:1px solid #f1f5f9;box-shadow:0 1px 3px rgba(0,0,0,.04),0 4px 16px rgba(0,0,0,.03);overflow:hidden;animation:fadeUp .5s ease both; }
        .ch        { display:flex;align-items:center;justify-content:space-between;padding:18px 22px 0;margin-bottom:14px; }
        .ch-left   { display:flex;align-items:center;gap:10px; }
        .ch-icon   { width:32px;height:32px;border-radius:9px;background:#f0fdfa;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
        .ct        { font-size:13px;font-weight:800;color:#0f172a;letter-spacing:-.01em; }
        .cs        { font-size:11px;color:#94a3b8;font-weight:500;margin-top:1px; }
        .ca        { font-size:11px;font-weight:700;color:#0d9488;text-decoration:none;display:inline-flex;align-items:center;gap:4px;transition:gap .15s; }
        .ca:hover  { gap:7px;color:#0f766e; }

        .portfolio-body { padding:0 22px 20px; }

        .rrow          { display:flex;align-items:center;gap:12px;padding:11px 22px;border-bottom:1px solid #f8fafc;transition:background .1s;text-decoration:none;color:inherit; }
        .rrow:last-child { border-bottom:none; }
        .rrow:hover    { background:linear-gradient(90deg,rgba(20,184,166,.04),transparent); }
        .rrow:hover .rarrow { color:#0d9488; }
        .rav           { width:34px;height:34px;border-radius:10px;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:14px; }
        .rname         { font-size:13px;font-weight:700;color:#0f172a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
        .rver          { font-size:10px;color:#94a3b8;font-family:'DM Mono',monospace;margin-top:1px; }
        .rdate         { font-size:10px;color:#cbd5e1;flex-shrink:0; }
        .rarrow        { font-size:12px;color:#d1d5db;flex-shrink:0;transition:color .15s; }

        .actions-wrap  { padding:0 16px 18px;display:flex;flex-direction:column;gap:8px; }
        .act           { display:flex;align-items:center;gap:12px;padding:13px 14px;border-radius:14px;text-decoration:none;transition:all .15s;border:1px solid transparent; }
        .act.pri       { background:linear-gradient(135deg,rgba(20,184,166,.08),rgba(8,145,178,.05));border-color:rgba(20,184,166,.15); }
        .act.pri:hover { background:linear-gradient(135deg,rgba(20,184,166,.14),rgba(8,145,178,.1));transform:translateX(2px); }
        .act.sec       { background:#fafafa;border-color:#f1f5f9; }
        .act.sec:hover  { background:#f1f5f9;transform:translateX(2px); }
        .act.sec2      { background:#fafafa;border-color:#f1f5f9; }
        .act.sec2:hover { background:#f1f5f9;transform:translateX(2px); }
        .ai            { width:38px;height:38px;border-radius:11px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:17px; }
        .ai.teal       { background:linear-gradient(135deg,#14b8a6,#0891b2);box-shadow:0 4px 12px rgba(20,184,166,.28); }
        .ai.indigo     { background:linear-gradient(135deg,#6366f1,#8b5cf6);box-shadow:0 4px 12px rgba(99,102,241,.22); }
        .ai.amber      { background:linear-gradient(135deg,#f59e0b,#f97316);box-shadow:0 4px 12px rgba(245,158,11,.22); }
        .act-sep       { height:1px;background:#f1f5f9;margin:2px 0; }
        .al            { font-size:13px;font-weight:700;color:#0f172a; }
        .as            { font-size:11px;color:#94a3b8;margin-top:2px; }
        .gw-body       { padding:0 22px 20px; }

        .spot-row          { display:flex;align-items:center;gap:12px;padding:12px 22px;border-bottom:1px solid #f8fafc;transition:background .1s;text-decoration:none;color:inherit; }
        .spot-row:last-child { border-bottom:none; }
        .spot-row:hover    { background:#f8fafc; }
        .spot-rank         { font-size:10px;font-weight:800;color:#e2e8f0;width:16px;text-align:center;flex-shrink:0; }
        .spot-av           { width:30px;height:30px;border-radius:9px;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:12px; }
        .spot-name         { font-size:12px;font-weight:700;color:#0f172a;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
        .live-badge        { font-size:9px;font-weight:700;padding:3px 8px;border-radius:99px;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;flex-shrink:0; }

        .empty         { text-align:center;padding:40px 20px; }
        .empty p       { color:#94a3b8;font-size:13px;margin:0 0 14px; }
        .empty-cta     { display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#14b8a6,#0891b2);color:white;font-size:12px;font-weight:700;padding:8px 18px;border-radius:99px;text-decoration:none;box-shadow:0 4px 14px rgba(20,184,166,.3);transition:all .2s; }
        .empty-cta:hover { transform:translateY(-1px);box-shadow:0 8px 24px rgba(20,184,166,.4); }
        .shimmer       { background:linear-gradient(90deg,#f1f5f9 25%,#e8edf5 50%,#f1f5f9 75%);background-size:200% auto;animation:shimmer 1.5s linear infinite;border-radius:10px; }

        /* ── Monthly trend bars ── */
        .trend-bar { flex:1;border-radius:4px 4px 0 0;cursor:pointer;transition:filter .15s,transform .15s; }
        .trend-bar:hover { filter:brightness(1.12);transform:scaleX(1.06); }

        /* ── Calendar cells ── */
        .cal-cell {
          aspect-ratio:1;border-radius:5px;display:flex;align-items:center;
          justify-content:center;font-size:9px;font-weight:700;cursor:default;
          transition:transform .1s;
        }
        .cal-cell.active { cursor:pointer; }
        .cal-cell.active:hover { transform:scale(1.25); }

        /* ── Nav buttons ── */
        .nav-btn { width:26px;height:26px;border-radius:8px;border:1px solid #e2e8f0;background:white;cursor:pointer;font-size:12px;color:#64748b;display:flex;align-items:center;justify-content:center;transition:all .15s; }
        .nav-btn:hover { background:#f1f5f9;color:#0f172a; }

        /* ── Consumer rows ── */
        .consumer-row { display:flex;align-items:center;gap:12px;padding:11px 0;text-decoration:none;color:inherit;transition:opacity .15s; }
        .consumer-row:hover { opacity:.85; }
        .consumer-row:hover .c-name { color:#0d9488; }
        .c-name { font-size:12px;font-weight:700;color:#0f172a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:5px;transition:color .15s; }
      `}</style>

      <div className="db">

        {/* ══ HERO ══ */}
        <div className="hero" style={{ animation:"fadeUp .4s ease both" }}>
          <div className="hero-noise"/>
          <div className="hero-gradient"/>
          <div className="hero-gradient2"/>
          <ParticleCanvas/>
          <div className="hero-content">
            <div className="hero-top">
              <div>
                <p className="hero-greeting">{greeting}</p>
                <h1 className="hero-name">Welcome back, <span>{firstName}</span> 👋</h1>
                <p className="hero-sub">Your API portfolio at a glance</p>
              </div>
              <div className="hero-time">
                {time
                  ? (
                    <>
                      {time.toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                      {" · "}
                      {time.toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </>
                  )
                  : "--:--"}
              </div>
            </div>
            <div className="hero-pills">
              {[
                { val:stats.total,     lbl:"Total APIs",  dot:"#14b8a6", accent:"rgba(20,184,166,.7)"  },
                { val:stats.published, lbl:"Live",        dot:"#22c55e", accent:"rgba(34,197,94,.7)"   },
                { val:stats.draft,     lbl:"Draft",       dot:"#6366f1", accent:"rgba(99,102,241,.7)"  },
                { val:callsToday,      lbl:"Calls Today", dot:"#f59e0b", accent:"rgba(245,158,11,.7)"  },
                { val:callsWeek,       lbl:"This Week",   dot:"#38bdf8", accent:"rgba(56,189,248,.7)"  },
              ].map((p,i)=>(
                <div key={i} className="hero-pill"
                  style={{ animationDelay:`${i*60}ms`, "--pill-accent":p.accent } as React.CSSProperties}>
                  <div className="hero-pill-top">
                    <span className="hero-pill-dot" style={{ background:p.dot, boxShadow:`0 0 8px ${p.dot}` }}/>
                    <span className="hero-pill-lbl">{p.lbl}</span>
                  </div>
                  <div className="hero-pill-val"><Counter to={p.val} duration={700+i*100}/></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ MAIN GRID ══ */}
        <div className="main-grid">

          {/* ── Recent APIs (col 1, row 1+2) ── */}
          <div className="card" style={{ gridRow:"1/3", animationDelay:"80ms" }}>
            <div className="ch">
              <div className="ch-left">
                <div className="ch-icon">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#0d9488" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h8m-8 4h4"/>
                  </svg>
                </div>
                <div><div className="ct">Recent APIs</div><div className="cs">Latest additions</div></div>
              </div>
              <Link href="/provider/apis" className="ca">All APIs →</Link>
            </div>
            {loadingApis ? (
              <div style={{ padding:"8px 22px",display:"flex",flexDirection:"column",gap:8 }}>
                {[...Array(5)].map((_,i)=>(
                  <div key={i} className="shimmer" style={{ height:52,animationDelay:`${i*70}ms` }}/>
                ))}
              </div>
            ) : recent.length===0 ? (
              <div className="empty">
                <div style={{ fontSize:36,marginBottom:10,opacity:.3 }}>🔌</div>
                <p>No APIs yet. Create your first one.</p>
                <Link href="/provider/apis/new" className="empty-cta">＋ Create API</Link>
              </div>
            ) : (
              recent.map((a,i)=>(
                <Link key={a.apiId} href={`/provider/apis/${a.apiId}`} className="rrow"
                  style={{ animationDelay:`${100+i*40}ms` }}>
                  <div className="rav" style={{ background:`linear-gradient(135deg,hsl(${175+i*15},65%,42%),hsl(${195+i*15},70%,38%))` }}>
                    {a.apiName[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div className="rname">{a.apiName}</div>
                    <div className="rver">{a.version}</div>
                  </div>
                  <StatusBadge status={a.status}/>
                  <div className="rdate">{fmt(a.createdAt)}</div>
                  <span className="rarrow">→</span>
                </Link>
              ))
            )}
          </div>

          {/* ── Portfolio (col 2, row 1) ── */}
          <div className="card" style={{ animationDelay:"120ms" }}>
            <div className="ch">
              <div className="ch-left">
                <div className="ch-icon">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#0d9488" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/>
                  </svg>
                </div>
                <div><div className="ct">Portfolio</div><div className="cs">By status</div></div>
              </div>
            </div>
            <div className="portfolio-body">
              <MiniDonut published={stats.published} draft={stats.draft} deprecated={stats.deprecated} total={stats.total}/>
              {stats.retired>0&&(
                <div style={{ marginTop:12,padding:"8px 12px",background:"#fafafa",borderRadius:10,border:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <span style={{ fontSize:11,color:"#94a3b8" }}>Retired</span>
                  <span style={{ fontSize:12,fontWeight:800,color:"#cbd5e1" }}>{stats.retired}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Live APIs (col 2, row 2) ── */}
          <div className="card" style={{ animationDelay:"160ms" }}>
            <div className="ch">
              <div className="ch-left">
                <div className="ch-icon">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#0d9488" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z"/>
                  </svg>
                </div>
                <div><div className="ct">Live APIs</div><div className="cs">Published & active</div></div>
              </div>
              <Link href="/provider/apis" className="ca">Manage →</Link>
            </div>
            {published.length===0 ? (
              <div style={{ padding:"16px 22px" }}>
                <div style={{ background:"#f8fafc",borderRadius:12,padding:"14px 16px",border:"1px dashed #e2e8f0",textAlign:"center" }}>
                  <p style={{ fontSize:11,color:"#94a3b8",margin:"0 0 8px" }}>No published APIs yet</p>
                  <Link href="/provider/apis" style={{ fontSize:11,fontWeight:700,color:"#0d9488",textDecoration:"none" }}>Publish one →</Link>
                </div>
              </div>
            ) : (
              published.map((a,i)=>(
                <Link key={a.apiId} href={`/provider/apis/${a.apiId}`} className="spot-row">
                  <span className="spot-rank" style={{ color:i===0?"#f59e0b":i===1?"#94a3b8":"#cd7f32" }}>{i+1}</span>
                  <div className="spot-av" style={{ background:`linear-gradient(135deg,hsl(${175+i*20},65%,42%),hsl(${195+i*20},70%,38%))` }}>
                    {a.apiName[0]?.toUpperCase()}
                  </div>
                  <span className="spot-name">{a.apiName}</span>
                  <span className="live-badge">LIVE</span>
                </Link>
              ))
            )}
          </div>

          {/* ── Quick Actions (col 3, row 1) ── */}
          <div className="card" style={{ animationDelay:"140ms" }}>
            <div className="ch">
              <div className="ch-left">
                <div className="ch-icon">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#0d9488" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <div className="ct">Quick Actions</div>
              </div>
            </div>
            <div className="actions-wrap">
              <Link href="/provider/apis/new" className="act pri">
                <div className="ai teal">＋</div>
                <div><div className="al">New API</div><div className="as">Create & register</div></div>
              </Link>
              <div className="act-sep"/>
              <Link href="/provider/apis" className="act sec">
                <div className="ai indigo">≡</div>
                <div><div className="al">My APIs</div><div className="as">Browse & manage</div></div>
              </Link>
              <Link href="/provider/analytics" className="act sec2">
                <div className="ai amber">📊</div>
                <div><div className="al">Analytics</div><div className="as">Usage & insights</div></div>
              </Link>
            </div>
          </div>

          {/* ── Gateway (col 3, row 2) ── */}
          <div className="card" style={{ animationDelay:"200ms" }}>
            <div className="ch">
              <div className="ch-left">
                <div className="ch-icon">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#0d9488" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
                  </svg>
                </div>
                <div className="ct">Gateway</div>
              </div>
              <Link href="/provider/analytics" className="ca">Details →</Link>
            </div>
            <div className="gw-body">
              <GatewayHealth callsToday={callsToday}/>
              <div style={{ marginTop:14,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                {[
                  { lbl:"This Week", val:callsWeek,       color:"#6366f1" },
                  { lbl:"APIs Live", val:stats.published, color:"#22c55e" },
                ].map(s=>(
                  <div key={s.lbl} style={{ background:"#f8fafc",borderRadius:12,padding:"10px 12px",border:"1px solid #f1f5f9" }}>
                    <div style={{ fontSize:18,fontWeight:900,color:s.color,letterSpacing:"-0.03em" }}>
                      <Counter to={s.val} duration={900}/>
                    </div>
                    <div style={{ fontSize:10,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.07em",marginTop:2 }}>
                      {s.lbl}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* ══ BOTTOM GRID: Trend + Calendar + Top Consumers ══ */}
        <div className="bottom-grid">

          {/* ── Monthly Trend (col 1) ── */}
          <div className="card" style={{ animationDelay:"220ms" }}>
            <div className="ch">
              <div className="ch-left">
                <div className="ch-icon">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#0d9488" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4v16"/>
                  </svg>
                </div>
                <div>
                  <div className="ct">Monthly Trend</div>
                  <div className="cs">API calls — last 12 months</div>
                </div>
              </div>
            </div>
            <div style={{ padding:"0 22px 20px" }}>
              {monthlyTrend.length===0 ? (
                <div style={{ height:110,display:"flex",alignItems:"center",justifyContent:"center" }}>
                  <p style={{ color:"#94a3b8",fontSize:13,margin:0 }}>No trend data yet</p>
                </div>
              ) : (
                <div>
                  <div style={{ display:"flex",alignItems:"flex-end",gap:5,height:100 }}>
                    {monthlyTrend.map((m,i)=>{
                      const pct        = (Number(m.calls)/maxTrend)*100;
                      const [yr,mo]    = m.month.split("-");
                      const label      = new Date(Number(yr),Number(mo)-1).toLocaleDateString("en-IN",{month:"short"});
                      const isCurrent  = m.month===currentMonthKey;
                      return (
                        <div key={i} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,height:"100%",justifyContent:"flex-end" }}>
                          {Number(m.calls)>0&&(
                            <span style={{ fontSize:8,fontWeight:isCurrent?800:500,color:isCurrent?"#0d9488":"#94a3b8",lineHeight:1 }}>
                              {Number(m.calls)>=1000?`${(Number(m.calls)/1000).toFixed(1)}k`:Number(m.calls)}
                            </span>
                          )}
                          <div
                            className="trend-bar"
                            title={`${m.month}: ${Number(m.calls).toLocaleString()} calls`}
                            onClick={()=>{ setCalYear(Number(yr)); setCalMonth(Number(mo)); }}
                            style={{
                              width:"100%",
                              height:`${Math.max(pct,3)}%`,
                              background:isCurrent
                                ? "linear-gradient(to top,#0d9488,#14b8a6)"
                                : "linear-gradient(to top,#cbd5e1,#e2e8f0)",
                              boxShadow:isCurrent?"0 0 8px rgba(20,184,166,0.35)":"none",
                            }}
                          />
                          <span style={{ fontSize:8,fontWeight:isCurrent?800:500,color:isCurrent?"#0d9488":"#94a3b8",lineHeight:1 }}>
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p style={{ fontSize:10,color:"#94a3b8",textAlign:"center",marginTop:10,marginBottom:0 }}>
                    💡 Click a bar to jump to that month's calendar
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Calendar Heatmap (col 2) ── */}
          <div className="card" style={{ animationDelay:"240ms" }}>
            <div className="ch">
              <div className="ch-left">
                <div className="ch-icon">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#0d9488" strokeWidth={2}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8"  y1="2" x2="8"  y2="6"/>
                    <line x1="3"  y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <div>
                  <div className="ct">Activity Calendar</div>
                  <div className="cs">{calLabel}</div>
                </div>
              </div>
              {/* Month nav */}
              <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                <button className="nav-btn" onClick={()=>navMonth(-1)}>←</button>
                <button className="nav-btn" onClick={()=>navMonth(1)}>→</button>
              </div>
            </div>
            <div style={{ padding:"0 22px 20px" }}>
              {/* Day headers */}
              <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:4 }}>
                {dayNames.map(d=>(
                  <div key={d} style={{ textAlign:"center",fontSize:9,fontWeight:700,color:"#94a3b8",padding:"2px 0" }}>{d}</div>
                ))}
              </div>
              {/* Cells */}
              <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3 }}>
                {calCells.map((day,i)=>{
                  if(day===null) return <div key={i}/>;
                  const dateStr = `${calYear}-${String(calMonth).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                  const calls   = callMap.get(dateStr)??0;
                  const pct     = calls/maxDayCalls;
                  const isToday = dateStr===todayStr;
                  const bg = calls===0?"#f1f5f9":pct<0.25?"#99f6e4":pct<0.5?"#2dd4bf":pct<0.75?"#0d9488":"#0f766e";
                  return (
                    <div key={i}
                      className={`cal-cell${calls>0?" active":""}`}
                      title={`${dateStr}: ${calls} call${calls!==1?"s":""}`}
                      style={{ background:bg, border:isToday?"2px solid #0d9488":"none", color:calls>0?"white":"#cbd5e1" }}>
                      {day}
                    </div>
                  );
                })}
              </div>
              {/* Legend */}
              <div style={{ display:"flex",alignItems:"center",gap:4,marginTop:10,justifyContent:"flex-end" }}>
                <span style={{ fontSize:9,color:"#94a3b8" }}>Less</span>
                {["#f1f5f9","#99f6e4","#2dd4bf","#0d9488","#0f766e"].map(c=>(
                  <div key={c} style={{ width:10,height:10,borderRadius:2,background:c,border:"1px solid rgba(0,0,0,.06)" }}/>
                ))}
                <span style={{ fontSize:9,color:"#94a3b8" }}>More</span>
              </div>
            </div>
          </div>

          {/* ── Top Consumers (col 3) ── */}
          <div className="card" style={{ animationDelay:"260ms" }}>
            <div className="ch">
              <div className="ch-left">
                <div className="ch-icon">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#0d9488" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0z"/>
                  </svg>
                </div>
                <div>
                  <div className="ct">Top Consumers</div>
                  <div className="cs">Last 30 days</div>
                </div>
              </div>
              <Link href="/provider/developers" className="ca">All →</Link>
            </div>
            <div style={{ padding:"0 22px 20px",display:"flex",flexDirection:"column" }}>
              {topConsumers.length===0 ? (
                <div style={{ textAlign:"center",padding:"28px 0" }}>
                  <div style={{ fontSize:28,marginBottom:8,opacity:.2 }}>👥</div>
                  <p style={{ color:"#94a3b8",fontSize:13,margin:0 }}>No usage data yet</p>
                </div>
              ) : (
                topConsumers.map((c,i)=>(
                  <Link key={c.userId} href={`/provider/developers/${c.userId}`}
                    className="consumer-row"
                    style={{ borderBottom:i<topConsumers.length-1?"1px solid #f8fafc":"none" }}>
                    {/* Medal */}
                    <span style={{ fontSize:18,flexShrink:0 }}>{medals[i]}</span>
                    {/* Avatar */}
                    <div style={{
                      width:36,height:36,borderRadius:10,flexShrink:0,
                      background:`linear-gradient(135deg,hsl(${175+i*25},65%,42%),hsl(${195+i*25},65%,38%))`,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      color:"white",fontSize:13,fontWeight:800,
                    }}>
                      {c.name[0]?.toUpperCase()}
                    </div>
                    {/* Name + bar */}
                    <div style={{ flex:1,minWidth:0 }}>
                      <div className="c-name">{c.name}</div>
                      <div style={{ height:4,background:"#f1f5f9",borderRadius:99,overflow:"hidden" }}>
                        <div style={{
                          height:"100%",
                          width:`${(Number(c.calls)/maxConsumerCalls)*100}%`,
                          background:`linear-gradient(90deg,${mColors[i]},hsl(${175+i*25},65%,52%))`,
                          borderRadius:99,transition:"width .8s ease",
                        }}/>
                      </div>
                    </div>
                    {/* Count */}
                    <div style={{ textAlign:"right",flexShrink:0 }}>
                      <div style={{ fontSize:15,fontWeight:900,color:mColors[i],letterSpacing:"-0.02em" }}>
                        {Number(c.calls).toLocaleString()}
                      </div>
                      <div style={{ fontSize:9,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",letterSpacing:".05em" }}>
                        calls
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
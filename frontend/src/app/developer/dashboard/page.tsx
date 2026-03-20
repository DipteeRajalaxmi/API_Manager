"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getUser } from "@/lib/auth";
import { getMyApps } from "@/lib/portal";
import apiClient from "@/lib/api";

const DotLottieReact = dynamic(
  () => import("@lottiefiles/dotlottie-react").then(m => m.DotLottieReact),
  { ssr: false, loading: () => <div style={{ width: 420, height: 420 }} /> }
);

interface App { appId: number; appName: string; status: string; }
interface AuthUser { name?: string; }

function Counter({ to }: { to: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / 800, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [to]);
  return <>{val}</>;
}

export default function DeveloperDashboard() {
  const [user,       setUser]       = useState<AuthUser | null>(null);
  const [mounted,    setMounted]    = useState(false);
  const [apps,       setApps]       = useState<App[]>([]);
  const [callsToday, setCallsToday] = useState(0);
  const [callsWeek,  setCallsWeek]  = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [time,       setTime]       = useState("");

  useEffect(() => {
    setMounted(true);
    setUser(getUser());
    const updateTime = () => setTime(
      new Date().toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", hour12:true }) +
      "  ·  " +
      new Date().toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short", year:"numeric" })
    );
    updateTime();
    const t = setInterval(updateTime, 60000);

    Promise.all([
      getMyApps().catch(() => []),
      apiClient.get("/api/analytics/developer").catch(() => ({ data: {} })),
    ]).then(([appsData, res]: any[]) => {
      setApps(appsData);
      setCallsToday(res.data?.callsToday ?? 0);
      setCallsWeek(res.data?.callsThisWeek ?? 0);
    }).finally(() => setLoading(false));

    return () => clearInterval(t);
  }, []);

  const hour      = mounted ? new Date().getHours() : 14;
  const greeting  = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] ?? "";
  const activeApps = apps.filter(a => a.status === "active").length;

  const links = [
    { href:"/marketplace",          icon:"🛒", label:"Marketplace",     sub:"Browse & subscribe to APIs"     },
    { href:"/developer/apps",       icon:"📱", label:"My Applications",  sub:"Manage apps & subscriptions"   },
    { href:"/developer/contribute", icon:"🚀", label:"Contribute API",   sub:"Submit your API for review"     },
    { href:"/developer/analytics",  icon:"📊", label:"Analytics",        sub:"Usage stats & insights"        },
    { href:"/developer/my-requests",icon:"📬", label:"My Requests",      sub:"Track API submission status"   },
    { href:"/developer/settings",   icon:"⚙️", label:"Settings",         sub:"Profile & security"            },
  ];

  const steps = [
    { num:1, title:"Create an Application",  desc:"Set up a container for your API keys and subscriptions.", href:"/developer/apps",     done: apps.length > 0 },
    { num:2, title:"Browse the Marketplace", desc:"Explore APIs published by providers in your organization.", href:"/marketplace",       done: false },
    { num:3, title:"Subscribe to an API",    desc:"Choose an API and link it to your application.", href:"/marketplace",                  done: false },
    { num:4, title:"Start Making API Calls", desc:"Use your API key with the gateway URL to make requests.", href:"/developer/apps",     done: false },
  ];

  return (
    <DashboardLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700;9..40,800;9..40,900&family=DM+Mono:wght@400;500&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes shimmer{ 0%{background-position:-200% center} 100%{background-position:200% center} }

        .dv { font-family:'DM Sans',system-ui,sans-serif; background:#f8fafc; min-height:100vh; padding-bottom:80px; }
        .dv * { box-sizing:border-box; }

        /* ── HERO ── */
        .hero {
          background:linear-gradient(135deg,#edfcf8 0%,#f0fdfa 40%,#eff6ff 100%);
          border-bottom:1px solid #d1fae5;
          padding:48px 44px 44px;
          display:grid;
          grid-template-columns:1fr 440px;
          gap:0;
          position:relative;overflow:hidden;
          animation:fadeUp .4s ease both;
        }
        .hero::before {
          content:'';position:absolute;bottom:-100px;left:-60px;
          width:340px;height:340px;border-radius:50%;
          background:radial-gradient(circle,rgba(20,184,166,.08),transparent 70%);
          pointer-events:none;
        }
        .hero-left { position:relative;z-index:1;display:flex;flex-direction:column;justify-content:center; }
        .eyebrow { font-size:11px;font-weight:700;letter-spacing:.12em;
          text-transform:uppercase;color:#0d9488;margin-bottom:12px;display:block; }
        .h1 { font-size:40px;font-weight:900;color:#0f172a;
          letter-spacing:-.04em;line-height:1.1;margin:0 0 12px; }
        .h1 span { color:#14b8a6; }
        .h-sub { font-size:15px;color:#64748b;margin:0 0 10px;line-height:1.6; }
        .h-time { font-family:'DM Mono',monospace;font-size:12px;color:#94a3b8;letter-spacing:.04em; }

        /* Stat row */
        .stats { display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:32px; }
        .stat {
          background:white;border:1px solid #e2e8f0;border-radius:16px;
          padding:16px 18px;display:flex;flex-direction:column;gap:4px;
          box-shadow:0 2px 8px rgba(0,0,0,.04);
          transition:transform .2s,box-shadow .2s;
          animation:fadeUp .5s ease both;
        }
        .stat:hover { transform:translateY(-3px);box-shadow:0 6px 20px rgba(0,0,0,.08); }
        .stat-val { font-size:28px;font-weight:900;color:#0f172a;letter-spacing:-.04em;line-height:1; }
        .stat-lbl { font-size:10px;color:#94a3b8;font-weight:700;
          text-transform:uppercase;letter-spacing:.08em; }
        .stat-dot { width:8px;height:8px;border-radius:50%;
          background:#14b8a6;margin-bottom:8px;
          box-shadow:0 0 0 3px rgba(20,184,166,.2); }

        /* Lottie */
        .lottie-wrap {
          display:flex;align-items:center;justify-content:center;
          animation:floatY 5s ease-in-out infinite;
          filter:drop-shadow(0 20px 40px rgba(20,184,166,.18));
        }

        /* ── BODY ── */
        .body { padding:32px 44px; display:grid;
          grid-template-columns:1fr 360px;gap:24px; }

        .sec-h { font-size:11px;font-weight:700;color:#94a3b8;
          text-transform:uppercase;letter-spacing:.09em;margin-bottom:16px; }

        /* Quick links */
        .ql-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:14px; }
        .ql {
          background:white;border-radius:18px;padding:22px 20px 20px;
          border:1px solid #f1f5f9;
          box-shadow:0 1px 3px rgba(0,0,0,.04),0 4px 14px rgba(0,0,0,.03);
          text-decoration:none;color:inherit;display:flex;flex-direction:column;gap:10px;
          transition:transform .2s,box-shadow .2s,border-color .2s;
          animation:fadeUp .5s ease both;
          position:relative;overflow:hidden;
        }
        .ql:hover { transform:translateY(-4px);
          box-shadow:0 8px 28px rgba(20,184,166,.12);border-color:#99f6e4; }
        .ql-icon { width:48px;height:48px;border-radius:14px;
          display:flex;align-items:center;justify-content:center;
          font-size:22px;background:#f0fdfa;flex-shrink:0; }
        .ql-title { font-size:13px;font-weight:800;color:#0f172a;margin:0; }
        .ql-sub { font-size:11px;color:#94a3b8;margin:0;line-height:1.5;flex:1; }
        .ql-arr { font-size:13px;color:#e2e8f0;align-self:flex-end;
          transition:color .15s,transform .15s; }
        .ql:hover .ql-arr { color:#14b8a6;transform:translateX(4px); }

        /* Right column */
        .right { display:flex;flex-direction:column;gap:18px; }

        /* Panel */
        .panel {
          background:white;border-radius:20px;border:1px solid #f1f5f9;
          box-shadow:0 1px 3px rgba(0,0,0,.04),0 4px 14px rgba(0,0,0,.03);
          overflow:hidden;animation:fadeUp .5s ease both;
        }
        .p-head { padding:18px 20px 14px;display:flex;align-items:center;
          justify-content:space-between;border-bottom:1px solid #f8fafc; }
        .p-title { font-size:13px;font-weight:800;color:#0f172a;
          display:flex;align-items:center;gap:8px; }
        .p-ico { width:28px;height:28px;border-radius:8px;
          background:#f0fdfa;display:flex;align-items:center;justify-content:center; }
        .p-link { font-size:11px;font-weight:700;color:#0d9488;text-decoration:none; }
        .p-link:hover { color:#0f766e; }

        /* App rows */
        .app-row { display:flex;align-items:center;gap:10px;
          padding:11px 20px;border-bottom:1px solid #f8fafc;
          text-decoration:none;color:inherit;transition:background .1s; }
        .app-row:last-child { border-bottom:none; }
        .app-row:hover { background:#f8fafc; }
        .app-av { width:32px;height:32px;border-radius:10px;flex-shrink:0;
          display:flex;align-items:center;justify-content:center;
          color:white;font-weight:800;font-size:13px; }
        .app-name { font-size:12px;font-weight:700;color:#334155;flex:1;
          overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
        .app-dot { width:6px;height:6px;border-radius:50%;flex-shrink:0; }

        /* Getting started steps */
        .step {
          display:flex;align-items:flex-start;gap:16px;
          padding:14px 20px;border-bottom:1px solid #f8fafc;
          text-decoration:none;color:inherit;transition:background .12s;
        }
        .step:last-child { border-bottom:none; }
        .step:hover { background:#f8fafc; }
        .step-left { display:flex;flex-direction:column;align-items:center;gap:0;flex-shrink:0; }
        .step-circle {
          width:32px;height:32px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font-size:12px;font-weight:800;flex-shrink:0;
          border:2px solid;
        }
        .step-line { width:2px;height:20px;background:#f1f5f9;margin:2px auto; }
        .step-num-lbl { font-size:9px;font-weight:700;color:#94a3b8;
          text-transform:uppercase;letter-spacing:.08em;margin-top:4px; }
        .step-title { font-size:13px;font-weight:700;color:#0f172a;margin:0 0 3px; }
        .step-desc { font-size:11px;color:#94a3b8;margin:0;line-height:1.5; }

        /* Shimmer */
        .shimmer { background:linear-gradient(90deg,#f1f5f9 25%,#e8edf5 50%,#f1f5f9 75%);
          background-size:200% auto;animation:shimmer 1.5s linear infinite;border-radius:10px; }
      `}</style>

      <div className="dv">

        {/* ══ HERO ══ */}
        <div className="hero">
          <div className="hero-left">
            <span className="eyebrow">Developer Portal</span>
            <h1 className="h1">
              {greeting},&nbsp;
              <span>{mounted ? firstName : ""}</span>&nbsp;👋
            </h1>
            <p className="h-sub">Build, integrate and monitor your APIs from one place.</p>
            <p className="h-time">{time}</p>

            <div className="stats">
              {[
                { lbl:"Active Apps",  val:activeApps,  accent:"#14b8a6" },
                { lbl:"Calls Today",  val:callsToday,  accent:"#6366f1" },
                { lbl:"This Week",    val:callsWeek,   accent:"#0891b2" },
                { lbl:"Total Apps",   val:apps.length, accent:"#14b8a6" },
              ].map((s,i) => (
                <div key={i} className="stat" style={{ animationDelay:`${i*60}ms` }}>
                  <div className="stat-dot" style={{ background:s.accent,
                    boxShadow:`0 0 0 3px ${s.accent}22` }}/>
                  <div className="stat-val" style={{ color: loading ? "#e2e8f0" : "#0f172a" }}>
                    {loading ? "—" : <Counter to={s.val}/>}
                  </div>
                  <div className="stat-lbl">{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Big lottie */}
         <div className="lottie-wrap">
            {mounted && (
              <iframe
                src="https://lottie.host/embed/8b5026b0-59a5-474f-9ed8-fef6673f307f/efK5WwYdTx.lottie"
                style={{ width:420, height:420, border:"none", background:"transparent" }}
              />
            )}
          </div>
        </div>

        {/* ══ BODY ══ */}
        <div className="body">

          {/* Quick links */}
          <div>
            <p className="sec-h">Quick Access</p>
            <div className="ql-grid">
              {links.map((l,i) => (
                <Link key={l.href} href={l.href} className="ql"
                  style={{ animationDelay:`${80+i*50}ms` }}>
                  <div className="ql-icon">{l.icon}</div>
                  <p className="ql-title">{l.label}</p>
                  <p className="ql-sub">{l.sub}</p>
                  <span className="ql-arr">→</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div className="right">

            {/* My Apps */}
            <div className="panel" style={{ animationDelay:"200ms" }}>
              <div className="p-head">
                <div className="p-title">
                  <div className="p-ico">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
                      stroke="#0d9488" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  My Apps
                </div>
                <Link href="/developer/apps" className="p-link">View all →</Link>
              </div>

              {loading ? (
                <div style={{ padding:"12px 20px", display:"flex", flexDirection:"column", gap:8 }}>
                  {[...Array(3)].map((_,i) => (
                    <div key={i} className="shimmer" style={{ height:42 }}/>
                  ))}
                </div>
              ) : apps.length === 0 ? (
                <div style={{ padding:"28px 20px", textAlign:"center" }}>
                  <p style={{ fontSize:12, color:"#94a3b8", margin:"0 0 10px" }}>No apps yet</p>
                  <Link href="/developer/apps"
                    style={{ fontSize:12, fontWeight:700, color:"#0d9488", textDecoration:"none" }}>
                    Create your first app →
                  </Link>
                </div>
              ) : (
                <div>
                  {apps.slice(0,4).map((app,i) => (
                    <Link key={app.appId} href="/developer/apps" className="app-row">
                      <div className="app-av" style={{
                        background:`linear-gradient(135deg,hsl(${175+i*20},65%,44%),hsl(${195+i*20},70%,40%))`,
                      }}>
                        {app.appName[0]?.toUpperCase()}
                      </div>
                      <span className="app-name">{app.appName}</span>
                      <span className="app-dot"
                        style={{ background: app.status==="active" ? "#14b8a6" : "#e2e8f0" }}/>
                    </Link>
                  ))}
                  {apps.length > 4 && (
                    <div style={{ padding:"10px 20px", fontSize:11, color:"#94a3b8", fontWeight:600 }}>
                      +{apps.length - 4} more apps
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Getting Started */}
            <div className="panel" style={{ animationDelay:"250ms" }}>
              <div className="p-head">
                <div className="p-title">
                  <div className="p-ico">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
                      stroke="#0d9488" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                  </div>
                  Getting Started
                </div>
                <span style={{ fontSize:11, fontWeight:600,
                    background:"#f0fdfa", border:"1px solid #99f6e4",
                    padding:"2px 10px", borderRadius:99, color:"#0d9488" }}>
                  {steps.filter(s=>s.done).length} / {steps.length}
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ margin:"0 20px 4px", height:3,
                background:"#f1f5f9", borderRadius:99, overflow:"hidden" }}>
                <div style={{
                  height:"100%", borderRadius:99,
                  background:"linear-gradient(90deg,#14b8a6,#0891b2)",
                  width:`${(steps.filter(s=>s.done).length/steps.length)*100}%`,
                  transition:"width .6s ease",
                }}/>
              </div>

              {steps.map((s, i) => (
                <Link key={i} href={s.href} className="step">
                  <div className="step-left">
                    <div className="step-circle" style={{
                      background: s.done ? "#14b8a6" : "white",
                      borderColor: s.done ? "#14b8a6" : "#e2e8f0",
                      color: s.done ? "white" : "#94a3b8",
                    }}>
                      {s.done ? "✓" : s.num}
                    </div>
                    {i < steps.length - 1 && <div className="step-line"/>}
                  </div>
                  <div style={{ flex:1, paddingTop:6 }}>
                    <p className="step-title" style={{ color: s.done ? "#0d9488" : "#0f172a" }}>
                      {s.title}
                    </p>
                    <p className="step-desc">{s.desc}</p>
                  </div>
                </Link>
              ))}
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
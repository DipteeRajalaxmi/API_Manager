"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register, saveAuth, getHomeRoute } from "@/lib/auth";

const STEPS = ["Account", "Role", "Details"];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", email: "", password: "",
    role: "DEVELOPER",
    organizationName: "", organizationDomain: "", inviteCode: "",
  });
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [strength, setStrength] = useState(0);

  useEffect(() => { setMounted(true); }, []);

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));

  const calcStrength = (p: string) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, password: e.target.value }));
    setStrength(calcStrength(e.target.value));
  };

  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["", "#ef4444", "#f59e0b", "#3b82f6", "#00d4b4"];

  const nextStep = () => {
    if (step === 0) {
      if (!form.name || !form.email || !form.password) { setError("All fields required"); return; }
      if (form.password.length < 8) { setError("Password must be 8+ chars"); return; }
    }
    setError("");
    setStep((s) => Math.min(s + 1, 2));
  };

  const handleRegister = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await register(
        form.email, form.password, form.name, form.role,
        form.organizationName, form.organizationDomain, form.inviteCode
      );
      saveAuth(data);
      router.push(getHomeRoute(data.role));
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .rp-root { font-family: 'Plus Jakarta Sans', sans-serif; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.06); opacity: 1; }
        }
        @keyframes progressFill {
          from { width: 0; }
          to { width: var(--w); }
        }
        @keyframes stepIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .card-glass {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-radius: 24px;
        }

        .input-dark {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          padding: 14px 48px 14px 44px;
          font-size: 14px;
          color: white;
          font-family: 'Plus Jakarta Sans', sans-serif;
          outline: none;
          transition: all 0.3s ease;
          caret-color: #00d4b4;
        }
        .input-dark-plain {
          padding-right: 16px;
        }
        .input-dark::placeholder { color: rgba(255,255,255,0.2); }
        .input-dark:focus {
          border-color: rgba(0,212,180,0.55);
          background: rgba(0,212,180,0.04);
          box-shadow: 0 0 0 4px rgba(0,212,180,0.07);
        }
        .input-wrap { position: relative; }
        .input-icon {
          position: absolute; left: 14px; top: 50%;
          transform: translateY(-50%);
          opacity: 0.3; pointer-events: none;
          transition: opacity 0.2s;
        }
        .input-wrap:focus-within .input-icon { opacity: 0.7; }
        .input-action {
          position: absolute; right: 14px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer; padding: 4px;
          color: rgba(255,255,255,0.3); transition: color 0.2s;
        }
        .input-action:hover { color: rgba(0,212,180,0.8); }

        .btn-primary {
          background: linear-gradient(135deg, #00d4b4 0%, #0891b2 100%);
          border: none; border-radius: 14px;
          color: #04121f; font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700; font-size: 15px; padding: 15px;
          cursor: pointer; position: relative; overflow: hidden;
          transition: all 0.3s ease; width: 100%;
        }
        .btn-primary::before {
          content: '';
          position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
          transition: left 0.5s ease;
        }
        .btn-primary:hover::before { left: 140%; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 16px 48px rgba(0,212,180,0.3); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .btn-secondary {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          color: rgba(255,255,255,0.7);
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600; font-size: 15px; padding: 15px;
          cursor: pointer; transition: all 0.2s; width: 100%;
        }
        .btn-secondary:hover { background: rgba(255,255,255,0.09); color: white; }

        .role-card {
          display: flex; align-items: flex-start; gap: 14px;
          padding: 16px 18px; border-radius: 16px; cursor: pointer;
          border: 1.5px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          transition: all 0.25s ease;
        }
        .role-card:hover {
          border-color: rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.06);
          transform: translateY(-2px);
        }
        .role-card.sel-dev {
          border-color: rgba(56,189,248,0.4);
          background: rgba(56,189,248,0.06);
        }
        .role-card.sel-prov {
          border-color: rgba(0,212,180,0.45);
          background: rgba(0,212,180,0.06);
        }

        .step-panel { animation: stepIn 0.4s cubic-bezier(0.16,1,0.3,1) both; }

        .brand-logo {
          width: 44px; height: 44px; border-radius: 14px;
          background: linear-gradient(135deg, #00d4b4, #0891b2);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 24px rgba(0,212,180,0.3);
          animation: pulse 3s ease-in-out infinite;
          flex-shrink: 0;
        }

        .reveal { opacity: 0; animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,212,180,0.2); border-radius: 4px; }
      `}</style>

      <div className="rp-root" style={{
        minHeight: "100vh",
        display: "flex",
        background: "linear-gradient(135deg, #020b16 0%, #041424 40%, #03101e 100%)",
        overflow: "hidden",
        position: "relative",
      }}>

        {/* Ambient blobs */}
        <div style={{
          position: "fixed", top: "-10%", right: "-5%", width: 550, height: 550,
          background: "radial-gradient(circle, rgba(0,212,180,0.07) 0%, transparent 65%)",
          pointerEvents: "none", zIndex: 0,
        }} />
        <div style={{
          position: "fixed", bottom: "-15%", left: "-5%", width: 480, height: 480,
          background: "radial-gradient(circle, rgba(8,145,178,0.07) 0%, transparent 65%)",
          pointerEvents: "none", zIndex: 0,
        }} />

        {/* Grid */}
        <div style={{
          position: "fixed", inset: 0, opacity: 0.035, pointerEvents: "none", zIndex: 0,
          backgroundImage: `
            linear-gradient(rgba(0,212,180,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,180,1) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }} />

        {/* LEFT PANEL */}
        <div className="hidden lg:flex" style={{
          width: "46%",
          position: "relative",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 56px",
          overflow: "hidden",
        }}>
          <div style={{ position: "relative", zIndex: 1, maxWidth: 380, width: "100%" }}>

            {/* Brand */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 44 }}>
              <div className="brand-logo">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#04121f" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span style={{ fontSize: 19, fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>
                API<span style={{ color: "#00d4b4" }}>Manager</span>
              </span>
            </div>

            <h2 style={{
              fontSize: 40, fontWeight: 800, lineHeight: 1.08,
              color: "white", marginBottom: 16, letterSpacing: "-0.03em",
            }}>
              Build something<br />
              <span style={{
                backgroundImage: "linear-gradient(90deg, #00d4b4, #38bdf8)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>extraordinary.</span>
            </h2>

            <p style={{
              color: "rgba(255,255,255,0.38)", fontSize: 14, lineHeight: 1.75,
              marginBottom: 40, fontWeight: 300,
            }}>
              Join thousands of developers and organizations managing their entire API lifecycle in one platform.
            </p>

            {/* Role preview cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 36 }}>
              {[
                {
                  icon: "💻", color: "#38bdf8",
                  title: "Developer",
                  desc: "Discover APIs, manage subscriptions, monitor usage & access analytics",
                  delay: "0.1s",
                },
                {
                  icon: "⚡", color: "#00d4b4",
                  title: "API Provider",
                  desc: "Publish APIs, configure rate limits, track consumers & revenue",
                  delay: "0.2s",
                },
              ].map((r) => (
                <div key={r.title} style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 16, padding: "16px 18px",
                  display: "flex", gap: 14, alignItems: "flex-start",
                  animation: `floatY 5s ease-in-out infinite ${r.delay}`,
                  transition: "all 0.3s",
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                    background: `${r.color}18`,
                    border: `1px solid ${r.color}30`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18,
                  }}>{r.icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "white", marginBottom: 4 }}>{r.title}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.55 }}>{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust bar */}
            <div style={{
              display: "flex", gap: 8, flexWrap: "wrap",
            }}>
              {["SOC2 Type II", "GDPR Ready", "99.9% Uptime", "Free Forever"].map((t) => (
                <span key={t} style={{
                  background: "rgba(0,212,180,0.07)",
                  border: "1px solid rgba(0,212,180,0.15)",
                  borderRadius: 8, padding: "5px 12px",
                  fontSize: 11, color: "rgba(0,212,180,0.7)", fontWeight: 600,
                }}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — Multi-step form */}
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
          position: "relative",
          zIndex: 1,
          overflowY: "auto",
        }}>
          {mounted && (
            <div style={{ width: "100%", maxWidth: 440 }}>

              <div className="card-glass reveal" style={{ padding: "40px 36px", animationDelay: "0.1s" }}>

                {/* Mobile brand */}
                <div className="lg:hidden" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
                  <div className="brand-logo" style={{ width: 36, height: 36, borderRadius: 10 }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#04121f" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "white" }}>
                    API<span style={{ color: "#00d4b4" }}>Manager</span>
                  </span>
                </div>

                {/* Step progress */}
                <div style={{ marginBottom: 32 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    {STEPS.map((s, i) => (
                      <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%",
                          background: i <= step
                            ? "linear-gradient(135deg, #00d4b4, #0891b2)"
                            : "rgba(255,255,255,0.06)",
                          border: i <= step ? "none" : "1px solid rgba(255,255,255,0.1)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 700,
                          color: i <= step ? "#04121f" : "rgba(255,255,255,0.3)",
                          transition: "all 0.3s ease",
                          boxShadow: i === step ? "0 4px 16px rgba(0,212,180,0.3)" : "none",
                        }}>
                          {i < step ? (
                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : i + 1}
                        </div>
                        <span style={{
                          fontSize: 12, fontWeight: i === step ? 700 : 400,
                          color: i === step ? "white" : i < step ? "rgba(0,212,180,0.7)" : "rgba(255,255,255,0.25)",
                          transition: "all 0.3s",
                        }}>{s}</span>
                        {i < STEPS.length - 1 && (
                          <div style={{
                            flex: 1, height: 1, minWidth: 20,
                            background: i < step ? "rgba(0,212,180,0.4)" : "rgba(255,255,255,0.07)",
                            transition: "background 0.4s",
                          }} />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Progress bar */}
                  <div style={{
                    height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden",
                  }}>
                    <div style={{
                      height: "100%",
                      width: `${((step + 1) / STEPS.length) * 100}%`,
                      background: "linear-gradient(90deg, #00d4b4, #0891b2)",
                      borderRadius: 4,
                      transition: "width 0.5s cubic-bezier(0.16,1,0.3,1)",
                    }} />
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.18)",
                    color: "#f87171", borderRadius: 12,
                    padding: "12px 16px", fontSize: 13, marginBottom: 16,
                    display: "flex", alignItems: "center", gap: 8,
                    animation: "fadeIn 0.25s ease",
                  }}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
                    </svg>
                    {error}
                  </div>
                )}

                {/* STEP 0 — Account info */}
                {step === 0 && (
                  <div className="step-panel" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <h1 style={{ fontSize: 26, fontWeight: 800, color: "white", letterSpacing: "-0.02em", marginBottom: 6 }}>
                        Create Account
                      </h1>
                      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>Start your journey — it's free</p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <Label>Full Name</Label>
                        <div className="input-wrap">
                          <svg className="input-icon" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <input type="text" value={form.name} onChange={set("name")} placeholder="John Doe" className="input-dark" />
                        </div>
                      </div>
                      <div>
                        <Label>Email</Label>
                        <div className="input-wrap">
                          <svg className="input-icon" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <input type="email" value={form.email} onChange={set("email")} placeholder="you@co.com" className="input-dark" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Password</Label>
                      <div className="input-wrap">
                        <svg className="input-icon" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <input
                          type={showPass ? "text" : "password"}
                          value={form.password}
                          onChange={handlePasswordChange}
                          placeholder="Min. 8 characters"
                          className="input-dark"
                        />
                        <button className="input-action" onClick={() => setShowPass(!showPass)}>
                          {showPass ? (
                            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {form.password && (
                        <div style={{ marginTop: 8 }}>
                          <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                            {[1,2,3,4].map((i) => (
                              <div key={i} style={{
                                flex: 1, height: 3, borderRadius: 4,
                                background: i <= strength ? strengthColors[strength] : "rgba(255,255,255,0.08)",
                                transition: "background 0.3s ease",
                              }} />
                            ))}
                          </div>
                          <span style={{ fontSize: 11, color: strengthColors[strength], fontWeight: 600 }}>
                            {strengthLabels[strength]}
                          </span>
                        </div>
                      )}
                    </div>

                    <button onClick={nextStep} className="btn-primary" style={{ marginTop: 4 }}>
                      Continue →
                    </button>
                  </div>
                )}

                {/* STEP 1 — Role selection */}
                {step === 1 && (
                  <div className="step-panel" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <h1 style={{ fontSize: 24, fontWeight: 800, color: "white", letterSpacing: "-0.02em", marginBottom: 6 }}>
                        Choose your role
                      </h1>
                      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>How will you use APIManager?</p>
                    </div>

                    {[
                      {
                        value: "DEVELOPER", icon: "💻", color: "#38bdf8", selClass: "sel-dev",
                        title: "Developer",
                        sub: "Use & subscribe to APIs",
                        features: ["Browse API catalogue", "Manage API keys", "Usage analytics", "Rate limit monitoring"],
                      },
                      {
                        value: "API_PROVIDER", icon: "⚡", color: "#00d4b4", selClass: "sel-prov",
                        title: "API Provider",
                        sub: "Publish & manage APIs",
                        features: ["Publish APIs", "Set pricing & limits", "Consumer insights", "Revenue tracking"],
                      },
                    ].map((r) => (
                      <label
                        key={r.value}
                        className={`role-card ${form.role === r.value ? r.selClass : ""}`}
                        onClick={() => setForm((p) => ({ ...p, role: r.value }))}
                      >
                        <div style={{
                          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                          background: form.role === r.value ? `${r.color}18` : "rgba(255,255,255,0.06)",
                          border: `1px solid ${form.role === r.value ? r.color + "35" : "rgba(255,255,255,0.08)"}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 20, transition: "all 0.25s",
                        }}>{r.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "white" }}>{r.title}</span>
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{r.sub}</span>
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {r.features.map((f) => (
                              <span key={f} style={{
                                fontSize: 10, fontWeight: 600,
                                color: form.role === r.value ? r.color : "rgba(255,255,255,0.3)",
                                background: form.role === r.value ? `${r.color}12` : "rgba(255,255,255,0.04)",
                                border: `1px solid ${form.role === r.value ? r.color + "25" : "rgba(255,255,255,0.06)"}`,
                                borderRadius: 6, padding: "3px 8px",
                                transition: "all 0.3s",
                              }}>{f}</span>
                            ))}
                          </div>
                        </div>
                        <div style={{
                          width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                          border: `1.5px solid ${form.role === r.value ? r.color : "rgba(255,255,255,0.15)"}`,
                          background: form.role === r.value ? `linear-gradient(135deg, ${r.color}, #0891b2)` : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.25s",
                        }}>
                          {form.role === r.value && (
                            <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#04121f" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </label>
                    ))}

                    <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                      <button className="btn-secondary" onClick={() => setStep(0)}>← Back</button>
                      <button className="btn-primary" onClick={nextStep}>Continue →</button>
                    </div>
                  </div>
                )}

                {/* STEP 2 — Details */}
                {step === 2 && (
                  <div className="step-panel" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <h1 style={{ fontSize: 24, fontWeight: 800, color: "white", letterSpacing: "-0.02em", marginBottom: 6 }}>
                        {form.role === "API_PROVIDER" ? "Organization details" : "Almost there!"}
                      </h1>
                      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
                        {form.role === "API_PROVIDER" ? "Tell us about your organization" : "One optional step to go"}
                      </p>
                    </div>

                    {form.role === "API_PROVIDER" ? (
                      <>
                        <div style={{
                          background: "rgba(0,212,180,0.05)",
                          border: "1px solid rgba(0,212,180,0.14)",
                          borderRadius: 14, padding: "14px 16px",
                          display: "flex", alignItems: "center", gap: 10,
                        }}>
                          <span style={{ fontSize: 14 }}>⚡</span>
                          <span style={{ fontSize: 12, color: "rgba(0,212,180,0.8)", fontWeight: 500 }}>
                            You're setting up as an API Provider
                          </span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <div>
                            <Label required>Org Name</Label>
                            <div className="input-wrap">
                              <svg className="input-icon" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <input type="text" value={form.organizationName} onChange={(e) => setForm(p => ({ ...p, organizationName: e.target.value }))} placeholder="Acme Inc." className="input-dark" />
                            </div>
                          </div>
                          <div>
                            <Label>Domain</Label>
                            <div className="input-wrap">
                              <svg className="input-icon" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <input type="text" value={form.organizationDomain} onChange={(e) => setForm(p => ({ ...p, organizationDomain: e.target.value }))} placeholder="acme.com" className="input-dark" />
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{
                          background: "rgba(56,189,248,0.05)",
                          border: "1px solid rgba(56,189,248,0.14)",
                          borderRadius: 14, padding: "14px 16px",
                          display: "flex", alignItems: "center", gap: 10,
                        }}>
                          <span style={{ fontSize: 14 }}>💡</span>
                          <span style={{ fontSize: 12, color: "rgba(56,189,248,0.8)", fontWeight: 500 }}>
                            Without an invite code you can browse public APIs only
                          </span>
                        </div>
                        <div>
                          <Label optional>Invite Code</Label>
                          <div className="input-wrap">
                            <svg className="input-icon" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            <input type="text" value={form.inviteCode} onChange={(e) => setForm(p => ({ ...p, inviteCode: e.target.value }))} placeholder="e.g. AVE-X7K2" className="input-dark" />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Summary */}
                    <div style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 14, padding: "14px 16px",
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                        Account Summary
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {[
                          { k: "Name", v: form.name || "—" },
                          { k: "Email", v: form.email || "—" },
                          { k: "Role", v: form.role === "DEVELOPER" ? "💻 Developer" : "⚡ API Provider" },
                        ].map((r) => (
                          <div key={r.k} style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{r.k}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>{r.v}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                      <button className="btn-secondary" onClick={() => setStep(1)}>← Back</button>
                      <button onClick={handleRegister} disabled={loading} className="btn-primary">
                        {loading ? (
                          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                            <span style={{
                              width: 15, height: 15,
                              border: "2.5px solid rgba(4,18,31,0.3)",
                              borderTopColor: "#04121f",
                              borderRadius: "50%",
                              display: "inline-block",
                              animation: "spin 0.7s linear infinite",
                            }} />
                            Creating…
                          </span>
                        ) : "Create Account 🚀"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <p className="reveal" style={{
                textAlign: "center", color: "rgba(255,255,255,0.3)",
                fontSize: 13, marginTop: 24, animationDelay: "0.4s",
              }}>
                Already have an account?{" "}
                <Link href="/login" style={{ color: "#00d4b4", fontWeight: 700, textDecoration: "none" }}>
                  Sign in →
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Label({ children, required, optional }: { children: React.ReactNode; required?: boolean; optional?: boolean }) {
  return (
    <label style={{
      fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)",
      textTransform: "uppercase", letterSpacing: "0.1em",
      display: "block", marginBottom: 8,
    }}>
      {children}
      {required && <span style={{ color: "#f87171", marginLeft: 4 }}>*</span>}
      {optional && <span style={{ color: "rgba(255,255,255,0.2)", fontWeight: 400, textTransform: "none", marginLeft: 4 }}>(optional)</span>}
    </label>
  );
}
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { register, saveAuth, getHomeRoute } from "@/lib/auth";

const STEPS = ["Account", "Role", "Details"];

function Label({ children, required, optional }: {
  children: React.ReactNode; required?: boolean; optional?: boolean;
}) {
  return (
    <label style={{
      fontSize: 11, fontWeight: 700, color: "#64748b",
      textTransform: "uppercase", letterSpacing: "0.08em",
      display: "block", marginBottom: 7,
    }}>
      {children}
      {required && <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>}
      {optional && <span style={{ color: "#94a3b8", fontWeight: 400, textTransform: "none", marginLeft: 5 }}>(optional)</span>}
    </label>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", email: "", password: "",
    role: "DEVELOPER",
    organizationName: "", organizationDomain: "", inviteCode: "",
  });
  const [step, setStep]       = useState(0);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [strength, setStrength] = useState(0);
  const [focused, setFocused]   = useState<string | null>(null);

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
  const strengthColors = ["", "#ef4444", "#f59e0b", "#3b82f6", "#2dd4bf"];

  const nextStep = () => {
    if (step === 0) {
      if (!form.name || !form.email || !form.password) { setError("All fields required"); return; }
      if (form.password.length < 8) { setError("Password must be 8+ characters"); return; }
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

  const inputStyle = (name: string) => ({
    width: "100%",
    background: focused === name ? "#f0fdfa" : "#f8fafc",
    border: `1.5px solid ${focused === name ? "#2dd4bf" : "#e2e8f0"}`,
    borderRadius: 12,
    padding: "12px 44px 12px 44px",
    fontSize: 14,
    color: "#0f172a",
    outline: "none",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    boxSizing: "border-box" as const,
    transition: "all 0.2s",
    boxShadow: focused === name ? "0 0 0 3px rgba(45,212,191,0.1)" : "none",
  });

  const inputStylePlain = (name: string) => ({
    ...inputStyle(name),
    padding: "12px 16px 12px 44px",
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeLeft {
          from { opacity: 0; transform: translateX(-24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes stepIn {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(45,212,191,0.3); }
          50%      { box-shadow: 0 0 0 8px rgba(45,212,191,0); }
        }
        @keyframes floatY {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-10px); }
        }

        .rg-left { animation: fadeLeft 0.7s cubic-bezier(0.16,1,0.3,1) both; }
        .rg-card { animation: fadeUp  0.7s cubic-bezier(0.16,1,0.3,1) 0.1s both; }
        .rg-foot { animation: fadeUp  0.7s cubic-bezier(0.16,1,0.3,1) 0.25s both; }
        .step-panel { animation: stepIn 0.35s cubic-bezier(0.16,1,0.3,1) both; }

        .btn-primary {
          background: linear-gradient(135deg, #2dd4bf, #0891b2);
          border: none; border-radius: 13px;
          color: white; font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700; font-size: 15px; padding: 13px 20px;
          cursor: pointer; position: relative; overflow: hidden;
          transition: all 0.25s ease; flex: 1;
          box-shadow: 0 6px 20px rgba(45,212,191,0.28);
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .btn-primary::after {
          content: '';
          position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
          transition: left 0.5s ease;
        }
        .btn-primary:hover::after { left: 140%; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(45,212,191,0.35); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

        .btn-secondary {
          background: #f8fafc; border: 1.5px solid #e2e8f0;
          border-radius: 13px; color: #64748b;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600; font-size: 15px; padding: 13px 20px;
          cursor: pointer; transition: all 0.2s; flex: 1;
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .btn-secondary:hover { background: #f1f5f9; color: #0f172a; border-color: #cbd5e1; }

        .role-card {
          display: flex; align-items: flex-start; gap: 14px;
          padding: 16px 18px; border-radius: 16px; cursor: pointer;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          transition: all 0.25s ease;
        }
        .role-card:hover {
          border-color: #99f6e4;
          background: #f0fdfa;
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(45,212,191,0.1);
        }
        .role-card.sel-dev {
          border-color: #7dd3fc;
          background: #f0f9ff;
          box-shadow: 0 4px 16px rgba(56,189,248,0.1);
        }
        .role-card.sel-prov {
          border-color: #5eead4;
          background: #f0fdfa;
          box-shadow: 0 4px 16px rgba(45,212,191,0.12);
        }

        .input-wrap { position: relative; }
        .input-icon {
          position: absolute; left: 14px; top: 50%;
          transform: translateY(-50%); pointer-events: none;
        }
        .input-toggle {
          position: absolute; right: 13px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #94a3b8; padding: 4px;
          display: flex; align-items: center;
          transition: color 0.2s;
        }
        .input-toggle:hover { color: #0891b2; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
      `}</style>

      <div style={{
        minHeight: "100vh", display: "flex",
        background: "linear-gradient(135deg, #f0fdfa 0%, #e0f7fa 40%, #f8fafc 100%)",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        position: "relative", overflow: "hidden",
      }}>

        {/* Background blobs */}
        <div style={{
          position: "fixed", top: -160, left: -120, width: 480, height: 480,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(45,212,191,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "fixed", bottom: -100, right: -100, width: 400, height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(8,145,178,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* ── LEFT PANEL ── */}
        <div className="rg-left" style={{
          width: "44%",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "60px 48px",
          position: "relative",
        }}>
          <div style={{ maxWidth: 380, width: "100%" }}>

            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: "linear-gradient(135deg, #2dd4bf, #0891b2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 24px rgba(45,212,191,0.35)",
                animation: "pulse 3s ease-in-out infinite",
              }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>
                  API<span style={{ color: "#0891b2" }}>Manager</span>
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.08em" }}>
                  JOIN THE PLATFORM
                </div>
              </div>
            </div>

            <h2 style={{
              fontSize: 36, fontWeight: 800, lineHeight: 1.1,
              color: "#0f172a", marginBottom: 12, letterSpacing: "-0.03em",
            }}>
              Build something<br />
              <span style={{
                background: "linear-gradient(90deg, #2dd4bf, #0891b2)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>extraordinary.</span>
            </h2>

            <p style={{
              color: "#64748b", fontSize: 14, lineHeight: 1.75,
              marginBottom: 28, fontWeight: 400,
            }}>
              Join thousands of developers and organizations managing their entire API lifecycle in one platform.
            </p>

            {/* Lottie */}
            <div style={{
              width: "100%", maxWidth: 340, margin: "0 auto 28px",
              animation: "floatY 5s ease-in-out infinite",
            }}>
              <DotLottieReact
                src="https://lottie.host/e38b4816-2a0b-445d-b3b4-326712debb71/U26s5l6Izq.lottie"
                loop autoplay
              />
            </div>

            {/* Role preview */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { icon: "💻", color: "#38bdf8", bg: "#f0f9ff", border: "#bae6fd", title: "Developer", desc: "Discover APIs, manage subscriptions & analytics" },
                { icon: "⚡", color: "#2dd4bf", bg: "#f0fdfa", border: "#99f6e4", title: "API Provider", desc: "Publish APIs, set limits & track consumers" },
              ].map((r) => (
                <div key={r.title} style={{
                  background: r.bg, border: `1px solid ${r.border}`,
                  borderRadius: 14, padding: "14px 16px",
                  display: "flex", gap: 12, alignItems: "center",
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: "white", border: `1px solid ${r.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                  }}>{r.icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{r.title}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20 }}>
              {["SOC2 Type II", "GDPR Ready", "99.9% Uptime", "Free Forever"].map((t) => (
                <span key={t} style={{
                  background: "#f0fdfa", border: "1px solid #99f6e4",
                  borderRadius: 20, padding: "5px 12px",
                  fontSize: 10, color: "#0891b2", fontWeight: 700,
                }}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{
          flex: 1, display: "flex",
          alignItems: "center", justifyContent: "center",
          padding: "40px 32px",
          position: "relative", zIndex: 1, overflowY: "auto",
        }}>
          {mounted && (
            <div style={{ width: "100%", maxWidth: 460 }}>

              {/* Card */}
              <div className="rg-card" style={{
                background: "rgba(255,255,255,0.88)",
                backdropFilter: "blur(20px)",
                border: "1.5px solid rgba(255,255,255,0.9)",
                borderRadius: 24,
                boxShadow: "0 20px 60px rgba(15,23,42,0.09), 0 4px 16px rgba(15,23,42,0.04)",
                padding: "40px 36px",
              }}>

                {/* Step progress */}
                <div style={{ marginBottom: 28 }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                    {STEPS.map((s, i) => (
                      <div key={s} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : undefined }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: "50%",
                            background: i <= step
                              ? "linear-gradient(135deg, #2dd4bf, #0891b2)"
                              : "#f1f5f9",
                            border: i <= step ? "none" : "1.5px solid #e2e8f0",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, fontWeight: 700,
                            color: i <= step ? "white" : "#94a3b8",
                            transition: "all 0.3s ease",
                            boxShadow: i === step ? "0 4px 12px rgba(45,212,191,0.3)" : "none",
                            flexShrink: 0,
                          }}>
                            {i < step ? (
                              <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : i + 1}
                          </div>
                          <span style={{
                            fontSize: 12, fontWeight: i === step ? 700 : 500,
                            color: i === step ? "#0f172a" : i < step ? "#2dd4bf" : "#94a3b8",
                            transition: "all 0.3s", whiteSpace: "nowrap",
                          }}>{s}</span>
                        </div>
                        {i < STEPS.length - 1 && (
                          <div style={{
                            flex: 1, height: 1.5, marginLeft: 8, marginRight: 8,
                            background: i < step
                              ? "linear-gradient(90deg, #2dd4bf, #0891b2)"
                              : "#e2e8f0",
                            transition: "background 0.4s",
                          }} />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Progress bar */}
                  <div style={{
                    height: 3, background: "#f1f5f9", borderRadius: 4, overflow: "hidden",
                  }}>
                    <div style={{
                      height: "100%",
                      width: `${((step + 1) / STEPS.length) * 100}%`,
                      background: "linear-gradient(90deg, #2dd4bf, #0891b2)",
                      borderRadius: 4,
                      transition: "width 0.5s cubic-bezier(0.16,1,0.3,1)",
                    }} />
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div style={{
                    background: "#fef2f2", border: "1.5px solid #fecaca",
                    color: "#dc2626", borderRadius: 12, padding: "12px 16px",
                    fontSize: 13, marginBottom: 16,
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
                    </svg>
                    {error}
                  </div>
                )}

                {/* ── STEP 0 — Account ── */}
                {step === 0 && (
                  <div className="step-panel" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ marginBottom: 4 }}>
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        background: "#f0fdfa", border: "1px solid #99f6e4",
                        borderRadius: 20, padding: "4px 12px", marginBottom: 12,
                      }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#0891b2" }}>Step 1 of 3</span>
                      </div>
                      <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", marginBottom: 4 }}>
                        Create Account
                      </h1>
                      <p style={{ fontSize: 13, color: "#64748b" }}>Start your journey — it's completely free</p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <Label>Full Name</Label>
                        <div className="input-wrap">
                          <svg className="input-icon" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke={focused === "name" ? "#0891b2" : "#94a3b8"} strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <input type="text" value={form.name} onChange={set("name")}
                            onFocus={() => setFocused("name")} onBlur={() => setFocused(null)}
                            placeholder="John Doe" style={inputStylePlain("name")} />
                        </div>
                      </div>
                      <div>
                        <Label>Email</Label>
                        <div className="input-wrap">
                          <svg className="input-icon" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke={focused === "regemail" ? "#0891b2" : "#94a3b8"} strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <input type="email" value={form.email} onChange={set("email")}
                            onFocus={() => setFocused("regemail")} onBlur={() => setFocused(null)}
                            placeholder="you@co.com" style={inputStylePlain("regemail")} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Password</Label>
                      <div className="input-wrap">
                        <svg className="input-icon" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke={focused === "regpass" ? "#0891b2" : "#94a3b8"} strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <input type={showPass ? "text" : "password"} value={form.password}
                          onChange={handlePasswordChange}
                          onFocus={() => setFocused("regpass")} onBlur={() => setFocused(null)}
                          placeholder="Min. 8 characters" style={inputStyle("regpass")} />
                        <button className="input-toggle" onClick={() => setShowPass(!showPass)}>
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
                          <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
                            {[1,2,3,4].map((i) => (
                              <div key={i} style={{
                                flex: 1, height: 3, borderRadius: 4,
                                background: i <= strength ? strengthColors[strength] : "#e2e8f0",
                                transition: "background 0.3s",
                              }} />
                            ))}
                          </div>
                          <span style={{ fontSize: 11, color: strengthColors[strength], fontWeight: 700 }}>
                            {strengthLabels[strength]}
                          </span>
                        </div>
                      )}
                    </div>

                    <button onClick={nextStep} className="btn-primary" style={{ marginTop: 4, flex: "none", width: "100%" }}>
                      Continue
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* ── STEP 1 — Role ── */}
                {step === 1 && (
                  <div className="step-panel" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ marginBottom: 4 }}>
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        background: "#f0fdfa", border: "1px solid #99f6e4",
                        borderRadius: 20, padding: "4px 12px", marginBottom: 12,
                      }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#0891b2" }}>Step 2 of 3</span>
                      </div>
                      <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", marginBottom: 4 }}>
                        Choose your role
                      </h1>
                      <p style={{ fontSize: 13, color: "#64748b" }}>How will you use APIManager?</p>
                    </div>

                    {[
                      {
                        value: "DEVELOPER", icon: "💻", color: "#38bdf8", selClass: "sel-dev",
                        title: "Developer", sub: "Use & subscribe to APIs",
                        features: ["Browse API catalogue", "Manage API keys", "Usage analytics", "Rate limit monitoring"],
                      },
                      {
                        value: "API_PROVIDER", icon: "⚡", color: "#2dd4bf", selClass: "sel-prov",
                        title: "API Provider", sub: "Publish & manage APIs",
                        features: ["Publish APIs", "Set pricing & limits", "Consumer insights", "Revenue tracking"],
                      },
                    ].map((r) => (
                      <label key={r.value}
                        className={`role-card ${form.role === r.value ? r.selClass : ""}`}
                        onClick={() => setForm((p) => ({ ...p, role: r.value }))}>
                        <div style={{
                          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                          background: form.role === r.value ? `${r.color}18` : "#f1f5f9",
                          border: `1px solid ${form.role === r.value ? r.color + "50" : "#e2e8f0"}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 20, transition: "all 0.25s",
                        }}>{r.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{r.title}</span>
                            <span style={{ fontSize: 11, color: "#94a3b8" }}>{r.sub}</span>
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                            {r.features.map((f) => (
                              <span key={f} style={{
                                fontSize: 10, fontWeight: 600,
                                color: form.role === r.value ? r.color : "#94a3b8",
                                background: form.role === r.value ? `${r.color}12` : "#f8fafc",
                                border: `1px solid ${form.role === r.value ? r.color + "30" : "#e2e8f0"}`,
                                borderRadius: 6, padding: "3px 8px", transition: "all 0.3s",
                              }}>{f}</span>
                            ))}
                          </div>
                        </div>
                        <div style={{
                          width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                          border: `1.5px solid ${form.role === r.value ? r.color : "#cbd5e1"}`,
                          background: form.role === r.value ? r.color : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.25s",
                        }}>
                          {form.role === r.value && (
                            <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </label>
                    ))}

                    <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                      <button className="btn-secondary" onClick={() => setStep(0)}>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                        </svg>
                        Back
                      </button>
                      <button className="btn-primary" onClick={nextStep}>
                        Continue
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* ── STEP 2 — Details ── */}
                {step === 2 && (
                  <div className="step-panel" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ marginBottom: 4 }}>
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        background: "#f0fdfa", border: "1px solid #99f6e4",
                        borderRadius: 20, padding: "4px 12px", marginBottom: 12,
                      }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#0891b2" }}>Step 3 of 3</span>
                      </div>
                      <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", marginBottom: 4 }}>
                        {form.role === "API_PROVIDER" ? "Organization details" : "Almost there!"}
                      </h1>
                      <p style={{ fontSize: 13, color: "#64748b" }}>
                        {form.role === "API_PROVIDER" ? "Tell us about your organization" : "One optional step"}
                      </p>
                    </div>

                    {/* Info banner */}
                    <div style={{
                      background: form.role === "API_PROVIDER" ? "#f0fdfa" : "#f0f9ff",
                      border: `1px solid ${form.role === "API_PROVIDER" ? "#99f6e4" : "#bae6fd"}`,
                      borderRadius: 12, padding: "12px 16px",
                      display: "flex", alignItems: "center", gap: 10,
                    }}>
                      <span style={{ fontSize: 16 }}>{form.role === "API_PROVIDER" ? "⚡" : "💡"}</span>
                      <span style={{ fontSize: 12, color: form.role === "API_PROVIDER" ? "#0891b2" : "#0369a1", fontWeight: 500 }}>
                        {form.role === "API_PROVIDER"
                          ? "You're setting up as an API Provider"
                          : "Without an invite code you can browse public APIs only"}
                      </span>
                    </div>

                    {form.role === "API_PROVIDER" ? (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <Label required>Org Name</Label>
                          <div className="input-wrap">
                            <svg className="input-icon" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke={focused === "orgname" ? "#0891b2" : "#94a3b8"} strokeWidth={1.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <input type="text" value={form.organizationName}
                              onChange={(e) => setForm(p => ({ ...p, organizationName: e.target.value }))}
                              onFocus={() => setFocused("orgname")} onBlur={() => setFocused(null)}
                              placeholder="Acme Inc." style={inputStylePlain("orgname")} />
                          </div>
                        </div>
                        <div>
                          <Label>Domain</Label>
                          <div className="input-wrap">
                            <svg className="input-icon" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke={focused === "domain" ? "#0891b2" : "#94a3b8"} strokeWidth={1.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <input type="text" value={form.organizationDomain}
                              onChange={(e) => setForm(p => ({ ...p, organizationDomain: e.target.value }))}
                              onFocus={() => setFocused("domain")} onBlur={() => setFocused(null)}
                              placeholder="acme.com" style={inputStylePlain("domain")} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Label optional>Invite Code</Label>
                        <div className="input-wrap">
                          <svg className="input-icon" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke={focused === "invite" ? "#0891b2" : "#94a3b8"} strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                          <input type="text" value={form.inviteCode}
                            onChange={(e) => setForm(p => ({ ...p, inviteCode: e.target.value }))}
                            onFocus={() => setFocused("invite")} onBlur={() => setFocused(null)}
                            placeholder="e.g. AVE-X7K2" style={inputStylePlain("invite")} />
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    <div style={{
                      background: "#f8fafc", border: "1px solid #e2e8f0",
                      borderRadius: 12, padding: "14px 16px",
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                        Account Summary
                      </div>
                      {[
                        { k: "Name", v: form.name || "—" },
                        { k: "Email", v: form.email || "—" },
                        { k: "Role", v: form.role === "DEVELOPER" ? "💻 Developer" : "⚡ API Provider" },
                      ].map((r) => (
                        <div key={r.k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 12, color: "#94a3b8" }}>{r.k}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{r.v}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                      <button className="btn-secondary" onClick={() => setStep(1)}>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                        </svg>
                        Back
                      </button>
                      <button onClick={handleRegister} disabled={loading} className="btn-primary">
                        {loading ? (
                          <>
                            <span style={{
                              width: 15, height: 15,
                              border: "2.5px solid rgba(255,255,255,0.3)",
                              borderTopColor: "white", borderRadius: "50%",
                              animation: "spin 0.7s linear infinite",
                            }} />
                            Creating…
                          </>
                        ) : <>Create Account 🚀</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <p className="rg-foot" style={{
                textAlign: "center", color: "#64748b",
                fontSize: 13, marginTop: 22,
              }}>
                Already have an account?{" "}
                <Link href="/login" style={{ color: "#0891b2", fontWeight: 700, textDecoration: "none" }}>
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
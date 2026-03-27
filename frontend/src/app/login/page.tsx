"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { login, saveAuth, getHomeRoute } from "@/lib/auth";

function RememberMe() {
  const [checked, setChecked] = useState(false);
  return (
    <label onClick={() => setChecked(!checked)} style={{
      display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: 6, flexShrink: 0,
        border: checked ? "none" : "1.5px solid #cbd5e1",
        background: checked ? "linear-gradient(135deg, #2dd4bf, #0891b2)" : "white",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s", boxShadow: checked ? "0 2px 8px rgba(45,212,191,0.3)" : "none",
      }}>
        {checked && (
          <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span style={{ fontSize: 13, color: "#64748b", userSelect: "none" }}>Remember me</span>
    </label>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [mounted, setMounted]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused]   = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await login(email, password);
      saveAuth(data);
      router.push(getHomeRoute(data.role));
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (name: string) => ({
    width: "100%",
    background: focused === name ? "#f0fdfa" : "#f8fafc",
    border: `1.5px solid ${focused === name ? "#2dd4bf" : "#e2e8f0"}`,
    borderRadius: 12,
    padding: "13px 44px 13px 44px",
    fontSize: 14,
    color: "#0f172a",
    outline: "none",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    boxSizing: "border-box" as const,
    transition: "all 0.2s",
    boxShadow: focused === name ? "0 0 0 3px rgba(45,212,191,0.1)" : "none",
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeLeft {
          from { opacity: 0; transform: translateX(-28px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(45,212,191,0.3); }
          50%      { box-shadow: 0 0 0 8px rgba(45,212,191,0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes floatY {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-10px); }
        }

        .lp-left  { animation: fadeLeft 0.7s cubic-bezier(0.16,1,0.3,1) both; }
        .lp-card  { animation: fadeUp  0.7s cubic-bezier(0.16,1,0.3,1) 0.1s both; }
        .lp-foot  { animation: fadeUp  0.7s cubic-bezier(0.16,1,0.3,1) 0.25s both; }

        .btn-login {
          width: 100%;
          background: linear-gradient(135deg, #2dd4bf 0%, #0891b2 100%);
          border: none; border-radius: 13px;
          color: white; font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700; font-size: 15px; padding: 14px;
          cursor: pointer; position: relative; overflow: hidden;
          transition: all 0.25s ease;
          box-shadow: 0 6px 20px rgba(45,212,191,0.3);
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .btn-login::after {
          content: '';
          position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
          transition: left 0.5s ease;
        }
        .btn-login:hover::after { left: 140%; }
        .btn-login:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(45,212,191,0.35); }
        .btn-login:active { transform: translateY(0); }
        .btn-login:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

        .stat-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px 20px;
          transition: all 0.3s;
          box-shadow: 0 2px 12px rgba(15,23,42,0.04);
        }
        .stat-card:hover {
          border-color: #2dd4bf;
          box-shadow: 0 4px 20px rgba(45,212,191,0.12);
          transform: translateY(-3px);
        }

        .feature-pill {
          background: #f0fdfa;
          border: 1px solid #99f6e4;
          color: #0891b2;
          border-radius: 20px;
          padding: 6px 14px;
          font-size: 11px; font-weight: 600;
          transition: all 0.2s;
          cursor: default;
        }
        .feature-pill:hover {
          background: #ccfbf1;
          transform: translateY(-2px);
        }

        .input-wrap { position: relative; }
        .input-icon {
          position: absolute; left: 14px; top: 50%;
          transform: translateY(-50%); pointer-events: none;
          transition: color 0.2s;
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
      `}</style>

      <div style={{
        minHeight: "100vh", display: "flex",
        background: "linear-gradient(135deg, #f0fdfa 0%, #e0f7fa 40%, #f8fafc 100%)",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        position: "relative", overflow: "hidden",
      }}>

        {/* Background mesh blobs */}
        <div style={{
          position: "fixed", top: -160, right: -160, width: 500, height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(45,212,191,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "fixed", bottom: -100, left: -100, width: 400, height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(8,145,178,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "fixed", top: "40%", left: "30%", width: 300, height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* ── LEFT PANEL ── */}
        <div className="lp-left" style={{
          width: "52%",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "60px 56px",
          position: "relative",
        }}>
          <div style={{ maxWidth: 420, width: "100%" }}>

            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
              <div style={{
                width: 46, height: 46, borderRadius: 14,
                background: "linear-gradient(135deg, #2dd4bf, #0891b2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 24px rgba(45,212,191,0.35)",
                animation: "pulse 3s ease-in-out infinite",
              }}>
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>
                  API<span style={{ color: "#0891b2" }}>Manager</span>
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.08em" }}>
                  API LIFECYCLE PLATFORM
                </div>
              </div>
            </div>

            {/* Headline */}
            <h2 style={{
              fontSize: 42, fontWeight: 800, lineHeight: 1.1,
              color: "#0f172a", marginBottom: 14, letterSpacing: "-0.03em",
            }}>
              The platform<br />
              <span style={{
                background: "linear-gradient(90deg, #2dd4bf, #0891b2)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>to manage apis.</span>
            </h2>

            <p style={{
              color: "#64748b", fontSize: 15, lineHeight: 1.75,
              marginBottom: 36, fontWeight: 400, maxWidth: 360,
            }}>
              Publish, monetize & observe every API across your organization with sub-5ms latency gateway infrastructure.
            </p>

            {/* Lottie animation */}
            <div style={{
              width: "100%", maxWidth: 360, margin: "0 auto 36px",
              animation: "floatY 5s ease-in-out infinite",
            }}>
              <DotLottieReact
                src="https://lottie.host/95ad63a6-08b9-4832-ba1c-f537323a1eef/ly6kjx2Fry.lottie"
                loop autoplay
              />
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
              {[
                { val: "99.9%", label: "Uptime SLA", icon: "🟢" },
                { val: "<5ms", label: "P99 Latency", icon: "⚡" },
                { val: "10M+", label: "API calls/day", icon: "📈" },
              ].map((s) => (
                <div key={s.label} className="stat-card" style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 16, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#0891b2", letterSpacing: "-0.02em" }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Feature pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["Rate Limiting", "OAuth2", "Analytics", "Versioning", "Webhooks", "Gateway"].map((f) => (
                <span key={f} className="feature-pill">{f}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{
          flex: 1, display: "flex",
          alignItems: "center", justifyContent: "center",
          padding: "48px 40px", position: "relative", zIndex: 1,
        }}>
          {mounted && (
            <div style={{ width: "100%", maxWidth: 420 }}>

              {/* Card */}
              <div className="lp-card" style={{
                background: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(20px)",
                border: "1.5px solid rgba(255,255,255,0.9)",
                borderRadius: 24,
                boxShadow: "0 20px 60px rgba(15,23,42,0.09), 0 4px 16px rgba(15,23,42,0.04)",
                padding: "44px 40px",
              }}>

                {/* Header */}
                <div style={{ marginBottom: 32 }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: "#f0fdfa", border: "1px solid #99f6e4",
                    borderRadius: 20, padding: "5px 14px", marginBottom: 16,
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2dd4bf" }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#0891b2" }}>SECURE LOGIN</span>
                  </div>
                  <h1 style={{
                    fontSize: 28, fontWeight: 800, color: "#0f172a",
                    letterSpacing: "-0.02em", marginBottom: 6,
                  }}>Welcome back 👋</h1>
                  <p style={{ color: "#64748b", fontSize: 14 }}>
                    Sign in to continue to your workspace
                  </p>
                </div>

                {/* Divider */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 12, marginBottom: 24,
                }}>
                  <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
                  <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, whiteSpace: "nowrap" }}>
                    continue with email
                  </span>
                  <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
                </div>

                {/* Error */}
                {error && (
                  <div style={{
                    background: "#fef2f2", border: "1.5px solid #fecaca",
                    color: "#dc2626", borderRadius: 12, padding: "12px 16px",
                    fontSize: 13, marginBottom: 18,
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
                    </svg>
                    {error}
                  </div>
                )}

                {/* Fields */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Email */}
                  <div>
                    <label style={{
                      fontSize: 11, fontWeight: 700, color: "#64748b",
                      textTransform: "uppercase", letterSpacing: "0.08em",
                      display: "block", marginBottom: 7,
                    }}>Email</label>
                    <div className="input-wrap">
                      <svg className="input-icon" width="16" height="16" fill="none" viewBox="0 0 24 24"
                        stroke={focused === "email" ? "#0891b2" : "#94a3b8"} strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <input
                        type="email" value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocused("email")}
                        onBlur={() => setFocused(null)}
                        placeholder="you@company.com"
                        style={{ ...inputStyle("email"), paddingRight: 16 }}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                      <label style={{
                        fontSize: 11, fontWeight: 700, color: "#64748b",
                        textTransform: "uppercase", letterSpacing: "0.08em",
                      }}>Password</label>
                      <Link href="/forgot-password" style={{
                        fontSize: 12, color: "#0891b2", fontWeight: 700, textDecoration: "none",
                      }}>
                        Forgot?
                      </Link>
                    </div>
                    <div className="input-wrap">
                      <svg className="input-icon" width="16" height="16" fill="none" viewBox="0 0 24 24"
                        stroke={focused === "password" ? "#0891b2" : "#94a3b8"} strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <input
                        type={showPass ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocused("password")}
                        onBlur={() => setFocused(null)}
                        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                        placeholder="••••••••••"
                        style={inputStyle("password")}
                      />
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
                  </div>

                  {/* Remember me */}
                  <RememberMe />

                  {/* Submit */}
                  <button onClick={handleLogin} disabled={loading} className="btn-login" style={{ marginTop: 4 }}>
                    {loading ? (
                      <>
                        <span style={{
                          width: 16, height: 16,
                          border: "2.5px solid rgba(255,255,255,0.3)",
                          borderTopColor: "white", borderRadius: "50%",
                          animation: "spin 0.7s linear infinite",
                        }} />
                        Signing in…
                      </>
                    ) : (
                      <>
                        Sign In
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>

                {/* Security note */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  marginTop: 20, padding: "10px 16px",
                  background: "#f8fafc", borderRadius: 10,
                  border: "1px solid #e2e8f0",
                }}>
                  {/* <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg> */}
                  {/* <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>
                    256-bit encrypted · SOC2 Type II
                  </span> */}
                </div>
              </div>

              {/* Footer */}
              <p className="lp-foot" style={{
                textAlign: "center", color: "#64748b",
                fontSize: 13, marginTop: 22,
              }}>
                Don't have an account?{" "}
                <Link href="/register" style={{ color: "#0891b2", fontWeight: 700, textDecoration: "none" }}>
                  Create one free →
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
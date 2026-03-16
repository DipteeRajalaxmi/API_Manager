"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login, saveAuth, getHomeRoute } from "@/lib/auth";

const floatingOrbs = [
  { size: 300, x: -80, y: -80, delay: 0, duration: 8 },
  { size: 200, x: 60, y: 40, delay: 2, duration: 10 },
  { size: 150, x: -20, y: 70, delay: 4, duration: 7 },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [focused, setFocused]   = useState<string | null>(null);
  const [mounted, setMounted]   = useState(false);

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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .login-root * { font-family: 'DM Sans', sans-serif; }
        .login-heading { font-family: 'Syne', sans-serif; }

        @keyframes floatOrb {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes gridDrift {
          0% { transform: translateY(0); }
          100% { transform: translateY(40px); }
        }

        .animate-slideUp { animation: slideUp 0.6s cubic-bezier(0.16,1,0.3,1) both; }
        .animate-fadeIn  { animation: fadeIn 0.4s ease both; }

        .input-glass {
          background: rgba(255,255,255,0.07);
          border: 1.5px solid rgba(255,255,255,0.12);
          color: white;
          border-radius: 14px;
          padding: 14px 18px;
          font-size: 14px;
          width: 100%;
          outline: none;
          transition: all 0.25s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .input-glass::placeholder { color: rgba(255,255,255,0.3); }
        .input-glass:focus {
          border-color: rgba(20,230,185,0.6);
          background: rgba(255,255,255,0.1);
          box-shadow: 0 0 0 3px rgba(20,230,185,0.12);
        }

        .btn-glow {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #14e6b9, #0891b2);
          border: none;
          border-radius: 14px;
          color: white;
          font-weight: 700;
          font-size: 15px;
          padding: 15px;
          width: 100%;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Syne', sans-serif;
          letter-spacing: 0.02em;
        }
        .btn-glow:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(20,230,185,0.4);
        }
        .btn-glow:active { transform: translateY(0); }
        .btn-glow:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .btn-glow::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          background-size: 200%;
          animation: shimmer 2s infinite;
        }

        .feature-pill {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.8);
          font-size: 11px;
          font-weight: 500;
          padding: 6px 14px;
          border-radius: 999px;
          display: inline-block;
          transition: all 0.2s;
        }
        .feature-pill:hover {
          background: rgba(20,230,185,0.15);
          border-color: rgba(20,230,185,0.3);
          color: white;
        }

        .stat-card {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 16px 20px;
          flex: 1;
        }
      `}</style>

      <div className="login-root" style={{
        minHeight: "100vh",
        display: "flex",
        background: "#040d1a",
        overflow: "hidden",
      }}>

        {/* LEFT — dark panel with orbs */}
        <div style={{
          width: "50%",
          position: "relative",
          background: "linear-gradient(135deg, #040d1a 0%, #071428 50%, #061020 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
          overflow: "hidden",
        }} className="hidden lg:flex">

          {/* Grid background */}
          <div style={{
            position: "absolute", inset: 0, opacity: 0.06,
            backgroundImage: `linear-gradient(rgba(20,230,185,0.5) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(20,230,185,0.5) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
            animation: "gridDrift 8s linear infinite alternate",
          }} />

          {/* Orbs */}
          <div style={{
            position: "absolute", top: "10%", left: "5%",
            width: 280, height: 280,
            background: "radial-gradient(circle, rgba(20,230,185,0.15) 0%, transparent 70%)",
            borderRadius: "50%",
            animation: "floatOrb 8s ease-in-out infinite",
          }} />
          <div style={{
            position: "absolute", bottom: "15%", right: "10%",
            width: 200, height: 200,
            background: "radial-gradient(circle, rgba(8,145,178,0.2) 0%, transparent 70%)",
            borderRadius: "50%",
            animation: "floatOrb 10s ease-in-out infinite 2s",
          }} />
          <div style={{
            position: "absolute", top: "50%", right: "20%",
            width: 120, height: 120,
            background: "radial-gradient(circle, rgba(20,230,185,0.1) 0%, transparent 70%)",
            borderRadius: "50%",
            animation: "floatOrb 7s ease-in-out infinite 4s",
          }} />

          <div style={{ position: "relative", zIndex: 1, maxWidth: 380 }}>
            {/* Logo mark */}
            <div style={{
              width: 64, height: 64,
              background: "linear-gradient(135deg, rgba(20,230,185,0.2), rgba(8,145,178,0.2))",
              border: "1px solid rgba(20,230,185,0.3)",
              borderRadius: 20,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 32,
              boxShadow: "0 0 40px rgba(20,230,185,0.1)",
            }}>
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="rgba(20,230,185,0.9)" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>

            <h2 className="login-heading" style={{
              fontSize: 42, fontWeight: 800, lineHeight: 1.1,
              color: "white", marginBottom: 16,
              letterSpacing: "-0.02em",
            }}>
              The API Platform<br />
              <span style={{
                background: "linear-gradient(90deg, #14e6b9, #38bdf8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>built for scale.</span>
            </h2>

            <p style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: 14, lineHeight: 1.7, marginBottom: 40,
              fontWeight: 300,
            }}>
              Publish, manage, and monetize APIs with enterprise-grade tools. Full lifecycle control in one platform.
            </p>

            {/* Stats */}
            <div style={{ display: "flex", gap: 12, marginBottom: 36 }}>
              {[
                { num: "99.9%", label: "Uptime SLA" },
                { num: "< 5ms", label: "Gateway latency" },
              ].map((s) => (
                <div key={s.label} className="stat-card">
                  <div className="login-heading" style={{
                    fontSize: 22, fontWeight: 800, color: "#14e6b9", lineHeight: 1,
                  }}>{s.num}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Feature pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["Rate Limiting", "Analytics", "OAuth2", "Gateway", "Versioning", "Webhooks"].map((f) => (
                <span key={f} className="feature-pill">{f}</span>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — form */}
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 40px",
          background: "linear-gradient(160deg, #071428 0%, #040d1a 100%)",
        }}>
          <div style={{
            width: "100%", maxWidth: 400,
            opacity: mounted ? 1 : 0,
            animation: mounted ? "slideUp 0.7s cubic-bezier(0.16,1,0.3,1) both" : "none",
          }}>

            {/* Logo */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10, marginBottom: 48,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "linear-gradient(135deg, #14e6b9, #0891b2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 16px rgba(20,230,185,0.3)",
              }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="login-heading" style={{
                fontSize: 18, fontWeight: 700, color: "white", letterSpacing: "-0.01em",
              }}>
                API<span style={{ color: "#14e6b9" }}>Manager</span>
              </span>
            </div>

            <h1 className="login-heading" style={{
              fontSize: 32, fontWeight: 800, color: "white",
              marginBottom: 8, letterSpacing: "-0.02em", lineHeight: 1.1,
            }}>Welcome back </h1>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, marginBottom: 36 }}>
              Sign in to your account to continue
            </p>

            {error && (
              <div style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: "#f87171",
                borderRadius: 12, padding: "12px 16px",
                fontSize: 13, marginBottom: 24,
                animation: "fadeIn 0.3s ease",
              }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Email */}
              <div style={{ animationDelay: "0.1s" }} className="animate-slideUp">
                <label style={{
                  fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)",
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  display: "block", marginBottom: 8,
                }}>Email</label>
                <input
                  type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  placeholder="you@company.com"
                  className="input-glass"
                />
              </div>

              {/* Password */}
              <div style={{ animationDelay: "0.15s" }} className="animate-slideUp">
                <label style={{
                  fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)",
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  display: "block", marginBottom: 8,
                }}>Password</label>
                <input
                  type="password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="••••••••"
                  className="input-glass"
                />
              </div>

              {/* Submit */}
              <div style={{ animationDelay: "0.2s", marginTop: 8 }} className="animate-slideUp">
                <button onClick={handleLogin} disabled={loading} className="btn-glow">
                  {loading ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <span style={{
                        width: 16, height: 16,
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "white",
                        borderRadius: "50%",
                        display: "inline-block",
                        animation: "spin 0.7s linear infinite",
                      }} />
                      Signing in…
                    </span>
                  ) : "Sign In →"}
                </button>
              </div>

            </div>

            <p style={{
              textAlign: "center", color: "rgba(255,255,255,0.3)",
              fontSize: 13, marginTop: 32,
            }}>
              No account?{" "}
              <Link href="/register" style={{
                color: "#14e6b9", fontWeight: 600, textDecoration: "none",
              }}>
                Create one now
              </Link>
            </p>
          </div>
        </div>

      </div>
    </> 
  );
}
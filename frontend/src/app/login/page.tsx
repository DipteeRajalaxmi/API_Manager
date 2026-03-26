"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login, saveAuth, getHomeRoute } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setMounted(true);

    // Particle canvas animation
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animId: number;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: { x: number; y: number; vx: number; vy: number; r: number; a: number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.5 + 0.5,
        a: Math.random() * 0.5 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,212,180,${p.a})`;
        ctx.fill();
      });

      // Draw connecting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0,212,180,${0.08 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

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
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .lp-root { font-family: 'Plus Jakarta Sans', sans-serif; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes borderGlow {
          0%, 100% { border-color: rgba(0,212,180,0.25); }
          50% { border-color: rgba(0,212,180,0.55); }
        }
        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-16px); }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }

        .card-glass {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-radius: 24px;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
          animation: borderGlow 4s ease-in-out infinite;
        }
        .card-glass:hover {
          box-shadow: 0 0 60px rgba(0,212,180,0.06);
        }

        .input-purity {
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
        .input-purity::placeholder { color: rgba(255,255,255,0.25); }
        .input-purity:focus {
          border-color: rgba(0,212,180,0.6);
          background: rgba(0,212,180,0.04);
          box-shadow: 0 0 0 4px rgba(0,212,180,0.08), inset 0 1px 0 rgba(255,255,255,0.08);
        }
        .input-wrap { position: relative; }
        .input-icon {
          position: absolute; left: 14px; top: 50%;
          transform: translateY(-50%);
          opacity: 0.35; pointer-events: none;
          transition: opacity 0.2s;
        }
        .input-wrap:focus-within .input-icon { opacity: 0.75; }
        .input-action {
          position: absolute; right: 14px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer; padding: 4px;
          color: rgba(255,255,255,0.3); transition: color 0.2s;
        }
        .input-action:hover { color: rgba(0,212,180,0.8); }

        .btn-primary {
          width: 100%;
          background: linear-gradient(135deg, #00d4b4 0%, #0891b2 100%);
          border: none;
          border-radius: 14px;
          color: #04121f;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
          font-size: 15px;
          padding: 15px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
          letter-spacing: 0.01em;
        }
        .btn-primary::before {
          content: '';
          position: absolute;
          top: 0; left: -100%; width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
          transition: left 0.5s ease;
        }
        .btn-primary:hover::before { left: 140%; }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 48px rgba(0,212,180,0.35);
        }
        .btn-primary:active { transform: translateY(0); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .divider {
          display: flex; align-items: center; gap: 12px; margin: 8px 0;
        }
        .divider::before, .divider::after {
          content: ''; flex: 1;
          height: 1px; background: rgba(255,255,255,0.08);
        }

        .social-btn {
          flex: 1;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          color: rgba(255,255,255,0.6);
          font-size: 13px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 500;
          padding: 11px 16px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.2s ease;
        }
        .social-btn:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.15);
          color: white;
        }

        .stat-chip {
          background: rgba(0,212,180,0.08);
          border: 1px solid rgba(0,212,180,0.18);
          border-radius: 12px;
          padding: 12px 16px;
          transition: all 0.3s ease;
          animation: floatY 4s ease-in-out infinite;
        }
        .stat-chip:hover {
          background: rgba(0,212,180,0.12);
          transform: translateY(-4px);
        }

        .feature-tag {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 11px;
          color: rgba(255,255,255,0.55);
          font-weight: 500;
          transition: all 0.2s;
          cursor: default;
        }
        .feature-tag:hover {
          background: rgba(0,212,180,0.1);
          border-color: rgba(0,212,180,0.25);
          color: rgba(0,212,180,0.9);
          transform: translateY(-2px);
        }

        .checkbox-wrap {
          display: flex; align-items: center; gap: 10px; cursor: pointer;
        }
        .checkbox-custom {
          width: 18px; height: 18px; border-radius: 6px;
          border: 1.5px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.05);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s; flex-shrink: 0;
        }
        .checkbox-custom.checked {
          background: linear-gradient(135deg, #00d4b4, #0891b2);
          border-color: transparent;
        }

        .error-shake {
          animation: shake 0.4s ease;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }

        .brand-logo {
          width: 44px; height: 44px; border-radius: 14px;
          background: linear-gradient(135deg, #00d4b4, #0891b2);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 24px rgba(0,212,180,0.3);
          animation: pulse 3s ease-in-out infinite;
        }

        .lp-reveal { opacity: 0; animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      <div className="lp-root" style={{
        minHeight: "100vh",
        display: "flex",
        background: "linear-gradient(135deg, #020b16 0%, #041424 40%, #03101e 100%)",
        overflow: "hidden",
        position: "relative",
      }}>

        {/* Scanline overlay */}
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
        }} />

        {/* Ambient glow blobs */}
        <div style={{
          position: "fixed", top: "-10%", left: "-5%",
          width: 600, height: 600,
          background: "radial-gradient(circle, rgba(0,212,180,0.07) 0%, transparent 65%)",
          pointerEvents: "none", zIndex: 0,
        }} />
        <div style={{
          position: "fixed", bottom: "-15%", right: "-5%",
          width: 500, height: 500,
          background: "radial-gradient(circle, rgba(8,145,178,0.08) 0%, transparent 65%)",
          pointerEvents: "none", zIndex: 0,
        }} />

        {/* LEFT PANEL */}
        <div className="hidden lg:flex" style={{
          width: "52%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 64px",
          overflow: "hidden",
        }}>
          {/* Particle canvas */}
          <canvas ref={canvasRef} style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            pointerEvents: "none",
          }} />

          {/* Grid */}
          <div style={{
            position: "absolute", inset: 0, opacity: 0.04,
            backgroundImage: `
              linear-gradient(rgba(0,212,180,1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,212,180,1) 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
          }} />

          <div style={{ position: "relative", zIndex: 1, maxWidth: 400, width: "100%" }}>

            {/* Brand */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 48 }}>
              <div className="brand-logo">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#04121f" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 20, fontWeight: 800, color: "white", letterSpacing: "-0.02em",
              }}>
                API<span style={{ color: "#00d4b4" }}>Manager</span>
              </span>
            </div>

            {/* Headline */}
            <h2 style={{
              fontSize: 46, fontWeight: 800, lineHeight: 1.05,
              color: "white", marginBottom: 16, letterSpacing: "-0.03em",
            }}>
              The platform<br />
              <span style={{
                backgroundImage: "linear-gradient(90deg, #00d4b4, #38bdf8, #818cf8)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                backgroundSize: "200%",
              }}>
                APIs love.
              </span>
            </h2>

            <p style={{
              color: "rgba(255,255,255,0.4)", fontSize: 15, lineHeight: 1.7,
              marginBottom: 44, fontWeight: 300, maxWidth: 340,
            }}>
              Publish, monetize & observe every API across your organization with sub-5ms latency gateway infrastructure.
            </p>

            {/* Stats */}
            <div style={{ display: "flex", gap: 14, marginBottom: 40 }}>
              {[
                { val: "99.9%", label: "Uptime SLA", delay: "0s" },
                { val: "<5ms", label: "P99 Latency", delay: "0.15s" },
                { val: "10M+", label: "API calls/day", delay: "0.3s" },
              ].map((s) => (
                <div key={s.label} className="stat-chip" style={{ animationDelay: s.delay, flex: 1 }}>
                  <div style={{
                    fontSize: 20, fontWeight: 800, color: "#00d4b4",
                    letterSpacing: "-0.02em", lineHeight: 1,
                  }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 4, fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Feature tags */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["Rate Limiting", "OAuth2", "Analytics", "Versioning", "Webhooks", "Gateway", "SDK Gen"].map((f) => (
                <span key={f} className="feature-tag">{f}</span>
              ))}
            </div>

            {/* Floating card widget */}
            <div style={{
              marginTop: 40,
              background: "rgba(0,212,180,0.05)",
              border: "1px solid rgba(0,212,180,0.15)",
              borderRadius: 16,
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              animation: "floatY 5s ease-in-out infinite 1s",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: "rgba(0,212,180,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#00d4b4" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "white" }}>Enterprise Security</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>SOC2 Type II · GDPR · HIPAA compliant</div>
              </div>
              <div style={{
                marginLeft: "auto", fontSize: 10, fontWeight: 700,
                color: "#00d4b4", background: "rgba(0,212,180,0.12)",
                padding: "4px 10px", borderRadius: 20, border: "1px solid rgba(0,212,180,0.2)",
              }}>CERTIFIED</div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — Form */}
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 40px",
          position: "relative",
          zIndex: 1,
        }}>
          {mounted && (
            <div style={{ width: "100%", maxWidth: 420 }}>

              {/* Glass card */}
              <div className="card-glass lp-reveal" style={{
                padding: "44px 40px",
                animationDelay: "0.1s",
              }}>
                {/* Mobile logo */}
                <div className="lg:hidden" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
                  <div className="brand-logo" style={{ width: 36, height: 36, borderRadius: 10 }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#04121f" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "white" }}>
                    API<span style={{ color: "#00d4b4" }}>Manager</span>
                  </span>
                </div>

                {/* Heading */}
                <div className="lp-reveal" style={{ marginBottom: 32, animationDelay: "0.15s" }}>
                  <h1 style={{
                    fontSize: 28, fontWeight: 800, color: "white",
                    letterSpacing: "-0.02em", marginBottom: 8,
                  }}>Welcome back 👋</h1>
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14 }}>
                    Sign in to continue to your workspace
                  </p>
                </div>

                {/* Social buttons */}
                {/* <div className="lp-reveal" style={{ display: "flex", gap: 10, marginBottom: 20, animationDelay: "0.2s" }}>
                  <button className="social-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </button>
                  <button className="social-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                  </button>
                </div> */}

                <div className="divider lp-reveal" style={{ animationDelay: "0.22s" }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 500, whiteSpace: "nowrap" }}> continue with email</span>
                </div>

                {/* Error */}
                {error && (
                  <div className="error-shake" style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: "#f87171",
                    borderRadius: 12, padding: "12px 16px",
                    fontSize: 13, marginBottom: 16, marginTop: 8,
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
                    </svg>
                    {error}
                  </div>
                )}

                {/* Form fields */}
                <div className="lp-reveal" style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14, animationDelay: "0.25s" }}>
                  <div>
                    <label style={{
                      fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)",
                      textTransform: "uppercase", letterSpacing: "0.1em",
                      display: "block", marginBottom: 8,
                    }}>Email</label>
                    <div className="input-wrap">
                      <svg className="input-icon" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <input
                        type="email" value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="input-purity"
                        style={{ paddingRight: "16px" }}
                      />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <label style={{
                        fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)",
                        textTransform: "uppercase", letterSpacing: "0.1em",
                      }}>Password</label>
                      <a href="#" style={{ fontSize: 12, color: "#00d4b4", fontWeight: 600, textDecoration: "none" }}>
                        Forgot?
                      </a>
                    </div>
                    <div className="input-wrap">
                      <svg className="input-icon" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <input
                        type={showPass ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                        placeholder="••••••••••"
                        className="input-purity"
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
                  </div>

                  {/* Remember me */}
                  <RememberMe />

                  {/* Submit */}
                  <button onClick={handleLogin} disabled={loading} className="btn-primary" style={{ marginTop: 4 }}>
                    {loading ? (
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <span style={{
                          width: 16, height: 16,
                          border: "2.5px solid rgba(4,18,31,0.3)",
                          borderTopColor: "#04121f",
                          borderRadius: "50%",
                          display: "inline-block",
                          animation: "spin 0.7s linear infinite",
                        }} />
                        Signing in…
                      </span>
                    ) : (
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        Sign In
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Footer */}
              <p className="lp-reveal" style={{
                textAlign: "center", color: "rgba(255,255,255,0.3)",
                fontSize: 13, marginTop: 24, animationDelay: "0.4s",
              }}>
                Don't have an account?{" "}
                <Link href="/register" style={{ color: "#00d4b4", fontWeight: 700, textDecoration: "none" }}>
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

// Extracted to avoid inline state issues
function RememberMe() {
  const [checked, setChecked] = useState(false);
  return (
    <label className="checkbox-wrap" onClick={() => setChecked(!checked)}>
      <div className={`checkbox-custom ${checked ? "checked" : ""}`}>
        {checked && (
          <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#04121f" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", userSelect: "none" }}>Remember me</span>
    </label>
  );
}
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register, saveAuth, getHomeRoute } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "DEVELOPER",
    organizationName: "", organizationDomain: "", inviteCode: "",
  });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleRegister = async () => {
    setError("");
    if (!form.name || !form.email || !form.password) {
      setError("All fields are required"); return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters"); return;
    }
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

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));

  const roles = [
    { value: "DEVELOPER",    label: "Developer",    sub: "Use & subscribe to APIs",  icon: "💻", color: "#38bdf8" },
    { value: "API_PROVIDER", label: "API Provider", sub: "Publish & manage APIs",    icon: "⚡", color: "#14e6b9" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .reg-root * { font-family: 'DM Sans', sans-serif; }
        .reg-heading { font-family: 'Syne', sans-serif; }

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
        @keyframes floatOrb {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes gridDrift {
          0% { transform: translateY(0); }
          100% { transform: translateY(40px); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .animate-slideUp { animation: slideUp 0.6s cubic-bezier(0.16,1,0.3,1) both; }

        .input-dark {
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.1);
          color: white;
          border-radius: 12px;
          padding: 13px 16px;
          font-size: 14px;
          width: 100%;
          outline: none;
          transition: all 0.25s ease;
          font-family: 'DM Sans', sans-serif;
          box-sizing: border-box;
        }
        .input-dark::placeholder { color: rgba(255,255,255,0.25); }
        .input-dark:focus {
          border-color: rgba(20,230,185,0.5);
          background: rgba(255,255,255,0.08);
          box-shadow: 0 0 0 3px rgba(20,230,185,0.1);
        }

        .role-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border-radius: 14px;
          border: 1.5px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .role-card:hover {
          border-color: rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.07);
        }
        .role-card.selected-dev {
          border-color: rgba(56,189,248,0.5);
          background: rgba(56,189,248,0.08);
        }
        .role-card.selected-prov {
          border-color: rgba(20,230,185,0.5);
          background: rgba(20,230,185,0.08);
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
          box-shadow: 0 12px 40px rgba(20,230,185,0.35);
        }
        .btn-glow:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .btn-glow::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          background-size: 200%;
          animation: shimmer 2.5s infinite;
        }

        .org-section {
          background: rgba(20,230,185,0.05);
          border: 1px solid rgba(20,230,185,0.15);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          animation: fadeIn 0.3s ease;
        }

        .invite-section {
          animation: fadeIn 0.3s ease;
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(20,230,185,0.2); border-radius: 4px; }
      `}</style>

      <div className="reg-root" style={{
        minHeight: "100vh",
        display: "flex",
        background: "#040d1a",
        overflow: "hidden",
      }}>

        {/* LEFT — info panel */}
        <div style={{
          width: "44%",
          position: "relative",
          background: "linear-gradient(160deg, #040d1a 0%, #071428 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 48px",
          overflow: "hidden",
          borderRight: "1px solid rgba(255,255,255,0.05)",
        }} className="hidden lg:flex">

          {/* Grid */}
          <div style={{
            position: "absolute", inset: 0, opacity: 0.05,
            backgroundImage: `linear-gradient(rgba(20,230,185,0.5) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(20,230,185,0.5) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
            animation: "gridDrift 10s linear infinite alternate",
          }} />

          {/* Orbs */}
          <div style={{
            position: "absolute", top: "8%", right: "5%",
            width: 250, height: 250,
            background: "radial-gradient(circle, rgba(20,230,185,0.12) 0%, transparent 70%)",
            borderRadius: "50%",
            animation: "floatOrb 9s ease-in-out infinite",
          }} />
          <div style={{
            position: "absolute", bottom: "10%", left: "0%",
            width: 180, height: 180,
            background: "radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%)",
            borderRadius: "50%",
            animation: "floatOrb 11s ease-in-out infinite 3s",
          }} />

          <div style={{ position: "relative", zIndex: 1, width: "100%" }}>
            <div style={{
              width: 56, height: 56,
              background: "linear-gradient(135deg, rgba(20,230,185,0.15), rgba(56,189,248,0.15))",
              border: "1px solid rgba(20,230,185,0.25)",
              borderRadius: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 28,
              boxShadow: "0 0 30px rgba(20,230,185,0.08)",
            }}>
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="rgba(20,230,185,0.8)" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>

            <h2 className="reg-heading" style={{
              fontSize: 36, fontWeight: 800, color: "white",
              lineHeight: 1.1, marginBottom: 14, letterSpacing: "-0.02em",
            }}>
              Start building<br />
              <span style={{
                background: "linear-gradient(90deg, #14e6b9, #38bdf8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>something great.</span>
            </h2>

            <p style={{
              color: "rgba(255,255,255,0.4)", fontSize: 13,
              lineHeight: 1.7, marginBottom: 36, fontWeight: 300,
            }}>
              Join thousands of developers and organizations managing their API ecosystems.
            </p>

            {/* Role cards info */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { icon: "💻", title: "Developer", desc: "Discover APIs, subscribe, manage keys & monitor usage", color: "#38bdf8" },
                { icon: "⚡", title: "API Provider", desc: "Publish APIs, set rate limits, track consumer analytics", color: "#14e6b9" },
              ].map((r) => (
                <div key={r.title} style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 14,
                  padding: "16px 18px",
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: `${r.color}18`,
                    border: `1px solid ${r.color}30`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18,
                  }}>{r.icon}</div>
                  <div>
                    <div className="reg-heading" style={{ fontSize: 13, fontWeight: 700, color: "white", marginBottom: 3 }}>{r.title}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{r.desc}</div>
                  </div>
                </div>
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
          padding: "40px 40px",
          background: "linear-gradient(160deg, #071428 0%, #040d1a 100%)",
          overflowY: "auto",
        }}>
          <div style={{
            width: "100%", maxWidth: 420,
            opacity: mounted ? 1 : 0,
            animation: mounted ? "slideUp 0.7s cubic-bezier(0.16,1,0.3,1) both" : "none",
            padding: "8px 0",
          }}>

            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: "linear-gradient(135deg, #14e6b9, #0891b2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 14px rgba(20,230,185,0.3)",
              }}>
                <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="reg-heading" style={{ fontSize: 17, fontWeight: 700, color: "white" }}>
                API<span style={{ color: "#14e6b9" }}>Manager</span>
              </span>
            </div>

            <h1 className="reg-heading" style={{
              fontSize: 28, fontWeight: 800, color: "white",
              marginBottom: 6, letterSpacing: "-0.02em",
            }}>Create Account</h1>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, marginBottom: 28 }}>
              Fill in your details to get started
            </p>

            {error && (
              <div style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "#f87171", borderRadius: 12,
                padding: "12px 16px", fontSize: 13, marginBottom: 20,
                animation: "fadeIn 0.3s ease",
              }}>{error}</div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Name + Email row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 7 }}>Full Name</label>
                  <input type="text" value={form.name} onChange={set("name")} placeholder="John Doe" className="input-dark" />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 7 }}>Email</label>
                  <input type="email" value={form.email} onChange={set("email")} placeholder="you@co.com" className="input-dark" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 7 }}>Password</label>
                <input type="password" value={form.password} onChange={set("password")} placeholder="Min. 8 characters"
                  onKeyDown={(e) => e.key === "Enter" && handleRegister()} className="input-dark" />
              </div>

              {/* Role selector */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 10 }}>I am a…</label>
                <div style={{ display: "flex", gap: 10 }}>
                  {roles.map((r) => (
                    <label key={r.value} className={`role-card ${
                      form.role === r.value
                        ? r.value === "DEVELOPER" ? "selected-dev" : "selected-prov"
                        : ""
                    }`} style={{ flex: 1 }}>
                      <input type="radio" name="role" value={r.value} checked={form.role === r.value}
                        onChange={set("role")} style={{ display: "none" }} />
                      <div style={{
                        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                        background: form.role === r.value ? `${r.color}20` : "rgba(255,255,255,0.06)",
                        border: `1px solid ${form.role === r.value ? r.color + "40" : "rgba(255,255,255,0.08)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16, transition: "all 0.2s",
                      }}>{r.icon}</div>
                      <div>
                        <div className="reg-heading" style={{ fontSize: 12, fontWeight: 700, color: form.role === r.value ? "white" : "rgba(255,255,255,0.6)" }}>{r.label}</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1, lineHeight: 1.3 }}>{r.sub}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Org fields */}
              {form.role === "API_PROVIDER" && (
                <div className="org-section">
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#14e6b9", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    ⚡ Organization Details
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 7 }}>
                        Org Name <span style={{ color: "#f87171" }}>*</span>
                      </label>
                      <input type="text" value={form.organizationName} onChange={set("organizationName")}
                        placeholder="Averlon Inc." className="input-dark" />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 7 }}>Domain</label>
                      <input type="text" value={form.organizationDomain} onChange={set("organizationDomain")}
                        placeholder="averlon.com" className="input-dark" />
                    </div>
                  </div>
                </div>
              )}

              {/* Invite code */}
              {form.role === "DEVELOPER" && (
                <div className="invite-section">
                  <label style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 7 }}>
                    Invite Code <span style={{ color: "rgba(255,255,255,0.2)", fontWeight: 400, textTransform: "none" }}>(optional)</span>
                  </label>
                  <input type="text" value={form.inviteCode} onChange={set("inviteCode")}
                    placeholder="e.g. AVE-X7K2" className="input-dark" />
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 6 }}>
                    Without a code you can only view public APIs
                  </p>
                </div>
              )}

              {/* Submit */}
              <button onClick={handleRegister} disabled={loading} className="btn-glow" style={{ marginTop: 4 }}>
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <span style={{
                      width: 15, height: 15,
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "white",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "spin 0.7s linear infinite",
                    }} />
                    Creating account…
                  </span>
                ) : "Create Account →"}
              </button>

            </div>

            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13, marginTop: 24 }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "#14e6b9", fontWeight: 600, textDecoration: "none" }}>
                Sign in
              </Link>
            </p>

          </div>
        </div>

      </div>
    </>
  );
}
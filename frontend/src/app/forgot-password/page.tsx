"use client";
import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #020b16 0%, #041424 40%, #03101e 100%)",
      fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "24px",
    }}>
      <div style={{
        width: "100%", maxWidth: 420,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(24px)",
        borderRadius: 24, padding: "44px 40px",
      }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "linear-gradient(135deg, #00d4b4, #0891b2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#04121f" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, color: "white" }}>
            API<span style={{ color: "#00d4b4" }}>Manager</span>
          </span>
        </div>

        {sent ? (
          /* ── Success state ── */
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "rgba(0,212,180,0.1)",
              border: "1px solid rgba(0,212,180,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#00d4b4" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "white", marginBottom: 10 }}>Check your inbox</h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
              If <strong style={{ color: "white" }}>{email}</strong> is registered,
              a password reset link has been sent. Check your spam folder too.
            </p>
            <Link href="/login" style={{
              display: "inline-block", padding: "12px 28px",
              background: "linear-gradient(135deg, #00d4b4, #0891b2)",
              color: "#04121f", borderRadius: 12, fontWeight: 700,
              fontSize: 14, textDecoration: "none",
            }}>
              Back to Login
            </Link>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "white", marginBottom: 8, letterSpacing: "-0.02em" }}>
              Forgot password?
            </h1>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
              Enter your email and we'll send you a reset link.
            </p>

            {error && (
              <div style={{
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                color: "#f87171", borderRadius: 12, padding: "12px 16px",
                fontSize: 13, marginBottom: 16,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
                </svg>
                {error}
              </div>
            )}

            <label style={{
              fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase", letterSpacing: "0.1em",
              display: "block", marginBottom: 8,
            }}>Email</label>

            <div style={{ position: "relative", marginBottom: 20 }}>
              <svg style={{
                position: "absolute", left: 14, top: "50%",
                transform: "translateY(-50%)", opacity: 0.35, pointerEvents: "none",
              }} width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <input
                type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="you@company.com"
                style={{
                  width: "100%", background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14,
                  padding: "14px 16px 14px 44px", fontSize: 14, color: "white",
                  outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                  caretColor: "#00d4b4",
                }}
              />
            </div>

            <button
              onClick={handleSubmit} disabled={loading || !email}
              style={{
                width: "100%", padding: "15px",
                background: "linear-gradient(135deg, #00d4b4, #0891b2)",
                border: "none", borderRadius: 14, color: "#04121f",
                fontWeight: 700, fontSize: 15, cursor: loading || !email ? "not-allowed" : "pointer",
                opacity: loading || !email ? 0.5 : 1,
                fontFamily: "inherit",
              }}
            >
              {loading ? "Sending…" : "Send Reset Link"}
            </button>

            <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
              Remember it?{" "}
              <Link href="/login" style={{ color: "#00d4b4", fontWeight: 700, textDecoration: "none" }}>
                Back to Login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
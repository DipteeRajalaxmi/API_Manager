"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPassword } from "@/lib/auth";

// ── Moved OUTSIDE to fix re-focus bug ─────────────────────────────────────────
const PasswordInput = ({
  label, value, show, onToggle, onChange, placeholder,
}: {
  label: string; value: string; show: boolean;
  onToggle: () => void; onChange: (v: string) => void; placeholder: string;
}) => (
  <div style={{ marginBottom: 18 }}>
    <label style={{
      fontSize: 11, fontWeight: 700, color: "#94a3b8",
      textTransform: "uppercase", letterSpacing: "0.08em",
      display: "block", marginBottom: 7,
    }}>{label}</label>
    <div style={{ position: "relative" }}>
      <svg style={{
        position: "absolute", left: 14, top: "50%",
        transform: "translateY(-50%)", opacity: 0.4, pointerEvents: "none",
      }} width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#64748b" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          background: "#f8fafc",
          border: "1.5px solid #e2e8f0",
          borderRadius: 12,
          padding: "13px 44px 13px 44px",
          fontSize: 14,
          color: "#1e293b",
          outline: "none",
          fontFamily: "inherit",
          boxSizing: "border-box" as const,
          transition: "border-color 0.2s, box-shadow 0.2s",
        }}
        onFocus={e => {
          e.target.style.borderColor = "#2dd4bf";
          e.target.style.boxShadow = "0 0 0 3px rgba(45,212,191,0.12)";
        }}
        onBlur={e => {
          e.target.style.borderColor = "#e2e8f0";
          e.target.style.boxShadow = "none";
        }}
      />
      <button
        type="button"
        onClick={onToggle}
        style={{
          position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", cursor: "pointer",
          color: "#94a3b8", padding: 4, display: "flex", alignItems: "center",
        }}
      >
        {show ? (
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        ) : (
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
    </div>
  </div>
);

// ── Main Form ─────────────────────────────────────────────────────────────────
function ResetPasswordForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [success,     setSuccess]     = useState(false);

  useEffect(() => {
    if (!token) setError("Invalid or missing reset link. Please request a new one.");
  }, [token]);

  const handleReset = async () => {
    setError("");
    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (newPassword !== confirmPass) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid or expired link. Please request a new one.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(45,212,191,0.3); }
          50%       { box-shadow: 0 0 0 10px rgba(45,212,191,0); }
        }
        @keyframes checkPop {
          0%   { transform: scale(0.5); opacity: 0; }
          70%  { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }

        .rp-card {
          animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
        }
        .rp-badge {
          animation: checkPop 0.5s cubic-bezier(0.16,1,0.3,1) both;
          animation-delay: 0.1s;
        }
      `}</style>

      <div style={{
        minHeight: "100vh",
        display: "flex",
        background: "linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 50%, #f8fafc 100%)",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}>

        {/* Background decoration */}
        <div style={{
          position: "fixed", top: -120, right: -120,
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(45,212,191,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "fixed", bottom: -100, left: -80,
          width: 350, height: 350, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(56,189,248,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Center card */}
        <div style={{
          flex: 1, display: "flex",
          alignItems: "center", justifyContent: "center",
          padding: "32px 24px",
        }}>
          <div className="rp-card" style={{
            width: "100%", maxWidth: 440,
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(20px)",
            border: "1.5px solid rgba(255,255,255,0.9)",
            borderRadius: 24,
            boxShadow: "0 20px 60px rgba(15,23,42,0.08), 0 4px 16px rgba(15,23,42,0.04)",
            padding: "44px 40px",
          }}>

            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 13,
                background: "linear-gradient(135deg, #2dd4bf, #0891b2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 6px 20px rgba(45,212,191,0.35)",
                animation: "pulse 3s ease-in-out infinite",
              }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
                  API<span style={{ color: "#0891b2" }}>Manager</span>
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500, letterSpacing: "0.05em" }}>
                  SECURE ACCOUNT RECOVERY
                </div>
              </div>
            </div>

            {success ? (
              /* ── Success state ── */
              <div style={{ textAlign: "center", padding: "12px 0" }}>
                <div className="rp-badge" style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "linear-gradient(135deg, #2dd4bf, #0891b2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 20px",
                  boxShadow: "0 8px 24px rgba(45,212,191,0.35)",
                }}>
                  <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 10 }}>
                  Password Updated!
                </h2>
                <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
                  Your password has been reset successfully.<br />
                  Redirecting to login in 3 seconds…
                </p>
                <div style={{
                  width: "100%", height: 4, borderRadius: 999,
                  background: "#e2e8f0", overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%", borderRadius: 999,
                    background: "linear-gradient(90deg, #2dd4bf, #0891b2)",
                    animation: "progressBar 3s linear forwards",
                  }} />
                </div>
                <style>{`
                  @keyframes progressBar {
                    from { width: 0%; }
                    to   { width: 100%; }
                  }
                `}</style>
              </div>
            ) : (
              /* ── Form state ── */
              <>
                {/* Header */}
                <div style={{ marginBottom: 28 }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.2)",
                    borderRadius: 20, padding: "5px 12px", marginBottom: 14,
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2dd4bf" }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#0891b2" }}>Password Reset</span>
                  </div>
                  <h1 style={{
                    fontSize: 26, fontWeight: 800, color: "#0f172a",
                    letterSpacing: "-0.02em", marginBottom: 6,
                  }}>
                    Set new password
                  </h1>
                  <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6 }}>
                    Must be at least 8 characters long.
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div style={{
                    background: "#fef2f2", border: "1.5px solid #fecaca",
                    color: "#dc2626", borderRadius: 12, padding: "12px 16px",
                    fontSize: 13, marginBottom: 20,
                    display: "flex", alignItems: "flex-start", gap: 10,
                  }}>
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }}>
                      <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
                    </svg>
                    {error}
                  </div>
                )}

                {/* Inputs — PasswordInput is defined OUTSIDE so no re-mount on keystroke */}
                <PasswordInput
                  label="New Password" value={newPassword} show={showNew}
                  onToggle={() => setShowNew(p => !p)}
                  onChange={setNewPassword} placeholder="Min. 8 characters"
                />
                <PasswordInput
                  label="Confirm Password" value={confirmPass} show={showConfirm}
                  onToggle={() => setShowConfirm(p => !p)}
                  onChange={setConfirmPass} placeholder="Repeat new password"
                />

                {/* Password match indicator */}
                {confirmPass.length > 0 && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    marginBottom: 20, marginTop: -8,
                  }}>
                    {newPassword === confirmPass ? (
                      <>
                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>Passwords match</span>
                      </>
                    ) : (
                      <>
                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#dc2626" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600 }}>Passwords don't match</span>
                      </>
                    )}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={loading || !newPassword || !confirmPass || !token}
                  style={{
                    width: "100%", padding: "14px",
                    background: loading || !newPassword || !confirmPass || !token
                      ? "#e2e8f0"
                      : "linear-gradient(135deg, #2dd4bf, #0891b2)",
                    border: "none", borderRadius: 13,
                    color: loading || !newPassword || !confirmPass || !token ? "#94a3b8" : "white",
                    fontWeight: 700, fontSize: 15, fontFamily: "inherit",
                    cursor: loading || !newPassword || !confirmPass || !token ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    boxShadow: loading || !newPassword || !confirmPass || !token
                      ? "none"
                      : "0 8px 24px rgba(45,212,191,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  {loading ? (
                    <>
                      <span style={{
                        width: 16, height: 16,
                        border: "2.5px solid rgba(255,255,255,0.3)",
                        borderTopColor: "white", borderRadius: "50%",
                        display: "inline-block",
                        animation: "spin 0.7s linear infinite",
                      }} />
                      Updating…
                    </>
                  ) : (
                    <>
                      Update Password
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>

                {/* Back link */}
                <p style={{ textAlign: "center", marginTop: 22, fontSize: 13, color: "#94a3b8" }}>
                  <Link href="/login" style={{
                    color: "#0891b2", fontWeight: 700, textDecoration: "none",
                    display: "inline-flex", alignItems: "center", gap: 4,
                  }}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                    </svg>
                    Back to Login
                  </Link>
                </p>
              </>
            )}
          </div>

          {/* Footer */}
          <p style={{
            position: "fixed", bottom: 20,
            fontSize: 12, color: "#94a3b8", textAlign: "center", width: "100%",
          }}>
            © 2026 APIManager · Secured with SHA-256
          </p>
        </div>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
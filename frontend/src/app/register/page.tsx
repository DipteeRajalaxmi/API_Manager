"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register, saveAuth, getHomeRoute } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
  name: "", email: "", password: "", role: "DEVELOPER",
  organizationName: "", organizationDomain: "", inviteCode: "",
});
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

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
        form.email,
        form.password,
        form.name,
        form.role,
        form.organizationName,
        form.organizationDomain,
        form.inviteCode
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
    { value: "DEVELOPER",    label: "Developer",    sub: "I want to use APIs",     icon: "💻" },
    { value: "API_PROVIDER", label: "API Provider", sub: "I want to publish APIs", icon: "⚡" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left — teal panel */}
      <div className="hidden lg:flex w-1/2 grad-teal items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 -translate-x-1/3" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 translate-x-1/4" />

        <div className="relative text-center text-white">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold mb-3">Join APIManager</h2>
          <p className="text-white/80 text-sm max-w-xs leading-relaxed">
            Create your account and start building or publishing APIs today.
          </p>

          {/* role cards */}
          <div className="flex flex-col gap-3 mt-8 text-left">
            <div className="bg-white/15 backdrop-blur rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xl">💻</span>
                <span className="font-bold text-sm">Developer</span>
              </div>
              <p className="text-white/70 text-xs pl-8">Discover & subscribe to APIs, manage apps and keys</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xl">⚡</span>
                <span className="font-bold text-sm">API Provider</span>
              </div>
              <p className="text-white/70 text-xs pl-8">Publish APIs, manage lifecycle, track usage</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl grad-teal flex items-center justify-center shadow">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-extrabold text-gray-800 text-lg">
              API<span className="text-teal-500">Manager</span>
            </span>
          </div>

          <h1 className="text-2xl font-extrabold text-gray-800 mb-1">Create Account</h1>
          <p className="text-gray-400 text-sm mb-8">Fill in your details to get started</p>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-500 rounded-xl px-4 py-3 mb-5 text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-4">
            {/* Name */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Full Name</label>
              <input type="text" value={form.name} onChange={set("name")} placeholder="John Doe"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800
                  placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all" />
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800
                  placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all" />
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Password</label>
              <input type="password" value={form.password} onChange={set("password")} placeholder="Min. 8 characters"
                onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800
                  placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all" />
            </div>

            {/* Role selector */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">I am a…</label>
              <div className="flex flex-col gap-2">
                {roles.map((r) => (
                  <label key={r.value}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                      ${form.role === r.value
                        ? "border-teal-400 bg-teal-50"
                        : "border-gray-200 bg-white hover:border-gray-300"}`}>
                    <input type="radio" name="role" value={r.value} checked={form.role === r.value}
                      onChange={set("role")} className="accent-teal-500" />
                    <span className="text-lg">{r.icon}</span>
                    <div>
                      <div className="text-sm font-semibold text-gray-800">{r.label}</div>
                      <div className="text-xs text-gray-400">{r.sub}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Org fields — shown only for API_PROVIDER */}
            {form.role === "API_PROVIDER" && (
              <div className="flex flex-col gap-4 p-4 bg-teal-50 rounded-xl border border-teal-100">
                <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Organization Details</p>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Organization Name <span className="text-red-400">*</span>
                  </label>
                  <input type="text" value={form.organizationName} onChange={set("organizationName")}
                    placeholder="e.g. Averlon Inc."
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800
                      placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Domain <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input type="text" value={form.organizationDomain} onChange={set("organizationDomain")}
                    placeholder="e.g. averlon.com"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800
                      placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all" />
                </div>
              </div>
            )}

            {/* Invite code — shown only for DEVELOPER */}
            {form.role === "DEVELOPER" && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Invite Code <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input type="text" value={form.inviteCode} onChange={set("inviteCode")}
                  placeholder="e.g. AVE-X7K2 — leave blank if independent"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800
                    placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all" />
                <p className="text-xs text-gray-400 mt-1">Without a code you can only view public APIs</p>
              </div>
            )}

            <button onClick={handleRegister} disabled={loading}
              className="w-full grad-teal text-white font-semibold rounded-xl py-3 text-sm mt-1
                shadow-md shadow-teal-200 hover:opacity-90 disabled:opacity-50 transition-all">
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </div>

          <p className="text-center text-gray-400 text-sm mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-teal-500 hover:text-teal-600 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
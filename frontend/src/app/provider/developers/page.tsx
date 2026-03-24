"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/lib/api";
import { UserResponse } from "@/types/auth";
import { getOrgDevelopers, addDeveloperToOrg } from "@/lib/users";


export default function DevelopersPage() {
  const router = useRouter();
  const [developers, setDevelopers] = useState<UserResponse[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [addModal, setAddModal]     = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", password: "" });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError]     = useState("");

  const loadDevelopers = () => {
    setLoading(true);
    getOrgDevelopers()
      .then(setDevelopers)
      .catch(console.error)
      .finally(() => setLoading(false));
  };
  useEffect(() => { loadDevelopers(); }, []);

  const handleAddDeveloper = async () => {
    if (!addForm.name || !addForm.email || !addForm.password) {
      setAddError("All fields are required"); return;
    }
    if (addForm.password.length < 8) {
      setAddError("Password must be at least 8 characters"); return;
    }
    setAddLoading(true); setAddError("");
    try {
      await addDeveloperToOrg(addForm.name, addForm.email, addForm.password);
      setAddModal(false);
      setAddForm({ name: "", email: "", password: "" });
      loadDevelopers();
    } catch (e: any) {
      setAddError(e.response?.data?.error || "Failed to add developer");
    } finally { setAddLoading(false); }
  };

  const filtered = developers.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.email?.toLowerCase().includes(search.toLowerCase())
  );

  const active   = developers.filter(d => d.status === "active").length;
  const inactive = developers.filter(d => d.status !== "active").length;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 md:p-10 animate-fade-in">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-10">
          <div>
            <span className="inline-flex items-center gap-1.5 text-teal-600 text-xs font-bold tracking-widest uppercase mb-3
              bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              Organization
            </span>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">Developers</h1>
            <p className="text-gray-400 text-sm mt-1.5 font-medium">All developers in your organization</p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="bg-white border border-emerald-100 rounded-2xl px-5 py-3 text-center shadow-sm">
              <p className="text-2xl font-black text-emerald-500">{active}</p>
              <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Active</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl px-5 py-3 text-center shadow-sm">
              <p className="text-2xl font-black text-gray-400">{inactive}</p>
              <p className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider">Inactive</p>
            </div>
            <div className="bg-teal-500 border border-teal-500 rounded-2xl px-5 py-3 text-center shadow-lg shadow-teal-500/20">
              <p className="text-2xl font-black text-white">{developers.length}</p>
              <p className="text-[11px] font-semibold text-teal-100 uppercase tracking-wider">Total</p>
            </div>
          </div>
        </div>

        {/* ── Invite Banner ───────────────────────────────── */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl p-5 mb-6
          flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-lg shadow-teal-500/20">
          <div>
            <p className="text-sm font-bold text-white mb-0.5">
              👥 Invite developers to your organization
            </p>
            <p className="text-xs text-teal-100/80">
              Share your invite code from Settings — developers register with it to join your org
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setAddModal(true)}
              className="bg-white text-teal-600 text-xs font-bold px-4 py-2 rounded-xl
                hover:bg-teal-50 transition-all shadow-sm whitespace-nowrap">
              + Add Developer
            </button>
            <a href="/provider/settings"
              className="bg-white/20 border border-white/30 text-white text-xs font-bold
                px-4 py-2 rounded-xl transition-all hover:bg-white/30 whitespace-nowrap">
              View Invite Code →
            </a>
          </div>
        </div>

        {/* ── Search ─────────────────────────────────────── */}
        <div className="bg-white border border-gray-100 rounded-2xl p-3 mb-6 shadow-sm">
          <div className="relative">
            <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm
                text-gray-700 placeholder-gray-400 focus:outline-none focus:border-teal-400
                focus:ring-2 focus:ring-teal-100 transition-all"
            />
          </div>
        </div>

        {/* ── Loading Skeleton ────────────────────────────── */}
        {loading ? (
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-50 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-3.5 bg-gray-200 rounded w-1/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
                <div className="h-3 bg-gray-100 rounded w-1/5" />
                <div className="h-6 bg-gray-100 rounded-full w-16" />
                <div className="h-7 bg-gray-100 rounded-xl w-24" />
              </div>
            ))}
          </div>

        ) : filtered.length === 0 ? (
          /* ── Empty State ──────────────────────────────── */
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-20 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-600 mb-1">
              {search ? "No developers match your search" : "No developers yet"}
            </h3>
            <p className="text-gray-400 text-sm">
              {search ? "Try a different search term" : "Share your invite code with developers to get them onboard"}
            </p>
          </div>

        ) : (
          /* ── Table ────────────────────────────────────── */
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3.5 bg-gray-50 border-b border-gray-100
              text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              <div className="col-span-3">Developer</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-2">Joined</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1">Last Login</div>
              <div className="col-span-1 text-right">Action</div>
            </div>

            <div className="divide-y divide-gray-50">
              {filtered.map((dev, idx) => (
                <div
                  key={dev.userId}
                  onClick={() => router.push(`/provider/developers/${dev.userId}`)}
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center
                    hover:bg-teal-50/40 hover:border-l-2 hover:border-l-teal-400
                    transition-all duration-150 cursor-pointer group"
                >
                  {/* Avatar + Name */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500
                      flex items-center justify-center text-white text-sm font-black flex-shrink-0 shadow-sm">
                      {dev.name?.[0]?.toUpperCase() ?? "D"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate group-hover:text-teal-700 transition-colors">
                        {dev.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{dev.orgName}</p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="col-span-3">
                    <p className="text-xs text-gray-500 truncate">{dev.email}</p>
                  </div>

                  {/* Joined */}
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400">
                      {dev.createdAt
                        ? new Date(dev.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                        : "—"}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border
                      ${dev.status === "active"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                        : "bg-red-50 text-red-500 border-red-200"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                        ${dev.status === "active" ? "bg-emerald-500" : "bg-red-400"}`} />
                      {dev.status}
                    </span>
                  </div>

                  {/* Last Login */}
                  <div className="col-span-1">
                    <p className="text-xs text-gray-400">
                      {dev.lastLoginAt
                        ? new Date(dev.lastLoginAt).toLocaleString("en-IN", {
                            day: "numeric", month: "short",
                            hour: "2-digit", minute: "2-digit", hour12: true,
                          })
                        : "Never"}
                    </p>
                  </div>

                  {/* View Profile */}
                  <div className="col-span-1 flex justify-end">
                    <Link
                      href={`/provider/developers/${dev.userId}`}
                      onClick={e => e.stopPropagation()}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl
                        bg-teal-50 text-teal-600 hover:bg-teal-500 hover:text-white
                        border border-teal-100 hover:border-teal-500
                        transition-all duration-150 whitespace-nowrap shadow-sm"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400 font-medium">
                Showing <span className="text-gray-600 font-bold">{filtered.length}</span> of{" "}
                <span className="text-gray-600 font-bold">{developers.length}</span>{" "}
                developer{developers.length !== 1 ? "s" : ""}
              </p>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="text-xs text-teal-500 font-semibold hover:text-teal-700 transition-colors"
                >
                  Clear search ✕
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Add Developer Modal ─────────────────────────── */}
      {addModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-7 w-full max-w-md shadow-2xl shadow-black/20 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-black text-gray-900">Add Developer</h2>
                <p className="text-xs text-gray-400 mt-0.5">Create a new developer account in your org</p>
              </div>
              <button
                onClick={() => { setAddModal(false); setAddError(""); }}
                className="w-8 h-8 flex items-center justify-center rounded-xl
                  text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all text-lg leading-none">
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {[
                { key: "name",     label: "Full Name", placeholder: "John Doe",          type: "text"     },
                { key: "email",    label: "Email",     placeholder: "john@example.com",  type: "email"    },
                { key: "password", label: "Password",  placeholder: "Min 8 characters",  type: "password" },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                    {label} *
                  </label>
                  <input
                    value={addForm[key as keyof typeof addForm]}
                    onChange={e => setAddForm(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    type={type}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm
                      text-gray-700 placeholder-gray-400
                      focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all"
                  />
                </div>
              ))}

              {addError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                  <span className="text-red-400 text-sm">⚠</span>
                  <p className="text-xs text-red-500 font-semibold">{addError}</p>
                </div>
              )}

              <div className="flex gap-3 mt-1">
                <button
                  onClick={() => { setAddModal(false); setAddError(""); }}
                  className="flex-1 border border-gray-200 text-gray-500 font-bold py-2.5 rounded-xl
                    text-sm hover:bg-gray-50 transition-all">
                  Cancel
                </button>
                <button
                  onClick={handleAddDeveloper}
                  disabled={addLoading}
                  className="flex-1 bg-teal-500 hover:bg-teal-600 disabled:opacity-50
                    text-white font-bold py-2.5 rounded-xl text-sm transition-all
                    shadow-lg shadow-teal-500/25 hover:-translate-y-0.5">
                  {addLoading ? "Adding…" : "Add Developer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
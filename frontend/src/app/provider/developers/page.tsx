"use client";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/lib/api";
import { UserResponse } from "@/types/auth";
import { getOrgDevelopers, addDeveloperToOrg } from "@/lib/users";


export default function DevelopersPage() {
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
    setAddForm({ name: "", email: "" ,password:""});
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
      <div className="p-8 animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-800">Developers</h1>
            <p className="text-gray-400 text-sm mt-1">All developers in your organization</p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3">
            <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2 text-center">
              <p className="text-xl font-extrabold text-green-600">{active}</p>
              <p className="text-xs text-green-500">Active</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-center">
              <p className="text-xl font-extrabold text-gray-500">{inactive}</p>
              <p className="text-xs text-gray-400">Inactive</p>
            </div>
            <div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-2 text-center">
              <p className="text-xl font-extrabold text-teal-600">{developers.length}</p>
              <p className="text-xs text-teal-500">Total</p>
            </div>
          </div>
        </div>

        {/* Invite code reminder */}
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100 rounded-2xl p-5 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-teal-700 mb-0.5">
              👥 Invite developers to your organization
            </p>
            <p className="text-xs text-teal-600/70">
              Share your invite code from Settings → developers register with it to join your org
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setAddModal(true)}
              className="bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold
                px-4 py-2 rounded-xl transition-all">
              + Add Developer
            </button>
            <a href="/provider/settings"
              className="bg-white border border-teal-200 text-teal-600 text-xs font-semibold
                px-4 py-2 rounded-xl transition-all hover:bg-teal-50">
              View Invite Code →
            </a>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <svg className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm
              text-gray-700 placeholder-gray-400 focus:outline-none focus:border-teal-400
              focus:ring-2 focus:ring-teal-100 transition-all"
          />
        </div>

        {loading ? (
          <div className="card overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-50 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-3.5 bg-gray-200 rounded w-1/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-20 text-center">
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
          <div className="card overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100
              text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <div className="col-span-4">Developer</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-2">Joined</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1 text-right">Last Login</div>
            </div>

            <div className="divide-y divide-gray-50">
              {filtered.map(dev => (
                <div key={dev.userId}
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors">

                  {/* Avatar + Name */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400
                      flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {dev.name?.[0]?.toUpperCase() ?? "D"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{dev.name}</p>
                      <p className="text-xs text-gray-400">{dev.orgName}</p>
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
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full
                      ${dev.status === "active"
                        ? "bg-green-50 text-green-600"
                        : "bg-red-50 text-red-500"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full inline-block
                        ${dev.status === "active" ? "bg-green-400" : "bg-red-400"}`} />
                      {dev.status}
                    </span>
                  </div>

                  {/* Last login */}
                  <div className="col-span-1 text-right">
                    <p className="text-xs text-gray-400">
                      {dev.lastLoginAt
                        ? new Date(dev.lastLoginAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: true })
                        : "Never"}
                    </p>
                  </div>

                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
              {filtered.length} developer{filtered.length !== 1 ? "s" : ""} in your organization
            </div>
          </div>
        )}
      </div>

      {addModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-extrabold text-gray-800">Add Developer</h2>
              <button onClick={() => { setAddModal(false); setAddError(""); }}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Full Name *
                </label>
                <input
                  value={addForm.name}
                  onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="John Doe"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                    focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Email *
                </label>
                <input
                  value={addForm.email}
                  onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="john@example.com"
                  type="email"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                    focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Password *
                </label>
                <input
                  value={addForm.password}
                  onChange={e => setAddForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Min 8 characters"
                  type="password"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                    focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              {addError && (
                <p className="text-xs text-red-500 font-semibold">{addError}</p>
              )}

              <button
                onClick={handleAddDeveloper}
                disabled={addLoading}
                className="w-full bg-teal-500 hover:bg-teal-600 disabled:opacity-50
                  text-white font-semibold py-2.5 rounded-xl text-sm transition-all">
                {addLoading ? "Adding…" : "Add Developer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
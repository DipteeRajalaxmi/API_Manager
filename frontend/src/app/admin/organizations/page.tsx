"use client";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import apiClient from "@/lib/api";

interface Org {
  orgId: number;
  orgName: string;
  domain: string | null;
  status: string;
  inviteCode: string | null;
  createdAt: string;
  developerCount: number;
  apiCount: number;
}

export default function AdminOrgsPage() {
  const [orgs,    setOrgs]    = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [copied,  setCopied]  = useState<number | null>(null);

  useEffect(() => {
    apiClient.get("/api/admin/organizations")
      .then(r => setOrgs(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = orgs.filter(o =>
    !search ||
    o.orgName?.toLowerCase().includes(search.toLowerCase()) ||
    o.domain?.toLowerCase().includes(search.toLowerCase())
  );

  const copy = (code: string, id: number) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <DashboardLayout>
      <div className="p-8 animate-fade-in">

        {/* Header */}
        <div className="mb-8">
          <p className="text-teal-500 text-xs font-bold uppercase tracking-wider mb-1">Admin Console</p>
          <h1 className="text-2xl font-extrabold text-gray-800">Organizations</h1>
          <p className="text-gray-400 text-sm mt-1">All registered organizations on the platform</p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or domain…"
              className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm
                text-gray-700 placeholder-gray-400 focus:outline-none focus:border-teal-400
                focus:ring-2 focus:ring-teal-100 transition-all" />
          </div>
          <span className="text-xs text-gray-400 font-medium">
            {filtered.length} organization{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-2xl mb-4" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-20 text-center">
            <div className="text-4xl mb-3 opacity-30">🏢</div>
            <p className="text-gray-400 text-sm">No organizations found</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 stagger">
            {filtered.map(org => (
              <div key={org.orgId} className="card p-6 card-lift">

                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl grad-teal flex items-center justify-center
                    text-white font-extrabold text-lg shadow-md">
                    {org.orgName[0]?.toUpperCase()}
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                    ${org.status === "active"
                      ? "bg-green-50 text-green-600"
                      : "bg-red-50 text-red-500"}`}>
                    {org.status}
                  </span>
                </div>

                {/* Info */}
                <h3 className="font-extrabold text-gray-800 mb-0.5">{org.orgName}</h3>
                <p className="text-xs text-gray-400 mb-4">{org.domain ?? "No domain"}</p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-extrabold text-blue-600">{org.developerCount}</p>
                    <p className="text-xs text-blue-400 font-medium">Developers</p>
                  </div>
                  <div className="bg-teal-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-extrabold text-teal-600">{org.apiCount}</p>
                    <p className="text-xs text-teal-400 font-medium">APIs</p>
                  </div>
                </div>

                {/* Invite code */}
                {org.inviteCode && (
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-0.5">Invite Code</p>
                      <code className="text-sm font-mono font-bold text-gray-700 tracking-wider">
                        {org.inviteCode}
                      </code>
                    </div>
                    <button onClick={() => copy(org.inviteCode!, org.orgId)}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all
                        ${copied === org.orgId
                          ? "bg-green-500 text-white"
                          : "bg-white border border-gray-200 text-gray-500 hover:border-teal-300"}`}>
                      {copied === org.orgId ? "✓" : "Copy"}
                    </button>
                  </div>
                )}

                {/* Footer */}
                <div className="text-xs text-gray-300 pt-2 border-t border-gray-50">
                  Created {fmt(org.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
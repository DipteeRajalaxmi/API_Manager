// ─────────────────────────────────────────────────────────────────────────────
// src/app/marketplace/page.tsx
// ─────────────────────────────────────────────────────────────────────────────

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/ui/Badge";
import { searchApis } from "@/lib/registry";
import { Api } from "@/types/api";

export default function MarketplacePage() {
  const [apis, setApis]       = useState<Api[]>([]);
  const [search, setSearch]   = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    searchApis().then(setApis).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = apis.filter(
    (a) =>
      a.apiName.toLowerCase().includes(search.toLowerCase()) ||
      (a.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Hero */}
        <div className="relative grad-teal rounded-2xl p-8 mb-8 overflow-hidden shadow-lg shadow-teal-200 animate-fade-in">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/10 rounded-full translate-y-1/2" />
          <div className="relative">
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Discover</p>
            <h1 className="text-3xl font-extrabold text-white mb-2">API Marketplace</h1>
            <p className="text-white/80 text-sm max-w-md">Browse and subscribe to published APIs.</p>
            <div className="relative max-w-md mt-5">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 text-sm">🔍</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search APIs…"
                className="w-full bg-white/20 border border-white/30 rounded-xl pl-10 pr-4 py-3 text-sm text-white
                  placeholder-white/60 focus:outline-none focus:border-white/60 transition-all"
              />
            </div>
          </div>
        </div>

        <p className="text-gray-400 text-sm mb-5">
          {loading ? "Loading…" : `${filtered.length} API${filtered.length !== 1 ? "s" : ""} available`}
        </p>

        {loading ? (
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-xl mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-20 text-center">
            <p className="text-gray-400 text-sm">No published APIs found</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 stagger">
            {filtered.map((a) => (
              <Link key={a.apiId} href={`/marketplace/${a.apiId}`} className="card p-6 card-lift block">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl grad-teal flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    {a.apiName[0]?.toUpperCase()}
                  </div>
                  <StatusBadge status={a.status} />
                </div>
                <h3 className="text-gray-800 font-bold mb-1">{a.apiName}</h3>
                <p className="text-gray-400 text-xs line-clamp-2 mb-4 min-h-[32px]">
                  {a.description || "No description provided"}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-teal-600 font-mono text-xs bg-teal-50 border border-teal-100 px-2 py-1 rounded-lg">{a.version}</span>
                  {a.orgName && <span className="text-gray-300 text-xs">{a.orgName}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
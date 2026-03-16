"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/ui/Badge";
import apiClient from "@/lib/api";
import { Api } from "@/types/api";

export default function AdminApisPage() {
  const [apis,    setApis]    = useState<Api[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [status,  setStatus]  = useState("ALL");
  const [vis,     setVis]     = useState("ALL");

  useEffect(() => {
    apiClient.get("/api/admin/apis")
      .then(r => setApis(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = apis.filter(a => {
    const matchSearch = !search ||
      a.apiName?.toLowerCase().includes(search.toLowerCase()) ||
      a.orgName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = status === "ALL" || a.status === status;
    const matchVis    = vis === "ALL" || a.visibility === vis;
    return matchSearch && matchStatus && matchVis;
  });

  const counts = {
    total:      apis.length,
    published:  apis.filter(a => a.status === "published").length,
    draft:      apis.filter(a => a.status === "draft").length,
    deprecated: apis.filter(a => a.status === "deprecated").length,
  };

  const visColor = (v: string) =>
    v === "public"     ? "bg-green-50 text-green-600"   :
    v === "private"    ? "bg-orange-50 text-orange-500" :
                         "bg-purple-50 text-purple-600";

  return (
    <DashboardLayout>
      <div className="p-8 animate-fade-in">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-teal-500 text-xs font-bold uppercase tracking-wider mb-1">Admin Console</p>
            <h1 className="text-2xl font-extrabold text-gray-800">All APIs</h1>
            <p className="text-gray-400 text-sm mt-1">Every API across all organizations</p>
          </div>
          <div className="flex items-center gap-2">
            {[
              { label: "Total",      value: counts.total,      color: "bg-gray-100 text-gray-600" },
              { label: "Published",  value: counts.published,  color: "bg-teal-50 text-teal-700"  },
              { label: "Draft",      value: counts.draft,      color: "bg-gray-100 text-gray-500" },
              { label: "Deprecated", value: counts.deprecated, color: "bg-orange-50 text-orange-600" },
            ].map(p => (
              <div key={p.label} className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${p.color}`}>
                {p.value} {p.label}
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by API name or org…"
              className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm
                text-gray-700 placeholder-gray-400 focus:outline-none focus:border-teal-400
                focus:ring-2 focus:ring-teal-100 transition-all" />
          </div>
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium
              text-gray-700 focus:outline-none focus:border-teal-400 transition-all">
            <option value="ALL">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="deprecated">Deprecated</option>
            <option value="retired">Retired</option>
          </select>
          <select value={vis} onChange={e => setVis(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium
              text-gray-700 focus:outline-none focus:border-teal-400 transition-all">
            <option value="ALL">All Visibility</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="restricted">Restricted</option>
          </select>
          <span className="text-xs text-gray-400 font-medium">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100
            text-xs font-bold text-gray-400 uppercase tracking-wider">
            <div className="col-span-3">API</div>
            <div className="col-span-2">Organization</div>
            <div className="col-span-1">Version</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Visibility</div>
            <div className="col-span-1">Created</div>
            <div className="col-span-1 text-right">View</div>
          </div>

          {loading ? (
            <div className="divide-y divide-gray-50">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4 items-center animate-pulse">
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-xl" />
                    <div className="h-3.5 bg-gray-200 rounded w-24" />
                  </div>
                  <div className="col-span-2"><div className="h-3 bg-gray-100 rounded w-20" /></div>
                  <div className="col-span-1"><div className="h-5 bg-gray-100 rounded w-12" /></div>
                  <div className="col-span-2"><div className="h-5 bg-gray-100 rounded w-20" /></div>
                  <div className="col-span-2"><div className="h-5 bg-gray-100 rounded w-16" /></div>
                  <div className="col-span-1"><div className="h-3 bg-gray-100 rounded w-16" /></div>
                  <div className="col-span-1"><div className="h-7 bg-gray-100 rounded w-12 ml-auto" /></div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-4xl mb-3 opacity-30">🔌</div>
              <p className="text-gray-400 text-sm">No APIs found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map(api => (
                <div key={api.apiId}
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors">

                  {/* API name */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl grad-teal flex items-center justify-center
                      text-white font-bold text-sm flex-shrink-0">
                      {api.apiName[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-gray-800 truncate">{api.apiName}</span>
                  </div>

                  {/* Org */}
                  <div className="col-span-2">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg font-medium">
                      {api.orgName ?? "—"}
                    </span>
                  </div>

                  {/* Version */}
                  <div className="col-span-1">
                    <span className="font-mono text-xs text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-lg">
                      {api.version}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <StatusBadge status={api.status} />
                  </div>

                  {/* Visibility */}
                  <div className="col-span-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${visColor(api.visibility)}`}>
                      {api.visibility}
                    </span>
                  </div>

                  {/* Created */}
                  <div className="col-span-1">
                    <span className="text-xs text-gray-400">
                      {new Date(api.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </div>

                  {/* View */}
                  <div className="col-span-1 flex justify-end">
                    <Link href={`/marketplace/${api.apiId}`}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-50 text-teal-600
                        hover:bg-teal-100 transition-all">
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
              {filtered.length} API{filtered.length !== 1 ? "s" : ""} shown
              {(search || status !== "ALL" || vis !== "ALL") ? ` (filtered from ${apis.length} total)` : ""}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/ui/Badge";
import Toast from "@/components/ui/Toast";
import { getMyApis, publishApi, deprecateApi, retireApi, deleteApi } from "@/lib/registry";
import { Api, ToastState } from "@/types/api";

export default function MyApisPage() {
  const [apis, setApis]     = useState<Api[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [busy, setBusy]     = useState<Record<number, boolean>>({});
  const [toast, setToast]   = useState<ToastState | null>(null);

  const load = useCallback(() => getMyApis().then(setApis).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const show = (message: string, type: ToastState["type"] = "success") => setToast({ message, type });

  const action = async (apiId: number, fn: () => Promise<unknown>, label: string) => {
    setBusy((p) => ({ ...p, [apiId]: true }));
    try { await fn(); show(`API ${label} successfully`); load(); }
    catch (e: any) { show(e.response?.data?.error || `Failed to ${label}`, "error"); }
    setBusy((p) => ({ ...p, [apiId]: false }));
  };

  const handleDelete = async (apiId: number) => {
    if (!confirm("Delete this draft API?")) return;
    try { await deleteApi(apiId); show("API deleted"); load(); }
    catch (e: any) { show(e.response?.data?.error || "Cannot delete", "error"); }
  };

  const filtered = apis.filter(
    (a) =>
      (filter === "all" || a.status === filter) &&
      a.apiName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <p className="text-teal-500 text-sm font-semibold mb-1">API Management</p>
            <h1 className="text-2xl font-extrabold text-gray-800">My APIs</h1>
            <p className="text-gray-400 text-sm mt-1">{apis.length} APIs in your portfolio</p>
          </div>
          <Link href="/provider/apis/new"
            className="grad-teal text-white font-semibold px-5 py-2.5 rounded-xl text-sm
              shadow-md shadow-teal-200 hover:opacity-90 transition-opacity flex items-center gap-2">
            ＋ New API
          </Link>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6 animate-fade-in flex gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search APIs…"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm
                text-gray-700 placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all"
            />
          </div>
          <div className="flex gap-2">
            {["all", "draft", "published", "deprecated", "retired"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all
                  ${filter === f
                    ? "grad-teal text-white shadow-md shadow-teal-200"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="card p-16 text-center animate-fade-in border-2 border-dashed border-gray-200">
            <p className="text-gray-400 text-sm mb-4">
              {search ? "No APIs match your search" : "No APIs yet"}
            </p>
            {!search && (
              <Link href="/provider/apis/new"
                className="grad-teal text-white text-sm font-semibold px-5 py-2.5 rounded-xl inline-block shadow-md shadow-teal-200">
                Create API
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4 stagger">
            {filtered.map((a) => (
              <div key={a.apiId} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl grad-teal flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm">
                    {a.apiName[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-gray-800 font-bold">{a.apiName}</span>
                      <span className="text-teal-600 font-mono text-xs bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-lg">{a.version}</span>
                      <StatusBadge status={a.status} />
                    </div>
                    <p className="text-gray-400 text-sm mt-0.5 truncate">{a.description || "No description"}</p>
                    <p className="text-gray-300 font-mono text-xs mt-0.5">{a.baseUrl}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href={`/provider/apis/${a.apiId}`}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors">
                      Manage
                    </Link>
                    {a.status === "draft" && (
                      <button onClick={() => action(a.apiId, () => publishApi(a.apiId), "published")} disabled={busy[a.apiId]}
                        className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                        {busy[a.apiId] ? "…" : "Publish"}
                      </button>
                    )}
                    {a.status === "published" && (
                      <button onClick={() => action(a.apiId, () => deprecateApi(a.apiId), "deprecated")} disabled={busy[a.apiId]}
                        className="px-3 py-1.5 bg-orange-400 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                        {busy[a.apiId] ? "…" : "Deprecate"}
                      </button>
                    )}
                    {a.status === "deprecated" && (
                      <button onClick={() => action(a.apiId, () => retireApi(a.apiId), "retired")} disabled={busy[a.apiId]}
                        className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                        {busy[a.apiId] ? "…" : "Retire"}
                      </button>
                    )}
                    {a.status === "draft" && (
                      <button onClick={() => handleDelete(a.apiId)}
                        className="px-3 py-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 text-xs font-semibold rounded-lg transition-colors">
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </DashboardLayout>
  );
}
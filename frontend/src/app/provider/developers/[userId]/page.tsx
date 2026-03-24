"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { StatusBadge, MethodBadge } from "@/components/ui/Badge";
import Toast from "@/components/ui/Toast";
import { Button } from "@/components/ui/FormFields";
import { ToastState } from "@/types/api";
import apiClient from "@/lib/api";
import { updateSubscriptionStatus, grantApiAccess } from "@/lib/portal";
import { getMyApis, getEndpoints } from "@/lib/registry";

// ── Interfaces ────────────────────────────────────────────────────────────────

interface EndpointStat {
  path: string;
  method: string;
  callCount: number;
}

interface OrgApi {
  apiId: number;
  apiName: string;
  version: string;
  status: string;
}
interface AllowedEndpoint {
  endpointId: number;
  httpMethod: string;
  path: string;
}

interface ApiEndpointOption {
  endpointId: number;
  httpMethod: string;
  path: string;
  description?: string;
}

interface SubDetail {
  subscriptionId: number;
  apiId: number;
  apiName: string;
  apiStatus: string;
  status: string;
  subscribedAt: string;
  appName: string;
  callsToday: number;
  callsWeek: number;
  endpoints: EndpointStat[];
  allowedEndpoints: AllowedEndpoint[];         
  accessScope: "full" | "restricted";      
}

interface LogEntry {
  requestTime: string;
  method: string;
  path: string;
  status: number;
  statusLabel: string;
  rateLimitType: string | null;
  latency: number;
  rateLimited: boolean;
  apiName: string;
}

interface DevDetail {
  developer: {
    userId: number;
    name: string;
    email: string;
    status: string;
    lastLoginAt: string | null;
    createdAt: string;
  };
  callsToday: number;
  callsWeek: number;
  subscriptions: SubDetail[];
  recentLogs: LogEntry[];
  totalPages?: number;
  totalLogs?: number;
}

type Tab = "subscriptions" | "logs";

// ── Page Component ────────────────────────────────────────────────────────────

export default function DeveloperDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const devId = Number(userId);

  // ── Core state ──────────────────────────────────────────────────────────────
  const [data, setData]             = useState<DevDetail | null>(null);
  const [tab, setTab]               = useState<Tab>("subscriptions");
  const [toast, setToast]           = useState<ToastState | null>(null);
  const [statusBusy, setStatusBusy] = useState<number | null>(null);
  const [expanded, setExpanded]     = useState<number | null>(null);

  const [logPage, setLogPage]             = useState(0);
  const [totalLogPages, setTotalLogPages] = useState(0);
  const [totalLogs, setTotalLogs]         = useState(0);

  // ── Grant modal state ───────────────────────────────────────────────────────
  const [grantModal,      setGrantModal]      = useState(false);
  const [orgApis,         setOrgApis]         = useState<OrgApi[]>([]);
  const [selectedApiId,   setSelectedApiId]   = useState<number | null>(null);
  const [accessType,      setAccessType]      = useState<"full" | "endpoints">("full");
  const [apiEndpoints,    setApiEndpoints]    = useState<ApiEndpointOption[]>([]);
  const [selectedEpIds,   setSelectedEpIds]   = useState<number[]>([]);
  const [loadingEps,      setLoadingEps]      = useState(false);
  const [granting,        setGranting]        = useState(false);
  const [grantResult,     setGrantResult]     = useState<{ apiKey: string; apiName: string } | null>(null);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const show = (message: string, type: ToastState["type"] = "success") =>
    setToast({ message, type });

  const load = useCallback((page = 0) => {
    apiClient.get(`/api/analytics/provider/developer/${devId}?page=${page}`)
      .then(r => {
        setData(r.data);
        setTotalLogPages(r.data.totalPages ?? 0);
        setTotalLogs(r.data.totalLogs ?? 0);
      })
      .catch(() => router.push("/provider/developers"));
  }, [devId, router]);

  useEffect(() => { load(logPage); }, [load, logPage]);

  const handleSubToggle = async (subId: number, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "blocked" : "active";
    setStatusBusy(subId);
    try {
      await updateSubscriptionStatus(subId, newStatus);
      show(`Subscription ${newStatus === "blocked" ? "blocked" : "reactivated"}`);
      load(logPage);
    } catch (e: any) {
      show(e.response?.data?.error || "Failed", "error");
    } finally { setStatusBusy(null); }
  };

  // ── Grant modal helpers ─────────────────────────────────────────────────────

  const openGrantModal = async () => {
    try {
      const apis = await getMyApis();
      setOrgApis(apis.filter((a: any) => a.status === "published"));
      setSelectedApiId(null);
      setAccessType("full");
      setApiEndpoints([]);
      setSelectedEpIds([]);
      setGrantResult(null);
      setGrantModal(true);
    } catch {
      show("Failed to load APIs", "error");
    }
  };

  const loadApiEndpoints = async (apiId: number) => {
    setLoadingEps(true);
    try {
      const eps = await getEndpoints(apiId);
      setApiEndpoints(eps);
      setSelectedEpIds([]);
    } catch {
      show("Failed to load endpoints", "error");
    } finally { setLoadingEps(false); }
  };

  // ── Style helpers ───────────────────────────────────────────────────────────

  const statusColor = (s: string) =>
    s === "active"    ? "bg-green-50 text-green-600 border-green-100"  :
    s === "blocked"   ? "bg-red-50 text-red-500 border-red-100"        :
    s === "cancelled" ? "bg-gray-100 text-gray-400 border-gray-200"    :
                        "bg-amber-50 text-amber-600 border-amber-100";

  const httpStatusColor = (s: number) =>
    s >= 500 ? "text-red-500"    :
    s >= 400 ? "text-orange-500" :
    s >= 300 ? "text-blue-500"   : "text-green-600";

  // ── Loading screen ──────────────────────────────────────────────────────────

  if (!data) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  const { developer: dev, subscriptions, recentLogs } = data;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="p-8 animate-fade-in">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <Link href="/provider/developers"
              className="w-9 h-9 bg-white rounded-xl border border-gray-100 flex items-center
                justify-center text-gray-400 hover:text-gray-600 hover:shadow transition-all mt-1">
              ←
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500
                flex items-center justify-center text-white text-xl font-extrabold shadow-md">
                {dev.name[0]?.toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-xl font-extrabold text-gray-800">{dev.name}</h1>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColor(dev.status)}`}>
                    {dev.status}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">{dev.email}</p>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-300">
                  <span>Joined {new Date(dev.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  <span>•</span>
                  <span>Last login: {dev.lastLoginAt
                    ? new Date(dev.lastLoginAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                    : "Never"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats + Grant Button */}
          <div className="flex items-center gap-3">
            {[
              { label: "Today",     value: data.callsToday },
              { label: "This Week", value: data.callsWeek  },
              { label: "APIs",      value: subscriptions.length },
            ].map(s => (
              <div key={s.label} className="bg-white border border-gray-100 rounded-xl px-4 py-3 text-center min-w-[80px]">
                <p className="text-2xl font-extrabold text-gray-800">{s.value}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            ))}
            <button
              onClick={openGrantModal}
              className="px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white
                text-sm font-semibold rounded-xl transition-colors shadow-sm">
              + Grant API Access
            </button>
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────── */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
          {[
            { key: "subscriptions", label: "Subscriptions", count: subscriptions.length },
            { key: "logs",          label: "Recent Calls",  count: recentLogs.length    },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as Tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all
                ${tab === t.key ? "bg-white text-teal-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {t.label}
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full
                ${tab === t.key ? "bg-teal-50 text-teal-500" : "bg-gray-200 text-gray-400"}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* ── Subscriptions Tab ───────────────────────────────────────── */}
        {tab === "subscriptions" && (
          <div className="animate-fade-in space-y-3">
            {subscriptions.length === 0 ? (
              <div className="card p-16 text-center border-2 border-dashed border-gray-200">
                <p className="text-gray-400 text-sm">No subscriptions yet</p>
                <p className="text-gray-300 text-xs mt-1">This developer hasn't subscribed to any APIs</p>
              </div>
            ) : subscriptions.map(sub => (
              <div key={sub.subscriptionId}
                className={`card overflow-hidden transition-all ${sub.status === "blocked" ? "border-red-100" : ""}`}>

                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500
                      flex items-center justify-center text-white font-bold text-sm">
                      {sub.apiName[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link href={`/provider/apis/${sub.apiId}`}
                          className="font-bold text-gray-800 text-sm hover:text-teal-600 transition-colors">
                          {sub.apiName}
                        </Link>
                        <StatusBadge status={sub.apiStatus as import("@/types/api").ApiStatus} />
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusColor(sub.status)}`}>
                          {sub.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                        <span>App: <span className="text-gray-600 font-medium">{sub.appName}</span></span>
                        <span>•</span>
                        <span>Subscribed {new Date(sub.subscribedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                        <span>•</span>
                        <span className="text-teal-600 font-semibold">{sub.callsToday} calls today</span>
                        <span className="text-blue-500 font-semibold">{sub.callsWeek} this week</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {(sub.allowedEndpoints?.length > 0) && (
                      <button
                        onClick={() => setExpanded(expanded === sub.subscriptionId ? null : sub.subscriptionId)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100
                          text-gray-500 border border-gray-200 transition-all">
                        {expanded === sub.subscriptionId
                          ? "▲ Hide"
                          : `▼ ${sub.allowedEndpoints.length} endpoint${sub.allowedEndpoints.length !== 1 ? "s" : ""}`}
                      </button>
                    )}
                    {sub.status !== "cancelled" && (
                      <button
                        onClick={() => handleSubToggle(sub.subscriptionId, sub.status)}
                        disabled={statusBusy === sub.subscriptionId}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50
                          ${sub.status === "active"
                            ? "bg-red-50 text-red-500 hover:bg-red-100"
                            : "bg-green-50 text-green-600 hover:bg-green-100"}`}>
                        {statusBusy === sub.subscriptionId ? "…"
                          : sub.status === "active" ? "🚫 Block" : "✅ Unblock"}
                      </button>
                    )}
                    {sub.status === "cancelled" && (
                      <span className="text-xs text-gray-300 italic">Cancelled</span>
                    )}
                  </div>
                </div>

                {expanded === sub.subscriptionId && (sub.allowedEndpoints?.length > 0) && (
                  <div className="border-t border-gray-50 bg-gray-50/50">

                    {/* Scope badge */}
                    <div className="px-6 pt-3 pb-1">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border
                        ${sub.accessScope === "restricted"
                          ? "bg-purple-50 text-purple-600 border-purple-100"
                          : "bg-blue-50 text-blue-600 border-blue-100"}`}>
                        {sub.accessScope === "restricted" ? "⚡ Restricted access" : "🌐 Full access"}
                      </span>
                    </div>

                    <div className="grid grid-cols-12 gap-3 px-6 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <div className="col-span-1">Method</div>
                      <div className="col-span-7">Endpoint</div>
                      <div className="col-span-2 text-right">Calls (30d)</div>
                      <div className="col-span-2 text-right">Usage</div>
                    </div>

                    <div className="divide-y divide-gray-100">
                      {sub.allowedEndpoints.map((ep, i) => {
                        // merge with usage log stats if calls exist
                        const stat = sub.endpoints.find(
                          e => e.path === ep.path &&
                              e.method.toUpperCase() === ep.httpMethod.toUpperCase()
                        );
                        const callCount = stat?.callCount ?? 0;
                        const maxCalls  = Math.max(
                          ...sub.allowedEndpoints.map(e => {
                            const s = sub.endpoints.find(x => x.path === e.path);
                            return s?.callCount ?? 0;
                          }), 1
                        );
                        const pct = Math.round((callCount / maxCalls) * 100);

                        return (
                          <div key={i} className="grid grid-cols-12 gap-3 px-6 py-2.5 items-center">
                            <div className="col-span-1"><MethodBadge method={ep.httpMethod} /></div>
                            <div className="col-span-7">
                              <code className="text-xs font-mono text-gray-600">{ep.path}</code>
                            </div>
                            <div className="col-span-2 text-right">
                              <span className="text-sm font-bold text-gray-700">
                                {callCount.toLocaleString()}
                              </span>
                            </div>
                            <div className="col-span-2">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full transition-all
                                    ${sub.accessScope === "restricted" ? "bg-purple-400" : "bg-teal-400"}`}
                                    style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {expanded === sub.subscriptionId && (!sub.allowedEndpoints || sub.allowedEndpoints.length === 0) && (
                  <div className="border-t border-gray-50 px-6 py-4 text-center">
                    <p className="text-xs text-gray-300">No endpoints defined on this API yet</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Recent Calls Tab ────────────────────────────────────────── */}
        {tab === "logs" && (
          <div className="animate-fade-in">
            {recentLogs.length === 0 ? (
              <div className="card p-16 text-center border-2 border-dashed border-gray-200">
                <p className="text-gray-400 text-sm">No calls yet</p>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <div className="grid grid-cols-12 gap-3 px-6 py-3 bg-gray-50 border-b border-gray-100
                  text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <div className="col-span-2">Time</div>
                  <div className="col-span-2">API</div>
                  <div className="col-span-1">Method</div>
                  <div className="col-span-2">Path</div>
                  <div className="col-span-1 text-center">Code</div>
                  <div className="col-span-2">Result</div>
                  <div className="col-span-1 text-right">Latency</div>
                  <div className="col-span-1 text-right">Flag</div>
                </div>

                <div className="divide-y divide-gray-50">
                  {recentLogs.map((log, i) => (
                    <div key={i}
                      className={`grid grid-cols-12 gap-3 px-6 py-3 items-center text-sm
                        ${log.rateLimited ? "bg-orange-50/30" : "hover:bg-gray-50"}`}>
                      <div className="col-span-2">
                        <span className="text-xs text-gray-400">
                          {new Date(log.requestTime).toLocaleString("en-IN", {
                            day: "numeric", month: "short",
                            hour: "2-digit", minute: "2-digit"
                          })}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs font-semibold text-gray-600 truncate block">{log.apiName}</span>
                      </div>
                      <div className="col-span-1"><MethodBadge method={log.method} /></div>
                      <div className="col-span-2">
                        <code className="text-xs font-mono text-gray-500 truncate block">{log.path}</code>
                      </div>
                      <div className="col-span-1 text-center">
                        <span className={`text-xs font-bold ${httpStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold
                          ${log.status >= 500 ? "bg-red-50 text-red-500" :
                            log.status >= 400 ? "bg-orange-50 text-orange-500" :
                            log.status >= 200 && log.status < 300 ? "bg-green-50 text-green-600" :
                            "bg-gray-100 text-gray-400"}`}>
                          {log.statusLabel || `HTTP ${log.status}`}
                        </span>
                      </div>
                      <div className="col-span-1 text-right">
                        <span className={`text-xs font-mono ${log.latency > 1000 ? "text-orange-500" : "text-gray-400"}`}>
                          {log.latency}ms
                        </span>
                      </div>
                      <div className="col-span-1 text-right">
                        {log.rateLimited && (
                          <span className="text-xs bg-orange-50 text-orange-500 border border-orange-100
                            px-1.5 py-0.5 rounded font-semibold" title={log.rateLimitType ?? "Rate limited"}>
                            429
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {totalLogPages > 1 ? (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                      Showing {logPage * 10 + 1}–{Math.min((logPage + 1) * 10, totalLogs)} of {totalLogs} calls
                    </p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setLogPage(p => Math.max(0, p - 1))}
                        disabled={logPage === 0}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200
                          text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                        ← Prev
                      </button>
                      <span className="text-xs text-gray-400 px-2">
                        Page {logPage + 1} of {totalLogPages}
                      </span>
                      <button onClick={() => setLogPage(p => Math.min(totalLogPages - 1, p + 1))}
                        disabled={logPage >= totalLogPages - 1}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200
                          text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                        Next →
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                    <p className="text-xs text-gray-400">Showing last {recentLogs.length} calls</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Grant API Access Modal ──────────────────────────────────────────── */}
      {grantModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-7 w-full max-w-md shadow-2xl shadow-black/20 animate-fade-in">

            {/* Modal header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-black text-gray-900">Grant API Access</h2>
                <p className="text-xs text-gray-400 mt-0.5">Manually grant this developer access to an API</p>
              </div>
              <button
                onClick={() => { setGrantModal(false); setGrantResult(null); }}
                className="w-8 h-8 flex items-center justify-center rounded-xl
                  text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all text-lg leading-none">
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4">

              {/* Developer info chip */}
              <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500
                  flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {dev.name[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-700 text-sm">{dev.name}</p>
                  <p className="text-xs text-gray-400">{dev.email}</p>
                </div>
              </div>

              {/* ── Success result ─────────────────────────────────────── */}
              {grantResult ? (
                <div className="flex flex-col gap-3">
                  <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">✅</span>
                      <p className="font-bold text-green-700 text-sm">
                        Access granted to {grantResult.apiName}
                      </p>
                    </div>
                    <p className="text-xs text-green-600 mb-3">
                      A subscription and API key have been created. Share this key with the developer — it will only be shown once.
                    </p>
                    <div className="bg-white border border-green-200 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wider">API Key</p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-gray-700 flex-1 break-all">
                          {grantResult.apiKey}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(grantResult.apiKey);
                            show("API key copied!");
                          }}
                          className="text-xs font-semibold px-2.5 py-1.5 bg-teal-50 text-teal-600
                            hover:bg-teal-100 rounded-lg border border-teal-200 flex-shrink-0 transition-all">
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => { setGrantModal(false); setGrantResult(null); load(logPage); }}
                    className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold
                      py-2.5 rounded-xl text-sm transition-all">
                    Done
                  </button>
                </div>

              ) : (
                <>
                  {/* ── Step 1: Select API ──────────────────────────────── */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                      Step 1 — Select API
                    </label>
                    {orgApis.length === 0 ? (
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
                        ⚠️ No published APIs in your organization. Publish an API first before granting access.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                        {orgApis.map(orgApi => {
                          const alreadySubscribed = data?.subscriptions
                            .some(s => s.apiId === orgApi.apiId && s.status === "active");
                          return (
                            <button key={orgApi.apiId}
                              onClick={() => {
                                if (alreadySubscribed) return;
                                setSelectedApiId(orgApi.apiId);
                                setAccessType("full");
                                setApiEndpoints([]);
                                setSelectedEpIds([]);
                              }}
                              disabled={alreadySubscribed}
                              className={`flex items-center justify-between px-4 py-3 rounded-xl border
                                text-left transition-all
                                ${alreadySubscribed
                                  ? "border-gray-100 bg-gray-50 cursor-not-allowed opacity-60"
                                  : selectedApiId === orgApi.apiId
                                    ? "border-teal-300 bg-teal-50"
                                    : "border-gray-200 hover:border-teal-200 hover:bg-gray-50"
                                }`}>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500
                                  flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                  {orgApi.apiName[0]?.toUpperCase()}
                                </div>
                                <div>
                                  <p className={`text-sm font-semibold
                                    ${selectedApiId === orgApi.apiId ? "text-teal-700" : "text-gray-700"}`}>
                                    {orgApi.apiName}
                                  </p>
                                  <p className="text-xs text-gray-400">{orgApi.version}</p>
                                </div>
                              </div>
                              {alreadySubscribed ? (
                                <span className="text-xs bg-green-50 text-green-600 border border-green-100
                                  px-2 py-0.5 rounded-lg font-semibold flex-shrink-0">
                                  Already has access
                                </span>
                              ) : selectedApiId === orgApi.apiId ? (
                                <span className="text-teal-500 text-lg">✓</span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ── Step 2: Access Type ─────────────────────────────── */}
                  {selectedApiId && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                        Step 2 — Access Type
                      </label>
                      <div className="grid grid-cols-2 gap-3">

                        {/* Full Access card */}
                        <button
                          onClick={() => { setAccessType("full"); setSelectedEpIds([]); }}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border
                            transition-all text-center
                            ${accessType === "full"
                              ? "border-teal-300 bg-teal-50"
                              : "border-gray-200 hover:border-gray-300 bg-white"}`}>
                          <span className="text-2xl">🌐</span>
                          <div>
                            <p className={`text-sm font-bold
                              ${accessType === "full" ? "text-teal-700" : "text-gray-700"}`}>
                              Full Access
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">All endpoints accessible</p>
                          </div>
                          {accessType === "full" && (
                            <span className="text-xs bg-teal-100 text-teal-600 px-2 py-0.5 rounded-full font-semibold">
                              Selected
                            </span>
                          )}
                        </button>

                        {/* Specific Endpoints card */}
                        <button
                          onClick={async () => {
                            setAccessType("endpoints");
                            if (apiEndpoints.length === 0) {
                              await loadApiEndpoints(selectedApiId);
                            }
                          }}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border
                            transition-all text-center
                            ${accessType === "endpoints"
                              ? "border-purple-300 bg-purple-50"
                              : "border-gray-200 hover:border-gray-300 bg-white"}`}>
                          <span className="text-2xl">⚡</span>
                          <div>
                            <p className={`text-sm font-bold
                              ${accessType === "endpoints" ? "text-purple-700" : "text-gray-700"}`}>
                              Specific Endpoints
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">Choose which to allow</p>
                          </div>
                          {accessType === "endpoints" && (
                            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-semibold">
                              Selected
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── Step 3: Endpoint Checklist ──────────────────────── */}
                  {selectedApiId && accessType === "endpoints" && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                        Step 3 — Select Endpoints
                        {selectedEpIds.length > 0 && (
                          <span className="ml-2 text-purple-600 font-bold">
                            ({selectedEpIds.length} selected)
                          </span>
                        )}
                      </label>

                      {loadingEps ? (
                        <div className="flex items-center justify-center py-6">
                          <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : apiEndpoints.length === 0 ? (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
                          ⚠️ This API has no endpoints defined yet.
                        </div>
                      ) : (
                        <>
                          {/* Select all / Clear */}
                          <div className="flex items-center gap-2 mb-2">
                            <button
                              onClick={() => setSelectedEpIds(apiEndpoints.map(e => e.endpointId))}
                              className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors">
                              Select all
                            </button>
                            <span className="text-gray-200">|</span>
                            <button
                              onClick={() => setSelectedEpIds([])}
                              className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors">
                              Clear
                            </button>
                          </div>

                          <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1">
                            {apiEndpoints.map(ep => {
                              const isSelected = selectedEpIds.includes(ep.endpointId);
                              return (
                                <button key={ep.endpointId}
                                  onClick={() => {
                                    setSelectedEpIds(prev =>
                                      isSelected
                                        ? prev.filter(id => id !== ep.endpointId)
                                        : [...prev, ep.endpointId]
                                    );
                                  }}
                                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border
                                    text-left transition-all
                                    ${isSelected
                                      ? "border-purple-200 bg-purple-50"
                                      : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                                    }`}>
                                  {/* Custom checkbox */}
                                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center
                                    flex-shrink-0 transition-all
                                    ${isSelected ? "bg-purple-500 border-purple-500" : "border-gray-300"}`}>
                                    {isSelected && (
                                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </div>
                                  {/* Method badge */}
                                  <MethodBadge method={ep.httpMethod} />
                                  {/* Path */}
                                  <code className={`text-xs font-mono flex-1 truncate
                                    ${isSelected ? "text-purple-700" : "text-gray-600"}`}>
                                    {ep.path}
                                  </code>
                                  {/* Optional description */}
                                  {ep.description && (
                                    <span className="text-xs text-gray-300 truncate max-w-[100px] hidden sm:block">
                                      {ep.description}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* ── Info note ───────────────────────────────────────── */}
                  {selectedApiId && (
                    <div className={`rounded-xl p-3 text-xs border
                      ${accessType === "full"
                        ? "bg-blue-50 border-blue-100 text-blue-700"
                        : "bg-purple-50 border-purple-100 text-purple-700"}`}>
                      {accessType === "full"
                        ? "💡 A Default App will be created if needed. Developer will have access to all current and future endpoints."
                        : selectedEpIds.length === 0
                          ? "⚠️ Select at least one endpoint to continue."
                          : `✅ Developer will only be able to call the ${selectedEpIds.length} selected endpoint${selectedEpIds.length > 1 ? "s" : ""}. All others will return 403.`
                      }
                    </div>
                  )}

                  {/* ── Action buttons ──────────────────────────────────── */}
                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        if (!selectedApiId) return show("Select an API first", "error");
                        if (accessType === "endpoints" && selectedEpIds.length === 0)
                          return show("Select at least one endpoint", "error");

                        setGranting(true);
                        try {
                          const result = await grantApiAccess(
                            dev.userId,
                            selectedApiId,
                            accessType === "endpoints" ? selectedEpIds : undefined
                          );
                          const apiName = orgApis.find(a => a.apiId === selectedApiId)?.apiName ?? "API";
                          setGrantResult({ apiKey: result.clientId ?? "", apiName });
                          show(`Access granted to ${apiName}`);
                        } catch (e: any) {
                          show(e.response?.data?.error || "Failed to grant access", "error");
                        } finally { setGranting(false); }
                      }}
                      disabled={
                        !selectedApiId || granting ||
                        (accessType === "endpoints" && selectedEpIds.length === 0)
                      }
                      className="flex-1 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white
                        text-sm font-bold rounded-xl transition-all disabled:opacity-50">
                      {granting ? "Granting…" : "✅ Grant Access"}
                    </button>
                    <button
                      onClick={() => setGrantModal(false)}
                      className="px-4 py-2.5 border border-gray-200 text-gray-500 font-bold
                        rounded-xl text-sm hover:bg-gray-50 transition-all">
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </DashboardLayout>
  );
}
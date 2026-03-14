"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { StatusBadge, MethodBadge } from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Toast from "@/components/ui/Toast";
import { Input, Select, Textarea, Button } from "@/components/ui/FormFields";
import {
  getApiById, getEndpoints, getDocuments, getVersions,
  publishApi, deprecateApi, retireApi, createVersion,
  addEndpoint, deleteEndpoint, addDocument, deleteDocument, updateRateLimits,
} from "@/lib/registry";
import { getProviderSubscriptions, updateSubscriptionStatus } from "@/lib/portal";
import {
  Api, ApiEndpoint, ApiDocument, ToastState, HttpMethod,
  CreateEndpointRequest, CreateDocumentRequest, Subscription,
} from "@/types/api";

import { UserResponse } from "@/types/auth";
import {
  getAllowedDevelopers, addAllowedDeveloper, removeAllowedDeveloper,
} from "@/lib/portal";
import apiClient from "@/lib/api";

type Tab = "endpoints" | "documents" | "versions" | "ratelimits" | "subscribers" | "restricted";

export default function ApiDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const apiId   = Number(id);

  const [api, setApi]             = useState<Api | null>(null);
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [versions, setVersions]   = useState<Api[]>([]);
  const [subs, setSubs]           = useState<Subscription[]>([]);
  const [tab, setTab]             = useState<Tab>("endpoints");
  const [toast, setToast]         = useState<ToastState | null>(null);
  const [lcBusy, setLcBusy]       = useState(false);
  const [statusBusy, setStatusBusy] = useState<number | null>(null);

  const [allowedDevs, setAllowedDevs] = useState<UserResponse[]>([]);
  const [orgDevs,     setOrgDevs]     = useState<UserResponse[]>([]);
  const [addingDev,   setAddingDev]   = useState<number | null>(null);
  const [removingDev, setRemovingDev] = useState<number | null>(null);

  const [rlForm, setRlForm] = useState({ perMinute: "", perHour: "", perDay: "", total: "" });
  const [rlSaving, setRlSaving] = useState(false);

  const [epModal,  setEpModal]  = useState(false);
  const [docModal, setDocModal] = useState(false);
  const [verModal, setVerModal] = useState(false);

  const [epForm, setEpForm]   = useState<CreateEndpointRequest>({ httpMethod: "GET", path: "", description: "", isAuthenticated: true });
  const [docForm, setDocForm] = useState<CreateDocumentRequest>({ title: "", docType: "markdown", content: "", docUrl: "" });
  const [newVer, setNewVer]   = useState("");

  const show = (message: string, type: ToastState["type"] = "success") => setToast({ message, type });

  const loadAll = useCallback(() => {
    getApiById(apiId).then(a => {
      setApi(a);
      setRlForm({
        perMinute: a.rateLimitPerMinute?.toString() ?? "",
        perHour:   a.rateLimitPerHour?.toString()   ?? "",
        perDay:    a.rateLimitPerDay?.toString()     ?? "",
        total:     a.rateLimitTotal?.toString()      ?? "",
      });
    }).catch(() => router.push("/provider/apis"));
    getEndpoints(apiId).then(setEndpoints).catch(() => {});
    getDocuments(apiId).then(setDocuments).catch(() => {});
    getVersions(apiId).then(setVersions).catch(() => {});
  }, [apiId, router]);

  const loadSubs = useCallback(() => {
    getProviderSubscriptions()
      .then(all => setSubs(all.filter((s: Subscription) => s.apiId === apiId)))
      .catch(() => {});
  }, [apiId]);

  const loadRestricted = useCallback(() => {
  if (api?.visibility !== "restricted") return;
  Promise.all([
    getAllowedDevelopers(apiId),
    apiClient.get("/api/users/org").then(r => r.data),
  ]).then(([allowed, org]) => {
    setAllowedDevs(allowed);
    // show only org devs NOT already allowed
    const allowedIds = new Set(allowed.map((d: UserResponse) => d.userId));
    setOrgDevs(org.filter((d: UserResponse) => !allowedIds.has(d.userId)));
  }).catch(console.error);
}, [apiId, api?.visibility]);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => { if (tab === "subscribers") loadSubs(); }, [tab, loadSubs]);
  useEffect(() => { if (tab === "restricted") loadRestricted(); }, [tab, loadRestricted]);

  const lifecycle = async (fn: () => Promise<unknown>, label: string) => {
    setLcBusy(true);
    try { await fn(); show(`API ${label}`); loadAll(); }
    catch (e: any) { show(e.response?.data?.error || `Failed to ${label}`, "error"); }
    setLcBusy(false);
  };

  const handleStatusToggle = async (subId: number, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "blocked" : "active";
    setStatusBusy(subId);
    try {
      await updateSubscriptionStatus(subId, newStatus);
      show(`Subscription ${newStatus === "blocked" ? "blocked" : "reactivated"}`);
      loadSubs();
    } catch (e: any) {
      show(e.response?.data?.error || "Failed", "error");
    } finally { setStatusBusy(null); }
  };

  const submitEndpoint = async () => {
    if (!epForm.path) return show("Path is required", "error");
    try {
      await addEndpoint(apiId, epForm); show("Endpoint added"); setEpModal(false);
      setEpForm({ httpMethod: "GET", path: "", description: "", isAuthenticated: true });
      getEndpoints(apiId).then(setEndpoints);
    } catch (e: any) { show(e.response?.data?.error || "Failed", "error"); }
  };

  const submitDoc = async () => {
    if (!docForm.title) return show("Title is required", "error");
    try {
      await addDocument(apiId, docForm); show("Document added"); setDocModal(false);
      setDocForm({ title: "", docType: "markdown", content: "", docUrl: "" });
      getDocuments(apiId).then(setDocuments);
    } catch (e: any) { show(e.response?.data?.error || "Failed", "error"); }
  };

  const submitVersion = async () => {
    if (!newVer) return show("Version is required", "error");
    try {
      await createVersion(apiId, newVer); show(`Version ${newVer} created`);
      setVerModal(false); setNewVer(""); getVersions(apiId).then(setVersions);
    } catch (e: any) { show(e.response?.data?.error || "Version already exists", "error"); }
  };

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "endpoints",   label: "Endpoints",   count: endpoints.length },
    { key: "documents",   label: "Docs",        count: documents.length },
    { key: "versions",    label: "Versions",    count: versions.length  },
    { key: "subscribers", label: "Subscribers", count: subs.length      },
    { key: "ratelimits",  label: "Rate Limits"                          },
    ...(api?.visibility === "restricted"
      ? [{ key: "restricted" as Tab, label: "🔒 Access Control", count: allowedDevs.length }]
      : []),
  ];

  if (!api) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="p-8 animate-fade-in">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <Link href="/provider/apis"
              className="w-9 h-9 bg-white rounded-xl border border-gray-100 flex items-center justify-center
                text-gray-400 hover:text-gray-600 hover:shadow transition-all mt-1">
              ←
            </Link>
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <div className="w-11 h-11 rounded-xl grad-teal flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {api.apiName[0]?.toUpperCase()}
                </div>
                <h1 className="text-xl font-extrabold text-gray-800">{api.apiName}</h1>
                <span className="text-teal-600 font-mono text-xs bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-lg">
                  {api.version}
                </span>
                <StatusBadge status={api.status} />
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                  ${api.visibility === "public"     ? "bg-green-50 text-green-600"   :
                    api.visibility === "private"    ? "bg-orange-50 text-orange-500" :
                                                      "bg-purple-50 text-purple-600"}`}>
                  {api.visibility}
                </span>
              </div>
              <p className="text-gray-400 text-sm ml-14">{api.description || "No description"}</p>
              <p className="text-gray-300 font-mono text-xs ml-14 mt-0.5">{api.baseUrl}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="ghost" onClick={() => setVerModal(true)}>+ Version</Button>
            {api.status === "draft" && (
              <Button variant="primary" onClick={() => lifecycle(publishApi.bind(null, apiId), "published")} disabled={lcBusy}>
                {lcBusy ? "…" : "▶ Publish"}
              </Button>
            )}
            {api.status === "published" && (
              <button onClick={() => lifecycle(deprecateApi.bind(null, apiId), "deprecated")} disabled={lcBusy}
                className="px-4 py-2.5 bg-orange-400 hover:bg-orange-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
                {lcBusy ? "…" : "⚠ Deprecate"}
              </button>
            )}
            {api.status === "deprecated" && (
              <Button variant="danger" onClick={() => lifecycle(retireApi.bind(null, apiId), "retired")} disabled={lcBusy}>
                {lcBusy ? "…" : "✕ Retire"}
              </Button>
            )}
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────── */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all
                ${tab === t.key ? "bg-white text-teal-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {t.label}
              {t.count !== undefined && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full
                  ${tab === t.key ? "bg-teal-50 text-teal-500" : "bg-gray-200 text-gray-400"}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Endpoints ──────────────────────────────────────────────────── */}
        {tab === "endpoints" && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-800">Endpoints</h2>
              <Button variant="primary" onClick={() => setEpModal(true)}>+ Add Endpoint</Button>
            </div>
            {endpoints.length === 0 ? (
              <div className="card p-16 text-center border-2 border-dashed border-gray-200">
                <p className="text-gray-400 text-sm mb-3">No endpoints yet</p>
                <button onClick={() => setEpModal(true)} className="text-teal-500 text-sm font-semibold">+ Add first endpoint</button>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <div className="divide-y divide-gray-50">
                  {endpoints.map(ep => (
                    <div key={ep.endpointId} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group">
                      <MethodBadge method={ep.httpMethod} />
                      <code className="text-gray-700 text-sm font-mono flex-1">{ep.path}</code>
                      <span className="text-gray-400 text-sm flex-1 truncate">{ep.description || "—"}</span>
                      {ep.isAuthenticated && (
                        <span className="text-xs text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-lg">🔒 Auth</span>
                      )}
                      <button onClick={() => deleteEndpoint(ep.endpointId).then(() => getEndpoints(apiId).then(setEndpoints))}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-red-50 transition-all">
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Documents ──────────────────────────────────────────────────── */}
        {tab === "documents" && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-800">Documentation</h2>
              <Button variant="primary" onClick={() => setDocModal(true)}>+ Add Document</Button>
            </div>
            {documents.length === 0 ? (
              <div className="card p-16 text-center border-2 border-dashed border-gray-200">
                <p className="text-gray-400 text-sm mb-3">No documentation yet</p>
                <button onClick={() => setDocModal(true)} className="text-teal-500 text-sm font-semibold">+ Add documentation</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {documents.map(doc => (
                  <div key={doc.docId} className="card p-5 hover:shadow-md transition-shadow group">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-gray-800 text-sm">{doc.title}</h3>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg mt-1 inline-block">{doc.docType}</span>
                      </div>
                      <button onClick={() => deleteDocument(doc.docId).then(() => getDocuments(apiId).then(setDocuments))}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all">✕</button>
                    </div>
                    {doc.content && <p className="text-gray-400 text-xs line-clamp-2 mt-2">{doc.content}</p>}
                    {doc.docUrl && <a href={doc.docUrl} target="_blank" rel="noreferrer" className="text-teal-500 text-xs mt-2 inline-block font-medium">↗ View</a>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Versions ───────────────────────────────────────────────────── */}
        {tab === "versions" && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-800">Versions</h2>
              <Button variant="primary" onClick={() => setVerModal(true)}>+ New Version</Button>
            </div>
            <div className="card overflow-hidden">
              <div className="divide-y divide-gray-50">
                {versions.map(v => (
                  <div key={v.apiId} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50">
                    <span className="text-teal-600 font-mono font-bold bg-teal-50 border border-teal-100 px-3 py-1 rounded-lg text-sm">{v.version}</span>
                    <StatusBadge status={v.status} />
                    <span className="text-gray-400 text-sm flex-1 truncate">{v.description || "No description"}</span>
                    <span className="text-gray-300 text-xs">{new Date(v.createdAt).toLocaleDateString()}</span>
                    {v.apiId !== apiId
                      ? <Link href={`/provider/apis/${v.apiId}`} className="text-teal-500 text-xs font-semibold">View →</Link>
                      : <span className="text-xs bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full">Current</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Subscribers ────────────────────────────────────────────────── */}
        {tab === "subscribers" && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-gray-800">Subscribers</h2>
                <p className="text-gray-400 text-xs mt-0.5">Developers subscribed to this API</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Active
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Blocked
                </span>
              </div>
            </div>

            {subs.length === 0 ? (
              <div className="card p-20 text-center border-2 border-dashed border-gray-200">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-gray-400 text-sm">No subscribers yet</p>
                <p className="text-gray-300 text-xs mt-1">Developers will appear here once they subscribe</p>
              </div>
            ) : (
              <div className="card overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <div className="col-span-3">Developer</div>
                  <div className="col-span-2">App</div>
                  <div className="col-span-2">Subscribed</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-3 text-right">Actions</div>
                </div>

                <div className="divide-y divide-gray-50">
                  {subs.map(sub => (
                    <div key={sub.subscriptionId}
                      className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors">

                      {/* Developer */}
                      <div className="col-span-3 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400
                          flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {sub.appName?.[0]?.toUpperCase() ?? "D"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-700">{sub.appName}</p>
                        </div>
                      </div>

                      {/* App */}
                      <div className="col-span-2">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                          {sub.appName}
                        </span>
                      </div>

                      {/* Date */}
                      <div className="col-span-2">
                        <span className="text-xs text-gray-400">
                          {sub.subscribedAt
                            ? new Date(sub.subscribedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                            : "—"}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="col-span-2">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full
                          ${sub.status === "active"    ? "bg-green-50 text-green-600"  :
                            sub.status === "blocked"   ? "bg-red-50 text-red-500"     :
                            sub.status === "cancelled" ? "bg-gray-100 text-gray-400"  :
                                                         "bg-amber-50 text-amber-600"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full inline-block
                            ${sub.status === "active"  ? "bg-green-400" :
                              sub.status === "blocked" ? "bg-red-400"   : "bg-gray-300"}`} />
                          {sub.status}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="col-span-3 flex justify-end gap-2">
                        {sub.status !== "cancelled" && (
                          <button
                            onClick={() => handleStatusToggle(sub.subscriptionId, sub.status)}
                            disabled={statusBusy === sub.subscriptionId}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50
                              ${sub.status === "active"
                                ? "bg-red-50 text-red-500 hover:bg-red-100"
                                : "bg-green-50 text-green-600 hover:bg-green-100"}`}>
                            {statusBusy === sub.subscriptionId
                              ? "…"
                              : sub.status === "active" ? "Block" : "Reactivate"}
                          </button>
                        )}
                        {sub.status === "cancelled" && (
                          <span className="text-xs text-gray-300 italic">Cancelled by developer</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer summary */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
                  <span>{subs.filter(s => s.status === "active").length} active</span>
                  <span>{subs.filter(s => s.status === "blocked").length} blocked</span>
                  <span>{subs.filter(s => s.status === "cancelled").length} cancelled</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Rate Limits ─────────────────────────────────────────────────── */}
        {tab === "ratelimits" && (
          <div className="animate-fade-in max-w-lg">
            <h2 className="font-bold text-gray-800 mb-5">Rate Limits</h2>

            {/* Current limits display */}
            {(api.rateLimitPerMinute || api.rateLimitPerHour || api.rateLimitPerDay || api.rateLimitTotal) && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { label: "Per Minute", value: api.rateLimitPerMinute, icon: "⚡" },
                  { label: "Per Hour",   value: api.rateLimitPerHour,   icon: "🕐" },
                  { label: "Per Day",    value: api.rateLimitPerDay,    icon: "📅" },
                  { label: "Total",      value: api.rateLimitTotal,     icon: "∞"  },
                ].filter(x => x.value).map(x => (
                  <div key={x.label} className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{x.icon}</span>
                      <span className="text-xs font-semibold text-teal-600">{x.label}</span>
                    </div>
                    <p className="text-2xl font-extrabold text-gray-800">{x.value?.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">calls allowed</p>
                  </div>
                ))}
              </div>
            )}

            {!api.rateLimitPerMinute && !api.rateLimitPerHour && !api.rateLimitPerDay && !api.rateLimitTotal && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6 text-sm text-green-600 font-semibold">
                ✅ No rate limits set — developers have unlimited access
              </div>
            )}

            <div className="card p-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Update Rate Limits
              </p>
              <p className="text-xs text-gray-400 mb-5">Leave blank to disable a limit.</p>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Per Minute" placeholder="e.g. 60" type="number"
                  value={rlForm.perMinute}
                  onChange={e => setRlForm(p => ({ ...p, perMinute: e.target.value }))} />
                <Input label="Per Hour" placeholder="e.g. 1000" type="number"
                  value={rlForm.perHour}
                  onChange={e => setRlForm(p => ({ ...p, perHour: e.target.value }))} />
                <Input label="Per Day" placeholder="e.g. 10000" type="number"
                  value={rlForm.perDay}
                  onChange={e => setRlForm(p => ({ ...p, perDay: e.target.value }))} />
                <Input label="Total (lifetime)" placeholder="e.g. 100000" type="number"
                  value={rlForm.total}
                  onChange={e => setRlForm(p => ({ ...p, total: e.target.value }))} />
              </div>
              <Button variant="primary" disabled={rlSaving} className="w-full mt-4"
                onClick={async () => {
                  setRlSaving(true);
                  try {
                    await updateRateLimits(apiId, {
                      rateLimitPerMinute: rlForm.perMinute ? Number(rlForm.perMinute) : null,
                      rateLimitPerHour:   rlForm.perHour   ? Number(rlForm.perHour)   : null,
                      rateLimitPerDay:    rlForm.perDay     ? Number(rlForm.perDay)    : null,
                      rateLimitTotal:     rlForm.total      ? Number(rlForm.total)     : null,
                    });
                    show("Rate limits saved");
                    loadAll();
                  } catch (e: any) {
                    show(e.response?.data?.error || "Failed", "error");
                  } finally { setRlSaving(false); }
                }}>
                {rlSaving ? "Saving…" : "Save Rate Limits"}
              </Button>
            </div>
          </div>
        )}


        {tab === "restricted" && (
  <div className="animate-fade-in">
    <div className="flex items-center justify-between mb-5">
      <div>
        <h2 className="font-bold text-gray-800">Access Control</h2>
        <p className="text-gray-400 text-xs mt-0.5">
          This API is restricted — only allowed developers can see and subscribe to it
        </p>
      </div>
      <span className="bg-purple-50 text-purple-600 text-xs font-semibold px-3 py-1.5 rounded-xl border border-purple-100">
        🔒 Restricted Visibility
      </span>
    </div>
 
    <div className="grid grid-cols-2 gap-5">
 
      {/* Allowed developers */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs">✓</span>
          Has Access ({allowedDevs.length})
        </h3>
 
        {allowedDevs.length === 0 ? (
          <div className="card p-8 text-center border-2 border-dashed border-gray-200">
            <p className="text-gray-400 text-sm">No developers have access yet</p>
            <p className="text-gray-300 text-xs mt-1">Add developers from the right panel</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="divide-y divide-gray-50">
              {allowedDevs.map(dev => (
                <div key={dev.userId} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 group">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-teal-400
                    flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {dev.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-700 truncate">{dev.name}</p>
                    <p className="text-xs text-gray-400 truncate">{dev.email}</p>
                  </div>
                  <button
                    onClick={async () => {
                      setRemovingDev(dev.userId);
                      try {
                        await removeAllowedDeveloper(apiId, dev.userId);
                        show("Access revoked");
                        loadRestricted();
                      } catch (e: any) {
                        show(e.response?.data?.error || "Failed", "error");
                      } finally { setRemovingDev(null); }
                    }}
                    disabled={removingDev === dev.userId}
                    className="opacity-0 group-hover:opacity-100 text-xs font-semibold px-2.5 py-1.5
                      bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-all disabled:opacity-50">
                    {removingDev === dev.userId ? "…" : "Revoke"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
 
      {/* Org developers without access */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-xs">+</span>
          Add Access ({orgDevs.length} available)
        </h3>
 
        {orgDevs.length === 0 ? (
          <div className="card p-8 text-center border-2 border-dashed border-gray-200">
            <p className="text-gray-400 text-sm">All org developers have access</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="divide-y divide-gray-50">
              {orgDevs.map(dev => (
                <div key={dev.userId} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 group">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400
                    flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {dev.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-700 truncate">{dev.name}</p>
                    <p className="text-xs text-gray-400 truncate">{dev.email}</p>
                  </div>
                  <button
                    onClick={async () => {
                      setAddingDev(dev.userId);
                      try {
                        await addAllowedDeveloper(apiId, dev.userId);
                        show(`Access granted to ${dev.name}`);
                        loadRestricted();
                      } catch (e: any) {
                        show(e.response?.data?.error || "Failed", "error");
                      } finally { setAddingDev(null); }
                    }}
                    disabled={addingDev === dev.userId}
                    className="opacity-0 group-hover:opacity-100 text-xs font-semibold px-2.5 py-1.5
                      bg-teal-50 text-teal-600 hover:bg-teal-100 rounded-lg transition-all disabled:opacity-50">
                    {addingDev === dev.userId ? "…" : "Grant"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
)}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {epModal && (
        <Modal title="Add Endpoint" onClose={() => setEpModal(false)}>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Select label="Method" value={epForm.httpMethod}
                onChange={e => setEpForm(p => ({ ...p, httpMethod: e.target.value as HttpMethod }))}>
                {["GET", "POST", "PUT", "PATCH", "DELETE"].map(m => <option key={m}>{m}</option>)}
              </Select>
              <Input label="Path *" placeholder="/users/{id}" value={epForm.path}
                onChange={e => setEpForm(p => ({ ...p, path: e.target.value }))} />
            </div>
            <Textarea label="Description" rows={2} value={epForm.description}
              onChange={e => setEpForm(p => ({ ...p, description: e.target.value }))} />
            <Textarea label="Request Schema" rows={3} placeholder='{"name":"string"}' value={epForm.requestSchema}
              onChange={e => setEpForm(p => ({ ...p, requestSchema: e.target.value }))} />
            <Textarea label="Response Schema" rows={3} placeholder='{"id":1}' value={epForm.responseSchema}
              onChange={e => setEpForm(p => ({ ...p, responseSchema: e.target.value }))} />
            <label className="flex items-center gap-3 cursor-pointer text-sm text-gray-600">
              <input type="checkbox" checked={epForm.isAuthenticated}
                onChange={e => setEpForm(p => ({ ...p, isAuthenticated: e.target.checked }))}
                className="w-4 h-4 accent-teal-500" />
              Requires Authentication
            </label>
            <Button variant="primary" onClick={submitEndpoint} className="w-full">Add Endpoint</Button>
          </div>
        </Modal>
      )}

      {docModal && (
        <Modal title="Add Document" onClose={() => setDocModal(false)}>
          <div className="flex flex-col gap-4">
            <Input label="Title *" value={docForm.title}
              onChange={e => setDocForm(p => ({ ...p, title: e.target.value }))} />
            <Select label="Type" value={docForm.docType}
              onChange={e => setDocForm(p => ({ ...p, docType: e.target.value }))}>
              {["markdown", "howto", "samples", "publicforum", "support"].map(t => <option key={t}>{t}</option>)}
            </Select>
            <Textarea label="Content" rows={5} value={docForm.content}
              onChange={e => setDocForm(p => ({ ...p, content: e.target.value }))} />
            <Input label="External URL" placeholder="https://docs.example.com" value={docForm.docUrl}
              onChange={e => setDocForm(p => ({ ...p, docUrl: e.target.value }))} />
            <Button variant="primary" onClick={submitDoc} className="w-full">Add Document</Button>
          </div>
        </Modal>
      )}

      {verModal && (
        <Modal title="Create New Version" onClose={() => setVerModal(false)} size="sm">
          <div className="flex flex-col gap-4">
            <div className="bg-teal-50 rounded-xl p-3 text-xs text-teal-700">
              New version of <strong>{api.apiName}</strong>
            </div>
            <Input label="Version *" placeholder="v2.0" value={newVer}
              onChange={e => setNewVer(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submitVersion()} />
            <Button variant="primary" onClick={submitVersion} className="w-full">Create Version</Button>
          </div>
        </Modal>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </DashboardLayout>
  );
}
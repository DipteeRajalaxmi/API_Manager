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
  publishApi, deprecateApi, retireApi, createVersion, updateApi, deleteApi,
  addEndpoint, deleteEndpoint, addDocument, deleteDocument, updateRateLimits, updateEndpoint,
  blockApi, unblockApi, blockEndpoint, unblockEndpoint,
} from "@/lib/registry";
import { getProviderSubscriptions, updateSubscriptionStatus } from "@/lib/portal";
import {
  Api, ApiEndpoint, ApiDocument, ToastState, HttpMethod,
  CreateEndpointRequest, CreateDocumentRequest, Subscription,
} from "@/types/api";
import { UserResponse } from "@/types/auth";
import { getAllowedDevelopers, addAllowedDeveloper, removeAllowedDeveloper } from "@/lib/portal";
import apiClient from "@/lib/api";
import { ApiPlanLimit, PLAN_NAMES, PlanName } from "@/types/api";
import { getPlanLimits, savePlanLimit, deletePlanLimit } from "@/lib/registry";

type Tab = "endpoints" | "documents" | "versions" | "ratelimits" | "subscribers" | "restricted";

export default function ApiDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const apiId   = Number(id);

  const [api, setApi]               = useState<Api | null>(null);
  const [endpoints, setEndpoints]   = useState<ApiEndpoint[]>([]);
  const [documents, setDocuments]   = useState<ApiDocument[]>([]);
  const [versions, setVersions]     = useState<Api[]>([]);
  const [subs, setSubs]             = useState<Subscription[]>([]);
  const [tab, setTab]               = useState<Tab>("endpoints");
  const [toast, setToast]           = useState<ToastState | null>(null);
  const [lcBusy, setLcBusy]         = useState(false);
  const [statusBusy, setStatusBusy] = useState<number | null>(null);

  const [allowedDevs, setAllowedDevs] = useState<UserResponse[]>([]);
  const [orgDevs,     setOrgDevs]     = useState<UserResponse[]>([]);
  const [addingDev,   setAddingDev]   = useState<number | null>(null);
  const [removingDev, setRemovingDev] = useState<number | null>(null);

  const [rlForm, setRlForm]     = useState({ perMinute: "", perHour: "", perDay: "", total: "" });
  const [rlSaving, setRlSaving] = useState(false);

  const [epModal,  setEpModal]  = useState(false);
  const [docModal, setDocModal] = useState(false);
  const [verModal, setVerModal] = useState(false);

  const [epForm, setEpForm]   = useState<CreateEndpointRequest>({ httpMethod: "GET", path: "", description: "", isAuthenticated: true });
  const [docForm, setDocForm] = useState<CreateDocumentRequest>({ title: "", docType: "SWAGGER", contentText: "", contentUrl: "" });
  const [newVer, setNewVer]   = useState("");

  const [editModal, setEditModal]   = useState(false);
  const [editForm, setEditForm]     = useState({ apiName: "", description: "", baseUrl: "", visibility: "" });
  const [editSaving, setEditSaving] = useState(false);

  const [epRlModal,  setEpRlModal]  = useState(false);
  const [epRlTarget, setEpRlTarget] = useState<ApiEndpoint | null>(null);
  const [epRlForm,   setEpRlForm]   = useState({ perMinute: "", perHour: "", perDay: "", total: "" });
  const [epRlSaving, setEpRlSaving] = useState(false);

  const [blockModal,  setBlockModal]  = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [blockTarget, setBlockTarget] = useState<"api" | ApiEndpoint | null>(null);
  const [blockSaving, setBlockSaving] = useState(false);

  const [planLimits,    setPlanLimits]    = useState<ApiPlanLimit[]>([]);
  const [planSaving,    setPlanSaving]    = useState<string | null>(null); // planName being saved
  const [planDeleting,  setPlanDeleting]  = useState<string | null>(null); // planName being deleted
  const [newPlanForm,   setNewPlanForm]   = useState({
    planName: "starter" as PlanName,
    perMinute: "", perHour: "", perDay: "", total: ""
  });
  const [showAddPlan,   setShowAddPlan]   = useState(false);
  const [rlMode, setRlMode] = useState<"global" | "plan">("global");

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
    getPlanLimits(apiId).then(data => {
    setPlanLimits(data);
    if (data.length > 0) setRlMode("plan");
  }).catch(() => {});
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
      setDocForm({ title: "", docType: "SWAGGER", contentText: "", contentUrl: "" });
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
        <div className="flex items-start justify-between mb-4">
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
                  ${api.visibility === "public"  ? "bg-green-50 text-green-600"   :
                    api.visibility === "private" ? "bg-orange-50 text-orange-500" :
                                                   "bg-purple-50 text-purple-600"}`}>
                  {api.visibility}
                </span>
              </div>
              <p className="text-gray-400 text-sm ml-14">{api.description || "No description"}</p>
              <p className="text-gray-300 font-mono text-xs ml-14 mt-0.5">{api.baseUrl}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="ghost" onClick={() => {
              setEditForm({ apiName: api.apiName, description: api.description ?? "", baseUrl: api.baseUrl, visibility: api.visibility });
              setEditModal(true);
            }}>✏️ Edit</Button>

            {api.status === "published" && (
              api.isBlocked ? (
                <button onClick={async () => {
                  await unblockApi(apiId);
                  show("API unblocked — developers can access it again");
                  loadAll();
                }} className="px-4 py-2.5 bg-green-50 text-green-600 hover:bg-green-100
                  text-sm font-semibold rounded-xl transition-colors">
                  ✅ Unblock API
                </button>
              ) : (
                <button onClick={() => { setBlockTarget("api"); setBlockReason(""); setBlockModal(true); }}
                  className="px-4 py-2.5 bg-red-50 text-red-500 hover:bg-red-100
                    text-sm font-semibold rounded-xl transition-colors">
                  🚫 Block API
                </button>
              )
            )}

            {api.status !== "published" && (
              <button onClick={async () => {
                if (!confirm("Delete this API?")) return;
                try { await deleteApi(apiId); router.push("/provider/apis"); }
                catch (e: any) { show(e.response?.data?.error || "Cannot delete", "error"); }
              }} className="px-4 py-2.5 bg-red-50 text-red-500 hover:bg-red-100 text-sm font-semibold rounded-xl transition-colors">
                🗑 Delete
              </button>
            )}

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

        {/* ── Blocked Banner ─────────────────────────────────────────────── */}
        {api.isBlocked && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-3 mb-5">
            <span className="text-xl flex-shrink-0">🚫</span>
            <div>
              <p className="text-sm font-bold text-red-600">API Blocked — all developers are getting 503 errors</p>
              {api.blockedReason && (
                <p className="text-xs text-red-400 mt-0.5">Reason: {api.blockedReason}</p>
              )}
            </div>
            <button onClick={async () => {
              await unblockApi(apiId);
              show("API unblocked");
              loadAll();
            }} className="ml-auto text-xs font-semibold px-3 py-1.5 bg-white border border-red-200
              text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0">
              ✅ Unblock Now
            </button>
          </div>
        )}

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
                <div className="grid grid-cols-12 gap-3 px-6 py-3 bg-gray-50 border-b border-gray-100
                  text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <div className="col-span-1">Method</div>
                  <div className="col-span-3">Path</div>
                  <div className="col-span-3">Description</div>
                  <div className="col-span-3">Limits / Status</div>
                  <div className="col-span-1">Auth</div>
                  <div className="col-span-1 text-right">Actions</div>
                </div>
                <div className="divide-y divide-gray-50">
                  {endpoints.map(ep => (
                    <div key={ep.endpointId}
                      className={`grid grid-cols-12 gap-3 px-6 py-4 items-center transition-colors group
                        ${ep.isBlocked ? "bg-red-50/30" : "hover:bg-gray-50"}`}>
                      <div className="col-span-1"><MethodBadge method={ep.httpMethod} /></div>
                      <div className="col-span-3">
                        <code className="text-gray-700 text-sm font-mono">{ep.path}</code>
                      </div>
                      <div className="col-span-3">
                        <span className="text-gray-400 text-sm truncate block">{ep.description || "—"}</span>
                      </div>
                      <div className="col-span-3 flex flex-wrap gap-1">
                        {ep.isBlocked && (
                          <span className="text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg font-semibold">
                            🚫 Blocked
                          </span>
                        )}
                        {ep.rateLimitPerMinute && (
                          <span className="text-xs bg-teal-50 text-teal-600 border border-teal-100 px-2 py-0.5 rounded-lg font-mono">
                            {ep.rateLimitPerMinute}/min
                          </span>
                        )}
                        {ep.rateLimitPerHour && (
                          <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-lg font-mono">
                            {ep.rateLimitPerHour}/hr
                          </span>
                        )}
                        {ep.rateLimitPerDay && (
                          <span className="text-xs bg-purple-50 text-purple-600 border border-purple-100 px-2 py-0.5 rounded-lg font-mono">
                            {ep.rateLimitPerDay}/day
                          </span>
                        )}
                        {ep.rateLimitTotal && (
                          <span className="text-xs bg-red-50 text-red-500 border border-red-100 px-2 py-0.5 rounded-lg font-mono">
                            {ep.rateLimitTotal} total
                          </span>
                        )}
                        {!ep.isBlocked && !ep.rateLimitPerMinute && !ep.rateLimitPerHour && !ep.rateLimitPerDay && !ep.rateLimitTotal && (
                          <span className="text-xs text-gray-300 italic">No limit</span>
                        )}
                      </div>
                      <div className="col-span-1">
                        {ep.isAuthenticated && (
                          <span className="text-xs text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-lg">🔒</span>
                        )}
                      </div>
                      <div className="col-span-1 flex justify-end items-center gap-1">
                        <button title="Set rate limits"
                          onClick={() => {
                            setEpRlTarget(ep);
                            setEpRlForm({
                              perMinute: ep.rateLimitPerMinute?.toString() ?? "",
                              perHour:   ep.rateLimitPerHour?.toString()   ?? "",
                              perDay:    ep.rateLimitPerDay?.toString()     ?? "",
                              total:     ep.rateLimitTotal?.toString()      ?? "",
                            });
                            setEpRlModal(true);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-xs px-2 py-1 rounded text-teal-500 hover:bg-teal-50 transition-all">
                          ⚡
                        </button>
                        <button
                          title={ep.isBlocked ? "Unblock endpoint" : "Block endpoint"}
                          onClick={() => {
                            if (ep.isBlocked) {
                              unblockEndpoint(ep.endpointId)
                                .then(() => { show("Endpoint unblocked"); getEndpoints(apiId).then(setEndpoints); })
                                .catch(() => show("Failed", "error"));
                            } else {
                              setBlockTarget(ep);
                              setBlockReason("");
                              setBlockModal(true);
                            }
                          }}
                          className={`opacity-0 group-hover:opacity-100 text-xs px-2 py-1 rounded transition-all
                            ${ep.isBlocked ? "text-green-500 hover:bg-green-50" : "text-red-400 hover:bg-red-50"}`}>
                          {ep.isBlocked ? "✅" : "🚫"}
                        </button>
                        <button onClick={() => deleteEndpoint(ep.endpointId).then(() => getEndpoints(apiId).then(setEndpoints))}
                          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-red-50 transition-all">
                          Del
                        </button>
                      </div>
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
                    {doc.contentText && <p className="text-gray-400 text-xs line-clamp-2 mt-2">{doc.contentText}</p>}
                    {doc.contentUrl && <a href={doc.contentUrl} target="_blank" rel="noreferrer" className="text-teal-500 text-xs mt-2 inline-block font-medium">↗ View</a>}
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
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Active</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Blocked</span>
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
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <div className="col-span-3">Developer</div>
                  <div className="col-span-2">App</div>
                  <div className="col-span-2">Subscribed</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-3 text-right">Actions</div>
                </div>
                <div className="divide-y divide-gray-50">
                  {subs.map(sub => (
                    <div key={sub.subscriptionId} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors">
                      <div className="col-span-3 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {sub.appName?.[0]?.toUpperCase() ?? "D"}
                        </div>
                        <p className="text-sm font-semibold text-gray-700">{sub.appName}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{sub.appName}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs text-gray-400">
                          {sub.subscribedAt ? new Date(sub.subscribedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full
                          ${sub.status === "active" ? "bg-green-50 text-green-600" : sub.status === "blocked" ? "bg-red-50 text-red-500" : sub.status === "cancelled" ? "bg-gray-100 text-gray-400" : "bg-amber-50 text-amber-600"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full inline-block ${sub.status === "active" ? "bg-green-400" : sub.status === "blocked" ? "bg-red-400" : "bg-gray-300"}`} />
                          {sub.status}
                        </span>
                      </div>
                      <div className="col-span-3 flex justify-end gap-2">
                        {sub.status !== "cancelled" && (
                          <button onClick={() => handleStatusToggle(sub.subscriptionId, sub.status)} disabled={statusBusy === sub.subscriptionId}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 ${sub.status === "active" ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}>
                            {statusBusy === sub.subscriptionId ? "…" : sub.status === "active" ? "Block" : "Reactivate"}
                          </button>
                        )}
                        {sub.status === "cancelled" && <span className="text-xs text-gray-300 italic">Cancelled by developer</span>}
                      </div>
                    </div>
                  ))}
                </div>
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
        <div className="animate-fade-in">
          <h2 className="font-bold text-gray-800 mb-2">Rate Limits</h2>

          {/* Mode Toggle */}
          <div className="flex gap-3 mb-6">
            <button onClick={() => setRlMode("global")}
              className={`flex-1 flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left
                ${rlMode === "global"
                  ? "border-teal-400 bg-teal-50"
                  : "border-gray-200 bg-white hover:border-gray-300"}`}>
              <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 flex items-center justify-center
                ${rlMode === "global" ? "border-teal-500" : "border-gray-300"}`}>
                {rlMode === "global" && <div className="w-2 h-2 rounded-full bg-teal-500" />}
              </div>
              <div>
                <p className={`text-sm font-bold ${rlMode === "global" ? "text-teal-700" : "text-gray-600"}`}>
                  🌐 Global Limits
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  One limit for all clients — simple setup
                </p>
              </div>
            </button>

            <button onClick={() => setRlMode("plan")}
              className={`flex-1 flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left
                ${rlMode === "plan"
                  ? "border-teal-400 bg-teal-50"
                  : "border-gray-200 bg-white hover:border-gray-300"}`}>
              <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 flex items-center justify-center
                ${rlMode === "plan" ? "border-teal-500" : "border-gray-300"}`}>
                {rlMode === "plan" && <div className="w-2 h-2 rounded-full bg-teal-500" />}
              </div>
              <div>
                <p className={`text-sm font-bold ${rlMode === "plan" ? "text-teal-700" : "text-gray-600"}`}>
                  📋 Plan-Based Limits
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Different limits per plan — per client independently
                </p>
              </div>
            </button>
          </div>


                {rlMode === "global" && (
                <>
                  {/* Global Limits */}
                  <div className="card p-6 mb-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-base">🌐</span>
                      <p className="text-sm font-bold text-gray-700">Global API Limits</p>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">Applies to all endpoints combined</span>
                    </div>

                    {(api.rateLimitPerMinute || api.rateLimitPerHour || api.rateLimitPerDay || api.rateLimitTotal) ? (
                      <div className="grid grid-cols-4 gap-3 mb-5">
                        {[
                          { label: "Per Minute", value: api.rateLimitPerMinute, icon: "⚡" },
                          { label: "Per Hour",   value: api.rateLimitPerHour,   icon: "🕐" },
                          { label: "Per Day",    value: api.rateLimitPerDay,    icon: "📅" },
                          { label: "Total",      value: api.rateLimitTotal,     icon: "∞"  },
                        ].filter(x => x.value).map(x => (
                          <div key={x.label} className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm">{x.icon}</span>
                              <span className="text-xs font-semibold text-teal-600">{x.label}</span>
                            </div>
                            <p className="text-2xl font-extrabold text-gray-800">{x.value?.toLocaleString()}</p>
                            <p className="text-xs text-gray-400">calls allowed</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-5 text-sm text-green-600 font-semibold">
                        ✅ No global limits — unlimited access
                      </div>
                    )}

                    <p className="text-xs text-gray-400 mb-4">Leave blank to remove a limit.</p>
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Per Minute" placeholder="e.g. 60" type="number"
                        value={rlForm.perMinute} onChange={e => setRlForm(p => ({ ...p, perMinute: e.target.value }))} />
                      <Input label="Per Hour" placeholder="e.g. 1000" type="number"
                        value={rlForm.perHour} onChange={e => setRlForm(p => ({ ...p, perHour: e.target.value }))} />
                      <Input label="Per Day" placeholder="e.g. 10000" type="number"
                        value={rlForm.perDay} onChange={e => setRlForm(p => ({ ...p, perDay: e.target.value }))} />
                      <Input label="Total (lifetime)" placeholder="e.g. 100000" type="number"
                        value={rlForm.total} onChange={e => setRlForm(p => ({ ...p, total: e.target.value }))} />
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
                          show("Global rate limits saved");
                          loadAll();
                        } catch (e: any) {
                          show(e.response?.data?.error || "Failed", "error");
                        } finally { setRlSaving(false); }
                      }}>
                      {rlSaving ? "Saving…" : "Save Global Limits"}
                    </Button>
                  </div>

                  {/* Per Endpoint Limits */}
                  <div className="card overflow-hidden">
                    <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-50">
                      <span className="text-base">⚡</span>
                      <p className="text-sm font-bold text-gray-700">Per Endpoint Limits</p>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">Override limits for specific endpoints</span>
                    </div>

                    {endpoints.length === 0 ? (
                      <div className="p-10 text-center">
                        <p className="text-gray-400 text-sm">No endpoints yet.</p>
                        <button onClick={() => setTab("endpoints")} className="text-teal-500 text-xs font-semibold mt-1">Add endpoints first →</button>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-[80px_1fr_100px_100px_100px_80px_110px] gap-2 px-6 py-2.5 bg-gray-50
                          text-xs font-bold text-gray-400 uppercase tracking-wider">
                          <div>Method</div>
                          <div>Path</div>
                          <div className="text-center">Per Min</div>
                          <div className="text-center">Per Hour</div>
                          <div className="text-center">Per Day</div>
                          <div className="text-center">Total</div>
                          <div className="text-right">Action</div>
                        </div>
                        <div className="divide-y divide-gray-50">
                          {endpoints.map(ep => (
                            <div key={ep.endpointId}
                              className={`grid grid-cols-[80px_1fr_100px_100px_100px_80px_110px] gap-2 px-6 py-3.5 items-center
                                ${ep.isBlocked ? "bg-red-50/30" : "hover:bg-gray-50"}`}>
                              <div><MethodBadge method={ep.httpMethod} /></div>
                              <div>
                                <code className="text-xs font-mono text-gray-700 truncate block">{ep.path}</code>
                                {ep.isBlocked && <span className="text-xs text-red-500 font-semibold">🚫 blocked</span>}
                              </div>
                              <div className="text-center">
                                {ep.rateLimitPerMinute
                                  ? <span className="text-xs bg-teal-50 text-teal-600 border border-teal-100 px-2 py-0.5 rounded-lg font-mono font-bold">{ep.rateLimitPerMinute}</span>
                                  : <span className="text-xs text-gray-300">∞</span>}
                              </div>
                              <div className="text-center">
                                {ep.rateLimitPerHour
                                  ? <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-lg font-mono font-bold">{ep.rateLimitPerHour}</span>
                                  : <span className="text-xs text-gray-300">∞</span>}
                              </div>
                              <div className="text-center">
                                {ep.rateLimitPerDay
                                  ? <span className="text-xs bg-purple-50 text-purple-600 border border-purple-100 px-2 py-0.5 rounded-lg font-mono font-bold">{ep.rateLimitPerDay}</span>
                                  : <span className="text-xs text-gray-300">∞</span>}
                              </div>
                              <div className="text-center">
                                {ep.rateLimitTotal
                                  ? <span className="text-xs bg-red-50 text-red-500 border border-red-100 px-2 py-0.5 rounded-lg font-mono font-bold">{ep.rateLimitTotal}</span>
                                  : <span className="text-xs text-gray-300">∞</span>}
                              </div>
                              <div className="flex justify-end">
                                <button onClick={() => {
                                  setEpRlTarget(ep);
                                  setEpRlForm({
                                    perMinute: ep.rateLimitPerMinute?.toString() ?? "",
                                    perHour:   ep.rateLimitPerHour?.toString()   ?? "",
                                    perDay:    ep.rateLimitPerDay?.toString()     ?? "",
                                    total:     ep.rateLimitTotal?.toString()      ?? "",
                                  });
                                  setEpRlModal(true);
                                }} className="text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap
                                  bg-gray-50 hover:bg-teal-50 text-gray-500 hover:text-teal-600
                                  border border-gray-200 hover:border-teal-200 transition-all">
                                  ✏️ Set Limit
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                          <p className="text-xs text-gray-400">
                            💡 Endpoint limits override global limits for that specific route. Leave unlimited to fall back to global limits.
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                    </>
                  )}


     {rlMode === "plan" && (
  <div className="card overflow-hidden">
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
      <div className="flex items-center gap-2">
        <span className="text-base">📋</span>
        <p className="text-sm font-bold text-gray-700">Plan-Based Rate Limits</p>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">
          Optional — per client plan
        </span>
      </div>
      <button onClick={() => setShowAddPlan(p => !p)}
        className="text-xs font-semibold px-3 py-1.5 grad-teal text-white rounded-lg hover:opacity-90 transition-all">
        {showAddPlan ? "✕ Cancel" : "+ Add Plan"}
      </button>
    </div>

    <div className="mx-6 mt-4 bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
      💡 When any request sends <code className="bg-white px-1 rounded">X-Client-Plan: professional</code> in the request,
      the gateway will apply that plan's limits <strong>per client</strong> independently.
      Leave empty to fall back to global limits.
    </div>

    {showAddPlan && (
      <div className="mx-6 mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-bold text-gray-600 mb-3 uppercase tracking-wider">New Plan Limit</p>
        <div className="grid grid-cols-5 gap-3 items-end">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1.5">Plan</label>
            <select value={newPlanForm.planName}
              onChange={e => setNewPlanForm(p => ({ ...p, planName: e.target.value as PlanName }))}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700
                focus:outline-none focus:border-teal-300 transition-all capitalize">
              {PLAN_NAMES.filter(p =>
                !planLimits.find(pl => pl.planName.toLowerCase() === p.toLowerCase())
              ).map(p => (
                <option key={p} value={p} className="capitalize">{p}</option>
              ))}
            </select>
          </div>
          <Input label="Per Minute" placeholder="e.g. 20" type="number"
            value={newPlanForm.perMinute}
            onChange={e => setNewPlanForm(p => ({ ...p, perMinute: e.target.value }))} />
          <Input label="Per Hour" placeholder="e.g. 500" type="number"
            value={newPlanForm.perHour}
            onChange={e => setNewPlanForm(p => ({ ...p, perHour: e.target.value }))} />
          <Input label="Per Day" placeholder="e.g. 2000" type="number"
            value={newPlanForm.perDay}
            onChange={e => setNewPlanForm(p => ({ ...p, perDay: e.target.value }))} />
          <Input label="Total" placeholder="e.g. 10000" type="number"
            value={newPlanForm.total}
            onChange={e => setNewPlanForm(p => ({ ...p, total: e.target.value }))} />
        </div>
        <button
          onClick={async () => {
            setPlanSaving(newPlanForm.planName);
            try {
              await savePlanLimit(apiId, {
                planName: newPlanForm.planName,
                rateLimitPerMinute: newPlanForm.perMinute ? Number(newPlanForm.perMinute) : null,
                rateLimitPerHour:   newPlanForm.perHour   ? Number(newPlanForm.perHour)   : null,
                rateLimitPerDay:    newPlanForm.perDay     ? Number(newPlanForm.perDay)    : null,
                rateLimitTotal:     newPlanForm.total      ? Number(newPlanForm.total)     : null,
              });
              show(`Plan limit saved for ${newPlanForm.planName}`);
              setShowAddPlan(false);
              setNewPlanForm({ planName: "starter", perMinute: "", perHour: "", perDay: "", total: "" });
              getPlanLimits(apiId).then(setPlanLimits);
            } catch (e: any) {
              show(e.response?.data?.error || "Failed", "error");
            } finally { setPlanSaving(null); }
          }}
          disabled={!!planSaving}
          className="mt-3 grad-teal text-white text-xs font-semibold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all">
          {planSaving ? "Saving…" : "Save Plan Limit"}
        </button>
      </div>
    )}

    {planLimits.length === 0 && !showAddPlan ? (
      <div className="p-10 text-center">
        <p className="text-gray-400 text-sm">No plan limits configured</p>
        <p className="text-gray-300 text-xs mt-1">Click "+ Add Plan" to define limits per plan</p>
      </div>
    ) : planLimits.length > 0 && (
      <>
        <div className="grid grid-cols-[140px_1fr_100px_100px_100px_80px_80px] gap-2 px-6 py-2.5 mt-4
          bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
          <div>Plan</div>
          <div />
          <div className="text-center">Per Min</div>
          <div className="text-center">Per Hour</div>
          <div className="text-center">Per Day</div>
          <div className="text-center">Total</div>
          <div className="text-right">Action</div>
        </div>
        <div className="divide-y divide-gray-50">
          {planLimits.map(pl => (
            <div key={pl.planName}
              className="grid grid-cols-[140px_1fr_100px_100px_100px_80px_80px] gap-2 px-6 py-3.5 items-center hover:bg-gray-50">
              <div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg capitalize
                  ${pl.planName === "enterprise"   ? "bg-purple-50 text-purple-600 border border-purple-100" :
                    pl.planName === "business"     ? "bg-blue-50 text-blue-600 border border-blue-100"       :
                    pl.planName === "professional" ? "bg-teal-50 text-teal-600 border border-teal-100"       :
                                                     "bg-gray-100 text-gray-500 border border-gray-200"}`}>
                  {pl.planName}
                </span>
              </div>
              <div />
              <div className="text-center">
                {pl.rateLimitPerMinute
                  ? <span className="text-xs bg-teal-50 text-teal-600 border border-teal-100 px-2 py-0.5 rounded-lg font-mono font-bold">{pl.rateLimitPerMinute}</span>
                  : <span className="text-xs text-gray-300">∞</span>}
              </div>
              <div className="text-center">
                {pl.rateLimitPerHour
                  ? <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-lg font-mono font-bold">{pl.rateLimitPerHour}</span>
                  : <span className="text-xs text-gray-300">∞</span>}
              </div>
              <div className="text-center">
                {pl.rateLimitPerDay
                  ? <span className="text-xs bg-purple-50 text-purple-600 border border-purple-100 px-2 py-0.5 rounded-lg font-mono font-bold">{pl.rateLimitPerDay}</span>
                  : <span className="text-xs text-gray-300">∞</span>}
              </div>
              <div className="text-center">
                {pl.rateLimitTotal
                  ? <span className="text-xs bg-red-50 text-red-500 border border-red-100 px-2 py-0.5 rounded-lg font-mono font-bold">{pl.rateLimitTotal}</span>
                  : <span className="text-xs text-gray-300">∞</span>}
              </div>
              <div className="flex justify-end">
                <button
                  onClick={async () => {
                    setPlanDeleting(pl.planName);
                    try {
                      await deletePlanLimit(apiId, pl.planName);
                      show(`${pl.planName} plan limit removed`);
                      getPlanLimits(apiId).then(setPlanLimits);
                    } catch (e: any) {
                      show(e.response?.data?.error || "Failed", "error");
                    } finally { setPlanDeleting(null); }
                  }}
                  disabled={planDeleting === pl.planName}
                  className="text-xs px-2.5 py-1.5 bg-red-50 text-red-400 hover:bg-red-100
                    rounded-lg transition-all disabled:opacity-50 font-semibold">
                  {planDeleting === pl.planName ? "…" : "✕"}
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            💡 Gateway checks <code className="bg-white px-1 rounded">X-Client-Plan</code> header →
            applies matching plan limit per <code className="bg-white px-1 rounded">X-Client-Id</code> independently.
            Falls back to global limits if no plan header sent.
          </p>
        </div>
      </>
    )}
  </div>
)}
        </div>
        )}



        {/* ── Access Control ──────────────────────────────────────────────── */}
        {tab === "restricted" && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-gray-800">Access Control</h2>
                <p className="text-gray-400 text-xs mt-0.5">This API is restricted — only allowed developers can see and subscribe to it</p>
              </div>
              <span className="bg-purple-50 text-purple-600 text-xs font-semibold px-3 py-1.5 rounded-xl border border-purple-100">
                🔒 Restricted Visibility
              </span>
            </div>
            <div className="grid grid-cols-2 gap-5">
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
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {dev.name?.[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-700 truncate">{dev.name}</p>
                            <p className="text-xs text-gray-400 truncate">{dev.email}</p>
                          </div>
                          <button onClick={async () => {
                            setRemovingDev(dev.userId);
                            try { await removeAllowedDeveloper(apiId, dev.userId); show("Access revoked"); loadRestricted(); }
                            catch (e: any) { show(e.response?.data?.error || "Failed", "error"); }
                            finally { setRemovingDev(null); }
                          }} disabled={removingDev === dev.userId}
                            className="opacity-0 group-hover:opacity-100 text-xs font-semibold px-2.5 py-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-all disabled:opacity-50">
                            {removingDev === dev.userId ? "…" : "Revoke"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {dev.name?.[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-700 truncate">{dev.name}</p>
                            <p className="text-xs text-gray-400 truncate">{dev.email}</p>
                          </div>
                          <button onClick={async () => {
                            setAddingDev(dev.userId);
                            try { await addAllowedDeveloper(apiId, dev.userId); show(`Access granted to ${dev.name}`); loadRestricted(); }
                            catch (e: any) { show(e.response?.data?.error || "Failed", "error"); }
                            finally { setAddingDev(null); }
                          }} disabled={addingDev === dev.userId}
                            className="opacity-0 group-hover:opacity-100 text-xs font-semibold px-2.5 py-1.5 bg-teal-50 text-teal-600 hover:bg-teal-100 rounded-lg transition-all disabled:opacity-50">
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
                {["SWAGGER", "HOWTO", "SAMPLE", "CHANGELOG", "OTHER"].map(t => (
                  <option key={t}>{t}</option>
                ))}           
             </Select>
            <Textarea label="Content" rows={5} value={docForm.contentText}
              onChange={e => setDocForm(p => ({ ...p, contentText: e.target.value }))} />
            <Input label="External URL" placeholder="https://docs.example.com" value={docForm.contentUrl}
              onChange={e => setDocForm(p => ({ ...p, contentUrl: e.target.value }))} />
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

      {editModal && (
        <Modal title="Edit API" onClose={() => setEditModal(false)}>
          <div className="flex flex-col gap-4">
            <Input label="API Name *" value={editForm.apiName}
              onChange={e => setEditForm(p => ({ ...p, apiName: e.target.value }))} />
            <Input label="Base URL *" value={editForm.baseUrl}
              onChange={e => setEditForm(p => ({ ...p, baseUrl: e.target.value }))} />
            <Textarea label="Description" rows={3} value={editForm.description}
              onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
            <Select label="Visibility" value={editForm.visibility}
              onChange={e => setEditForm(p => ({ ...p, visibility: e.target.value }))}>
              <option value="public">🌐 Public — visible in marketplace</option>
              <option value="private">🔒 Private — org members only</option>
              <option value="restricted">🎯 Restricted — specific developers only</option>
            </Select>
            <Button variant="primary" disabled={editSaving} className="w-full"
              onClick={async () => {
                if (!editForm.apiName || !editForm.baseUrl) return show("Name and URL required", "error");
                setEditSaving(true);
                try {
                  await updateApi(apiId, editForm);
                  show("API updated");
                  setEditModal(false);
                  loadAll();
                } catch (e: any) {
                  show(e.response?.data?.error || "Failed to update", "error");
                } finally { setEditSaving(false); }
              }}>
              {editSaving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </Modal>
      )}

      {epRlModal && epRlTarget && (
        <Modal title="Endpoint Rate Limits" onClose={() => setEpRlModal(false)}>
          <div className="flex flex-col gap-4">
            <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
              <MethodBadge method={epRlTarget.httpMethod} />
              <code className="text-sm font-mono text-gray-700">{epRlTarget.path}</code>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
              💡 Endpoint limits are checked <strong>before</strong> API level limits.
              Leave blank to remove the limit for this endpoint.
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Per Minute" placeholder="e.g. 30" type="number"
                value={epRlForm.perMinute}
                onChange={e => setEpRlForm(p => ({ ...p, perMinute: e.target.value }))} />
              <Input label="Per Hour" placeholder="e.g. 500" type="number"
                value={epRlForm.perHour}
                onChange={e => setEpRlForm(p => ({ ...p, perHour: e.target.value }))} />
              <Input label="Per Day" placeholder="e.g. 5000" type="number"
                value={epRlForm.perDay}
                onChange={e => setEpRlForm(p => ({ ...p, perDay: e.target.value }))} />
              <Input label="Total (lifetime)" placeholder="e.g. 100" type="number"
                value={epRlForm.total}
                onChange={e => setEpRlForm(p => ({ ...p, total: e.target.value }))} />
            </div>
            {(epRlTarget.rateLimitPerMinute || epRlTarget.rateLimitPerHour || epRlTarget.rateLimitPerDay || epRlTarget.rateLimitTotal) && (
              <button onClick={() => setEpRlForm({ perMinute: "", perHour: "", perDay: "", total: "" })}
                className="text-xs text-red-400 hover:text-red-600 font-semibold text-left">
                ✕ Clear all limits for this endpoint
              </button>
            )}
            <Button variant="primary" disabled={epRlSaving} className="w-full"
              onClick={async () => {
                setEpRlSaving(true);
                try {
                  await updateEndpoint(epRlTarget.endpointId, {
                    rateLimitPerMinute: epRlForm.perMinute ? Number(epRlForm.perMinute) : -1,
                    rateLimitPerHour:   epRlForm.perHour   ? Number(epRlForm.perHour)   : -1,
                    rateLimitPerDay:    epRlForm.perDay     ? Number(epRlForm.perDay)    : -1,
                    rateLimitTotal:     epRlForm.total      ? Number(epRlForm.total)     : -1,
                  });
                  show("Endpoint rate limits saved");
                  setEpRlModal(false);
                  getEndpoints(apiId).then(setEndpoints);
                } catch (e: any) {
                  show(e.response?.data?.error || "Failed", "error");
                } finally { setEpRlSaving(false); }
              }}>
              {epRlSaving ? "Saving…" : "Save Limits"}
            </Button>
          </div>
        </Modal>
      )}

      {blockModal && blockTarget && (
        <Modal title={blockTarget === "api" ? "Block Entire API" : "Block Endpoint"}
          onClose={() => setBlockModal(false)}>
          <div className="flex flex-col gap-4">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              {blockTarget === "api" ? (
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🚫</span>
                  <div>
                    <p className="font-bold text-red-700">{api.apiName}</p>
                    <p className="text-xs text-red-500 mt-0.5">All developers will immediately get 503 errors</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🚫</span>
                  <div className="flex items-center gap-2">
                    <MethodBadge method={(blockTarget as ApiEndpoint).httpMethod} />
                    <code className="text-sm font-mono text-red-700">{(blockTarget as ApiEndpoint).path}</code>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
              ⚠️ This takes effect immediately. Developers will receive:
              <code className="block mt-1 bg-white border border-amber-100 rounded p-2 text-amber-600">
                503 — {blockTarget === "api" ? "API" : "Endpoint"} temporarily unavailable
              </code>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                Reason (shown to developers)
              </label>
              <input value={blockReason} onChange={e => setBlockReason(e.target.value)}
                placeholder="e.g. Under maintenance, Security patch in progress…"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5
                  text-sm text-gray-700 focus:outline-none focus:border-red-300 transition-all" />
            </div>

            <div className="flex gap-3">
              <button onClick={async () => {
                setBlockSaving(true);
                try {
                  if (blockTarget === "api") {
                    await blockApi(apiId, blockReason);
                    show("API blocked — all developers getting 503");
                  } else {
                    await blockEndpoint((blockTarget as ApiEndpoint).endpointId, blockReason);
                    show("Endpoint blocked");
                    getEndpoints(apiId).then(setEndpoints);
                  }
                  setBlockModal(false);
                  loadAll();
                } catch (e: any) {
                  show(e.response?.data?.error || "Failed", "error");
                } finally { setBlockSaving(false); }
              }} disabled={blockSaving}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white
                  text-sm font-bold rounded-xl transition-all disabled:opacity-50">
                {blockSaving ? "…" : "🚫 Confirm Block"}
              </button>
              <Button variant="secondary" onClick={() => setBlockModal(false)}>Cancel</Button>
            </div>
          </div>
        </Modal>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </DashboardLayout>
  );
}
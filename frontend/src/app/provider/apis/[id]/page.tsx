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
  addEndpoint, deleteEndpoint, addDocument, deleteDocument,updateRateLimits,
} from "@/lib/registry";
import {
  Api, ApiEndpoint, ApiDocument, ToastState, HttpMethod,
  CreateEndpointRequest, CreateDocumentRequest,
} from "@/types/api";


type Tab = "endpoints" | "documents" | "versions" | "ratelimits";

export default function ApiDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const apiId   = Number(id);

  const [api, setApi]             = useState<Api | null>(null);
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [versions, setVersions]   = useState<Api[]>([]);
  const [tab, setTab]             = useState<Tab>("endpoints");
  const [toast, setToast]         = useState<ToastState | null>(null);
  const [lcBusy, setLcBusy]       = useState(false);


  const [rlForm, setRlForm] = useState({ perMinute: "", perHour: "", perDay: "", total: "" });
  const [rlSaving, setRlSaving] = useState(false);

  // modals
  const [epModal,  setEpModal]  = useState(false);
  const [docModal, setDocModal] = useState(false);
  const [verModal, setVerModal] = useState(false);

  // forms
  const [epForm, setEpForm]   = useState<CreateEndpointRequest>({ httpMethod: "GET", path: "", description: "", isAuthenticated: true });
  const [docForm, setDocForm] = useState<CreateDocumentRequest>({ title: "", docType: "markdown", content: "", docUrl: "" });
  const [newVer, setNewVer]   = useState("");

  const show = (message: string, type: ToastState["type"] = "success") => setToast({ message, type });

  const loadAll = useCallback(() => {
    getApiById(apiId).then(setApi).catch(() => router.push("/provider/apis"));
    getEndpoints(apiId).then(setEndpoints).catch(() => {});
    getDocuments(apiId).then(setDocuments).catch(() => {});
    getVersions(apiId).then(setVersions).catch(() => {});
  }, [apiId, router]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const lifecycle = async (fn: () => Promise<unknown>, label: string) => {
    setLcBusy(true);
    try { await fn(); show(`API ${label}`); loadAll(); }
    catch (e: any) { show(e.response?.data?.error || `Failed to ${label}`, "error"); }
    setLcBusy(false);
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

  if (!api) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64 text-gray-400 animate-pulse">Loading…</div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="p-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <Link href="/provider/apis"
              className="w-9 h-9 bg-white rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:shadow transition-all mt-1">
              ←
            </Link>
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <div className="w-10 h-10 rounded-xl grad-teal flex items-center justify-center text-white font-bold shadow-sm">
                  {api.apiName[0]?.toUpperCase()}
                </div>
                <h1 className="text-xl font-extrabold text-gray-800">{api.apiName}</h1>
                <span className="text-teal-600 font-mono text-xs bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-lg">{api.version}</span>
                <StatusBadge status={api.status} />
              </div>
              <p className="text-gray-400 text-sm ml-14">{api.description || "No description"}</p>
              <p className="text-gray-300 font-mono text-xs ml-14 mt-0.5">{api.baseUrl}</p>
            </div>
          </div>

          {/* Lifecycle buttons */}
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

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
          {(["endpoints", "documents", "versions", "ratelimits"] as Tab[]).map((t) => {
            const count = t === "endpoints" ? endpoints.length : t === "documents" ? documents.length : t === "versions" ? versions.length : 0;
            return (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all capitalize
                  ${tab === t ? "bg-white text-teal-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                {t === "ratelimits" ? "Rate Limits" : t} {t !== "ratelimits" && <span className="text-xs opacity-50">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Endpoints */}
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
                  {endpoints.map((ep) => (
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

        {/* Documents */}
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
                {documents.map((doc) => (
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

        {/* Versions */}
        {tab === "versions" && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-800">Versions</h2>
              <Button variant="primary" onClick={() => setVerModal(true)}>+ New Version</Button>
            </div>
            <div className="card overflow-hidden">
              <div className="divide-y divide-gray-50">
                {versions.map((v) => (
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
      </div>

      {/* Endpoint Modal */}
      {epModal && (
        <Modal title="Add Endpoint" onClose={() => setEpModal(false)}>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Select label="Method" value={epForm.httpMethod}
                onChange={(e) => setEpForm((p) => ({ ...p, httpMethod: e.target.value as HttpMethod }))}>
                {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => <option key={m}>{m}</option>)}
              </Select>
              <Input label="Path *" placeholder="/users/{id}" value={epForm.path}
                onChange={(e) => setEpForm((p) => ({ ...p, path: e.target.value }))} />
            </div>
            <Textarea label="Description" rows={2} value={epForm.description}
              onChange={(e) => setEpForm((p) => ({ ...p, description: e.target.value }))} />
            <Textarea label="Request Schema" rows={3} placeholder='{"name":"string"}' value={epForm.requestSchema}
              onChange={(e) => setEpForm((p) => ({ ...p, requestSchema: e.target.value }))} />
            <Textarea label="Response Schema" rows={3} placeholder='{"id":1}' value={epForm.responseSchema}
              onChange={(e) => setEpForm((p) => ({ ...p, responseSchema: e.target.value }))} />
            <label className="flex items-center gap-3 cursor-pointer text-sm text-gray-600">
              <input type="checkbox" checked={epForm.isAuthenticated}
                onChange={(e) => setEpForm((p) => ({ ...p, isAuthenticated: e.target.checked }))}
                className="w-4 h-4 accent-teal-500" />
              Requires Authentication
            </label>
            <Button variant="primary" onClick={submitEndpoint} className="w-full">Add Endpoint</Button>
          </div>
        </Modal>
      )}

      {/* Document Modal */}
      {docModal && (
        <Modal title="Add Document" onClose={() => setDocModal(false)}>
          <div className="flex flex-col gap-4">
            <Input label="Title *" value={docForm.title}
              onChange={(e) => setDocForm((p) => ({ ...p, title: e.target.value }))} />
            <Select label="Type" value={docForm.docType}
              onChange={(e) => setDocForm((p) => ({ ...p, docType: e.target.value }))}>
              {["markdown", "howto", "samples", "publicforum", "support"].map((t) => <option key={t}>{t}</option>)}
            </Select>
            <Textarea label="Content" rows={5} value={docForm.content}
              onChange={(e) => setDocForm((p) => ({ ...p, content: e.target.value }))} />
            <Input label="External URL" placeholder="https://docs.example.com" value={docForm.docUrl}
              onChange={(e) => setDocForm((p) => ({ ...p, docUrl: e.target.value }))} />
            <Button variant="primary" onClick={submitDoc} className="w-full">Add Document</Button>
          </div>
        </Modal>
      )}

      {/* Version Modal */}
      {verModal && (
        <Modal title="Create New Version" onClose={() => setVerModal(false)} size="sm">
          <div className="flex flex-col gap-4">
            <div className="bg-teal-50 rounded-xl p-3 text-xs text-teal-700">
              New version of <strong>{api.apiName}</strong>
            </div>
            <Input label="Version *" placeholder="v2.0" value={newVer}
              onChange={(e) => setNewVer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitVersion()} />
            <Button variant="primary" onClick={submitVersion} className="w-full">Create Version</Button>
          </div>
        </Modal>
      )}

      {/* Rate Limits */}
        {tab === "ratelimits" && (
          <div className="animate-fade-in max-w-md">
            <h2 className="font-bold text-gray-800 mb-4">Rate Limits</h2>
            <div className="card p-6">
              <p className="text-xs text-gray-400 mb-5">Leave blank to disable a limit.</p>
              <div className="flex flex-col gap-4">
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
                <Button variant="primary" disabled={rlSaving}
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
                    } catch (e: any) {
                      show(e.response?.data?.error || "Failed", "error");
                    } finally { setRlSaving(false); }
                  }}>
                  {rlSaving ? "Saving…" : "Save Rate Limits"}
                </Button>
              </div>
            </div>

            {(api.rateLimitPerMinute || api.rateLimitPerHour || api.rateLimitPerDay || api.rateLimitTotal) && (
              <div className="mt-4 bg-teal-50 border border-teal-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-teal-600 mb-3">Current Limits</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  {api.rateLimitPerMinute && <span>Per minute: <strong>{api.rateLimitPerMinute}</strong></span>}
                  {api.rateLimitPerHour   && <span>Per hour: <strong>{api.rateLimitPerHour}</strong></span>}
                  {api.rateLimitPerDay    && <span>Per day: <strong>{api.rateLimitPerDay}</strong></span>}
                  {api.rateLimitTotal     && <span>Total: <strong>{api.rateLimitTotal}</strong></span>}
                </div>
              </div>
            )}
          </div>
        )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </DashboardLayout>
  );
}
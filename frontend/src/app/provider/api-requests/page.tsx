"use client";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Modal from "@/components/ui/Modal";
import Toast from "@/components/ui/Toast";
import { Button } from "@/components/ui/FormFields";
import { ToastState } from "@/types/api";
import apiClient from "@/lib/api";

interface ApiRequestItem {
  requestId: number;
  apiName: string;
  description: string;
  baseUrl: string;
  visibility: string;
  status: string;
  rejectionReason: string | null;
  feedback: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  submittedByName: string;
  categoryName: string | null;
  createdApiId: number | null;
  endpoints: { httpMethod: string; path: string; description: string }[];
}

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: string; label: string }> = {
  pending:           { bg: "bg-amber-50",  text: "text-amber-600",  icon: "⏳", label: "Pending"           },
  approved:          { bg: "bg-green-50",  text: "text-green-600",  icon: "✅", label: "Approved"          },
  rejected:          { bg: "bg-red-50",    text: "text-red-600",    icon: "❌", label: "Rejected"          },
  changes_requested: { bg: "bg-blue-50",   text: "text-blue-600",   icon: "🔄", label: "Changes Requested" },
};

const METHOD_COLORS: Record<string, string> = {
  GET:    "bg-green-50 text-green-600 border-green-100",
  POST:   "bg-blue-50  text-blue-600  border-blue-100",
  PUT:    "bg-amber-50 text-amber-600 border-amber-100",
  PATCH:  "bg-purple-50 text-purple-600 border-purple-100",
  DELETE: "bg-red-50   text-red-500   border-red-100",
};

export default function ProviderApiRequestsPage() {
  const [requests,    setRequests]    = useState<ApiRequestItem[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState("pending");
  const [toast,       setToast]       = useState<ToastState | null>(null);
  const [busy,        setBusy]        = useState<number | null>(null);
  const [selected,    setSelected]    = useState<ApiRequestItem | null>(null);
  const [rejectModal, setRejectModal] = useState(false);
  const [changeModal, setChangeModal] = useState(false);
  const [reason,      setReason]      = useState("");
  const [feedback,    setFeedback]    = useState("");

  const show = (message: string, type: ToastState["type"] = "success") =>
    setToast({ message, type });

  const load = () => {
    setLoading(true);
    apiClient.get(`/api/requests/org${filter !== "all" ? `?status=${filter}` : ""}`)
      .then(r => setRequests(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const handleApprove = async (req: ApiRequestItem) => {
    setBusy(req.requestId);
    try {
      const res = await apiClient.patch(`/api/requests/${req.requestId}/approve`);
      show(`"${req.apiName}" approved — API created as draft!`);
      load();
    } catch (e: any) {
      show(e.response?.data?.error || "Failed to approve", "error");
    } finally { setBusy(null); }
  };

  const handleReject = async () => {
    if (!selected || !reason.trim()) return show("Please provide a reason", "error");
    setBusy(selected.requestId);
    try {
      await apiClient.patch(`/api/requests/${selected.requestId}/reject`, { reason });
      show(`"${selected.apiName}" rejected`);
      setRejectModal(false);
      setReason("");
      setSelected(null);
      load();
    } catch (e: any) {
      show(e.response?.data?.error || "Failed to reject", "error");
    } finally { setBusy(null); }
  };

  const handleChanges = async () => {
    if (!selected || !feedback.trim()) return show("Please provide feedback", "error");
    setBusy(selected.requestId);
    try {
      await apiClient.patch(`/api/requests/${selected.requestId}/changes`, { feedback });
      show(`Feedback sent to developer`);
      setChangeModal(false);
      setFeedback("");
      setSelected(null);
      load();
    } catch (e: any) {
      show(e.response?.data?.error || "Failed", "error");
    } finally { setBusy(null); }
  };

  const pending  = requests.filter(r => r.status === "pending").length;

  return (
    <DashboardLayout>
      <div className="p-8 animate-fade-in">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-teal-500 text-xs font-bold uppercase tracking-wider mb-1">Provider Portal</p>
            <h1 className="text-2xl font-extrabold text-gray-800">API Requests</h1>
            <p className="text-gray-400 text-sm mt-1">
              Review API submissions from developers in your organization
            </p>
          </div>
          {pending > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-center">
              <p className="text-2xl font-extrabold text-amber-600">{pending}</p>
              <p className="text-xs text-amber-500 font-semibold">Pending Review</p>
            </div>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
          {[
            { key: "pending",           label: "⏳ Pending"  },
            { key: "approved",          label: "✅ Approved" },
            { key: "rejected",          label: "❌ Rejected" },
            { key: "changes_requested", label: "🔄 Changes"  },
            { key: "all",               label: "All"         },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all
                ${filter === f.key
                  ? "bg-white text-teal-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {!loading && requests.length === 0 && (
          <div className="card p-20 text-center">
            <div className="text-5xl mb-4 opacity-30">📬</div>
            <p className="text-gray-400 text-sm">
              No {filter !== "all" ? filter.replace("_", " ") : ""} requests yet
            </p>
          </div>
        )}

        {/* Request cards */}
        {!loading && requests.length > 0 && (
          <div className="flex flex-col gap-4">
            {requests.map(req => {
              const s = STATUS_STYLES[req.status] ?? STATUS_STYLES.pending;
              return (
                <div key={req.requestId} className="card overflow-hidden">

                  {/* Card main */}
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-11 h-11 rounded-xl grad-teal flex items-center justify-center
                          text-white font-bold text-lg flex-shrink-0">
                          {req.apiName[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-extrabold text-gray-800">{req.apiName}</h3>
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                              inline-flex items-center gap-1 ${s.bg} ${s.text}`}>
                              {s.icon} {s.label}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                              ${req.visibility === "public"     ? "bg-green-50 text-green-600"   :
                                req.visibility === "private"    ? "bg-orange-50 text-orange-500" :
                                                                  "bg-purple-50 text-purple-600"}`}>
                              {req.visibility}
                            </span>
                          </div>
                          <p className="text-gray-400 text-xs truncate">{req.description || "No description"}</p>
                          <p className="text-gray-300 font-mono text-xs mt-0.5 truncate">{req.baseUrl}</p>
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-semibold text-gray-600">{req.submittedByName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Submitted {fmt(req.submittedAt)}</p>
                      </div>
                    </div>

                    {/* Endpoints preview */}
                    {req.endpoints?.length > 0 && (
                      <div className="mt-4 border border-gray-100 rounded-xl overflow-hidden">
                        {req.endpoints.slice(0, 3).map((ep, i) => (
                          <div key={i} className="flex items-center gap-3 px-4 py-2.5
                            border-b border-gray-50 last:border-b-0 bg-gray-50">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded border
                              min-w-[52px] text-center
                              ${METHOD_COLORS[ep.httpMethod] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                              {ep.httpMethod}
                            </span>
                            <code className="text-xs font-mono text-gray-700 flex-1">{ep.path}</code>
                            <span className="text-xs text-gray-400 truncate max-w-[200px]">
                              {ep.description || "—"}
                            </span>
                          </div>
                        ))}
                        {req.endpoints.length > 3 && (
                          <div className="px-4 py-2 bg-gray-50 text-xs text-gray-400 text-center">
                            +{req.endpoints.length - 3} more endpoints
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action buttons — only for pending */}
                    {req.status === "pending" && (
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
                        <Button variant="primary" disabled={busy === req.requestId}
                          onClick={() => handleApprove(req)}
                          className="flex-1">
                          {busy === req.requestId ? "…" : "✅ Approve"}
                        </Button>
                        <button onClick={() => { setSelected(req); setChangeModal(true); }}
                          className="flex-1 px-4 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100
                            text-sm font-semibold rounded-xl transition-all">
                          🔄 Request Changes
                        </button>
                        <button onClick={() => { setSelected(req); setRejectModal(true); }}
                          className="flex-1 px-4 py-2.5 bg-red-50 text-red-500 hover:bg-red-100
                            text-sm font-semibold rounded-xl transition-all">
                          ❌ Reject
                        </button>
                      </div>
                    )}

                    {/* Approved — link to API */}
                    {req.status === "approved" && req.createdApiId && (
                      <div className="mt-4 pt-4 border-t border-gray-50">
                        <a href={`/provider/apis/${req.createdApiId}`}
                          className="text-xs font-semibold text-teal-500 hover:text-teal-600">
                          View Created API →
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-gray-200 rounded-xl" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && selected && (
        <Modal title="Reject Request" onClose={() => { setRejectModal(false); setReason(""); }}>
          <div className="flex flex-col gap-4">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <p className="text-sm font-bold text-red-700">{selected.apiName}</p>
              <p className="text-xs text-red-500 mt-0.5">by {selected.submittedByName}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                Rejection Reason *
              </label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={4}
                placeholder="Explain why this request is being rejected…"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm
                  text-gray-700 focus:outline-none focus:border-red-300 focus:ring-2
                  focus:ring-red-100 transition-all resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={handleReject} disabled={busy !== null}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white
                  text-sm font-bold rounded-xl transition-all disabled:opacity-50">
                {busy !== null ? "…" : "Confirm Reject"}
              </button>
              <Button variant="secondary" onClick={() => { setRejectModal(false); setReason(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Request Changes Modal */}
      {changeModal && selected && (
        <Modal title="Request Changes" onClose={() => { setChangeModal(false); setFeedback(""); }}>
          <div className="flex flex-col gap-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-sm font-bold text-blue-700">{selected.apiName}</p>
              <p className="text-xs text-blue-500 mt-0.5">by {selected.submittedByName}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                Feedback for Developer *
              </label>
              <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={4}
                placeholder="What needs to be changed? Be specific…"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm
                  text-gray-700 focus:outline-none focus:border-blue-300 focus:ring-2
                  focus:ring-blue-100 transition-all resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={handleChanges} disabled={busy !== null}
                className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white
                  text-sm font-bold rounded-xl transition-all disabled:opacity-50">
                {busy !== null ? "…" : "Send Feedback"}
              </button>
              <Button variant="secondary" onClick={() => { setChangeModal(false); setFeedback(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </DashboardLayout>
  );
}
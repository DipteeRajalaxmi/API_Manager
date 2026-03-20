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

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  pending:           { bg: "bg-amber-50",  text: "text-amber-600", dot: "bg-amber-400", label: "Pending"           },
  approved:          { bg: "bg-green-50",  text: "text-green-600", dot: "bg-green-400", label: "Approved"          },
  rejected:          { bg: "bg-red-50",    text: "text-red-500",   dot: "bg-red-400",   label: "Rejected"          },
  changes_requested: { bg: "bg-blue-50",   text: "text-blue-600",  dot: "bg-blue-400",  label: "Changes Requested" },
};

const METHOD_COLORS: Record<string, string> = {
  GET:    "bg-green-50 text-green-600 border-green-100",
  POST:   "bg-blue-50  text-blue-600  border-blue-100",
  PUT:    "bg-amber-50 text-amber-600 border-amber-100",
  PATCH:  "bg-purple-50 text-purple-600 border-purple-100",
  DELETE: "bg-red-50   text-red-500   border-red-100",
};

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function ProviderApiRequestsPage() {
  const [requests,    setRequests]    = useState<ApiRequestItem[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState("pending");
  const [toast,       setToast]       = useState<ToastState | null>(null);
  const [busy,        setBusy]        = useState<number | null>(null);
  const [selected,    setSelected]    = useState<ApiRequestItem | null>(null);
  const [rejectModal, setRejectModal] = useState(false);
  const [changeModal, setChangeModal] = useState(false);
  const [expandedId,  setExpandedId]  = useState<number | null>(null);
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

  const handleApprove = async (req: ApiRequestItem) => {
    setBusy(req.requestId);
    try {
      await apiClient.patch(`/api/requests/${req.requestId}/approve`);
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
      setRejectModal(false); setReason(""); setSelected(null); load();
    } catch (e: any) {
      show(e.response?.data?.error || "Failed to reject", "error");
    } finally { setBusy(null); }
  };

  const handleChanges = async () => {
    if (!selected || !feedback.trim()) return show("Please provide feedback", "error");
    setBusy(selected.requestId);
    try {
      await apiClient.patch(`/api/requests/${selected.requestId}/changes`, { feedback });
      show("Feedback sent to developer");
      setChangeModal(false); setFeedback(""); setSelected(null); load();
    } catch (e: any) {
      show(e.response?.data?.error || "Failed", "error");
    } finally { setBusy(null); }
  };

  const counts = {
    pending:           requests.filter(r => r.status === "pending").length,
    approved:          requests.filter(r => r.status === "approved").length,
    rejected:          requests.filter(r => r.status === "rejected").length,
    changes_requested: requests.filter(r => r.status === "changes_requested").length,
  };

  return (
    <DashboardLayout>
      <div className="p-8 animate-fade-in">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <p className="text-teal-500 text-xs font-bold uppercase tracking-wider mb-1">
              Provider Portal
            </p>
            <h1 className="text-2xl font-extrabold text-gray-800">API Requests</h1>
            <p className="text-gray-400 text-sm mt-1">
              Review API submissions from developers in your organization
            </p>
          </div>
          <div className="flex items-center gap-3">
            {[
              { label:"Pending",  val:counts.pending,           color:"text-amber-600", bg:"bg-amber-50",  border:"border-amber-100" },
              { label:"Approved", val:counts.approved,          color:"text-green-600", bg:"bg-green-50",  border:"border-green-100" },
              { label:"Changes",  val:counts.changes_requested, color:"text-blue-600",  bg:"bg-blue-50",   border:"border-blue-100"  },
            ].map(s => (
              <div key={s.label}
                className={`${s.bg} border ${s.border} rounded-2xl px-4 py-2.5 text-center min-w-[68px]`}>
                <p className={`text-xl font-extrabold ${s.color}`}>{s.val}</p>
                <p className={`text-xs font-semibold ${s.color} opacity-70`}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Filter tabs ── */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-2xl p-1 w-fit">
          {[
            { key:"pending",           label:"Pending",  count:counts.pending           },
            { key:"approved",          label:"Approved", count:counts.approved          },
            { key:"rejected",          label:"Rejected", count:counts.rejected          },
            { key:"changes_requested", label:"Changes",  count:counts.changes_requested },
            { key:"all",               label:"All",      count:requests.length          },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all
                ${filter === f.key
                  ? "bg-white text-teal-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"}`}>
              {f.label}
              {f.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
                  ${filter === f.key ? "bg-teal-50 text-teal-500" : "bg-gray-200 text-gray-400"}`}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex flex-col gap-4">
            {[...Array(3)].map((_,i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-gray-200 rounded-2xl flex-shrink-0"/>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded-lg w-1/3 mb-2"/>
                    <div className="h-3 bg-gray-100 rounded-lg w-1/2"/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && requests.length === 0 && (
          <div className="card p-20 text-center border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl opacity-40">📬</span>
            </div>
            <p className="font-bold text-gray-600 mb-1">
              No {filter !== "all" ? filter.replace("_"," ") : ""} requests yet
            </p>
            <p className="text-gray-400 text-sm">
              They'll appear here when developers submit API proposals
            </p>
          </div>
        )}

        {/* ── Cards ── */}
        {!loading && requests.length > 0 && (
          <div className="flex flex-col gap-4">
            {requests.map((req, idx) => {
              const s        = STATUS_STYLES[req.status] ?? STATUS_STYLES.pending;
              const expanded = expandedId === req.requestId;
              const accentColor =
                req.status === "pending"           ? "#f59e0b" :
                req.status === "approved"          ? "#22c55e" :
                req.status === "rejected"          ? "#ef4444" :
                req.status === "changes_requested" ? "#3b82f6" : "#e2e8f0";

              return (
                <div key={req.requestId}
                  className="card overflow-hidden hover:shadow-md transition-all"
                  style={{ animationDelay:`${idx*40}ms` }}>
                  <div className="flex">

                    {/* Left accent */}
                    <div className="w-1 flex-shrink-0 rounded-l-2xl"
                      style={{ background: accentColor }}/>

                    <div className="flex-1 p-6">

                      {/* Main row */}
                      <div className="flex items-start justify-between gap-4 mb-0">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          {/* Avatar */}
                          <div className="w-11 h-11 rounded-2xl flex-shrink-0 flex items-center
                            justify-center text-white font-extrabold text-base shadow-sm"
                            style={{ background:`linear-gradient(135deg,
                              hsl(${175+idx*20},65%,44%),hsl(${195+idx*20},70%,40%))` }}>
                            {req.apiName[0]?.toUpperCase()}
                          </div>

                          {/* Text */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-extrabold text-gray-800">{req.apiName}</h3>
                              <span className={`inline-flex items-center gap-1.5 text-xs
                                font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full inline-block ${s.dot}`}/>
                                {s.label}
                              </span>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                                ${req.visibility === "public"  ? "bg-green-50 text-green-600"   :
                                  req.visibility === "private" ? "bg-orange-50 text-orange-500" :
                                                                  "bg-purple-50 text-purple-600"}`}>
                                {req.visibility}
                              </span>
                              {req.categoryName && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full
                                  bg-gray-100 text-gray-500">
                                  {req.categoryName}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-400 text-xs truncate mb-0.5">
                              {req.description || "No description"}
                            </p>
                            <p className="text-gray-300 font-mono text-xs truncate">
                              {req.baseUrl}
                            </p>
                          </div>
                        </div>

                        {/* Submitter */}
                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-2 justify-end mb-1">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400
                              to-purple-400 flex items-center justify-center
                              text-white text-xs font-bold">
                              {req.submittedByName?.[0]?.toUpperCase()}
                            </div>
                            <span className="text-xs font-semibold text-gray-600">
                              {req.submittedByName}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">{fmt(req.submittedAt)}</p>
                          {req.reviewedAt && (
                            <p className="text-xs text-teal-500 mt-0.5">
                              Reviewed {fmt(req.reviewedAt)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Rejection / feedback inline */}
                      {req.status === "rejected" && req.rejectionReason && (
                        <div className="mt-4 bg-red-50 border border-red-100 rounded-xl p-3.5">
                          <p className="text-xs font-bold text-red-400 uppercase tracking-wide mb-1"
                            style={{ fontSize:10 }}>Rejection Reason</p>
                          <p className="text-xs text-red-600">{req.rejectionReason}</p>
                        </div>
                      )}
                      {req.status === "changes_requested" && req.feedback && (
                        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-3.5">
                          <p className="text-xs font-bold text-blue-400 uppercase tracking-wide mb-1"
                            style={{ fontSize:10 }}>Feedback for Developer</p>
                          <p className="text-xs text-blue-600">{req.feedback}</p>
                        </div>
                      )}

                      {/* Endpoints toggle */}
                      {req.endpoints?.length > 0 && (
                        <div className="mt-4">
                          <button
                            onClick={() => setExpandedId(expanded ? null : req.requestId)}
                            className="flex items-center gap-1.5 text-xs font-semibold
                              text-gray-400 hover:text-teal-500 transition-colors mb-2">
                            <svg width="11" height="11" fill="none" viewBox="0 0 24 24"
                              stroke="currentColor" strokeWidth={2.5}
                              style={{ transform:expanded?"rotate(90deg)":"none",
                                transition:"transform .2s" }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                            </svg>
                            {expanded ? "Hide" : "Show"} {req.endpoints.length} endpoint{req.endpoints.length !== 1 ? "s" : ""}
                          </button>

                          {expanded && (
                            <div className="border border-gray-100 rounded-xl overflow-hidden">
                              {req.endpoints.map((ep, i) => (
                                <div key={i} className="flex items-center gap-3 px-4 py-2.5
                                  border-b border-gray-50 last:border-0 bg-gray-50
                                  hover:bg-white transition-colors">
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border
                                    min-w-[52px] text-center
                                    ${METHOD_COLORS[ep.httpMethod] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                                    {ep.httpMethod}
                                  </span>
                                  <code className="text-xs font-mono text-gray-700 flex-1">
                                    {ep.path}
                                  </code>
                                  <span className="text-xs text-gray-400 truncate max-w-[200px]">
                                    {ep.description || "—"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions — pending only */}
                      {req.status === "pending" && (
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
                          <button
                            disabled={busy === req.requestId}
                            onClick={() => handleApprove(req)}
                            className="flex-1 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-50
                              text-white text-sm font-bold rounded-xl transition-all">
                            {busy === req.requestId ? "…" : "✓ Approve"}
                          </button>
                          <button
                            onClick={() => { setSelected(req); setChangeModal(true); }}
                            className="flex-1 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600
                              text-sm font-bold rounded-xl transition-all">
                            ↻ Request Changes
                          </button>
                          <button
                            onClick={() => { setSelected(req); setRejectModal(true); }}
                            className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-500
                              text-sm font-bold rounded-xl transition-all">
                            ✕ Reject
                          </button>
                        </div>
                      )}

                      {req.status === "approved" && req.createdApiId && (
                        <div className="mt-4 pt-4 border-t border-gray-50">
                          <a href={`/provider/apis/${req.createdApiId}`}
                            className="text-xs font-bold text-teal-500 hover:text-teal-600 transition-colors">
                            View Created API →
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Reject Modal ── */}
      {rejectModal && selected && (
        <Modal title="Reject Request" onClose={() => { setRejectModal(false); setReason(""); }}>
          <div className="flex flex-col gap-4">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <p className="text-sm font-bold text-red-700">{selected.apiName}</p>
              <p className="text-xs text-red-400 mt-0.5">by {selected.submittedByName}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                Rejection Reason *
              </label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={4}
                placeholder="Explain why this request is being rejected…"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm
                  text-gray-700 focus:outline-none focus:border-teal-400 focus:ring-2
                  focus:ring-teal-100 transition-all resize-none"/>
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

      {/* ── Changes Modal ── */}
      {changeModal && selected && (
        <Modal title="Request Changes" onClose={() => { setChangeModal(false); setFeedback(""); }}>
          <div className="flex flex-col gap-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-sm font-bold text-blue-700">{selected.apiName}</p>
              <p className="text-xs text-blue-400 mt-0.5">by {selected.submittedByName}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                Feedback for Developer *
              </label>
              <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={4}
                placeholder="What needs to be changed? Be specific…"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm
                  text-gray-700 focus:outline-none focus:border-teal-400 focus:ring-2
                  focus:ring-teal-100 transition-all resize-none"/>
            </div>
            <div className="flex gap-3">
              <button onClick={handleChanges} disabled={busy !== null}
                className="flex-1 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white
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
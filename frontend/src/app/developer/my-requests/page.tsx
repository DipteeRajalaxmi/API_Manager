"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import apiClient from "@/lib/api";
import OrgGuard from "@/components/OrgGuard";


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
  createdApiId: number | null;
  endpoints: { httpMethod: string; path: string; description: string }[];
}

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: string; label: string }> = {
  pending:           { bg: "bg-amber-50",  text: "text-amber-600",  icon: "⏳", label: "Pending Review"    },
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

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<ApiRequestItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    apiClient.get("/api/requests/my")
      .then(r => setRequests(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const pending   = requests.filter(r => r.status === "pending").length;
  const approved  = requests.filter(r => r.status === "approved").length;
  const rejected  = requests.filter(r => r.status === "rejected").length;
  const changes   = requests.filter(r => r.status === "changes_requested").length;

  return (
    <OrgGuard>
    <DashboardLayout>
      <div className="p-8 animate-fade-in">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-blue-500 text-xs font-bold uppercase tracking-wider mb-1">Developer Portal</p>
            <h1 className="text-2xl font-extrabold text-gray-800">My API Requests</h1>
            <p className="text-gray-400 text-sm mt-1">Track the status of your submitted APIs</p>
          </div>
          <Link href="/developer/contribute"
            className="px-4 py-2.5 grad-teal text-white text-sm font-bold rounded-xl shadow-md
              hover:opacity-90 transition-all">
            + Submit New API
          </Link>
        </div>

        {/* Summary pills */}
        {!loading && requests.length > 0 && (
          <div className="flex items-center gap-2 mb-6">
            {[
              { label: "Total",    value: requests.length, color: "bg-gray-100 text-gray-600"    },
              { label: "Pending",  value: pending,         color: "bg-amber-50 text-amber-600"   },
              { label: "Approved", value: approved,        color: "bg-green-50 text-green-600"   },
              { label: "Rejected", value: rejected,        color: "bg-red-50 text-red-600"       },
              { label: "Changes",  value: changes,         color: "bg-blue-50 text-blue-600"     },
            ].map(p => (
              <div key={p.label} className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${p.color}`}>
                {p.value} {p.label}
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && requests.length === 0 && (
          <div className="card p-20 text-center">
            <div className="text-5xl mb-4 opacity-30">📬</div>
            <h3 className="font-bold text-gray-700 mb-2">No requests yet</h3>
            <p className="text-gray-400 text-sm mb-6">
              Have an API you want to share with your org? Submit it for review.
            </p>
            <Link href="/developer/contribute"
              className="inline-flex items-center gap-2 px-5 py-2.5 grad-teal text-white
                text-sm font-bold rounded-xl shadow-md hover:opacity-90 transition-all">
              + Submit Your First API
            </Link>
          </div>
        )}

        {/* Request cards */}
        {!loading && requests.length > 0 && (
          <div className="flex flex-col gap-4">
            {requests.map(req => {
              const s = STATUS_STYLES[req.status] ?? STATUS_STYLES.pending;
              const isExpanded = expanded === req.requestId;

              return (
                <div key={req.requestId} className="card overflow-hidden">

                  {/* Card header */}
                  <div className="flex items-start justify-between p-6 pb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl grad-blue flex items-center justify-center
                        text-white font-bold text-lg flex-shrink-0">
                        {req.apiName[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-extrabold text-gray-800">{req.apiName}</h3>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                            inline-flex items-center gap-1 ${s.bg} ${s.text}`}>
                            {s.icon} {s.label}
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs">{req.description || "No description"}</p>
                        <p className="text-gray-300 font-mono text-xs mt-0.5">{req.baseUrl}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-400">
                        Submitted {fmt(req.submittedAt)}
                      </span>
                      <button onClick={() => setExpanded(isExpanded ? null : req.requestId)}
                        className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center
                          justify-center text-gray-400 transition-all text-xs font-bold">
                        {isExpanded ? "▲" : "▼"}
                      </button>
                    </div>
                  </div>

                  {/* Feedback/rejection banner */}
                  {req.status === "rejected" && req.rejectionReason && (
                    <div className="mx-6 mb-4 bg-red-50 border border-red-100 rounded-xl p-4">
                      <p className="text-xs font-bold text-red-600 mb-1">❌ Rejection Reason</p>
                      <p className="text-xs text-red-500">{req.rejectionReason}</p>
                    </div>
                  )}

                  {req.status === "changes_requested" && req.feedback && (
                    <div className="mx-6 mb-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <p className="text-xs font-bold text-blue-600 mb-1">🔄 Provider Feedback</p>
                      <p className="text-xs text-blue-500">{req.feedback}</p>
                    </div>
                  )}

                  {req.status === "approved" && req.createdApiId && (
                    <div className="mx-6 mb-4 bg-green-50 border border-green-100 rounded-xl p-4
                      flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-green-600 mb-0.5">✅ Approved!</p>
                        <p className="text-xs text-green-500">
                          Your API has been created as a draft. The provider will publish it.
                        </p>
                      </div>
                      {/* <Link href={`/developer/apis/${req.createdApiId}`}
                        className="text-xs font-semibold text-green-600 bg-white border border-green-200
                          px-3 py-1.5 rounded-lg hover:bg-green-50 transition-all flex-shrink-0">
                        View API →
                      </Link> */}
                    </div>
                  )}

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-gray-50 pt-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Visibility</p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                            ${req.visibility === "public"     ? "bg-green-50 text-green-600"   :
                              req.visibility === "private"    ? "bg-orange-50 text-orange-500" :
                                                                "bg-purple-50 text-purple-600"}`}>
                            {req.visibility}
                          </span>
                        </div>
                        {req.reviewedAt && (
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Reviewed</p>
                            <p className="text-xs text-gray-600">{fmt(req.reviewedAt)}</p>
                          </div>
                        )}
                      </div>

                      {/* Endpoints */}
                      {req.endpoints?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Endpoints ({req.endpoints.length})
                          </p>
                          <div className="border border-gray-100 rounded-xl overflow-hidden">
                            {req.endpoints.map((ep, i) => (
                              <div key={i}
                                className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50
                                  last:border-b-0 hover:bg-gray-50 transition-colors">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded border min-w-[52px]
                                  text-center ${METHOD_COLORS[ep.httpMethod] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                                  {ep.httpMethod}
                                </span>
                                <code className="text-xs font-mono text-gray-700 flex-1">{ep.path}</code>
                                <span className="text-xs text-gray-400">{ep.description || "—"}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Loading skeleton */}
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
    </DashboardLayout>
    </OrgGuard>
  );
}
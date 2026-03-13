"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getApiById, getEndpoints, getDocuments } from "@/lib/registry";
import { getMyApps, subscribe } from "@/lib/portal";
import { getUser } from "@/lib/auth";
import { Api, ApiEndpoint, ApiDocument, Application, SubscribeResponse } from "@/types/api";

const METHOD_COLORS: Record<string, string> = {
  GET:    "bg-emerald-50 text-emerald-600 border-emerald-200",
  POST:   "bg-blue-50 text-blue-600 border-blue-200",
  PUT:    "bg-amber-50 text-amber-600 border-amber-200",
  PATCH:  "bg-purple-50 text-purple-600 border-purple-200",
  DELETE: "bg-red-50 text-red-500 border-red-200",
};

export default function MarketplaceDetailPage() {
  const { id } = useParams();
  const router  = useRouter();
  const user    = getUser();
  const apiId   = Number(id);

  const [apiData,    setApiData]    = useState<Api | null>(null);
  const [endpoints,  setEndpoints]  = useState<ApiEndpoint[]>([]);
  const [documents,  setDocuments]  = useState<ApiDocument[]>([]);
  const [apps,       setApps]       = useState<Application[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState<"overview" | "endpoints" | "docs">("overview");

  // Subscribe modal state
  const [showModal,   setShowModal]   = useState(false);
  const [selectedApp, setSelectedApp] = useState<number | "">("");
  const [subscribing, setSubscribing] = useState(false);
  const [subResult,   setSubResult]   = useState<SubscribeResponse | null>(null);
  const [keyCopied,   setKeyCopied]   = useState(false);
  const [error,       setError]       = useState("");

  const isDeveloper = user?.role === "DEVELOPER";

  useEffect(() => {
    Promise.all([
      getApiById(apiId),
      getEndpoints(apiId),
      getDocuments(apiId),
      ...(isDeveloper ? [getMyApps()] : []),
    ]).then(([a, e, d, appsData]) => {
      setApiData(a as Api);
      setEndpoints(e as ApiEndpoint[]);
      setDocuments(d as ApiDocument[]);
      if (appsData) setApps(appsData as Application[]);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [apiId]);

  const handleSubscribe = async () => {
    if (!selectedApp) { setError("Please select an app"); return; }
    setSubscribing(true);
    setError("");
    try {
      const result = await subscribe(Number(selectedApp), apiId);
      setSubResult(result);
    } catch (e: any) {
      setError(e.response?.data?.error || "Subscription failed");
    } finally {
      setSubscribing(false);
    }
  };

//   const copyKey = () => {
//     if (subResult?.rawClientSecret) {
//       navigator.clipboard.writeText(subResult.rawClientSecret);
//       setKeyCopied(true);
//       setTimeout(() => setKeyCopied(false), 2000);
//     }
//   };

  const closeModal = () => {
    setShowModal(false);
    setSubResult(null);
    setSelectedApp("");
    setError("");
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  if (!apiData) return (
    <DashboardLayout>
      <div className="p-8 text-center text-gray-400">API not found</div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="p-8 max-w-5xl mx-auto animate-fade-in">

        {/* Back */}
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm font-medium mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Marketplace
        </button>

        {/* Header */}
        <div className="card p-6 mb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl grad-teal flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-teal-100 flex-shrink-0">
                {apiData.apiName[0]?.toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-xl font-extrabold text-gray-800">{apiData.apiName}</h1>
                  <span className="font-mono text-xs bg-teal-50 text-teal-600 border border-teal-100 px-2 py-0.5 rounded-lg">
                    {apiData.version}
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full
                    ${apiData.visibility === "public"     ? "bg-green-50 text-green-600"  :
                      apiData.visibility === "private"    ? "bg-orange-50 text-orange-500" :
                                                            "bg-purple-50 text-purple-600"}`}>
                    {apiData.visibility}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-2">{apiData.description || "No description"}</p>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  {apiData.orgName && <span>🏢 {apiData.orgName}</span>}
                  <span>📅 {new Date(apiData.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  <span>🔗 {endpoints.length} endpoint{endpoints.length !== 1 ? "s" : ""}</span>
                </div>
              </div>
            </div>

            {/* Subscribe button — only for DEVELOPER */}
            {isDeveloper && (
              <button onClick={() => setShowModal(true)}
                className="flex-shrink-0 grad-teal text-white font-semibold text-sm px-5 py-2.5 rounded-xl
                  shadow-md shadow-teal-200 hover:opacity-90 transition-all">
                Subscribe
              </button>
            )}
          </div>

          {/* Base URL */}
          {apiData.baseUrl && (
            <div className="mt-4 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Base URL</span>
              <code className="text-sm font-mono text-gray-700 flex-1">{apiData.baseUrl}</code>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 mb-5 w-fit shadow-sm">
          {(["overview", "endpoints", "docs"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize
                ${activeTab === tab
                  ? "grad-teal text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-600"}`}>
              {tab}
              {tab === "endpoints" && endpoints.length > 0 &&
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full
                  ${activeTab === tab ? "bg-white/20" : "bg-gray-100"}`}>
                  {endpoints.length}
                </span>}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="card p-6">
            <h3 className="font-bold text-gray-700 mb-4">About this API</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              {apiData.description || "No description provided for this API."}
            </p>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <InfoBox label="Status"     value={apiData.status} />
              <InfoBox label="Visibility" value={apiData.visibility} />
              <InfoBox label="Version"    value={apiData.version} />
              <InfoBox label="Auth Type"  value={apiData.authType || "JWT"} />
            </div>
          </div>
        )}

        {activeTab === "endpoints" && (
          <div className="flex flex-col gap-3">
            {endpoints.length === 0 ? (
              <div className="card p-12 text-center text-gray-400 text-sm">No endpoints defined</div>
            ) : endpoints.map(ep => (
              <div key={ep.endpointId} className="card p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg border ${METHOD_COLORS[ep.httpMethod] ?? "bg-gray-50 text-gray-500 border-gray-200"}`}>
                    {ep.httpMethod}
                  </span>
                  <code className="text-sm font-mono text-gray-700">{ep.path}</code>
                  {ep.isAuthenticated && (
                    <span className="ml-auto text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-lg">
                      🔒 Auth required
                    </span>
                  )}
                </div>
                {ep.description && <p className="text-gray-400 text-xs ml-1">{ep.description}</p>}
                {(ep.requestSchema || ep.responseSchema) && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {ep.requestSchema && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 mb-1">Request Schema</p>
                        <pre className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 overflow-auto max-h-32 border border-gray-100">
                          {ep.requestSchema}
                        </pre>
                      </div>
                    )}
                    {ep.responseSchema && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 mb-1">Response Schema</p>
                        <pre className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 overflow-auto max-h-32 border border-gray-100">
                          {ep.responseSchema}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "docs" && (
          <div className="flex flex-col gap-3">
            {documents.length === 0 ? (
              <div className="card p-12 text-center text-gray-400 text-sm">No documentation available</div>
            ) : documents.map(doc => (
              <div key={doc.docId} className="card p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-1 rounded-lg uppercase">
                    {doc.docType}
                  </span>
                  <h4 className="font-semibold text-gray-700 text-sm">{doc.title}</h4>
                </div>
                {doc.content && <p className="text-gray-500 text-sm leading-relaxed">{doc.content}</p>}
                {doc.docUrl && (
                  <a href={doc.docUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-teal-500 text-xs font-semibold mt-2 hover:text-teal-600">
                    View Documentation →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subscribe Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">

            {subResult ? (
                <div className="p-6">
                    <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    </div>
                    <h3 className="text-lg font-extrabold text-gray-800 text-center mb-1">Subscribed!</h3>
                    <p className="text-gray-400 text-sm text-center mb-5">
                    Your API key is shown below. <strong className="text-red-500">Save it now</strong> — it won't be shown again.
                    </p>

                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Client ID (API Key)</p>
                    <code className="text-sm font-mono text-gray-700 break-all">{subResult.clientId}</code>
                    </div>

                    <div className="flex gap-3">
                    <button onClick={() => { navigator.clipboard.writeText(subResult.clientId ?? ""); setKeyCopied(true); setTimeout(() => setKeyCopied(false), 2000); }}
                        className={`flex-1 font-semibold text-sm py-2.5 rounded-xl transition-all
                        ${keyCopied ? "bg-green-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                        {keyCopied ? "✓ Copied!" : "Copy Key"}
                    </button>
                    <button onClick={() => { closeModal(); router.push("/developer/apps"); }}
                        className="flex-1 grad-teal text-white font-semibold text-sm py-2.5 rounded-xl hover:opacity-90 transition-all">
                        View My Apps
                    </button>
                    </div>
                </div>
            ) : (
              // ── Select app screen ────────────────────────────────────────
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-extrabold text-gray-800">Subscribe to API</h3>
                  <button onClick={closeModal} className="text-gray-300 hover:text-gray-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 mb-5">
                  <p className="font-semibold text-gray-800 text-sm">{apiData.apiName}</p>
                  <p className="text-teal-600 text-xs font-mono mt-0.5">{apiData.version}</p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-500 text-sm rounded-xl px-4 py-3 mb-4">
                    {error}
                  </div>
                )}

                {apps.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-400 text-sm mb-3">You don't have any apps yet.</p>
                    <button onClick={() => { closeModal(); router.push("/developer/apps/new"); }}
                      className="grad-teal text-white font-semibold text-sm px-4 py-2 rounded-xl hover:opacity-90 transition-all">
                      Create an App First
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                        Select App
                      </label>
                      <div className="flex flex-col gap-2">
                        {apps.map(app => (
                          <label key={app.appId}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                              ${selectedApp === app.appId
                                ? "border-teal-400 bg-teal-50"
                                : "border-gray-200 hover:border-gray-300"}`}>
                            <input type="radio" name="app" value={app.appId}
                              checked={selectedApp === app.appId}
                              onChange={() => setSelectedApp(app.appId)}
                              className="accent-teal-500" />
                            <div>
                              <p className="text-sm font-semibold text-gray-700">{app.appName}</p>
                              <p className="text-xs text-gray-400">{app.description || "No description"}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={closeModal}
                        className="flex-1 bg-gray-100 text-gray-600 font-semibold text-sm py-2.5 rounded-xl hover:bg-gray-200 transition-all">
                        Cancel
                      </button>
                      <button onClick={handleSubscribe} disabled={subscribing || !selectedApp}
                        className="flex-1 grad-teal text-white font-semibold text-sm py-2.5 rounded-xl
                          hover:opacity-90 disabled:opacity-50 transition-all">
                        {subscribing ? "Subscribing…" : "Subscribe"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-700 capitalize">{value}</p>
    </div>
  );
}
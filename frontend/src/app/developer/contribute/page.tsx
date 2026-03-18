"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Input, Select, Textarea, Button } from "@/components/ui/FormFields";
import Toast from "@/components/ui/Toast";
import { ToastState } from "@/types/api";
import apiClient from "@/lib/api";

interface EndpointRow {
  httpMethod: string;
  path: string;
  description: string;
}

const METHOD_COLORS: Record<string, string> = {
  GET:    "bg-green-50  text-green-600  border-green-100",
  POST:   "bg-blue-50   text-blue-600   border-blue-100",
  PUT:    "bg-amber-50  text-amber-600  border-amber-100",
  PATCH:  "bg-purple-50 text-purple-600 border-purple-100",
  DELETE: "bg-red-50    text-red-500    border-red-100",
};

export default function ContributePage() {
  const router = useRouter();
  const [toast,   setToast]   = useState<ToastState | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    apiName:     "",
    baseUrl:     "",
    description: "",
    visibility:  "private",
  });

  const [endpoints, setEndpoints] = useState<EndpointRow[]>([
    { httpMethod: "GET", path: "", description: "" },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const show = (message: string, type: ToastState["type"] = "success") =>
    setToast({ message, type });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.apiName.trim())  e.apiName  = "Required";
    if (!form.baseUrl.trim())  e.baseUrl  = "Required";
    else if (!form.baseUrl.startsWith("http")) e.baseUrl = "Must start with http(s)://";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const addEndpoint = () =>
    setEndpoints(p => [...p, { httpMethod: "GET", path: "", description: "" }]);

  const removeEndpoint = (i: number) =>
    setEndpoints(p => p.filter((_, idx) => idx !== i));

  const updateEndpoint = (i: number, field: keyof EndpointRow, value: string) =>
    setEndpoints(p => p.map((ep, idx) => idx === i ? { ...ep, [field]: value } : ep));

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const validEndpoints = endpoints.filter(ep => ep.path.trim());
      await apiClient.post("/api/requests", {
        ...form,
        endpoints: validEndpoints,
      });
      show("API request submitted! Provider will review it shortly.");
      setTimeout(() => router.push("/developer/my-requests"), 1200);
    } catch (e: any) {
      show(e.response?.data?.error || "Failed to submit request", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-2xl animate-fade-in">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/developer/dashboard"
            className="w-9 h-9 bg-white rounded-xl border border-gray-100 flex items-center
              justify-center text-gray-400 hover:text-gray-600 hover:shadow transition-all">
            ←
          </Link>
          <div>
            <p className="text-blue-500 text-sm font-semibold">Developer Portal</p>
            <h1 className="text-xl font-extrabold text-gray-800">Contribute an API</h1>
          </div>
        </div>

        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6 flex gap-3">
          <span className="text-xl flex-shrink-0">💡</span>
          <div>
            <p className="text-sm font-semibold text-blue-700 mb-0.5">How this works</p>
            <p className="text-xs text-blue-500 leading-relaxed">
              Submit your API details for review. Your org provider will review it and either
              approve (API goes live), request changes, or reject with feedback.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="card p-8">
          <div className="flex flex-col gap-5">

            {/* Basic info */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">API Details</p>
              <div className="flex flex-col gap-4">
                <Input label="API Name *" placeholder="Weather Service"
                  value={form.apiName}
                  onChange={e => setForm(p => ({ ...p, apiName: e.target.value }))}
                  error={errors.apiName} />
                <Input label="Base URL *" placeholder="https://api.example.com"
                  value={form.baseUrl}
                  onChange={e => setForm(p => ({ ...p, baseUrl: e.target.value }))}
                  error={errors.baseUrl} />
                <Textarea label="Description" rows={3}
                  placeholder="What does this API do? Who should use it?"
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                <Select label="Suggested Visibility" value={form.visibility}
                  onChange={e => setForm(p => ({ ...p, visibility: e.target.value }))}>
                  <option value="public">🌐 Public — visible to everyone</option>
                  <option value="private">🔒 Private — org members only</option>
                  <option value="restricted">🎯 Restricted — specific developers</option>
                </Select>
              </div>
            </div>

            {/* Endpoints */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Endpoints <span className="text-gray-300 font-normal">(optional)</span>
                </p>
                <button onClick={addEndpoint}
                  className="text-xs font-semibold text-teal-500 hover:text-teal-600
                    bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-all">
                  + Add Endpoint
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {endpoints.map((ep, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl">
                    <select value={ep.httpMethod}
                      onChange={e => updateEndpoint(i, "httpMethod", e.target.value)}
                      className={`text-xs font-bold px-2 py-1.5 rounded-lg border flex-shrink-0
                        focus:outline-none focus:ring-2 focus:ring-teal-100
                        ${METHOD_COLORS[ep.httpMethod] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                      {["GET", "POST", "PUT", "PATCH", "DELETE"].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <input value={ep.path}
                      onChange={e => updateEndpoint(i, "path", e.target.value)}
                      placeholder="/resource/{id}"
                      className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5
                        text-xs font-mono text-gray-700 focus:outline-none focus:border-teal-400 min-w-0" />
                    <input value={ep.description}
                      onChange={e => updateEndpoint(i, "description", e.target.value)}
                      placeholder="Description"
                      className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5
                        text-xs text-gray-600 focus:outline-none focus:border-teal-400 min-w-0" />
                    {endpoints.length > 1 && (
                      <button onClick={() => removeEndpoint(i)}
                        className="text-gray-300 hover:text-red-400 text-sm px-2 py-1.5 flex-shrink-0
                          transition-colors">
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit info */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-700 flex gap-2">
              <span>⏳</span>
              <span>
                After submission, your request will be <strong>pending review</strong>.
                The provider can approve, reject, or request changes.
                You can track status in <strong>My Requests</strong>.
              </span>
            </div>

            <div className="flex gap-3">
              <Button variant="primary" onClick={handleSubmit}
                disabled={loading} className="flex-1">
                {loading ? "Submitting…" : "Submit for Review →"}
              </Button>
              <Link href="/developer/dashboard">
                <Button variant="secondary">Cancel</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </DashboardLayout>
  );
}
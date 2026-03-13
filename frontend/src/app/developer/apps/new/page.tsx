"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { createApp } from "@/lib/portal";

export default function NewAppPage() {
  const router = useRouter();
  const [form, setForm]     = useState({ appName: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const handleCreate = async () => {
    setError("");
    if (!form.appName.trim()) { setError("App name is required"); return; }
    setLoading(true);
    try {
      const app = await createApp({ appName: form.appName, description: form.description });
      router.push(`/developer/apps/${app.appId}`);
    } catch (e: any) {
      setError(e.response?.data?.error || "Failed to create app");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-lg mx-auto animate-fade-in">

        {/* Back */}
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm font-medium mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to My Apps
        </button>

        <div className="card p-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-800">Create New App</h1>
              <p className="text-gray-400 text-sm">Apps let you subscribe to APIs and get API keys</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-500 rounded-xl px-4 py-3 mb-5 text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-5">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                App Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.appName}
                onChange={e => setForm(p => ({ ...p, appName: e.target.value }))}
                placeholder="e.g. My Weather App"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800
                  placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                Description <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="What does your app do?"
                rows={4}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800
                  placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all resize-none"
              />
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-600 mb-1">What happens next?</p>
              <p className="text-xs text-blue-500/80">
                After creating your app, you can go to the Marketplace and subscribe to APIs.
                Each subscription generates a unique API key for your app.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => router.back()}
                className="flex-1 bg-gray-100 text-gray-600 font-semibold text-sm py-3 rounded-xl hover:bg-gray-200 transition-all">
                Cancel
              </button>
              <button onClick={handleCreate} disabled={loading}
                className="flex-1 grad-teal text-white font-semibold text-sm py-3 rounded-xl
                  shadow-md shadow-teal-200 hover:opacity-90 disabled:opacity-50 transition-all">
                {loading ? "Creating…" : "Create App"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
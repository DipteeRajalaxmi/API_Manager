"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getMyApps, deleteApp } from "@/lib/portal";
import { Application } from "@/types/api";

export default function MyAppsPage() {
  const router = useRouter();
  const [apps,    setApps]    = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    getMyApps().then(setApps).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (appId: number) => {
    if (!confirm("Delete this app? All subscriptions and keys will be removed.")) return;
    setDeleting(appId);
    try {
      await deleteApp(appId);
      setApps(prev => prev.filter(a => a.appId !== appId));
    } catch (e: any) {
      alert(e.response?.data?.error || "Failed to delete app");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-800">My Apps</h1>
            <p className="text-gray-400 text-sm mt-1">Manage your applications and API subscriptions</p>
          </div>
          <Link href="/developer/apps/new"
            className="grad-teal text-white font-semibold text-sm px-5 py-2.5 rounded-xl
              shadow-md shadow-teal-200 hover:opacity-90 transition-all flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            New App
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-xl mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-full" />
              </div>
            ))}
          </div>
        ) : apps.length === 0 ? (
          <div className="card p-20 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-600 mb-2">No apps yet</h3>
            <p className="text-gray-400 text-sm mb-5">Create an app to start subscribing to APIs</p>
            <Link href="/developer/apps/new"
              className="inline-block grad-teal text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition-all">
              Create Your First App
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {apps.map(app => (
              <div key={app.appId} className="card p-6 card-lift flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center
                    justify-center text-white font-bold text-lg shadow-sm">
                    {app.appName[0]?.toUpperCase()}
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                    ${app.status === "active"   ? "bg-green-50 text-green-600"  :
                      app.status === "blocked"  ? "bg-red-50 text-red-500"     :
                                                  "bg-gray-100 text-gray-400"}`}>
                    {app.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-gray-800 mb-1">{app.appName}</h3>
                  <p className="text-gray-400 text-xs line-clamp-2">
                    {app.description || "No description"}
                  </p>
                </div>

                <div className="text-xs text-gray-300 mt-auto">
                  Created {new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-50">
                  <Link href={`/developer/apps/${app.appId}`}
                    className="flex-1 text-center bg-teal-50 text-teal-600 font-semibold text-xs py-2 rounded-lg
                      hover:bg-teal-100 transition-all">
                    View Details
                  </Link>
                  <button onClick={() => handleDelete(app.appId)} disabled={deleting === app.appId}
                    className="px-3 py-2 bg-red-50 text-red-400 rounded-lg hover:bg-red-100 transition-all disabled:opacity-50">
                    {deleting === app.appId ? (
                      <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/app/provider/dashboard/page.tsx
// ─────────────────────────────────────────────────────────────────────────────

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/ui/Badge";
import { getMyApis } from "@/lib/registry";
import { getUser } from "@/lib/auth";
import { Api } from "@/types/api";
import { AuthResponse } from "@/types/auth";

export default function ProviderDashboard() {
  //const user = getUser();
  const [user, setUser] = useState<AuthResponse | null>(null)

useEffect(() => {
  getMyApis().then(setApis).catch(() => {})
  setUser(getUser())  // ← move here
}, [])
  const [apis, setApis] = useState<Api[]>([]);

  useEffect(() => { getMyApis().then(setApis).catch(() => {}); }, []);

  const stats = {
    total:     apis.length,
    published: apis.filter((a) => a.status === "published").length,
    draft:     apis.filter((a) => a.status === "draft").length,
    deprecated:apis.filter((a) => a.status === "deprecated").length,
  };

  const recent = [...apis]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <p className="text-teal-500 text-sm font-semibold mb-1">Overview</p>
          <h1 className="text-2xl font-extrabold text-gray-800">
                Welcome back, {user?.name?.split(" ")[0] ?? ""} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">Your API portfolio at a glance.</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-5 mb-8 stagger">
          {[
            { label: "Total APIs",  value: stats.total,      gradient: "grad-teal",   icon: "⚡" },
            { label: "Published",   value: stats.published,  gradient: "grad-blue",   icon: "✓"  },
            { label: "Draft",       value: stats.draft,      gradient: "grad-purple", icon: "✎"  },
            { label: "Deprecated",  value: stats.deprecated, gradient: "grad-navy",   icon: "⚠"  },
          ].map((s) => (
            <div key={s.label} className="card p-6">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${s.gradient} flex items-center justify-center text-white text-lg shadow-sm`}>
                  {s.icon}
                </div>
                <span className="text-3xl font-extrabold text-gray-800">{s.value}</span>
              </div>
              <p className="text-sm font-semibold text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-5">
          {/* Quick actions */}
          <div className="card p-6 animate-fade-in">
            <h2 className="text-sm font-bold text-gray-700 mb-4">Quick Actions</h2>
            <div className="flex flex-col gap-3">
              <Link href="/provider/apis/new"
                className="flex items-center gap-3 p-3 rounded-xl bg-teal-50 hover:bg-teal-100 transition-colors">
                <div className="w-8 h-8 grad-teal rounded-lg flex items-center justify-center text-white font-bold shadow-sm">＋</div>
                <div>
                  <div className="text-sm font-semibold text-gray-700">Create New API</div>
                  <div className="text-xs text-gray-400">Register an API</div>
                </div>
              </Link>
              <Link href="/provider/apis"
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 grad-blue rounded-lg flex items-center justify-center text-white shadow-sm text-sm">≡</div>
                <div>
                  <div className="text-sm font-semibold text-gray-700">Manage APIs</div>
                  <div className="text-xs text-gray-400">View all APIs</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent APIs */}
          <div className="col-span-2 card p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-700">Recent APIs</h2>
              <Link href="/provider/apis" className="text-teal-500 hover:text-teal-600 text-xs font-semibold">
                View all →
              </Link>
            </div>

            {recent.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-400 text-sm mb-3">No APIs yet</p>
                <Link href="/provider/apis/new"
                  className="grad-teal text-white text-xs font-semibold px-4 py-2 rounded-xl inline-block shadow-md shadow-teal-200">
                  Create your first API
                </Link>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-gray-50">
                {recent.map((a) => (
                  <div key={a.apiId} className="flex items-center gap-4 py-3">
                    <div className="w-8 h-8 rounded-lg grad-teal flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                      {a.apiName[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800 truncate">{a.apiName}</div>
                      <div className="text-xs text-gray-400 font-mono">{a.version}</div>
                    </div>
                    <StatusBadge status={a.status} />
                    <Link href={`/provider/apis/${a.apiId}`}
                      className="text-teal-500 hover:text-teal-600 text-xs font-semibold flex-shrink-0">
                      Manage →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
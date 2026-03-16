"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import apiClient from "@/lib/api";

interface PlatformStats {
  totalOrgs: number;
  totalUsers: number;
  totalApis: number;
  totalCallsToday: number;
  totalDevelopers: number;
  totalProviders: number;
  totalSubscriptions: number;
  totalCallsThisWeek: number;
}

function StatCard({ label, value, icon, accent, sub, delay = 0 }: {
  label: string; value: number | string; icon: string;
  accent: string; sub?: string; delay?: number;
}) {
  return (
    <div className="card p-6 animate-fade-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl shadow-md"
          style={{ background: accent }}>
          {icon}
        </div>
        {sub && (
          <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">{sub}</span>
        )}
      </div>
      <div className="text-3xl font-extrabold text-gray-800 mb-1 tracking-tight">
        {value}
      </div>
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats,   setStats]   = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/api/admin/stats")
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Organizations",   value: stats?.totalOrgs ?? 0,           icon: "🏢", accent: "linear-gradient(135deg,#4FD1C5,#319795)", delay: 0   },
    { label: "Total Users",     value: stats?.totalUsers ?? 0,          icon: "👥", accent: "linear-gradient(135deg,#4299E1,#3182CE)", delay: 60  },
    { label: "API Providers",   value: stats?.totalProviders ?? 0,      icon: "⚡", accent: "linear-gradient(135deg,#9F7AEA,#805AD5)", delay: 120 },
    { label: "Developers",      value: stats?.totalDevelopers ?? 0,     icon: "💻", accent: "linear-gradient(135deg,#F6AD55,#ED8936)", delay: 180 },
    { label: "Published APIs",  value: stats?.totalApis ?? 0,           icon: "🔌", accent: "linear-gradient(135deg,#68D391,#38A169)", delay: 240 },
    { label: "Subscriptions",   value: stats?.totalSubscriptions ?? 0,  icon: "🔑", accent: "linear-gradient(135deg,#FC8181,#E53E3E)", delay: 300 },
    { label: "Calls Today",     value: stats?.totalCallsToday ?? 0,     icon: "📊", accent: "linear-gradient(135deg,#4FD1C5,#319795)", sub: "24h",  delay: 360 },
    { label: "Calls This Week", value: stats?.totalCallsThisWeek ?? 0,  icon: "📈", accent: "linear-gradient(135deg,#4299E1,#3182CE)", sub: "7d",   delay: 420 },
  ];

  return (
    <DashboardLayout>
      <div className="p-8">

        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl grad-teal flex items-center justify-center text-white text-lg shadow-md">
              🛡️
            </div>
            <div>
              <p className="text-teal-500 text-xs font-bold uppercase tracking-wider">Admin Console</p>
              <h1 className="text-2xl font-extrabold text-gray-800">Platform Overview</h1>
            </div>
          </div>
          <p className="text-gray-400 text-sm ml-13">Monitor and manage the entire API Manager platform</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {cards.map(c => (
            <StatCard key={c.label} {...c} value={loading ? "—" : c.value} />
          ))}
        </div>

        {/* Quick nav */}
        <div className="grid grid-cols-3 gap-4 stagger">
          {[
            {
              href: "/admin/users",
              icon: "👥",
              accent: "linear-gradient(135deg,#4299E1,#3182CE)",
              title: "User Management",
              desc: "View, search and manage all users across organizations",
              badge: `${stats?.totalUsers ?? 0} users`,
            },
            {
              href: "/admin/organizations",
              icon: "🏢",
              accent: "linear-gradient(135deg,#4FD1C5,#319795)",
              title: "Organizations",
              desc: "Manage all registered organizations and their settings",
              badge: `${stats?.totalOrgs ?? 0} orgs`,
            },
            {
              href: "/admin/apis",
              icon: "🔌",
              accent: "linear-gradient(135deg,#9F7AEA,#805AD5)",
              title: "All APIs",
              desc: "View and monitor all APIs across every organization",
              badge: `${stats?.totalApis ?? 0} APIs`,
            },
          ].map(item => (
            <Link key={item.href} href={item.href} className="card p-6 card-lift block">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl shadow-md"
                  style={{ background: item.accent }}>
                  {item.icon}
                </div>
                {!loading && (
                  <span className="text-xs font-semibold text-teal-600 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-gray-800 mb-1">{item.title}</h3>
              <p className="text-gray-400 text-xs leading-relaxed">{item.desc}</p>
            </Link>
          ))}
        </div>

      </div>
    </DashboardLayout>
  );
}
// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/app/developer/dashboard/page.tsx
// ─────────────────────────────────────────────────────────────────────────────

"use client";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getUser } from "@/lib/auth";

export default function DeveloperDashboard() {
  const user = getUser();
  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8 animate-fade-in">
          <p className="text-blue-500 text-sm font-semibold mb-1">Developer Portal</p>
          <h1 className="text-2xl font-extrabold text-gray-800">
            Welcome, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">Discover APIs and build amazing applications.</p>
        </div>

        <div className="grid grid-cols-3 gap-5 stagger">
          <Link href="/marketplace" className="card p-6 card-lift block">
            <div className="w-12 h-12 grad-blue rounded-xl flex items-center justify-center text-white shadow-md mb-4 text-2xl">🛒</div>
            <h3 className="font-bold text-gray-800 mb-1">Explore Marketplace</h3>
            <p className="text-gray-400 text-xs">Discover and subscribe to APIs</p>
          </Link>

          <Link href="/developer/apps" className="card p-6 card-lift block">
            <div className="w-12 h-12 grad-purple rounded-xl flex items-center justify-center text-white shadow-md mb-4 text-2xl">📱</div>
            <h3 className="font-bold text-gray-800 mb-1">My Applications</h3>
            <p className="text-gray-400 text-xs">Manage your apps and subscriptions</p>
          </Link>

          <Link href="/developer/settings" className="card p-6 card-lift block">
            <div className="w-12 h-12 grad-navy rounded-xl flex items-center justify-center text-white shadow-md mb-4 text-2xl">⚙️</div>
            <h3 className="font-bold text-gray-800 mb-1">Settings</h3>
            <p className="text-gray-400 text-xs">Profile, org info and security</p>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
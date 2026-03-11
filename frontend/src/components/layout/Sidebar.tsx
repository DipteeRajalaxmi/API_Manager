"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getUser, logout, getNavItems } from "@/lib/auth";
import { useState, useEffect } from "react"
import { AuthResponse } from "@/types/auth"

// Simple inline SVG icons
const NavIcon = ({ name }: { name: string }) => {
  const icons: Record<string, string> = {
    dashboard: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    apis:      "M13 10V3L4 14h7v7l9-11h-7z",
    market:    "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
    apps:      "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
    users:     "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    subs:      "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  };
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[name] ?? icons.dashboard} />
    </svg>
  );
};

const roleBadge: Record<string, string> = {
  API_PROVIDER: "bg-teal-100 text-teal-700",
  DEVELOPER:    "bg-blue-100 text-blue-700",
  ADMIN:        "bg-purple-100 text-purple-700",
  VIEWER:       "bg-gray-100 text-gray-500",
};

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [user, setUser] = useState<AuthResponse | null>(null)
  const role = user?.role ?? "VIEWER"
  const navItems = getNavItems(role)

  useEffect(() => {
    setUser(getUser())
}, [])

  const handleLogout = () => { logout(); router.push("/login"); };

  const isActive = (href: string) =>
    href === "/marketplace"
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-100 flex flex-col fixed top-0 left-0 bottom-0 z-30 shadow-sm">
      {/* Brand */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl grad-teal flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <div className="font-extrabold text-gray-800 text-base tracking-tight">
              API<span className="text-teal-500">Manager</span>
            </div>
            <div className="text-gray-400 text-xs">v1.0</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-2 flex flex-col gap-1 overflow-y-auto">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest px-3 mb-2 mt-1">
          {role.replace("_", " ")}
        </p>
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all
                ${active
                  ? "bg-gradient-to-r from-teal-500 to-cyan-400 text-white shadow-md shadow-teal-200"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
            >
              <span className={active ? "text-white" : "text-gray-400"}>
                <NavIcon name={item.icon} />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 h-px bg-gray-100" />

      {/* User */}
      <div className="p-4">
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
          <div className="w-9 h-9 rounded-full grad-teal flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-gray-800 text-sm font-semibold truncate">{user?.name ?? "User"}</div>
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${roleBadge[role] ?? "bg-gray-100 text-gray-500"}`}>
              {role.replace("_", " ")}
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="text-gray-300 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
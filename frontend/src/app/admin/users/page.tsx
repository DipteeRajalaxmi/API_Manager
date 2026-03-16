"use client";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import apiClient from "@/lib/api";

interface User {
  userId: number;
  name: string;
  email: string;
  role: string;
  status: string;
  orgId: number | null;
  orgName: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

const ROLE_STYLES: Record<string, string> = {
  API_PROVIDER: "bg-teal-50 text-teal-700 border-teal-200",
  DEVELOPER:    "bg-blue-50 text-blue-700 border-blue-200",
  ADMIN:        "bg-purple-50 text-purple-700 border-purple-200",
};

export default function AdminUsersPage() {
  const [users,   setUsers]   = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [role,    setRole]    = useState("ALL");
  const [busy,    setBusy]    = useState<number | null>(null);

  useEffect(() => {
    apiClient.get("/api/users")
      .then(r => setUsers(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.orgName?.toLowerCase().includes(search.toLowerCase());
    const matchRole = role === "ALL" || u.role === role;
    return matchSearch && matchRole;
  });

  const handleToggle = async (user: User) => {
    setBusy(user.userId);
    try {
      if (user.status === "active") {
        await apiClient.patch(`/api/users/${user.userId}/deactivate`);
      } else {
        await apiClient.patch(`/api/users/${user.userId}/activate`);
      }
      setUsers(prev => prev.map(u =>
        u.userId === user.userId
          ? { ...u, status: u.status === "active" ? "inactive" : "active" }
          : u
      ));
    } catch (e) { console.error(e); }
    finally { setBusy(null); }
  };

  const fmt = (d: string | null) => d
    ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  const activeCount   = users.filter(u => u.status === "active").length;
  const providerCount = users.filter(u => u.role === "API_PROVIDER").length;
  const devCount      = users.filter(u => u.role === "DEVELOPER").length;

  return (
    <DashboardLayout>
      <div className="p-8 animate-fade-in">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-teal-500 text-xs font-bold uppercase tracking-wider mb-1">Admin Console</p>
            <h1 className="text-2xl font-extrabold text-gray-800">User Management</h1>
            <p className="text-gray-400 text-sm mt-1">All users across the platform</p>
          </div>
          {/* Summary pills */}
          <div className="flex items-center gap-2">
            {[
              { label: "Total",     value: users.length,   color: "bg-gray-100 text-gray-600"          },
              { label: "Active",    value: activeCount,    color: "bg-green-50 text-green-700"          },
              { label: "Providers", value: providerCount,  color: "bg-teal-50 text-teal-700"            },
              { label: "Devs",      value: devCount,       color: "bg-blue-50 text-blue-700"            },
            ].map(p => (
              <div key={p.label} className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${p.color}`}>
                {p.value} {p.label}
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email or org…"
              className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm
                text-gray-700 placeholder-gray-400 focus:outline-none focus:border-teal-400
                focus:ring-2 focus:ring-teal-100 transition-all" />
          </div>
          <select value={role} onChange={e => setRole(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium
              text-gray-700 focus:outline-none focus:border-teal-400 transition-all">
            <option value="ALL">All Roles</option>
            <option value="API_PROVIDER">API Provider</option>
            <option value="DEVELOPER">Developer</option>
            <option value="ADMIN">Admin</option>
          </select>
          <span className="text-xs text-gray-400 font-medium ml-1">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100
            text-xs font-bold text-gray-400 uppercase tracking-wider">
            <div className="col-span-3">User</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Organization</div>
            <div className="col-span-1">Joined</div>
            <div className="col-span-1 text-right">Action</div>
          </div>

          {loading ? (
            <div className="divide-y divide-gray-50">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4 items-center animate-pulse">
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-200 rounded-full" />
                    <div className="h-3.5 bg-gray-200 rounded w-24" />
                  </div>
                  <div className="col-span-3"><div className="h-3 bg-gray-100 rounded w-32" /></div>
                  <div className="col-span-2"><div className="h-5 bg-gray-100 rounded w-20" /></div>
                  <div className="col-span-2"><div className="h-3 bg-gray-100 rounded w-20" /></div>
                  <div className="col-span-1"><div className="h-3 bg-gray-100 rounded w-16" /></div>
                  <div className="col-span-1"><div className="h-7 bg-gray-100 rounded w-16 ml-auto" /></div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-4xl mb-3 opacity-30">👥</div>
              <p className="text-gray-400 text-sm">No users found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map(user => (
                <div key={user.userId}
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors">

                  {/* Name */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white
                      text-sm font-bold flex-shrink-0"
                      style={{ background: user.role === "API_PROVIDER"
                        ? "linear-gradient(135deg,#4FD1C5,#319795)"
                        : user.role === "ADMIN"
                        ? "linear-gradient(135deg,#9F7AEA,#805AD5)"
                        : "linear-gradient(135deg,#4299E1,#3182CE)" }}>
                      {user.name?.[0]?.toUpperCase() ?? "U"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full inline-block ${user.status === "active" ? "bg-green-400" : "bg-red-400"}`} />
                        <span className="text-xs text-gray-400">{user.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="col-span-3">
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>

                  {/* Role */}
                  <div className="col-span-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border
                      ${ROLE_STYLES[user.role] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
                      {user.role?.replace("_", " ")}
                    </span>
                  </div>

                  {/* Org */}
                  <div className="col-span-2">
                    {user.orgName ? (
                      <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-lg font-medium truncate block">
                        {user.orgName}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300 italic">Independent</span>
                    )}
                  </div>

                  {/* Joined */}
                  <div className="col-span-1">
                    <span className="text-xs text-gray-400">{fmt(user.createdAt)}</span>
                  </div>

                  {/* Action */}
                  <div className="col-span-1 flex justify-end">
                    {user.role !== "ADMIN" && (
                      <button onClick={() => handleToggle(user)} disabled={busy === user.userId}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50
                          ${user.status === "active"
                            ? "bg-red-50 text-red-500 hover:bg-red-100"
                            : "bg-green-50 text-green-600 hover:bg-green-100"}`}>
                        {busy === user.userId ? "…" : user.status === "active" ? "Deactivate" : "Activate"}
                      </button>
                    )}
                    {user.role === "ADMIN" && (
                      <span className="text-xs text-gray-300 italic">Protected</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          {!loading && filtered.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
              {filtered.length} user{filtered.length !== 1 ? "s" : ""} shown
              {search || role !== "ALL" ? ` (filtered from ${users.length} total)` : ""}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
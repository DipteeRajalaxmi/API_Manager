"use client";
import { useEffect, useState } from "react";
import apiClient from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ClientEntry {
  clientId: string;
  clientPlan: string | null;
  apiId: number;
  apiName: string;
  lastCall: string;
  totalCalls: number;
  limitSource: "plan" | "api" | "endpoint";

  usedMinute: number;
  usedHour: number;
  usedDay: number;
  usedTotal: number;

  limitMinute: number | null;
  limitHour: number | null;
  limitDay: number | null;
  limitTotal: number | null;

  remainingMinute: number | null;
  remainingHour: number | null;
  remainingDay: number | null;
  remainingTotal: number | null;
}

// ── Quota bar ─────────────────────────────────────────────────────────────────

function QuotaBar({
  label,
  used,
  limit,
  remaining,
}: {
  label: string;
  used: number;
  limit: number | null;
  remaining: number | null;
}) {
  if (limit === null) return null;

  const pct     = Math.min(100, Math.round((used / limit) * 100));
  const isWarn  = pct >= 80;
  const isCrit  = pct >= 95;

  const barColor = isCrit
    ? "bg-red-400"
    : isWarn
    ? "bg-amber-400"
    : "bg-teal-400";

  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-xs text-gray-400 w-12 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden min-w-0">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`text-xs font-mono flex-shrink-0 w-20 text-right tabular-nums ${
          isCrit
            ? "text-red-500"
            : isWarn
            ? "text-amber-500"
            : "text-gray-500"
        }`}
      >
        {used.toLocaleString()} / {limit.toLocaleString()}
      </span>
    </div>
  );
}

// ── Plan badge ────────────────────────────────────────────────────────────────

function PlanBadge({ plan, source }: { plan: string | null; source: "plan" | "api" | "endpoint" }) {
  if (!plan) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 border border-gray-200 font-medium">
        no plan
      </span>
    );
  }

  const colors: Record<string, string> = {
    free:       "bg-gray-100 text-gray-500 border-gray-200",
    basic:      "bg-blue-50 text-blue-600 border-blue-100",
    pro:        "bg-purple-50 text-purple-600 border-purple-100",
    premium:    "bg-amber-50 text-amber-600 border-amber-100",
    enterprise: "bg-teal-50 text-teal-600 border-teal-100",
  };

  const colorClass =
    colors[plan.toLowerCase()] ?? "bg-gray-100 text-gray-600 border-gray-200";

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${colorClass}`}
      >
        {plan}
      </span>
      {source === "plan" && (
        <span className="text-xs text-gray-300" title="Limits from plan definition">
          plan limits
        </span>
      )}
      {source === "api" && (
        <span className="text-xs text-gray-300" title="Falling back to API-level limits">
          api limits
        </span>
      )}
      {source === "endpoint" && (
        <span className="text-xs text-gray-300" title="Endpoint-level limits (most restrictive)">
          endpoint limits
        </span>
      )}
    </div>
  );
}

// ── Client card ───────────────────────────────────────────────────────────────

function ClientCard({ client }: { client: ClientEntry }) {
  const hasAnyLimit =
    client.limitMinute !== null ||
    client.limitHour   !== null ||
    client.limitDay    !== null ||
    client.limitTotal  !== null;

  const lastCallDate = new Date(client.lastCall);
  const isRecent =
    Date.now() - lastCallDate.getTime() < 60 * 60 * 1000; // < 1 hour

  return (
    <div className="card overflow-hidden">
      {/* ── Header row ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between px-5 py-4 gap-4">
        {/* Left: clientId + plan */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <code className="text-sm font-mono font-semibold text-gray-800 truncate max-w-[260px]">
              {client.clientId}
            </code>
            <PlanBadge plan={client.clientPlan} source={client.limitSource} />
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
            <span>
              API:{" "}
              <span className="text-gray-600 font-medium">{client.apiName}</span>
            </span>
            <span>•</span>
            <span
              className={`font-medium ${isRecent ? "text-teal-500" : "text-gray-400"}`}
            >
              Last call:{" "}
              {lastCallDate.toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        {/* Right: total calls */}
        <div className="text-right flex-shrink-0">
          <p className="text-2xl font-extrabold text-gray-800 tabular-nums leading-none">
            {client.totalCalls.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">calls (30d)</p>
        </div>
      </div>

      {/* ── Quota section ──────────────────────────────────────────── */}
      {hasAnyLimit ? (
        <div className="border-t border-gray-50 px-5 py-3 bg-gray-50/50 flex flex-col gap-2">
          <QuotaBar
            label="/ min"
            used={client.usedMinute}
            limit={client.limitMinute}
            remaining={client.remainingMinute}
          />
          <QuotaBar
            label="/ hour"
            used={client.usedHour}
            limit={client.limitHour}
            remaining={client.remainingHour}
          />
          <QuotaBar
            label="/ day"
            used={client.usedDay}
            limit={client.limitDay}
            remaining={client.remainingDay}
          />
          <QuotaBar
            label="total"
            used={client.usedTotal}
            limit={client.limitTotal}
            remaining={client.remainingTotal}
          />
        </div>
      ) : (
        <div className="border-t border-gray-50 px-5 py-2.5 bg-gray-50/40">
          <p className="text-xs text-gray-300 italic">
            No rate limits configured for this API
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main ClientsTab ───────────────────────────────────────────────────────────

export default function ClientsTab({ devId }: { devId: number }) {
  const [clients, setClients]   = useState<ClientEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search,  setSearch]    = useState("");
  const [planFilter, setPlan]   = useState<string>("all");

  useEffect(() => {
    setLoading(true);
    apiClient
      .get(`/api/analytics/provider/developer/${devId}/clients`)
      .then((r) => setClients(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [devId]);

  // ── Derived ──────────────────────────────────────────────────────
  const allPlans = [
    "all",
    ...Array.from(
      new Set(clients.map((c) => c.clientPlan ?? "no plan"))
    ),
  ];

  const filtered = clients.filter((c) => {
    const matchSearch =
      !search ||
      c.clientId.toLowerCase().includes(search.toLowerCase()) ||
      (c.clientPlan ?? "").toLowerCase().includes(search.toLowerCase()) ||
      c.apiName.toLowerCase().includes(search.toLowerCase());

    const matchPlan =
      planFilter === "all" ||
      (planFilter === "no plan" ? c.clientPlan === null : c.clientPlan === planFilter);

    return matchSearch && matchPlan;
  });

  // ── Summary stats ─────────────────────────────────────────────────
  const totalClients   = clients.length;
  const activeClients  = clients.filter(
    (c) => Date.now() - new Date(c.lastCall).getTime() < 24 * 60 * 60 * 1000
  ).length;
  const throttledClients = clients.filter((c) => {
    if (c.limitDay && c.usedDay >= c.limitDay * 0.9) return true;
    if (c.limitHour && c.usedHour >= c.limitHour * 0.9) return true;
    return false;
  }).length;

  // ── Render ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-7 h-7 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">

      {/* ── Summary bar ──────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Unique clients",   value: totalClients,    color: "text-gray-800" },
          { label: "Active today",     value: activeClients,   color: "text-teal-600" },
          { label: "Near limit (90%)", value: throttledClients, color: throttledClients > 0 ? "text-amber-500" : "text-gray-800" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white border border-gray-100 rounded-xl px-4 py-3"
          >
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search client ID, plan, API..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] text-sm px-3 py-2 rounded-xl border border-gray-200
            bg-white text-gray-700 placeholder-gray-300 focus:outline-none
            focus:border-teal-300 transition-colors"
        />
        <div className="flex items-center gap-1 flex-wrap">
          {allPlans.map((plan) => (
            <button
              key={plan}
              onClick={() => setPlan(plan)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                planFilter === plan
                  ? "bg-teal-500 text-white border-teal-500"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}
            >
              {plan}
            </button>
          ))}
        </div>
      </div>

      {/* ── Empty state ───────────────────────────────────────────── */}
      {clients.length === 0 ? (
        <div className="card p-16 text-center border-2 border-dashed border-gray-200">
          <p className="text-gray-400 text-sm">No client activity yet</p>
          <p className="text-gray-300 text-xs mt-1">
            Clients appear here when the developer's backend sends{" "}
            <code className="font-mono">X-Client-Id</code> headers with gateway calls
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-gray-400 text-sm">No clients match your filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((client) => (
            <ClientCard
              key={`${client.clientId}-${client.apiId}`}
              client={client}
            />
          ))}
        </div>
      )}
    </div>
  );
}
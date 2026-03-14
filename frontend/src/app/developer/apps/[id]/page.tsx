"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getAppSubscriptions, cancelSubscription, getSubscriptionKey, regenerateKey } from "@/lib/portal";
import { Subscription, ApiKey } from "@/types/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

function usagePct(used?: number, limit?: number | null): number | null {
  if (!limit || used === undefined) return null;
  return Math.min(100, Math.round((used / limit) * 100));
}

function alertLevel(pct: number | null): "ok" | "warn" | "danger" | null {
  if (pct === null) return null;
  if (pct >= 100) return "danger";
  if (pct >= 80)  return "warn";
  return "ok";
}

// ── Usage Bar ─────────────────────────────────────────────────────────────────

function UsageBar({ label, used, limit }: {
  label: string; used?: number; limit?: number | null;
}) {
  const pct   = usagePct(used, limit);
  const level = alertLevel(pct);

  if (limit === null || limit === undefined) return null;

  const barColor =
    level === "danger" ? "bg-red-500" :
    level === "warn"   ? "bg-amber-400" :
                         "bg-teal-400";

  const textColor =
    level === "danger" ? "text-red-600" :
    level === "warn"   ? "text-amber-600" :
                         "text-gray-600";

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-gray-500">{label}</span>
        <span className={`text-xs font-bold ${textColor}`}>
          {used ?? 0} / {limit}
          {pct !== null && <span className="ml-1 opacity-60">({pct}%)</span>}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct ?? 0}%` }}
        />
      </div>
    </div>
  );
}

// ── Alert Banner ──────────────────────────────────────────────────────────────

function UsageAlerts({ sub }: { sub: Subscription }) {
  const alerts: { label: string; pct: number; level: "warn" | "danger" }[] = [];

  const checks = [
    { label: "Per minute",  used: sub.usedPerMinute, limit: sub.rateLimitPerMinute },
    { label: "Per hour",    used: sub.usedPerHour,   limit: sub.rateLimitPerHour   },
    { label: "Per day",     used: sub.usedPerDay,    limit: sub.rateLimitPerDay    },
    { label: "Total",       used: sub.usedTotal,     limit: sub.rateLimitTotal     },
  ];

  for (const c of checks) {
    const pct   = usagePct(c.used, c.limit);
    const level = alertLevel(pct);
    if (level === "warn" || level === "danger")
      alerts.push({ label: c.label, pct: pct!, level });
  }

  if (alerts.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mb-4">
      {alerts.map((a, i) => (
        <div key={i}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold
            ${a.level === "danger"
              ? "bg-red-50 border border-red-200 text-red-600"
              : "bg-amber-50 border border-amber-200 text-amber-700"}`}>
          <span>{a.level === "danger" ? "🔴" : "🟡"}</span>
          {a.level === "danger"
            ? `${a.label} rate limit exceeded (${a.pct}%)`
            : `${a.label} limit at ${a.pct}% — approaching limit`}
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AppDetailPage() {
  const { id }  = useParams();
  const router  = useRouter();
  const appId   = Number(id);

  const [subs,        setSubs]        = useState<Subscription[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [keys,        setKeys]        = useState<Record<number, ApiKey>>({});
  const [showKey,     setShowKey]     = useState<Record<number, boolean>>({});
  const [copied,      setCopied]      = useState<number | null>(null);
  const [regen,       setRegen]       = useState<number | null>(null);
  const [regenResult, setRegenResult] = useState<{ subId: number; secret: string } | null>(null);
  const [cancelling,  setCancelling]  = useState<number | null>(null);

  useEffect(() => {
    getAppSubscriptions(appId)
      .then(setSubs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [appId]);

  const loadKey = async (subId: number) => {
    if (keys[subId]) { setShowKey(p => ({ ...p, [subId]: !p[subId] })); return; }
    try {
      const key = await getSubscriptionKey(subId);
      setKeys(p => ({ ...p, [subId]: key }));
      setShowKey(p => ({ ...p, [subId]: true }));
    } catch (e) { console.error(e); }
  };

  const handleRegen = async (subId: number) => {
    if (!confirm("Regenerate API key? The old key will stop working immediately.")) return;
    setRegen(subId);
    try {
      const result = await regenerateKey(subId);
      setKeys(p => ({ ...p, [subId]: result }));
      setRegenResult({ subId, secret: result.rawClientSecret ?? result.clientId });
    } catch (e) { console.error(e); }
    finally { setRegen(null); }
  };

  const handleCancel = async (subId: number) => {
    if (!confirm("Cancel this subscription? The API key will stop working.")) return;
    setCancelling(subId);
    try {
      await cancelSubscription(subId);
      setSubs(p => p.filter(s => s.subscriptionId !== subId));
    } catch (e: any) {
      alert(e.response?.data?.error || "Failed to cancel");
    } finally { setCancelling(null); }
  };

  const copyText = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const hasAnyLimit = (sub: Subscription) =>
    sub.rateLimitPerMinute || sub.rateLimitPerHour ||
    sub.rateLimitPerDay    || sub.rateLimitTotal;

  return (
    <DashboardLayout>
      <div className="p-8 max-w-4xl mx-auto animate-fade-in">

        {/* Back */}
        <button onClick={() => router.push("/developer/apps")}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm font-medium mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to My Apps
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-800">App Subscriptions</h1>
            <p className="text-gray-400 text-sm mt-1">Manage your API subscriptions and keys</p>
          </div>
          <Link href="/marketplace"
            className="grad-teal text-white font-semibold text-sm px-5 py-2.5 rounded-xl
              shadow-md shadow-teal-200 hover:opacity-90 transition-all flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Subscription
          </Link>
        </div>

        {/* Regen banner */}
        {regenResult && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-amber-700 mb-1">🔑 New API Key Generated</p>
                <p className="text-xs text-amber-600 mb-3">Save this — it won't be shown again</p>
                <code className="text-sm font-mono text-gray-800 break-all">{regenResult.secret}</code>
              </div>
              <button onClick={() => setRegenResult(null)} className="text-amber-400 hover:text-amber-600 ml-4">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <button onClick={() => copyText(regenResult.secret, -1)}
              className={`mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all
                ${copied === -1 ? "bg-green-500 text-white" : "bg-amber-200 text-amber-800 hover:bg-amber-300"}`}>
              {copied === -1 ? "✓ Copied!" : "Copy Secret"}
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-full" />
              </div>
            ))}
          </div>
        ) : subs.length === 0 ? (
          <div className="card p-20 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-600 mb-2">No subscriptions yet</h3>
            <p className="text-gray-400 text-sm mb-5">Subscribe to APIs from the Marketplace</p>
            <Link href="/marketplace"
              className="inline-block grad-teal text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition-all">
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {subs.map(sub => (
              <div key={sub.subscriptionId} className="card p-6">

                {/* Sub header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-800">{sub.apiName}</h3>
                      <span className="font-mono text-xs bg-teal-50 text-teal-600 border border-teal-100 px-2 py-0.5 rounded-lg">
                        {sub.apiVersion}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Subscribed {sub.subscribedAt
                        ? new Date(sub.subscribedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                        : "—"}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                    ${sub.status === "active"    ? "bg-green-50 text-green-600"  :
                      sub.status === "blocked"   ? "bg-red-50 text-red-500"     :
                      sub.status === "cancelled" ? "bg-gray-100 text-gray-400"  :
                                                   "bg-amber-50 text-amber-600"}`}>
                    {sub.status === "blocked" ? "🚫 Blocked by provider" : sub.status}
                  </span>
                </div>

                {/* Blocked warning */}
                {sub.status === "blocked" && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-xs text-red-600 font-semibold">
                    🚫 This subscription has been blocked by the API provider. Contact them to reactivate.
                  </div>
                )}

                {/* Usage alerts */}
                <UsageAlerts sub={sub} />

                {/* Usage bars — only if limits are set */}
                {hasAnyLimit(sub) && (
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                      Rate Limit Usage
                    </p>
                    <UsageBar label="Per Minute" used={sub.usedPerMinute} limit={sub.rateLimitPerMinute} />
                    <UsageBar label="Per Hour"   used={sub.usedPerHour}   limit={sub.rateLimitPerHour}   />
                    <UsageBar label="Per Day"    used={sub.usedPerDay}    limit={sub.rateLimitPerDay}    />
                    <UsageBar label="Total"      used={sub.usedTotal}     limit={sub.rateLimitTotal}     />
                  </div>
                )}

                {/* No limits set */}
                {!hasAnyLimit(sub) && sub.status === "active" && (
                  <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-4 text-xs text-green-600 font-semibold">
                    ✅ No rate limits set — unlimited access
                  </div>
                )}

                {/* API Key section */}
                {sub.status === "active" && (
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">API Key</p>
                      <button onClick={() => loadKey(sub.subscriptionId)}
                        className="text-xs text-teal-500 font-semibold hover:text-teal-600 transition-colors">
                        {showKey[sub.subscriptionId] ? "Hide" : "View Key Info"}
                      </button>
                    </div>
                    {showKey[sub.subscriptionId] && keys[sub.subscriptionId] && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">Client ID</p>
                            <code className="text-xs font-mono text-gray-700 break-all">
                              {keys[sub.subscriptionId].clientId}
                            </code>
                          </div>
                          <button onClick={() => copyText(keys[sub.subscriptionId].clientId, sub.subscriptionId)}
                            className={`ml-3 flex-shrink-0 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all
                              ${copied === sub.subscriptionId
                                ? "bg-green-500 text-white"
                                : "bg-white border border-gray-200 text-gray-500 hover:border-teal-300"}`}>
                            {copied === sub.subscriptionId ? "✓ Copied" : "Copy"}
                          </button>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <span className="text-xs font-semibold text-gray-600">
                            {keys[sub.subscriptionId].keyType}
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                            ${keys[sub.subscriptionId].status === "active"
                              ? "bg-green-50 text-green-600"
                              : "bg-gray-100 text-gray-400"}`}>
                            {keys[sub.subscriptionId].status}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {sub.status === "active" && (
                    <button onClick={() => handleRegen(sub.subscriptionId)} disabled={regen === sub.subscriptionId}
                      className="flex-1 bg-amber-50 text-amber-600 font-semibold text-xs py-2 rounded-lg
                        hover:bg-amber-100 transition-all disabled:opacity-50">
                      {regen === sub.subscriptionId ? "Regenerating…" : "Regenerate Key"}
                    </button>
                  )}
                  {sub.status !== "cancelled" && (
                    <button onClick={() => handleCancel(sub.subscriptionId)} disabled={cancelling === sub.subscriptionId}
                      className="flex-1 bg-red-50 text-red-400 font-semibold text-xs py-2 rounded-lg
                        hover:bg-red-100 transition-all disabled:opacity-50">
                      {cancelling === sub.subscriptionId ? "Cancelling…" : "Cancel Subscription"}
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
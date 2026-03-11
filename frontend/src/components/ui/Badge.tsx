import { ApiStatus, HttpMethod } from "@/types/api";

// ── Status Badge ─────────────────────────────────────────────────────────────

const statusStyles: Record<ApiStatus, { bg: string; text: string; dot: string }> = {
  draft:      { bg: "bg-gray-100",    text: "text-gray-600",   dot: "bg-gray-400"   },
  published:  { bg: "bg-teal-50",     text: "text-teal-700",   dot: "bg-teal-500"   },
  deprecated: { bg: "bg-orange-50",   text: "text-orange-600", dot: "bg-orange-400" },
  retired:    { bg: "bg-red-50",      text: "text-red-600",    dot: "bg-red-400"    },
};

export function StatusBadge({ status }: { status: ApiStatus }) {
  const s = statusStyles[status] ?? statusStyles.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ── Method Badge ─────────────────────────────────────────────────────────────

const methodStyles: Record<HttpMethod, string> = {
  GET:    "bg-blue-50   text-blue-600   border border-blue-200",
  POST:   "bg-teal-50   text-teal-600   border border-teal-200",
  PUT:    "bg-orange-50 text-orange-600 border border-orange-200",
  PATCH:  "bg-purple-50 text-purple-600 border border-purple-200",
  DELETE: "bg-red-50    text-red-600    border border-red-200",
};

export function MethodBadge({ method }: { method: string }) {
  const cls = methodStyles[method as HttpMethod] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono w-14 text-center inline-block ${cls}`}>
      {method}
    </span>
  );
}
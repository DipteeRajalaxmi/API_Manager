"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Input, Select, Textarea, Button } from "@/components/ui/FormFields";
import Toast from "@/components/ui/Toast";
import { createApi } from "@/lib/registry";
import { CreateApiRequest, ToastState } from "@/types/api";

export default function CreateApiPage() {
  const router = useRouter();
  const [form, setForm] = useState<CreateApiRequest>({
    apiName: "", version: "v1.0", description: "", baseUrl: "", visibility: "public",
    rateLimitPerMinute: undefined, rateLimitPerHour: undefined,
    rateLimitPerDay: undefined, rateLimitTotal: undefined,
});
  const [errors, setErrors] = useState<Partial<Record<keyof CreateApiRequest, string>>>({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast]     = useState<ToastState | null>(null);

  const validate = () => {
    const e: typeof errors = {};
    if (!form.apiName) e.apiName = "Required";
    if (!form.version) e.version = "Required";
    if (!form.baseUrl) e.baseUrl = "Required";
    else if (!form.baseUrl.startsWith("http")) e.baseUrl = "Must start with http(s)://";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await createApi(form);
      setToast({ message: "API created!", type: "success" });
      setTimeout(() => router.push(`/provider/apis/${res.apiId}`), 700);
    } catch (e: any) {
      setToast({ message: e.response?.data?.error || "Failed to create API", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const set = (key: keyof CreateApiRequest) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <DashboardLayout>
      <div className="p-8 max-w-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/provider/apis"
            className="w-9 h-9 bg-white rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:shadow transition-all">
            ←
          </Link>
          <div>
            <p className="text-teal-500 text-sm font-semibold">API Management</p>
            <h1 className="text-xl font-extrabold text-gray-800">Create New API</h1>
          </div>
        </div>

        <div className="card p-8">
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <Input label="API Name *" placeholder="Weather Service"
                value={form.apiName} onChange={set("apiName")} error={errors.apiName} />
              <Input label="Version *" placeholder="v1.0"
                value={form.version} onChange={set("version")} error={errors.version} />
            </div>
            <Input label="Base URL *" placeholder="https://api.example.com"
              value={form.baseUrl} onChange={set("baseUrl")} error={errors.baseUrl} />
            <Textarea label="Description" rows={4}
              placeholder="What does this API do?"
              value={form.description} onChange={set("description")} />
          <Select label="Visibility" value={form.visibility} onChange={set("visibility")}>
            <option value="public">🌐 Public — visible in marketplace</option>
            <option value="private">🔒 Private — org members only</option>
            <option value="restricted">🎯 Restricted — specific developers only</option>
          </Select>

              {/* Rate Limits */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-3">
                  Rate Limits <span className="text-gray-400 font-normal">(optional — leave blank to disable)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Per Minute" placeholder="e.g. 60" type="number"
                    value={form.rateLimitPerMinute ?? ""}
                    onChange={e => setForm(p => ({ ...p, rateLimitPerMinute: e.target.value ? Number(e.target.value) : undefined }))} />
                  <Input label="Per Hour" placeholder="e.g. 1000" type="number"
                    value={form.rateLimitPerHour ?? ""}
                    onChange={e => setForm(p => ({ ...p, rateLimitPerHour: e.target.value ? Number(e.target.value) : undefined }))} />
                  <Input label="Per Day" placeholder="e.g. 10000" type="number"
                    value={form.rateLimitPerDay ?? ""}
                    onChange={e => setForm(p => ({ ...p, rateLimitPerDay: e.target.value ? Number(e.target.value) : undefined }))} />
                  <Input label="Total (lifetime)" placeholder="e.g. 100000" type="number"
                    value={form.rateLimitTotal ?? ""}
                    onChange={e => setForm(p => ({ ...p, rateLimitTotal: e.target.value ? Number(e.target.value) : undefined }))} />
                </div>
              </div>

            <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 text-xs text-teal-700 flex gap-2">
              <span>ℹ</span>
              <span>Your API starts as <strong>Draft</strong>. Add endpoints, then publish to the marketplace.</span>
            </div>

            <div className="flex gap-3">
              <Button variant="primary" onClick={handleSubmit} disabled={loading} className="flex-1">
                {loading ? "Creating…" : "Create API →"}
              </Button>
              <Link href="/provider/apis">
                <Button variant="secondary">Cancel</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </DashboardLayout>
  );
}
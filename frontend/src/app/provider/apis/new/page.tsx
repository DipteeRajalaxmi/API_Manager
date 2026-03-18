"use client";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Input, Select, Textarea, Button } from "@/components/ui/FormFields";
import Toast from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import { createApi, previewSwaggerFile, importSwaggerFile, importSwaggerUrl } from "@/lib/registry";
import { CreateApiRequest, ToastState } from "@/types/api";
import { ImportPreview } from "@/lib/registry";

// ── Method badge colours (reused from detail page style) ──────────────────────
const METHOD_COLORS: Record<string, string> = {
  GET:    "bg-green-50  text-green-600  border-green-100",
  POST:   "bg-blue-50   text-blue-600   border-blue-100",
  PUT:    "bg-amber-50  text-amber-600  border-amber-100",
  PATCH:  "bg-purple-50 text-purple-600 border-purple-100",
  DELETE: "bg-red-50    text-red-500    border-red-100",
};

type Mode = "manual" | "import";
type ImportTab = "file" | "url";

export default function CreateApiPage() {
  const router = useRouter();

  // ── Mode toggle ───────────────────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>("manual");

  // ── Manual form ──────────────────────────────────────────────────────────
  const [form, setForm] = useState<CreateApiRequest>({
    apiName: "", version: "v1.0", description: "", baseUrl: "", visibility: "public",
    rateLimitPerMinute: undefined, rateLimitPerHour: undefined,
    rateLimitPerDay: undefined, rateLimitTotal: undefined,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateApiRequest, string>>>({});
  const [manualLoading, setManualLoading] = useState(false);

  // ── Import state ──────────────────────────────────────────────────────────
  const [importTab, setImportTab]       = useState<ImportTab>("file");
  const [importUrl, setImportUrl]       = useState("");
  const [importFile, setImportFile]     = useState<File | null>(null);
  const [dragOver, setDragOver]         = useState(false);
  const [previewing, setPreviewing]     = useState(false);
  const [importing, setImporting]       = useState(false);
  const [preview, setPreview]           = useState<ImportPreview | null>(null);
  const [showPreview, setShowPreview]   = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<ToastState | null>(null);
  const show = (message: string, type: ToastState["type"] = "success") =>
    setToast({ message, type });

  // ── Manual submit ─────────────────────────────────────────────────────────
  const validate = () => {
    const e: typeof errors = {};
    if (!form.apiName) e.apiName = "Required";
    if (!form.version) e.version = "Required";
    if (!form.baseUrl) e.baseUrl = "Required";
    else if (!form.baseUrl.startsWith("http")) e.baseUrl = "Must start with http(s)://";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleManualSubmit = async () => {
    if (!validate()) return;
    setManualLoading(true);
    try {
      const res = await createApi(form);
      show("API created!");
      setTimeout(() => router.push(`/provider/apis/${res.apiId}`), 700);
    } catch (e: any) {
      show(e.response?.data?.error || "Failed to create API", "error");
    } finally {
      setManualLoading(false);
    }
  };

  // ── File drag & drop ──────────────────────────────────────────────────────
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []);

  const handleFileSelect = (file: File) => {
    const name = file.name.toLowerCase();
    if (!name.endsWith(".json") && !name.endsWith(".yaml") && !name.endsWith(".yml")) {
      show("Only .json, .yaml, or .yml files are supported", "error");
      return;
    }
    setImportFile(file);
    setPreview(null);
  };

  // ── Preview ───────────────────────────────────────────────────────────────
  const handlePreview = async () => {
    if (!importFile) return;
    setPreviewing(true);
    try {
      const p = await previewSwaggerFile(importFile);
      setPreview(p);
      setShowPreview(true);
    } catch (e: any) {
      show(e.response?.data?.error || "Failed to parse file", "error");
    } finally {
      setPreviewing(false);
    }
  };

  // ── Confirm import (after preview) ───────────────────────────────────────
  const handleConfirmImport = async () => {
    if (!importFile) return;
    setImporting(true);
    try {
      const result = await importSwaggerFile(importFile);
      show(`Imported "${result.apiName}" — ${result.endpointCount} endpoints created`);
      setShowPreview(false);
      setTimeout(() => router.push(`/provider/apis/${result.apiId}`), 800);
    } catch (e: any) {
      show(e.response?.data?.error || "Import failed", "error");
    } finally {
      setImporting(false);
    }
  };

  // ── Direct import without preview (URL) ──────────────────────────────────
  const handleUrlImport = async () => {
    if (!importUrl.trim()) return show("Enter a URL", "error");
    if (!importUrl.startsWith("http")) return show("URL must start with http(s)://", "error");
    setImporting(true);
    try {
      const result = await importSwaggerUrl(importUrl);
      show(`Imported "${result.apiName}" — ${result.endpointCount} endpoints created`);
      setTimeout(() => router.push(`/provider/apis/${result.apiId}`), 800);
    } catch (e: any) {
      show(e.response?.data?.error || "Import failed", "error");
    } finally {
      setImporting(false);
    }
  };

  const set = (key: keyof CreateApiRequest) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <DashboardLayout>
      <div className="p-8 max-w-2xl animate-fade-in">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/provider/apis"
            className="w-9 h-9 bg-white rounded-xl border border-gray-100 flex items-center justify-center
              text-gray-400 hover:text-gray-600 hover:shadow transition-all">
            ←
          </Link>
          <div>
            <p className="text-teal-500 text-sm font-semibold">API Management</p>
            <h1 className="text-xl font-extrabold text-gray-800">Create New API</h1>
          </div>
        </div>

        {/* ── Mode toggle ─────────────────────────────────────────────────── */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
          <button onClick={() => setMode("manual")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all
              ${mode === "manual" ? "bg-white text-teal-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            ✏️ Manual
          </button>
          <button onClick={() => setMode("import")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all
              ${mode === "import" ? "bg-white text-teal-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            📥 Import Swagger
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            MANUAL MODE
        ════════════════════════════════════════════════════════════════════ */}
        {mode === "manual" && (
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
              <Textarea label="Description" rows={4} placeholder="What does this API do?"
                value={form.description} onChange={set("description")} />
              <Select label="Visibility" value={form.visibility} onChange={set("visibility")}>
                <option value="public">🌐 Public — visible in marketplace</option>
                <option value="private">🔒 Private — org members only</option>
                <option value="restricted">🎯 Restricted — specific developers only</option>
              </Select>

              {/* Rate Limits */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-3">
                  Rate Limits <span className="text-gray-400 font-normal">(optional)</span>
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
                <Button variant="primary" onClick={handleManualSubmit}
                  disabled={manualLoading} className="flex-1">
                  {manualLoading ? "Creating…" : "Create API →"}
                </Button>
                <Link href="/provider/apis">
                  <Button variant="secondary">Cancel</Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            IMPORT MODE
        ════════════════════════════════════════════════════════════════════ */}
        {mode === "import" && (
          <div className="flex flex-col gap-5">

            {/* Import source tabs */}
            <div className="card p-1 flex gap-1 w-fit bg-gray-50">
              <button onClick={() => setImportTab("file")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all
                  ${importTab === "file" ? "bg-white text-teal-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                📄 Upload File
              </button>
              <button onClick={() => setImportTab("url")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all
                  ${importTab === "url" ? "bg-white text-teal-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                🔗 From URL
              </button>
            </div>

            {/* ── File upload ────────────────────────────────────────────── */}
            {importTab === "file" && (
              <div className="card p-6 flex flex-col gap-5">
                <div>
                  <p className="font-bold text-gray-800 mb-1">Upload Swagger / OpenAPI File</p>
                  <p className="text-gray-400 text-xs">Supports OpenAPI 2.0 (Swagger) and 3.x in JSON or YAML format</p>
                </div>

                {/* Drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer
                    transition-all duration-200
                    ${dragOver
                      ? "border-teal-400 bg-teal-50 scale-[1.01]"
                      : importFile
                        ? "border-teal-300 bg-teal-50/50"
                        : "border-gray-200 bg-gray-50 hover:border-teal-300 hover:bg-teal-50/30"
                    }`}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.yaml,.yml"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  />

                  {importFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-teal-100 rounded-2xl flex items-center justify-center text-2xl">
                        {importFile.name.endsWith(".json") ? "{ }" : "📄"}
                      </div>
                      <p className="font-bold text-gray-800 text-sm">{importFile.name}</p>
                      <p className="text-gray-400 text-xs">
                        {(importFile.size / 1024).toFixed(1)} KB
                      </p>
                      <button
                        onClick={e => { e.stopPropagation(); setImportFile(null); setPreview(null); }}
                        className="text-xs text-red-400 hover:text-red-600 mt-1 font-semibold">
                        ✕ Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl">
                        📂
                      </div>
                      <div>
                        <p className="font-semibold text-gray-600 text-sm">
                          Drop your file here, or <span className="text-teal-500">browse</span>
                        </p>
                        <p className="text-gray-400 text-xs mt-1">.json · .yaml · .yml</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Info box */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 flex gap-2">
                  <span className="flex-shrink-0">💡</span>
                  <span>
                    We'll <strong>preview the parsed API</strong> before saving anything.
                    You can review all endpoints before confirming the import.
                  </span>
                </div>

                <div className="flex gap-3">
                  <Button variant="primary" disabled={!importFile || previewing}
                    onClick={handlePreview} className="flex-1">
                    {previewing ? "Parsing…" : "Preview Import →"}
                  </Button>
                  <Link href="/provider/apis">
                    <Button variant="secondary">Cancel</Button>
                  </Link>
                </div>
              </div>
            )}

            {/* ── URL import ─────────────────────────────────────────────── */}
            {importTab === "url" && (
              <div className="card p-6 flex flex-col gap-5">
                <div>
                  <p className="font-bold text-gray-800 mb-1">Import from URL</p>
                  <p className="text-gray-400 text-xs">
                    Point to a publicly accessible Swagger / OpenAPI spec URL
                  </p>
                </div>

                <Input
                  label="Swagger URL *"
                  placeholder="https://petstore.swagger.io/v2/swagger.json"
                  value={importUrl}
                  onChange={e => setImportUrl(e.target.value)}
                />

                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-700 flex gap-2">
                  <span className="flex-shrink-0">⚠️</span>
                  <span>
                    The URL must be publicly accessible. Private / intranet URLs will fail.
                    URL import creates the API immediately without a preview step.
                  </span>
                </div>

                {/* Example URLs */}
                <div>
                  <p className="text-xs text-gray-400 font-semibold mb-2">Try an example:</p>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { label: "Petstore (JSON)", url: "https://petstore.swagger.io/v2/swagger.json" },
                      { label: "Petstore v3 (YAML)", url: "https://petstore3.swagger.io/api/v3/openapi.json" },
                    ].map(ex => (
                      <button key={ex.url}
                        onClick={() => setImportUrl(ex.url)}
                        className="text-left text-xs text-teal-600 hover:text-teal-700 font-mono
                          bg-teal-50 hover:bg-teal-100 px-3 py-2 rounded-lg transition-colors truncate">
                        {ex.label} — {ex.url}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="primary"
                    disabled={!importUrl.trim() || importing}
                    onClick={handleUrlImport}
                    className="flex-1">
                    {importing ? "Importing…" : "Import from URL →"}
                  </Button>
                  <Link href="/provider/apis">
                    <Button variant="secondary">Cancel</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          PREVIEW MODAL
      ════════════════════════════════════════════════════════════════════════ */}
      {showPreview && preview && (
        <Modal title="Preview Import" onClose={() => setShowPreview(false)} size="lg">
          <div className="flex flex-col gap-5">

            {/* API summary */}
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl grad-teal flex items-center justify-center
                  text-white font-bold text-lg shadow-md flex-shrink-0">
                  {preview.apiName?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-gray-800">{preview.apiName}</h3>
                    <span className="text-teal-600 font-mono text-xs bg-white border border-teal-200 px-2 py-0.5 rounded-lg">
                      {preview.version}
                    </span>
                    <span className="text-xs bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full font-semibold">
                      DRAFT
                    </span>
                  </div>
                  {preview.description && (
                    <p className="text-gray-500 text-sm mt-1">{preview.description}</p>
                  )}
                  <p className="text-gray-400 font-mono text-xs mt-1">{preview.baseUrl}</p>
                </div>
              </div>
            </div>

            {/* Endpoint list */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-gray-700">
                  Endpoints to create
                </p>
                <span className="text-xs bg-teal-50 text-teal-600 border border-teal-100
                  px-2.5 py-1 rounded-full font-semibold">
                  {preview.endpoints.length} total
                </span>
              </div>

              {preview.endpoints.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-6 text-center text-sm text-gray-400">
                  No endpoints found in this spec
                </div>
              ) : (
                <div className="border border-gray-100 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  <div className="divide-y divide-gray-50">
                    {preview.endpoints.map((ep, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded border min-w-[52px] text-center
                          ${METHOD_COLORS[ep.method] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                          {ep.method}
                        </span>
                        <code className="text-gray-700 text-xs font-mono flex-1">{ep.path}</code>
                        <span className="text-gray-400 text-xs truncate max-w-[160px]">
                          {ep.description || "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm strip */}
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-xs text-green-700 flex gap-2">
              <span>✅</span>
              <span>
                This will create the API in <strong>Draft</strong> status.
                You can edit details, add more endpoints, and publish when ready.
              </span>
            </div>

            <div className="flex gap-3">
              <Button variant="primary" disabled={importing}
                onClick={handleConfirmImport} className="flex-1">
                {importing ? "Importing…" : `Confirm Import (${preview.endpoints.length} endpoints)`}
              </Button>
              <Button variant="secondary" onClick={() => setShowPreview(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </DashboardLayout>
  );
}
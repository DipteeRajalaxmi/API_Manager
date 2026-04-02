
import api from "./api";
import {
  Api,
  CreateApiRequest,
  CreateEndpointRequest,
  CreateDocumentRequest,
  ApiEndpoint,
  ApiPlanLimit,
  ApiDocument,
} from "@/types/api";

// ── APIs ──────────────────────────────────────────────────────────────────────

export const getMyApis = async (): Promise<Api[]> => {
  const res = await api.get<Api[]>("/api/apis/my");
  return res.data;
};

export const searchApis = async (search = "", categoryId?: number): Promise<Api[]> => {
  const res = await api.get<Api[]>("/api/apis", {
    params: { search, ...(categoryId ? { categoryId } : {}) },
  });
  return res.data;
};

export const getApiById = async (apiId: number): Promise<Api> => {
  const res = await api.get<Api>(`/api/apis/${apiId}`);
  return res.data;
};

export const createApi = async (data: CreateApiRequest): Promise<Api> => {
  const res = await api.post<Api>("/api/apis", data);
  return res.data;
};

export const updateApi = async (apiId: number, data: Partial<CreateApiRequest>): Promise<Api> => {
  const res = await api.put<Api>(`/api/apis/${apiId}`, data);
  return res.data;
};

export const deleteApi = async (apiId: number): Promise<void> => {
  await api.delete(`/api/apis/${apiId}`);
};

export const publishApi    = async (apiId: number) => api.patch(`/api/apis/${apiId}/publish`);
export const deprecateApi  = async (apiId: number) => api.patch(`/api/apis/${apiId}/deprecate`);
export const retireApi     = async (apiId: number) => api.patch(`/api/apis/${apiId}/retire`);

export const createVersion = async (apiId: number, version: string): Promise<Api> => {
  const res = await api.post<Api>(`/api/apis/${apiId}/versions`, null, { params: { version } });
  return res.data;
};

export const getVersions = async (apiId: number): Promise<Api[]> => {
  const res = await api.get<Api[]>(`/api/apis/${apiId}/versions`);
  return res.data;
};

// ── Endpoints ─────────────────────────────────────────────────────────────────

export const getEndpoints = async (apiId: number): Promise<ApiEndpoint[]> => {
  const res = await api.get<ApiEndpoint[]>(`/api/apis/${apiId}/endpoints`);
  return res.data;
};

export const addEndpoint = async (
  apiId: number,
  data: CreateEndpointRequest
): Promise<ApiEndpoint> => {
  const res = await api.post<ApiEndpoint>(`/api/apis/${apiId}/endpoints`, data);
  return res.data;
};

export async function updateEndpoint(
  endpointId: number,
  data: {
    httpMethod?: string;
    path?: string;
    description?: string;
    isAuthenticated?: boolean;
    rateLimitPerMinute?: number | null;
    rateLimitPerHour?: number | null;
    rateLimitPerDay?: number | null;
    rateLimitTotal?: number | null;
  }
): Promise<ApiEndpoint> {
  const res = await api.put(`/api/apis/endpoints/${endpointId}`, data);
  return res.data;
}

export const deleteEndpoint = async (endpointId: number): Promise<void> => {
  await api.delete(`/api/apis/endpoints/${endpointId}`);
};

// ── Documents ─────────────────────────────────────────────────────────────────

export const getDocuments = async (apiId: number): Promise<ApiDocument[]> => {
  const res = await api.get<ApiDocument[]>(`/api/apis/${apiId}/documents`);
  return res.data;
};

export const addDocument = async (
  apiId: number,
  data: CreateDocumentRequest
): Promise<ApiDocument> => {
  const res = await api.post<ApiDocument>(`/api/apis/${apiId}/documents`, data);
  return res.data;
};

export const deleteDocument = async (docId: number): Promise<void> => {
  await api.delete(`/api/apis/documents/${docId}`);
};


export const updateRateLimits = async (apiId: number, data: {
  rateLimitPerMinute: number | null;
  rateLimitPerHour: number | null;
  rateLimitPerDay: number | null;
  rateLimitTotal: number | null;
}): Promise<void> => {
  await api.put(`/api/portal/provider/apis/${apiId}/rate-limits`, data);
};

export const blockApi = async (apiId: number, reason?: string) =>
  api.patch(`/api/apis/${apiId}/block`, { reason });

export const unblockApi = async (apiId: number) =>
  api.patch(`/api/apis/${apiId}/unblock`);

export const blockEndpoint = async (endpointId: number, reason?: string) =>
  api.patch(`/api/apis/endpoints/${endpointId}/block`, { reason });

export const unblockEndpoint = async (endpointId: number) =>
  api.patch(`/api/apis/endpoints/${endpointId}/unblock`);



export interface ImportPreview {
  apiName: string;
  version: string;
  description: string;
  baseUrl: string;
  endpoints: { method: string; path: string; description: string }[];
}

export interface ImportResult {
  message: string;
  apiId: number;
  apiName: string;
  version: string;
  endpointCount: number;
}

/** Preview a Swagger file without saving — returns parsed metadata + endpoints */
export const previewSwaggerFile = async (file: File): Promise<ImportPreview> => {
  const form = new FormData();
  form.append("file", file);
  const res = await api.post<ImportPreview>("/api/apis/swagger/import/preview", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

/** Import from uploaded file — creates API in DRAFT */
export const importSwaggerFile = async (file: File): Promise<ImportResult> => {
  const form = new FormData();
  form.append("file", file);
  const res = await api.post<ImportResult>("/api/apis/swagger/import", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

/** Preview from a remote Swagger URL — parses only, does NOT save */
export const previewSwaggerUrl = async (url: string): Promise<ImportPreview> => {
  const res = await api.get<ImportPreview>("/api/apis/swagger/import/preview-url", {
    params: { url },
  });
  return res.data;
};

/** Import from a remote Swagger URL — creates API in DRAFT */
export const importSwaggerUrl = async (url: string): Promise<ImportResult> => {
  const res = await api.post<ImportResult>("/api/apis/swagger/import-url", { url });
  return res.data;
};

// ── Plan Limits ───────────────────────────────────────────────────────────────

export const getPlanLimits = async (apiId: number): Promise<ApiPlanLimit[]> => {
  const res = await api.get(`/api/registry/apis/${apiId}/plan-limits`);
  return res.data;
};

export const savePlanLimit = async (apiId: number, data: ApiPlanLimit): Promise<ApiPlanLimit> => {
  const res = await api.post(`/api/registry/apis/${apiId}/plan-limits`, data);
  return res.data;
};

export const deletePlanLimit = async (apiId: number, planName: string): Promise<void> => {
  await api.delete(`/api/registry/apis/${apiId}/plan-limits/${planName}`);
};



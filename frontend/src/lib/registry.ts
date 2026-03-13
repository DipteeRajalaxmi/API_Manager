
import api from "./api";
import {
  Api,
  CreateApiRequest,
  CreateEndpointRequest,
  CreateDocumentRequest,
  ApiEndpoint,
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

export const deleteEndpoint = async (endpointId: number): Promise<void> => {
  await api.delete(`/api/endpoints/${endpointId}`);
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
  await api.delete(`/api/documents/${docId}`);
};


export const updateRateLimits = async (apiId: number, data: {
  rateLimitPerMinute: number | null;
  rateLimitPerHour: number | null;
  rateLimitPerDay: number | null;
  rateLimitTotal: number | null;
}): Promise<void> => {
  await api.put(`/api/portal/provider/apis/${apiId}/rate-limits`, data);
};
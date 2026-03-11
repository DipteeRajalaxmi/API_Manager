// All types for the registry / portal module

export type ApiStatus = "draft" | "published" | "deprecated" | "retired";
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface Api {
  apiId: number;
  apiName: string;
  version: string;
  description: string;
  baseUrl: string;
  status: ApiStatus;
  visibility: string;
  authType: string;
  orgName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiEndpoint {
  endpointId: number;
  httpMethod: HttpMethod;
  path: string;
  description: string;
  isAuthenticated: boolean;
  requestSchema?: string;
  responseSchema?: string;
}

export interface ApiDocument {
  docId: number;
  title: string;
  docType: string;
  content?: string;
  docUrl?: string;
  createdAt: string;
}

export interface CreateApiRequest {
  apiName: string;
  version: string;
  description?: string;
  baseUrl: string;
  visibility: string;
}

export interface CreateEndpointRequest {
  httpMethod: HttpMethod;
  path: string;
  description?: string;
  isAuthenticated: boolean;
  requestSchema?: string;
  responseSchema?: string;
}

export interface CreateDocumentRequest {
  title: string;
  docType: string;
  content?: string;
  docUrl?: string;
}

export interface ToastState {
  message: string;
  type: "success" | "error" | "info";
}
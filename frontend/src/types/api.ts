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
  rateLimitPerMinute?: number | null;
  rateLimitPerHour?: number | null;
  rateLimitPerDay?: number | null;
  rateLimitTotal?: number | null;
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
  rateLimitPerMinute?: number;
  rateLimitPerHour?: number;
  rateLimitPerDay?: number;
  rateLimitTotal?: number;
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

export interface Application {
  appId: number;
  appName: string;
  description: string;
  status: string;
  createdAt: string;
}

export interface Subscription {
  subscriptionId: number;
  appId: number;
  appName: string;
  apiId: number;
  apiName: string;
  apiVersion: string;
  status: string;
  createdAt: string;
  // usage counters
  usageToday?: number;
  usageThisHour?: number;
  usageThisMinute?: number;
}

export interface ApiKey {
  keyId: number;
  clientId: string;
  keyType: string;
  status: string;
  createdAt: string;
  // raw key only returned once on creation
  rawKey?: string;
}

export interface SubscribeResponse {
  subscriptionId: number;
  appId: number;
  appName: string;
  apiId: number;
  apiName: string;
  apiVersion: string;
  status: string;
  clientId: string;  // raw key shown once
  subscribedAt: string; 
}

export interface CreateApplicationRequest {
  appName: string;
  description?: string;
}
import api from "./api";
import {
  Application,
  Subscription,
  ApiKey,
  SubscribeResponse,
  CreateApplicationRequest,
} from "@/types/api";

// ── Applications ──────────────────────────────────────────────────────────────

export const getMyApps = async (): Promise<Application[]> => {
  const res = await api.get<Application[]>("/api/portal/applications");
  return res.data;
};

export const createApp = async (data: CreateApplicationRequest): Promise<Application> => {
  const res = await api.post<Application>("/api/portal/applications", data);
  return res.data;
};

export const deleteApp = async (appId: number): Promise<void> => {
  await api.delete(`/api/portal/applications/${appId}`);
};

// ── Subscriptions ─────────────────────────────────────────────────────────────

export const getMySubscriptions = async (): Promise<Subscription[]> => {
  const res = await api.get<Subscription[]>("/api/portal/subscriptions");
  return res.data;
};

export const getAppSubscriptions = async (appId: number): Promise<Subscription[]> => {
  const res = await api.get<Subscription[]>(`/api/portal/applications/${appId}/subscriptions`);
  return res.data;
};

export const subscribe = async (
  appId: number,
  apiId: number
): Promise<SubscribeResponse> => {
  const res = await api.post<SubscribeResponse>("/api/portal/subscriptions", { appId, apiId });
  return res.data;
};

export const cancelSubscription = async (subId: number): Promise<void> => {
  await api.delete(`/api/portal/subscriptions/${subId}`);
};

// ── API Keys ──────────────────────────────────────────────────────────────────

export const getSubscriptionKey = async (subId: number): Promise<ApiKey> => {
  const res = await api.get<ApiKey>(`/api/portal/subscriptions/${subId}/key`);
  return res.data;
};

export const regenerateKey = async (subId: number): Promise<ApiKey & { rawClientSecret: string }> => {
  const res = await api.post(`/api/portal/subscriptions/${subId}/key/regenerate`);
  return res.data;
};


export const getProviderSubscriptions = async (): Promise<Subscription[]> => {
  const res = await api.get<Subscription[]>("/api/portal/provider/subscriptions");
  return res.data;
};

export const updateSubscriptionStatus = async (subId: number, status: string): Promise<void> => {
  await api.patch(`/api/portal/provider/subscriptions/${subId}/status`, { status });
};


export const getAllowedDevelopers = async (apiId: number): Promise<any[]> => {
  const res = await api.get(`/api/portal/provider/apis/${apiId}/allowed-developers`);
  return res.data;
};

export const addAllowedDeveloper = async (apiId: number, devId: number): Promise<void> => {
  await api.post(`/api/portal/provider/apis/${apiId}/allowed-developers/${devId}`);
};

export const removeAllowedDeveloper = async (apiId: number, devId: number): Promise<void> => {
  await api.delete(`/api/portal/provider/apis/${apiId}/allowed-developers/${devId}`);
};
import api from "./api";
import { UserResponse } from "@/types/auth";

export const getOrgDevelopers = async (): Promise<UserResponse[]> => {
  const res = await api.get<UserResponse[]>("/api/users/org");
  return res.data;
};

export const addDeveloperToOrg = async (name: string, email: string, password: string) => {
  const res = await api.post("/api/users/org/add", { name, email, password });
  return res.data;
};
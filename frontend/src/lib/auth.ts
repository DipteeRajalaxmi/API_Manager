import api from "./api";
import { AuthResponse } from "@/types/auth";

// ── API calls ─────────────────────────────────────────────────────────────────

export const register = async (
  email: string,
  password: string,
  name: string,
  roleName: string = "DEVELOPER",
  organizationName?: string,
  organizationDomain?: string,
  inviteCode?: string
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/api/auth/register", {
    email,
    password,
    name,
    roleName,
    organizationName,
    organizationDomain,
    inviteCode,
  });
  return response.data;
};

export const login = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/api/auth/login", {
    email,
    password,
  });
  return response.data;
};

// ── Storage ───────────────────────────────────────────────────────────────────

export const saveAuth = (data: AuthResponse) => {
  localStorage.setItem("token", data.token);
  localStorage.setItem("refreshToken", data.refreshToken);
  localStorage.setItem("user", JSON.stringify(data));
};

export const getUser = (): AuthResponse | null => {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
};

export const isLoggedIn = (): boolean => {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("token");
};

// ── Role routing ──────────────────────────────────────────────────────────────

export const getHomeRoute = (role: string): string => {
  switch (role?.toUpperCase()) {
    case "API_PROVIDER": return "/provider/dashboard";
    case "DEVELOPER":    return "/developer/dashboard";
    case "ADMIN":        return "/admin/dashboard";
    case "VIEWER":       return "/marketplace";
    default:             return "/marketplace";
  }
};

export const getNavItems = (role: string) => {
  switch (role?.toUpperCase()) {
    case "API_PROVIDER":
      return [
        { href: "/provider/dashboard", icon: "dashboard", label: "Dashboard"   },
        { href: "/provider/apis",      icon: "apis",      label: "My APIs"     },
        { href: "/marketplace",        icon: "market",    label: "Marketplace" },
        { href: "/provider/api-requests", icon: "handshake", label: "API Requests" },
        { href: "/provider/developers", icon: "users", label: "Developers" },
        { href: "/provider/analytics", icon: "analytics", label: "Analytics" },
        { href: "/provider/settings", icon: "settings", label: "Settings" }

      ];
    case "DEVELOPER":
      return [
        { href: "/developer/dashboard", icon: "dashboard", label: "Dashboard"   },
        { href: "/marketplace",         icon: "market",    label: "Marketplace" },
        { href: "/developer/apps",      icon: "apps",      label: "My Apps"     },
        { href: "/developer/contribute",  icon: "apis",      label: "Contribute API" },
        { href: "/developer/my-requests", icon: "handshake ", label: "My Requests"    },
        { href: "/developer/analytics", icon: "analytics", label: "Analytics" },
        { href: "/developer/settings", icon: "settings", label: "Settings" }
      ];
    case "ADMIN":
      return [
        { href: "/admin/dashboard",      icon: "dashboard", label: "Dashboard"     },
        { href: "/admin/users",          icon: "users",     label: "Users"         },
        { href: "/admin/organizations",  icon: "market",    label: "Organizations" },
        { href: "/admin/apis",           icon: "apis",      label: "All APIs"      },
        { href: "/marketplace",          icon: "market",    label: "Marketplace"   },
      ];
    default:
      return [{ href: "/marketplace", icon: "market", label: "Marketplace" }];
  }
};
import { apiRequest } from "./queryClient";
import type { AuthUser, LoginCredentials, RegisterCredentials } from "../types";

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<{ user: AuthUser; token: string }> => {
    const response = await apiRequest("POST", "/api/auth/login", credentials);
    return response.json();
  },

  register: async (credentials: RegisterCredentials): Promise<{ user: AuthUser; token: string }> => {
    const response = await apiRequest("POST", "/api/auth/register", credentials);
    return response.json();
  },

  logout: async (): Promise<void> => {
    await apiRequest("POST", "/api/auth/logout");
  },

  getProfile: async (): Promise<AuthUser> => {
    const response = await apiRequest("GET", "/api/user/profile");
    return response.json();
  },
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem("auth_token");
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem("auth_token", token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem("auth_token");
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

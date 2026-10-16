import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import type { ApiResponse, AuthResponse } from "@/types";
import { clearTokens, getAccessToken, isLoggedOut, storeTokens } from "@/lib/auth-storage";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  // Send/accept the HttpOnly refresh cookie (cross-site: Vercel → Render).
  withCredentials: true,
});

// Auth endpoints go through the Next.js rewrite proxy (/api/v1/auth/* → API
// origin) so the refresh cookie is FIRST-party — Safari drops third-party
// cookies entirely. Relative base = same origin = the proxy.
const authApi: AxiosInstance = axios.create({
  baseURL: "/api/v1",
  timeout: 15_000,
  withCredentials: true,
});

/** Same envelope unwrap as request(), but via the same-origin auth proxy. */
export async function authRequest<T>(config: Parameters<typeof authApi.request>[0]): Promise<T> {
  const response = await authApi.request<ApiResponse<T>>(config);
  const body = response.data;
  if (!body.success) {
    const first = body.errors?.[0];
    throw new ApiRequestError(first?.message ?? "Request failed", first?.code ?? "UNKNOWN", first?.field);
  }
  return body.data;
}

// ---------- envelope helpers ----------

/** Unwraps { success, data } or throws the first API error with its code. */
export async function request<T>(config: Parameters<typeof api.request>[0]): Promise<T> {
  const response = await api.request<ApiResponse<T>>(config);
  const body = response.data;
  if (!body.success) {
    const first = body.errors?.[0];
    throw new ApiRequestError(first?.message ?? "Request failed", first?.code ?? "UNKNOWN", first?.field);
  }
  return body.data;
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly field?: string | null,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

// ---------- request interceptor: attach the JWT ----------

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------- response interceptor: one refresh, many waiters ----------

let refreshPromise: Promise<string | null> | null = null;

/** Single-flight: ten parallel 401s must trigger exactly ONE /auth/refresh call. */
async function refreshAccessToken(): Promise<string | null> {
  // Logout latch: never resurrect a session the user just ended.
  if (isLoggedOut()) return null;
  try {
    // No body — the refresh token rides in the HttpOnly cookie automatically.
    // Relative URL = Next proxy = first-party cookie (Safari-safe).
    // Raw axios on purpose — the authenticated instance would recurse here.
    const response = await axios.post<ApiResponse<AuthResponse>>(
      "/api/v1/auth/refresh",
      undefined,
      { timeout: 15_000, withCredentials: true },
    );
    const body = response.data;
    if (!body.success) return null;

    storeTokens(body.data.accessToken, body.data.user);
    return body.data.accessToken;
  } catch {
    return null;
  } finally {
    // Allow the next batch of 401s to attempt a fresh refresh.
    refreshPromise = null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    const is401 = error.response?.status === 401;
    // Credential endpoints never carry a usable token; only refresh is loop-sensitive.
    // /auth/me etc. MUST be allowed to refresh — blanket "/auth/" blocking would
    // kill valid sessions on an expired access token.
    const NO_REFRESH_ENDPOINTS = ["/auth/login", "/auth/register", "/auth/forgot-password", "/auth/reset-password", "/auth/revoke", "/auth/refresh"];
    const skipsRefresh = NO_REFRESH_ENDPOINTS.some((u) => original?.url?.includes(u) ?? false);

    if (!is401 || !original || skipsRefresh) {
      if (is401 && skipsRefresh) clearTokens();
      throw error;
    }

    // A second 401 right after a successful refresh = the session is truly dead.
    if (original._retry) {
      clearTokens();
      if (typeof window !== "undefined") window.location.href = "/login";
      throw error;
    }

    original._retry = true;
    refreshPromise ??= refreshAccessToken();
    const freshToken = await refreshPromise;

    if (!freshToken) {
      clearTokens();
      if (typeof window !== "undefined") {
        const next = encodeURIComponent(window.location.pathname);
        window.location.href = `/login?next=${next}`;
      }
      throw error;
    }

    original.headers.Authorization = `Bearer ${freshToken}`;
    return api(original);
  },
);

/** Maps an axios/api failure into the standard display error. */
export function toApiError(error: unknown): ApiRequestError {
  if (error instanceof ApiRequestError) return error;
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiResponse<unknown> | undefined;
    const first = body?.errors?.[0];
    if (first) return new ApiRequestError(first.message, first.code, first.field);
    if (error.code === "ERR_NETWORK") {
      return new ApiRequestError("Cannot reach the API server. Is the backend running?", "NETWORK");
    }
    return new ApiRequestError(error.message, "HTTP_ERROR");
  }
  return new ApiRequestError("Something went wrong.", "UNKNOWN");
}

import type { AuthUser } from "@/types";

/**
 * Token storage.
 *
 * ponytail: PRD asks for refresh-in-HttpOnly-cookie (needs a BFF/cookie flow on
 * the API — Phase 8 hardening). Until then both tokens live in localStorage and
 * the ACCESS token is mirrored into a readable cookie so Next.js middleware can
 * gate routes before React hydrates.
 */
const ACCESS_KEY = "tdp_access";
const REFRESH_KEY = "tdp_refresh";
const USER_KEY = "tdp_user";
const MIDDLEWARE_COOKIE = "tdp_access";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function storeTokens(accessToken: string, refreshToken: string, user: AuthUser): void {
  window.localStorage.setItem(ACCESS_KEY, accessToken);
  window.localStorage.setItem(REFRESH_KEY, refreshToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  mirrorForMiddleware(accessToken);
  window.dispatchEvent(new Event("tdp-auth-changed"));
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
  window.localStorage.removeItem(USER_KEY);
  document.cookie = `${MIDDLEWARE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  window.dispatchEvent(new Event("tdp-auth-changed"));
}

export function isAuthenticated(): boolean {
  return getAccessToken() !== null;
}

function mirrorForMiddleware(accessToken: string): void {
  // Readable by JS + Next middleware (edge runtime has no localStorage).
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${MIDDLEWARE_COOKIE}=${accessToken}; Path=/; Max-Age=900; SameSite=Lax${secure}`;
}

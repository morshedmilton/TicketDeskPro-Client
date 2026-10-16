import type { AuthUser } from "@/types";

/**
 * Token storage (HttpOnly-cookie hardening).
 *
 * The REFRESH token never touches JavaScript — the API sets it as an HttpOnly
 * cookie on login and rotates it on /auth/refresh; the browser attaches it
 * automatically (axios withCredentials). Only the short-lived ACCESS token and
 * the user profile live here; the access token is also mirrored into a readable
 * cookie so Next.js middleware can gate routes before React hydrates.
 */
const ACCESS_KEY = "tdp_access";
const USER_KEY = "tdp_user";
const MIDDLEWARE_COOKIE = "tdp_access";
// Pre-migration leftovers + the logged-out latch (see markLoggedOut).
const LEGACY_REFRESH_KEY = "tdp_refresh";
const LOGGED_OUT_KEY = "tdp_logged_out";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_KEY);
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

export function storeTokens(accessToken: string, user: AuthUser): void {
  window.localStorage.setItem(ACCESS_KEY, accessToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.localStorage.removeItem(LOGGED_OUT_KEY); // a real login lifts the latch
  mirrorForMiddleware(accessToken);
  window.dispatchEvent(new Event("tdp-auth-changed"));
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem(LEGACY_REFRESH_KEY); // purge pre-migration copies
  document.cookie = `${MIDDLEWARE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  window.dispatchEvent(new Event("tdp-auth-changed"));
}

/**
 * Logout latch: the HttpOnly cookie can only die server-side, so a lost revoke
 * request could otherwise let a background 401→refresh silently resurrect the
 * session (in this tab or another). After markLoggedOut() the refresh
 * interceptor refuses to run until the next successful login.
 */
export function markLoggedOut(): void {
  window.localStorage.setItem(LOGGED_OUT_KEY, "1");
}

export function isLoggedOut(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(LOGGED_OUT_KEY) === "1";
}

export function isAuthenticated(): boolean {
  return getAccessToken() !== null;
}

function mirrorForMiddleware(accessToken: string): void {
  // Readable by JS + Next middleware (edge runtime has no localStorage).
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${MIDDLEWARE_COOKIE}=${accessToken}; Path=/; Max-Age=900; SameSite=Lax${secure}`;
}

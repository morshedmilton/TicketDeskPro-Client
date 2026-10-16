"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authRequest, request } from "@/lib/api";
import { clearTokens, getStoredUser, markLoggedOut, storeTokens } from "@/lib/auth-storage";
import { startSignalR, stopSignalR } from "@/lib/signalr";
import type { AuthUser, NotificationItem, RegisterRequest } from "@/types";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  notifications: NotificationItem[];
  unreadCount: number;
  markAllRead: () => void;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Rehydrate from storage after mount (localStorage is unavailable during SSR).
  useEffect(() => {
    setUser(getStoredUser());
    setIsLoading(false);
  }, []);

  // React to login/logout happening in OTHER tabs or via interceptor clears.
  useEffect(() => {
    const sync = () => setUser(getStoredUser());
    window.addEventListener("tdp-auth-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("tdp-auth-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // Real-time notifications while authenticated (FRD §8).
  useEffect(() => {
    if (!user?.id) return;
    const stop = startSignalR((notification) => {
      setNotifications((previous) => [notification, ...previous].slice(0, 50));
    });
    return stop;
  }, [user?.id]);

  const login = useCallback(async (email: string, password: string) => {
    // Through the Next proxy (first-party cookie) — refresh token arrives as an
    // HttpOnly Set-Cookie, never in this payload.
    const data = await authRequest<{ accessToken: string; user: AuthUser }>({
      method: "POST",
      url: "/auth/login",
      data: { email, password },
    });
    storeTokens(data.accessToken, data.user);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload: RegisterRequest) => {
    await request({ method: "POST", url: "/auth/register", data: payload });
  }, []);

  const logout = useCallback(() => {
    // Latch first: if the revoke POST is lost, the stale cookie can no longer
    // resurrect the session via a background 401→refresh.
    markLoggedOut();
    // Best-effort server-side revoke — the HttpOnly cookie rides along
    // (credentials: include) and the API clears it; keepalive survives the
    // navigation that follows. No body: revoke reads the cookie.
    void fetch("/api/v1/auth/revoke", {
      method: "POST",
      credentials: "include",
      keepalive: true,
    }).catch(() => {});
    stopSignalR();
    clearTokens();
    setUser(null);
    setNotifications([]);
    window.location.href = "/login";
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((previous) => previous.map((n) => ({ ...n, isRead: true })));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
      markAllRead,
      login,
      register,
      logout,
    }),
    [user, isLoading, notifications, markAllRead, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}

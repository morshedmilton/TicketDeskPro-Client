"use client";

import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import { subscribeToasts } from "@/lib/toasts";
import type { NotificationItem } from "@/types";

interface Toast extends NotificationItem {
  leaving?: boolean;
}

/** Bottom-right toasts fed by the SignalR bus — slide in, auto-dismiss in 6s. */
export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const unsubscribe = subscribeToasts((notification) => {
      const id = notification.id;
      setToasts((previous) => [{ ...notification }, ...previous].slice(0, 4));
      timers.push(setTimeout(() => {
        setToasts((previous) => previous.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      }, 5400));
      timers.push(setTimeout(() => {
        setToasts((previous) => previous.filter((t) => t.id !== id));
      }, 6000));
    });
    return () => {
      unsubscribe();
      timers.forEach(clearTimeout);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-card p-3 shadow-lg transition-all duration-300"
          style={{ opacity: toast.leaving ? 0 : 1, transform: toast.leaving ? "translateY(8px)" : "none" }}
        >
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BellRing className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{toast.title}</p>
            <p className="truncate text-xs text-muted-foreground">{toast.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

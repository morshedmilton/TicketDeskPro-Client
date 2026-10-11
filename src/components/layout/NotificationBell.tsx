"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

/** Live notification bell — count comes from SignalR events this session (Phase 7
 *  adds the persisted list endpoint). Bell is a real button with an accessible
 *  label; the count badge is decorative and aria-hidden. */
export function NotificationBell() {
  const { notifications, unreadCount, markAllRead } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => {
          setOpen((value) => !value);
          if (!open) markAllRead();
        }}
        className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-accent-foreground"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 max-h-96 w-80 overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
          <div className="border-b border-border px-4 py-3 text-sm font-semibold">Notifications</div>
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Nothing yet — real-time alerts will appear here.
            </p>
          ) : (
            <ul>
              {notifications.map((notification) => (
                <li key={notification.id} className="border-b border-border px-4 py-3 last:border-b-0">
                  <p className="text-sm font-medium text-foreground">{notification.title}</p>
                  <p className={cn("mt-0.5 text-xs text-muted-foreground")}>{notification.message}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground/70">
                    {new Date(notification.createdAt).toLocaleTimeString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

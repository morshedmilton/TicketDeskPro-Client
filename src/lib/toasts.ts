import type { NotificationItem } from "@/types";

/** Tiny global toast bus: SignalR (and anything else) dispatches, the Toaster renders. */
export function pushToast(notification: Omit<NotificationItem, "id" | "isRead" | "createdAt">): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("tdp-toast", { detail: notification }));
}

export function subscribeToasts(handler: (notification: NotificationItem) => void): () => void {
  const listener = (event: Event) => handler((event as CustomEvent<NotificationItem>).detail);
  window.addEventListener("tdp-toast", listener);
  return () => window.removeEventListener("tdp-toast", listener);
}

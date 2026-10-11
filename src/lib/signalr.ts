import * as signalR from "@microsoft/signalr";
import type { NotificationItem } from "@/types";
import { getAccessToken } from "@/lib/auth-storage";

export const SIGNALR_URL =
  process.env.NEXT_PUBLIC_SIGNALR_URL ?? "http://localhost:5000/hubs/notifications";

let connection: signalR.HubConnection | null = null;

export type NotificationHandler = (notification: NotificationItem) => void;

/**
 * One hub connection per session (FRD §8). The JWT rides the `?access_token=`
 * query string because browsers cannot set headers on a WebSocket handshake —
 * the API's JwtBearer OnMessageReceived hook reads exactly this.
 */
export function startSignalR(onNotification: NotificationHandler): () => void {
  if (typeof window === "undefined") return () => {};

  stopSignalR();

  connection = new signalR.HubConnectionBuilder()
    .withUrl(SIGNALR_URL, {
      // Evaluated on EVERY (re)connect — reconnects after 15 minutes must carry a fresh token.
      accessTokenFactory: () => getAccessToken() ?? "",
    })
    .withAutomaticReconnect([0, 2000, 5000, 10_000, 30_000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  const forward = (name: string) =>
    connection!.on(name, (payload: Record<string, unknown>) => {
      onNotification({
        id: crypto.randomUUID(),
        type: mapEventType(name),
        title: titleFor(name, payload),
        message: describe(name, payload),
        link: payload.ticketNumber ? `/tickets/${payload.ticketNumber}` : null,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    });

  // Events emitted by SignalRRealtimeNotifier (Phase 4).
  forward("TicketCreated");
  forward("TicketAssigned");
  forward("TicketStatusChanged");
  forward("NewMessage");
  forward("SlaBreached");

  connection
    .start()
    .catch(() => {
      // AutomaticReconnect handles retry; a failed start degrades to polling-free UI.
    });

  return () => stopSignalR();
}

export function stopSignalR(): void {
  if (connection) {
    void connection.stop();
    connection = null;
  }
}

function mapEventType(name: string): number {
  switch (name) {
    case "TicketCreated":
      return 1;
    case "TicketAssigned":
      return 2;
    case "TicketStatusChanged":
      return 3;
    case "NewMessage":
      return 4;
    case "SlaBreached":
      return 6;
    default:
      return 0;
  }
}

function titleFor(name: string, payload: Record<string, unknown>): string {
  const ticket = typeof payload.ticketNumber === "string" ? payload.ticketNumber : "a ticket";
  switch (name) {
    case "TicketCreated":
      return `New ticket ${ticket}`;
    case "TicketAssigned":
      return `${ticket} assigned`;
    case "TicketStatusChanged":
      return `${ticket} is now ${String(payload.toStatus ?? "updated")}`;
    case "NewMessage":
      return `New message on ${ticket}`;
    case "SlaBreached":
      return `SLA breached on ${ticket}`;
    default:
      return "Notification";
  }
}

function describe(name: string, payload: Record<string, unknown>): string {
  switch (name) {
    case "TicketStatusChanged":
      return `${payload.fromStatus} → ${payload.toStatus}`;
    case "NewMessage":
      return payload.isInternal ? "An internal note was added." : "A new reply was posted.";
    case "SlaBreached":
      return `Type: ${String(payload.breachType ?? "unknown")}`;
    default:
      return "Open the ticket for details.";
  }
}

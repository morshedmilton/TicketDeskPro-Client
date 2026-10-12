import { cn } from "@/lib/utils";
import type { SlaSummary, TicketPriority, TicketStatus } from "@/types";

const STATUS_STYLES: Record<TicketStatus, string> = {
  Open: "bg-blue-100 text-blue-800",
  InProgress: "bg-violet-100 text-violet-800",
  AwaitingCustomer: "bg-amber-100 text-amber-800",
  CustomerReplied: "bg-cyan-100 text-cyan-800",
  Resolved: "bg-emerald-100 text-emerald-800",
  Closed: "bg-slate-200 text-slate-600",
  Reopened: "bg-orange-100 text-orange-800",
};

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  Low: "bg-emerald-100 text-emerald-800",
  Medium: "bg-amber-100 text-amber-800",
  High: "bg-orange-100 text-orange-800",
  Urgent: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_STYLES[status])}>
      {status.replace(/([A-Z])/g, " $1").trim()}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", PRIORITY_STYLES[priority])}>
      {priority}
    </span>
  );
}

/**
 * The one bold element of the design system: the SLA urgency bar.
 * Grey before the window, amber at 75% warning, red once breached —
 * the stopwatch metaphor rendered as a single graded strip.
 */
export function SlaBar({ sla, createdAt }: { sla?: SlaSummary | null; createdAt?: string }) {
  if (!sla) return null;

  const now = Date.now();
  const start = createdAt ? new Date(createdAt).getTime() : new Date(sla.firstResponseDeadline).getTime() - 3600_000;

  const state: "breached" | "warning" | "ok" | "paused" = sla.isFirstResponseBreached || sla.isResolutionBreached
    ? "breached"
    : sla.isPaused
      ? "paused"
      : new Date(sla.resolutionDeadline).getTime() - now < 3600_000
        ? "warning"
        : "ok";

  const label =
    state === "breached"
      ? "SLA breached"
      : state === "paused"
        ? "SLA paused (awaiting customer)"
        : state === "warning"
          ? "SLA due within 1h"
          : "Within SLA";

  const elapsed = Math.min(100, Math.max(0, ((now - start) / (new Date(sla.resolutionDeadline).getTime() - start)) * 100));

  return (
    <div className="space-y-1" aria-label={label}>
      <div className="flex items-center justify-between text-xs">
        <span
          className={cn(
            "font-semibold",
            state === "breached" ? "text-red-600" : state === "warning" ? "text-amber-600" : state === "paused" ? "text-slate-500" : "text-emerald-600",
          )}
        >
          {label}
        </span>
        <span className="text-muted-foreground">
          first response by{" "}
          {new Date(sla.firstResponseDeadline).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            state === "breached" ? "bg-red-500" : state === "warning" ? "bg-amber-500" : state === "paused" ? "bg-slate-400" : "bg-emerald-500",
          )}
          style={{ width: `${elapsed}%` }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>Resolution by {new Date(sla.resolutionDeadline).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
        {sla.firstResponseAt && <span className="text-emerald-600">First response sent</span>}
      </div>
    </div>
  );
}
